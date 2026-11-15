from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

app = FastAPI(title="RAVS AI Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded files
uploads_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
if os.path.exists(uploads_dir):
    app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

@app.get("/health")
async def health():
    return {"status": "ok", "service": "RAVS AI Service"}

# Routers will be added in Order 2 (AI Service)
# from app.routers import face, id_verify, plate
# app.include_router(face.router, prefix="/face", tags=["Face Recognition"])
# app.include_router(id_verify.router, prefix="/id", tags=["ID Verification"])
# app.include_router(plate.router, prefix="/plate", tags=["Plate OCR"])
