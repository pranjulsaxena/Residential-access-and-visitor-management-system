from fastapi import APIRouter, UploadFile, File
from app.services.face_service import detect_faces, get_embedding, find_match, compare_faces
from app.schemas.face import FaceDetectionResult, EmbeddingResult, MatchResult, CompareResult

router = APIRouter()


@router.post("/detect", response_model=FaceDetectionResult)
async def detect(file: UploadFile = File(...)):
    """Detect all faces in an image and return bounding boxes + detection confidence."""
    image_bytes = await file.read()
    faces = detect_faces(image_bytes)
    return FaceDetectionResult(faces_found=len(faces), faces=faces)


@router.post("/embed", response_model=EmbeddingResult)
async def embed(file: UploadFile = File(...)):
    """Extract a 512-dimensional facial embedding vector for the primary face in the image."""
    image_bytes = await file.read()
    embedding = get_embedding(image_bytes)

    if embedding is None:
        return EmbeddingResult(success=False, message="No face detected in image")

    return EmbeddingResult(
        success=True,
        embedding=embedding.tolist(),
        message="512-dim embedding generated successfully"
    )


@router.post("/match", response_model=MatchResult)
async def match(file: UploadFile = File(...)):
    """Match a live face against all stored resident/staff face profiles using cosine similarity."""
    image_bytes = await file.read()
    result = find_match(image_bytes)

    if result is None:
        emb = get_embedding(image_bytes)
        if emb is None:
            return MatchResult(match_found=False, message="No face detected in image")
        return MatchResult(match_found=False, message="No matching resident or staff found")

    return MatchResult(
        match_found=True,
        person_id=result["person_id"],
        person_type=result["person_type"],
        confidence=result["confidence"],
        message=f"Matched {result['person_type']} with {result['confidence']:.2%} confidence"
    )


@router.post("/compare", response_model=CompareResult)
async def compare(
    file1: UploadFile = File(..., description="Live webcam capture photo"),
    file2: UploadFile = File(..., description="ID card photo or reference photo"),
):
    """
    Biometric Anti-Impersonation Check:
    Compares live webcam capture against physical ID card photo.
    """
    image1_bytes = await file1.read()
    image2_bytes = await file2.read()
    result = compare_faces(image1_bytes, image2_bytes)
    return CompareResult(**result)
