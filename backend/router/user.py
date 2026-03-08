from fastapi import APIRouter, Depends, HTTPException, UploadFile, Form, File
from sqlalchemy.orm import Session
import os
from database import get_db
from models.user import User
from schemas.user import UserResponse
from core.security import get_current_user, hash_password
import cloudinary.uploader
import Cloudinary_config
# from Cloudinary_config import cloudinary_config (redundant if just using side-effect, but user had it)

router = APIRouter(prefix="/users", tags=["Users"])


def save_image(image: UploadFile) -> str:
    result = cloudinary.uploader.upload(image.file)
    return result["secure_url"]

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
    email_lower = email.lower()
    if db.query(User).filter(User.email == email_lower).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    image_path = save_image(image) if image else None

    new_user = User(
        name=name,
        email=email_lower,
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

# --- Get User By ID ---
@router.get("/{user_id}", response_model=UserResponse)
def get_user_by_id(
    user_id: int,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
       raise HTTPException(status_code=404, detail="User not found")

    return user