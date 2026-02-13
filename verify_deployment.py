import sys
import os

# Simulate Vercel environment
print("Simulating Vercel environment...")
BASE_DIR = os.path.abspath(".")
sys.path.append(BASE_DIR)

try:
    print(f"Added {BASE_DIR} to sys.path")
    # Simulate api/index.py import
    # api/index.py does:
    # BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    # sys.path.append(BASE_DIR)
    # from backend.main import app

    # We are at root, so we just import backend.main
    from backend.main import app
    print("Successfully imported FastAPI app from backend.main")
    
    print("Verification passed!")
except Exception as e:
    print(f"Verification FAILED: {e}")
    import traceback
    traceback.print_exc()
