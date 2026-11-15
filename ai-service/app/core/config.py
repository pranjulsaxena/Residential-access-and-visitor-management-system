import os
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent  # project root
UPLOADS_DIR = BASE_DIR / "uploads"
MODELS_DIR = Path(__file__).resolve().parent.parent.parent / "models"

# Auto-load .env file if present
env_path = Path(__file__).resolve().parent.parent.parent / ".env"
if env_path.exists():
    try:
        from dotenv import load_dotenv
        load_dotenv(env_path)
    except ImportError:
        # Lightweight fallback reader without third-party dependencies
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    k = k.strip()
                    v = v.strip().strip('"').strip("'")
                    os.environ.setdefault(k, v)

# Database
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://ravms:ravms123@localhost:5432/ravms")

# Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Face Recognition
FACE_SIMILARITY_THRESHOLD = 0.5       # for live-to-live matching
FACE_ID_SIMILARITY_THRESHOLD = 0.4    # for live-to-ID-card matching (lower because ID photos are lower quality)

# Ensure directories exist
for subdir in ["faces/residents", "faces/staff", "entries", "ids", "plates"]:
    (UPLOADS_DIR / subdir).mkdir(parents=True, exist_ok=True)
