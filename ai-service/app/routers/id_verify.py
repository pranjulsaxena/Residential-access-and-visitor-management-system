from fastapi import APIRouter, UploadFile, File
from app.services.id_service import extract_id_data
from app.schemas.id_document import IDExtractionResult

router = APIRouter()


@router.post("/extract", response_model=IDExtractionResult)
async def extract(file: UploadFile = File(..., description="Photograph of the physical ID card")):
    """
    Extract structured identity information from any government or institutional ID card
    using Gemini Vision multimodal AI.
    """
    image_bytes = await file.read()
    result = await extract_id_data(image_bytes)
    return IDExtractionResult(**result)
