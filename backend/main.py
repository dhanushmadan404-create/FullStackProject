import os
import sys
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from fastapi import Request
import traceback


# --- Path Setup ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.append(BASE_DIR)

# --- Imports ---
from router import auth, user, vendor, food
from database import init_db

# --- Logging ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Startup ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up...")
    init_db()
    yield

# --- App Definition ---
app = FastAPI(
    title="Annesana API",
    lifespan=lifespan
)

# --- CORS (Allow all for simplicity) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- File Uploads ---
# --- File Uploads ---
if os.environ.get("VERCEL"):
    UPLOAD_DIR = "/tmp/uploads"
else:
    UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")

os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# --- Routers ---
app.include_router(auth.router, prefix="/api")
app.include_router(user.router, prefix="/api")
app.include_router(vendor.router, prefix="/api")
app.include_router(food.router, prefix="/api")


# --- Global Exception Handler (for debugging backend errors) ---
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # This will print the full error to the console/Vercel logs
    logger.error(f"Unhandled error: {exc}")
    traceback.print_exc()
    
    # Return a 500 status with the actual error message for now
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "error": str(exc)}
    )



# --- Root ---
@app.get("/")
def root():
    return {"message": "Welcome to Annesana API"}

@app.get("/health")
def health_check():
    return {"status": "ok", "environment": "vercel" if os.environ.get("VERCEL") else "local"}

