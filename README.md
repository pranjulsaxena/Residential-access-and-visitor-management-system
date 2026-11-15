# RAVS — Residential Access & Visitor System

> Smart entry management for housing societies using **face recognition**, **ID verification**, and **vehicle plate OCR**.

---

## Features

| Feature | Technology |
|---|---|
| 🔍 **Face Recognition** | Auto-identify residents & staff at the gate | InsightFace (`buffalo_l`, 512-dim embeddings) |
| 🪪 **ID Verification** | Extract data from Aadhar, DL, PAN, College ID | Google Gemini 1.5 Flash (Vision) |
| 🚨 **Impersonation Detection** | Compare live face with ID card photo | InsightFace cosine similarity |
| 🚗 **Plate OCR** | Read Indian number plates, match to residents | PaddleOCR |
| 🔔 **Approval Workflow** | Real-time push to resident; guard polls every 3s | TanStack Query polling |
| 🛡️ **5-Level Trust System** | Resident=5, Staff=4, Approved Visitor=3, Unknown=1 | Custom scoring |
| 📊 **Live Dashboard** | Who's inside, today's stats, entry log | TanStack Query, Next.js API |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, TypeScript, Tailwind CSS v3, shadcn/ui (`@base-ui/react`) |
| Backend | Next.js API Routes, Prisma ORM v6 |
| Database | PostgreSQL 16 (Docker) |
| AI Service | Python 3.12, FastAPI |
| Face Recognition | InsightFace (`buffalo_l`) |
| ID Extraction | Google Gemini 1.5 Flash (Multimodal) |
| Plate OCR | PaddleOCR v4 |
| Authentication | NextAuth.js v5 (JWT, Credentials) |

---

## Setup

### Prerequisites
- Node.js 20+
- Python 3.12+
- Docker Desktop (running)
- Google Gemini API key

### 1. Clone & Start Database
```bash
git clone <repo>
cd "Residential access and visitor system"
docker compose up -d
# Wait ~15 seconds for PostgreSQL to initialize
```

### 2. Configure Environment
```bash
cd web
cp .env .env.local   # Edit GEMINI_API_KEY with your real key
```

### 3. Set Up Web Application
```bash
cd web
npm install
npx prisma@6 migrate dev --name init
npx prisma@6 db seed
npm run dev
# → http://localhost:3000
```

### 4. Set Up AI Service
```bash
cd ai-service
python -m uvicorn app.main:app --reload --port 8000
# Wait for "Application startup complete"
# Models auto-download on first run (~500MB)
# → http://localhost:8000/docs
```

---

## Login Credentials (Seed Data)

| Role | Username | Password | Notes |
|---|---|---|---|
| Guard | `guard1` | `guard123` | Assigned to Main Gate |
| Guard | `guard2` | `guard123` | Assigned to Back Gate |
| Resident | `rajesh` | `resident123` | Flat A-101, Primary |
| Secretary | `secretary1` | `admin123` | Society admin |

---

## Demo Flow (5–7 minutes)

### Pre-Demo Setup
1. Start Docker, AI service (port 8000), Next.js (port 3000)
2. Run `npx prisma@6 db seed` to ensure fresh seed data
3. Register your face as Rajesh:
   - Login: `secretary1 / admin123` → (use Prisma Studio or API)
   - `POST /api/residents/{rajesh-id}/face` with your selfie

### Part 1 — Resident Auto-Entry (1 min)
1. Login as `guard1`
2. Go to **Identify** → Start Camera → Capture your face
3. System shows: *"✅ Rajesh Kumar, Flat A-101 — Entry logged"*

### Part 2 — Unknown Visitor with Approval (2 min)
1. Capture an unregistered face → System: *"Unknown person"*
2. Scan an ID card photo → Gemini extracts name, ID number, type
3. Impersonation check: compare live face vs ID photo → pass/fail
4. Fill visitor form → Select flat → Send for Approval
5. **On another tab**: Login as `rajesh` → See notification → Approve
6. **Guard tab**: Shows *"✅ Approved"* in real time

### Part 3 — Vehicle Plate Scan (30 sec)
1. Guard → Plate Scan → Photograph a number plate
2. System reads plate via PaddleOCR → Matches to registered resident

### Part 4 — Secretary Dashboard (1 min)
1. Login as `secretary1`
2. See today's stats, who's inside, full entry log

---

## Project Structure

```
├── docker-compose.yml          # PostgreSQL container
├── web/                        # Next.js application
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/            # All backend API routes
│   │   │   │   ├── auth/       # NextAuth handlers
│   │   │   │   ├── gate-ops/   # identify, scan-id, scan-plate, entry, exit
│   │   │   │   ├── visits/     # Visitor workflow + approvals
│   │   │   │   └── dashboard/  # Stats + live feed
│   │   │   ├── guard/          # Guard UI pages
│   │   │   ├── resident/       # Resident UI pages
│   │   │   └── admin/          # Secretary UI pages
│   │   ├── components/         # Shared React components
│   │   └── lib/                # auth, db, ai-client, validators
│   └── prisma/
│       ├── schema.prisma       # 16-table database schema
│       └── seed.ts             # Test data
├── ai-service/                 # Python FastAPI
│   └── app/
│       ├── routers/            # face.py, id_verify.py, plate.py
│       └── services/           # face_service.py, id_service.py, plate_service.py
└── uploads/                    # Stored photos (git-ignored)
```

---

## Architecture

```
Browser
  │
  ▼
Next.js (port 3000)
  ├── /api/gate-ops/identify ──────► FastAPI AI Service (port 8000)
  ├── /api/gate-ops/scan-id  ──────►   /face/match   (InsightFace)
  ├── /api/gate-ops/scan-plate ────►   /face/embed   (InsightFace)
  └── /api/visits/*          ──────►   /id/extract   (Gemini Flash)
                                       /plate/read   (PaddleOCR)
  │
  ▼
PostgreSQL (port 5432) via Docker
  └── face_profiles (embeddings as JSON)
      visits, approvals, entry_logs, ...
```

---

## Common Issues & Fixes

| Error | Fix |
|---|---|
| `uvicorn: command not found` | Use `python -m uvicorn ...` instead |
| Protobuf VersionError | `pip install "protobuf<6.0.0dev,>=5.26.1" "onnx<1.18.0"` |
| `No module named uvicorn` | Run with global Python, not venv |
| `Tailwind class does not exist` | Ensure `tailwind.config.js` has CSS variable color mappings |
| Prisma `migrate` not found | Use `npx prisma@6 migrate dev` (not prisma@7+) |
| Docker DB not connecting | Wait for Docker Desktop to fully start |

---

*Built as a college project demonstrating full-stack AI integration.*
