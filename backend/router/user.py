from fastapi import APIRouter, Depends, HTTPException, UploadFile, Form, File
from sqlalchemy.orm import Session
import os, uuid, shutil
from database import get_db
from models.user import User
from schemas.user import UserResponse
from core.security import get_current_user, hash_password

router = APIRouter(prefix="/users", tags=["Users"])

# --- Image Upload Helper ---
if os.environ.get("VERCEL"):
    UPLOAD_DIR = "/tmp/uploads/users"
else:
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    UPLOAD_DIR = os.path.join(BASE_DIR, "uploads", "users")
os.makedirs(UPLOAD_DIR, exist_ok=True)

def save_image(image: UploadFile) -> str:
    ext = image.filename.split(".")[-1]
    filename = f"{uuid.uuid4().hex}.{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)
    return f"/uploads/users/{filename}"

# --- Register ---
@router.post("", response_model=UserResponse)
def register_user(
    name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    role: str = Form(...),
    image: UploadFile | None = File(None),
    db: Session = Depends(get_db)
):
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    image_path = save_image(image) if image else None

    new_user = User(
        name=name,
        email=email,
        password_hash=hash_password(password),
        role=role.lower(),
        image_url=image_path
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

# --- Current User ---
@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user

# --- Update Profile ---
@router.put("/email/{email}")
def update_user(
    email: str,
    name: str = Form(None),
    image: UploadFile = None,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if name: user.name = name
    if image: user.image_url = save_image(image)

    db.commit()
    db.refresh(user)
    return user

