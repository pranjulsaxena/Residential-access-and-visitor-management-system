import re
import numpy as np
from PIL import Image
import io
from paddleocr import PaddleOCR

print("Loading PaddleOCR model...")
ocr = PaddleOCR(use_angle_cls=True, lang="en")
print("✅ PaddleOCR model ready")


def clean_plate_number(raw_text: str) -> str:
    """Clean OCR output and normalize to standard Indian vehicle plate format"""
    # Remove non-alphanumeric characters except spaces
    cleaned = re.sub(r"[^A-Z0-9 ]", "", raw_text.upper())
    cleaned = re.sub(r"\s+", " ", cleaned).strip()

    # Match Indian plate patterns: e.g. DL 8C AQ 1234, MH 12 AB 5678
    patterns = [
        r"[A-Z]{2}\s?\d{1,2}\s?[A-Z]{1,3}\s?\d{1,4}",
        r"[A-Z]{2}\s?\d{1,2}\s?\d{1,4}",
    ]

    for pattern in patterns:
        match = re.search(pattern, cleaned)
        if match:
            return match.group(0).strip()

    return cleaned


def read_plate(image_bytes: bytes) -> dict:
    """Extract vehicle registration plate numbers from an image using PaddleOCR"""
    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img_array = np.array(image)

        result = ocr.ocr(img_array, cls=True)

        if not result or not result[0]:
            return {
                "success": False,
                "plate_number": None,
                "raw_text": None,
                "confidence": 0.0,
                "message": "No vehicle registration plate text detected in image",
            }

        texts = []
        confidences = []
        for line in result[0]:
            text = line[1][0]
            conf = line[1][1]
            texts.append(text)
            confidences.append(float(conf))

        raw_text = " ".join(texts)
        avg_confidence = float(sum(confidences) / len(confidences)) if confidences else 0.0
        plate_number = clean_plate_number(raw_text)

        return {
            "success": True,
            "plate_number": plate_number,
            "raw_text": raw_text,
            "confidence": avg_confidence,
            "message": f"Plate detected: {plate_number}",
        }

    except Exception as e:
        return {
            "success": False,
            "plate_number": None,
            "raw_text": None,
            "confidence": 0.0,
            "message": f"Plate OCR processing failed: {str(e)}",
        }
