from pydantic import BaseModel
from typing import Optional

class PlateReadResult(BaseModel):
    success: bool
    plate_number: Optional[str] = None
    raw_text: Optional[str] = None
    confidence: float = 0.0
    message: str = ""
