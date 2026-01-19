import sys
import os
import logging

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError

# ---------------- PATH FIX ----------------
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)

# ---------------- IMPORT ROUTERS ----------------
from router import auth, user, vendor, food
from database import init_db

# ---------------- LOGGING ----------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ---------------- APP SETUP ----------------
app = FastAPI(title="Annesana API", version="1.0.0")

# ---------------- EXCEPTIONS ----------------
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(status_code=422, content={"detail": exc.errors()})

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {exc}", exc_info=True)
    return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})

# ---------------- CORS ----------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://silly-custard-b54606.netlify.app",  # your frontend
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- STATIC FILES / UPLOADS ----------------
# Save uploaded images in a persistent folder
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Mount static files for access via /uploads/<filename>
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# ---------------- ROUTERS ----------------
API_PREFIX = "/api"
app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(user.router, prefix=API_PREFIX)
app.include_router(vendor.router, prefix=API_PREFIX)
app.include_router(food.router, prefix=API_PREFIX)

# ---------------- HEALTH CHECK ----------------
@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "Annesana Backend"}

# ---------------- ROOT ----------------
@app.get("/")
def root():
    return {"message": "Welcome to Annesana API"}

# ---------------- INIT DATABASE ----------------
init_db()
