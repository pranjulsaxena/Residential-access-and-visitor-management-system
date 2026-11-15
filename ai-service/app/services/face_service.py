import numpy as np
from numpy.linalg import norm
from insightface.app import FaceAnalysis
from PIL import Image
import io
import json
import psycopg2
from app.core.config import FACE_SIMILARITY_THRESHOLD, FACE_ID_SIMILARITY_THRESHOLD, DATABASE_URL, MODELS_DIR

# Initialize InsightFace model
print("Loading InsightFace model (buffalo_l)...")
face_app = FaceAnalysis(
    name="buffalo_l",
    root=str(MODELS_DIR),
    providers=["CPUExecutionProvider"]
)
face_app.prepare(ctx_id=0, det_size=(640, 640))
print("✅ InsightFace model ready")


def image_to_numpy(image_bytes: bytes) -> np.ndarray:
    """Convert uploaded image bytes to numpy array (BGR format for InsightFace)"""
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img_array = np.array(image)
    # Convert RGB to BGR (InsightFace convention)
    img_bgr = img_array[:, :, ::-1]
    return img_bgr


def detect_faces(image_bytes: bytes) -> list:
    """Detect all faces in an image, return bounding boxes and confidence"""
    img = image_to_numpy(image_bytes)
    faces = face_app.get(img)
    results = []
    for face in faces:
        bbox = face.bbox.tolist()
        results.append({
            "x1": float(bbox[0]),
            "y1": float(bbox[1]),
            "x2": float(bbox[2]),
            "y2": float(bbox[3]),
            "confidence": float(face.det_score),
        })
    return results


def get_embedding(image_bytes: bytes) -> np.ndarray | None:
    """Get 512-dim face embedding for the largest face in the image"""
    img = image_to_numpy(image_bytes)
    faces = face_app.get(img)

    if not faces:
        return None

    # Sort by face area (largest first — dominant face)
    faces = sorted(
        faces,
        key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1]),
        reverse=True,
    )
    return faces[0].embedding


def cosine_similarity(emb1: np.ndarray, emb2: np.ndarray) -> float:
    """Compute cosine similarity between two normalized embeddings (-1 to 1)"""
    denom = norm(emb1) * norm(emb2)
    if denom == 0:
        return 0.0
    return float(np.dot(emb1, emb2) / denom)


def load_stored_embeddings() -> list:
    """Load all registered face embeddings from PostgreSQL"""
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        cur.execute("SELECT person_type, person_id, embedding FROM face_profiles")
        rows = cur.fetchall()
        cur.close()
        conn.close()

        results = []
        for row in rows:
            person_type, person_id, embedding_raw = row
            if isinstance(embedding_raw, str):
                embedding = json.loads(embedding_raw)
            else:
                embedding = embedding_raw
            results.append({
                "person_type": person_type,
                "person_id": str(person_id),
                "embedding": np.array(embedding, dtype=np.float32),
            })
        return results
    except Exception as e:
        print(f"Error querying database for embeddings: {e}")
        return []


def find_match(image_bytes: bytes, threshold: float = None) -> dict | None:
    """
    Match an uploaded face against all registered embeddings.
    Returns best match above threshold, or None.
    """
    if threshold is None:
        threshold = FACE_SIMILARITY_THRESHOLD

    new_embedding = get_embedding(image_bytes)
    if new_embedding is None:
        return None

    stored = load_stored_embeddings()
    if not stored:
        return None

    best_match = None
    best_score = 0.0

    for entry in stored:
        score = cosine_similarity(new_embedding, entry["embedding"])
        if score > threshold and score > best_score:
            best_score = score
            best_match = {
                "person_id": entry["person_id"],
                "person_type": entry["person_type"],
                "confidence": score,
            }

    return best_match


def compare_faces(image1_bytes: bytes, image2_bytes: bytes, threshold: float = None) -> dict:
    """
    Compare two faces directly (e.g. live webcam capture vs physical ID card photo).
    Used for the Biometric Anti-Impersonation Engine.
    """
    if threshold is None:
        threshold = FACE_ID_SIMILARITY_THRESHOLD

    emb1 = get_embedding(image1_bytes)
    if emb1 is None:
        return {"similarity_score": 0.0, "result": "no_face_in_image1", "threshold_used": threshold}

    emb2 = get_embedding(image2_bytes)
    if emb2 is None:
        return {"similarity_score": 0.0, "result": "no_face_in_image2", "threshold_used": threshold}

    score = cosine_similarity(emb1, emb2)
    result = "match" if score >= threshold else "mismatch"

    return {
        "similarity_score": float(score),
        "result": result,
        "threshold_used": threshold,
    }
