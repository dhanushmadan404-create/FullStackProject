import os
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Add the project root and backend folder to sys.path
# This allows 'from backend.main import app' to work correctly on Vercel
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
sys.path.append(project_root)
sys.path.append(os.path.join(project_root, "backend"))

from backend.main import app

# Vercel needs the app object to be exposed as 'app'
# This is already done in backend.main, so we just export it here.
app = app
