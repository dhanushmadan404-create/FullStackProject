import os
import sys
import traceback
from fastapi import FastAPI
from fastapi.responses import JSONResponse

# ---------------- PATH FIX ----------------
# Add project root and backend dir to sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
backend_dir = os.path.join(project_root, "backend")

# Insert paths to ensure imports work correctly
if project_root not in sys.path:
    sys.path.insert(0, project_root)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# ---------------- APP LOAD ----------------
app = None
startup_error = None

try:
    # Attempt to import the FastAPI app from backend/main.py
    from backend.main import app as fastapi_app
    app = fastapi_app
except Exception as e:
    startup_error = {
        "error": str(e),
        "traceback": traceback.format_exc(),
        "sys_path": sys.path,
        "env": {k: v for k, v in os.environ.items() if "KEY" not in k and "PASS" not in k and "DATABASE" not in k},
    }

# ---------------- FALLBACK APP ----------------
if app is None:
    # If the main app failed to load, create a fallback diagnostic app
    app = FastAPI(title="Startup Error Diagnostic")

    @app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
    async def catch_all_error(path: str):
        return JSONResponse(
            status_code=500,
            content={
                "detail": "Vercel Startup Error",
                "message": startup_error.get("error") if startup_error else "Unknown error during import",
                "debug": startup_error,
                "hint": "Check if DATABASE_URL and SECRET_KEY are set in Vercel Environment Variables."
            },
        )

# ---------------- EXPORT ----------------
# Vercel looks for 'app'
app = app
