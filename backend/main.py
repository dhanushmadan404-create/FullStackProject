import os
import sys
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

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
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# --- Routers ---
app.include_router(auth.router, prefix="/api")
app.include_router(user.router, prefix="/api")
app.include_router(vendor.router, prefix="/api")
app.include_router(food.router, prefix="/api")

# --- Root ---
@app.get("/")
def root():
    return {"message": "Welcome to Annesana API"}

