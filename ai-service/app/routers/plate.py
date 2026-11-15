from fastapi import APIRouter, UploadFile, File
from app.services.plate_service import read_plate
from app.schemas.plate import PlateReadResult

router = APIRouter()


@router.post("/read", response_model=PlateReadResult)
async def read(file: UploadFile = File(..., description="Photograph of vehicle license plate")):
    """
    Extract and parse vehicle registration numbers from license plate images using PaddleOCR.
    """
    image_bytes = await file.read()
    result = await read_plate(image_bytes)
    return PlateReadResult(**result)
