from fastapi import APIRouter, Depends, HTTPException, UploadFile, Form
from sqlalchemy.orm import Session
import os, uuid, shutil

from database import get_db
from models.user import User
from schemas.user import UserResponse
from core.security import get_current_user, hash_password

router = APIRouter(prefix="/users", tags=["Users"])

UPLOAD_DIR = "uploads/users"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def save_image(image: UploadFile) -> str:
    ext = image.filename.split(".")[-1]
    filename = f"{uuid.uuid4().hex}.{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)

    return f"/{file_path}"

# ---------------- REGISTER USER ----------------
@router.post("/", response_model=UserResponse)
def register_user(
    name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    role: str = Form(...),
    image: UploadFile | None = None,
    db: Session = Depends(get_db)
):
    # check existing user
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    # save image
    image_path = save_image(image) if image else None

    # create user
    db_user = User(
        name=name,
        email=email,
        password_hash=hash_password(password),  # ✅ FIXED
        role=role,
        image=image_path                         # ✅ FIXED
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return db_user

# ---------------- GET CURRENT USER ----------------
@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user

# ---------------- GET USER BY ID ----------------
@router.get("/{user_id}", response_model=UserResponse)
def get_user_by_id(
    user_id: int,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# ---------------- UPDATE NAME & IMAGE BY EMAIL ----------------
@router.put("/email/{email}")
def update_name_image_by_email(
    email: str,
    name: str = Form(None),
    image: UploadFile = None,
    db: Session = Depends(get_db)
):
    db_user = db.query(User).filter(User.email == email).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    if name:
        db_user.name = name
    if image:
        db_user.image = save_image(image)

    db.commit()
    db.refresh(db_user)
    return {
        "message": "Name & image updated successfully",
        "user_id": db_user.user_id,
        "image_url": db_user.image
    }
