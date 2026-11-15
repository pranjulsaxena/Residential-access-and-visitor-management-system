from pydantic import BaseModel
from typing import Optional, List

class BoundingBox(BaseModel):
    x1: float
    y1: float
    x2: float
    y2: float
    confidence: float

class FaceDetectionResult(BaseModel):
    faces_found: int
    faces: List[BoundingBox]

class EmbeddingResult(BaseModel):
    success: bool
    embedding: Optional[List[float]] = None
    message: str = ""

class MatchResult(BaseModel):
    match_found: bool
    person_id: Optional[str] = None
    person_type: Optional[str] = None  # resident | staff
    confidence: float = 0.0
    message: str = ""

class CompareResult(BaseModel):
    similarity_score: float
    result: str  # match | mismatch | no_face_in_image1 | no_face_in_image2
    threshold_used: float
