import os
import sys
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError

# ---------------- PATH FIX ----------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.append(BASE_DIR)

# ---------------- IMPORT ROUTERS ----------------
from router import auth, user, vendor, food
from database import init_db

# ---------------- LOGGING ----------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ---------------- LIFESPAN (APP STARTUP) ----------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting application...")
    init_db()   # Connect / create DB tables
    yield

# ---------------- APP ----------------
app = FastAPI(
    title="Annesana API",
    version="1.0.0",
    lifespan=lifespan
)

# ---------------- ERROR HANDLING ----------------
@app.exception_handler(HTTPException)
async def http_error(_, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )

@app.exception_handler(RequestValidationError)
async def validation_error(_, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()}
    )

@app.exception_handler(Exception)
async def server_error(_, exc: Exception):
    logger.error(exc)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error"}
    )

# ---------------- CORS ----------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # frontend can access API
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- FILE UPLOADS ----------------
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# ---------------- ROUTERS ----------------
API_PREFIX = "/api"
app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(user.router, prefix=API_PREFIX)
app.include_router(vendor.router, prefix=API_PREFIX)
app.include_router(food.router, prefix=API_PREFIX)

# ---------------- HEALTH CHECK ----------------
@app.get("/api/health")
def health():
    return {"status": "ok"}

# ---------------- ROOT ----------------
@app.get("/")
def root():
    return {"message": "Welcome to Annesana API"}
