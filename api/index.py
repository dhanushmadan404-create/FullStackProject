import os

# Base project directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Detect Vercel environment
IS_VERCEL = os.getenv("VERCEL") == "1"

# Upload directory
UPLOAD_DIR = "/tmp/uploads" if IS_VERCEL else os.path.join(BASE_DIR, "uploads")

# Create folder
os.makedirs(UPLOAD_DIR, exist_ok=True)
