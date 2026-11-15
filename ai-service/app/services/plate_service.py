import json
import re
from app.core.config import GEMINI_API_KEY


def clean_plate_number(raw_text: str) -> str:
    """Clean OCR output and normalize to standard Indian vehicle plate format"""
    if not raw_text:
        return ""
    cleaned = re.sub(r"[^A-Z0-9 ]", "", raw_text.upper())
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned


async def read_plate(image_bytes: bytes) -> dict:
    """Extract vehicle registration plate numbers from an image using async Gemini Vision"""
    if not GEMINI_API_KEY:
        return {
            "success": False,
            "plate_number": None,
            "raw_text": None,
            "confidence": 0.0,
            "message": "GEMINI_API_KEY is not configured in environment",
        }

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=GEMINI_API_KEY)
        config = types.GenerateContentConfig(
            thinking_config=types.ThinkingConfig(thinking_budget=0),
            response_mime_type="application/json",
        )

        prompt = """Analyze this vehicle or license plate image.
Extract the vehicle registration / license plate number (e.g. DL 01 AB 1234, MH 12 CD 5678, HR 26 etc.).

Return ONLY a JSON object with this exact structure:
{
  "plate_number": "<clean plate number or null>",
  "raw_text": "<text as it appears on the plate or null>",
  "confidence": 0.95
}"""

        response = await client.aio.models.generate_content(
            model="gemini-3.8-flash",
            contents=[
                prompt,
                types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
            ],
            config=config,
        )

        response_text = response.text.strip()
        if response_text.startswith("```"):
            response_text = response_text.split("\n", 1)[1]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            response_text = response_text.strip()

        data = json.loads(response_text)
        plate_num = clean_plate_number(data.get("plate_number") or "")

        if not plate_num:
            return {
                "success": False,
                "plate_number": None,
                "raw_text": data.get("raw_text"),
                "confidence": 0.0,
                "message": "No vehicle registration plate text detected in image",
            }

        return {
            "success": True,
            "plate_number": plate_num,
            "raw_text": data.get("raw_text") or plate_num,
            "confidence": float(data.get("confidence", 0.95)),
            "message": f"Plate detected: {plate_num}",
        }

    except Exception as e:
        return {
            "success": False,
            "plate_number": None,
            "raw_text": None,
            "confidence": 0.0,
            "message": f"Plate recognition failed: {str(e)}",
        }
