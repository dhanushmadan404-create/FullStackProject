# Vercel entry point for FastAPI application

import sys
import os

# Get project root directory
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Add project root to Python path
if BASE_DIR not in sys.path:
    sys.path.append(BASE_DIR)

# Import FastAPI app from backend/main.py
from backend.main import app
