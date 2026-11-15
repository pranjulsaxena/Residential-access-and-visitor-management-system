import os
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent  # project root
UPLOADS_DIR = BASE_DIR / "uploads"
MODELS_DIR = Path(__file__).resolve().parent.parent.parent / "models"

# Database
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://ravs:ravs123@localhost:5432/ravs")

# Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Face Recognition
FACE_SIMILARITY_THRESHOLD = 0.5       # for live-to-live matching
FACE_ID_SIMILARITY_THRESHOLD = 0.4    # for live-to-ID-card matching (lower because ID photos are lower quality)

# Ensure directories exist
for subdir in ["faces/residents", "faces/staff", "entries", "ids", "plates"]:
    (UPLOADS_DIR / subdir).mkdir(parents=True, exist_ok=True)
