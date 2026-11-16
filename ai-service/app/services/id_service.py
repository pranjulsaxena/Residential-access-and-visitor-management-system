import json
import re
from app.core.config import GEMINI_API_KEY

GOVERNMENT_ID_TYPES = {"aadhar", "driving_license", "pan", "voter_id"}

EXTRACTION_PROMPT = """Analyze this ID card image carefully. Extract ALL visible information and return it as a JSON object.

You MUST identify what type of ID this is and include ALL of these fields:

{
  "id_type": "<one of: aadhar, driving_license, pan, voter_id, college_id, company_id, delivery_id, other>",
  "name": "<full name as written on the card>",
  "id_number": "<the main unique identification number on the card>",
  "date_of_birth": "<if visible, in DD/MM/YYYY format>",
  "gender": "<if visible>",
  "father_name": "<if visible>",
  "address": "<if visible, complete address>",
  "organization": "<issuing organization if visible - e.g., college name, company name, Zomato, etc.>",
  "role": "<role/designation if visible - e.g., student, delivery partner, employee>",
  "department": "<department if visible>",
  "validity_from": "<if visible>",
  "validity_to": "<if visible>",
  "vehicle_class": "<for driving license, if visible>",
  "blood_group": "<if visible>",
  "has_photo": <true if the ID card has a photograph on it, false otherwise>
}

Return ONLY the raw JSON object. No markdown code blocks, no explanation."""


def validate_id_format(id_type: str, id_number: str) -> bool:
    """Validate format of Indian government ID numbers"""
    if not id_number:
        return False

    clean = id_number.replace(" ", "").replace("-", "").strip()

    if id_type == "aadhar":
        return bool(re.match(r"^\d{12}$", clean))
    elif id_type == "pan":
        return bool(re.match(r"^[A-Z]{5}\d{4}[A-Z]$", clean.upper()))
    elif id_type == "driving_license":
        return len(clean) >= 10
    elif id_type == "voter_id":
        return bool(re.match(r"^[A-Z]{3}\d{7}$", clean.upper()))

    return True


async def extract_id_data(image_bytes: bytes) -> dict:
    """Extract structured data from an ID card image using Gemini Vision API"""
    if not GEMINI_API_KEY:
        return {
            "success": False,
            "id_type": "unknown",
            "id_category": "unknown",
            "extracted_data": {},
            "id_number": None,
            "format_valid": None,
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

        response = await client.aio.models.generate_content(
            model="gemini-3.5-flash",
            contents=[
                EXTRACTION_PROMPT,
                types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
            ],
            config=config,
        )
        response_text = response.text.strip()

        # Clean markdown code blocks if returned
        if response_text.startswith("```"):
            response_text = response_text.split("\n", 1)[1]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            response_text = response_text.strip()

        extracted = json.loads(response_text)

        id_type = extracted.get("id_type", "other").lower().replace(" ", "_")
        id_category = "government" if id_type in GOVERNMENT_ID_TYPES else "institutional"
        id_number = extracted.get("id_number", "")

        format_valid = None
        if id_category == "government" and id_number:
            format_valid = validate_id_format(id_type, id_number)

        return {
            "success": True,
            "id_type": id_type,
            "id_category": id_category,
            "extracted_data": extracted,
            "id_number": id_number if id_number else None,
            "format_valid": format_valid,
            "message": f"Successfully extracted {id_type} document data",
        }

    except json.JSONDecodeError as e:
        return {
            "success": False,
            "id_type": "unknown",
            "id_category": "unknown",
            "extracted_data": {},
            "id_number": None,
            "format_valid": None,
            "message": f"Failed to parse LLM response: {str(e)}",
        }
    except Exception as e:
        return {
            "success": False,
            "id_type": "unknown",
            "id_category": "unknown",
            "extracted_data": {},
            "id_number": None,
            "format_valid": None,
            "message": f"ID extraction failed: {str(e)}",
        }
