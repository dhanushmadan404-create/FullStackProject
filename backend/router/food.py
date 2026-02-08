from fastapi import APIRouter, Depends, HTTPException, Form, File, UploadFile
from sqlalchemy.orm import Session
import os, uuid, shutil
from typing import List

from database import get_db
from models.food import Food
from models.vendor import Vendor
from models.user import User
from schemas.food import FoodResponse
from core.security import get_current_user

router = APIRouter(prefix="/foods", tags=["Foods"])

# --- Image Upload Helper ---
if os.environ.get("VERCEL"):
    UPLOAD_DIR = "/tmp/uploads/foods"
else:
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    UPLOAD_DIR = os.path.join(BASE_DIR, "uploads", "foods")
os.makedirs(UPLOAD_DIR, exist_ok=True)

def save_image(image: UploadFile) -> str:
    ext = image.filename.split(".")[-1]
    filename = f"{uuid.uuid4().hex}.{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)
    return f"/uploads/foods/{filename}"

# --- Get All Foods ---
@router.get("/all", response_model=List[FoodResponse])
def get_all_foods(db: Session = Depends(get_db)):
    return db.query(Food).all()

# --- Create Food ---
@router.post("", response_model=FoodResponse)
def create_food(
    food_name: str = Form(...),
    category: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    vendor_id: int = Form(...),
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify owner
    vendor = db.query(Vendor).filter(Vendor.vendor_id == vendor_id, Vendor.user_id == current_user.user_id).first()
    if not vendor:
        raise HTTPException(status_code=403, detail="Not authorized")

    new_food = Food(
        food_name=food_name,
        category=category.lower(),
        latitude=latitude,
        longitude=longitude,
        food_image_url=save_image(image),
        vendor_id=vendor_id
    )

    db.add(new_food)
    db.commit()
    db.refresh(new_food)
    return new_food

# --- Get Food By ID ---
@router.get("/{food_id}", response_model=FoodResponse)
def get_food(food_id: int, db: Session = Depends(get_db)):
    food = db.query(Food).filter(Food.food_id == food_id).first()
    if not food:
        raise HTTPException(status_code=404, detail="Food not found")
    return food

# --- Get Food By Vendor ---
@router.get("/vendor/{vendor_id}", response_model=List[FoodResponse])
def get_foods_by_vendor(vendor_id: int, db: Session = Depends(get_db)):
    return db.query(Food).filter(Food.vendor_id == vendor_id).all()

# --- Delete Food ---
@router.delete("/{food_id}")
def delete_food(food_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Verify food belongs to a vendor owned by current user
    food = db.query(Food).join(Vendor).filter(
        Food.food_id == food_id,
        Vendor.user_id == current_user.user_id
    ).first()

    if not food:
        raise HTTPException(status_code=404, detail="Food not found or unauthorized")

    if food.food_image_url:
        path = os.path.join(UPLOAD_DIR, food.food_image_url.split("/")[-1])
        if os.path.exists(path): os.remove(path)

    db.delete(food)
    db.commit()
    return {"message": "Foo deleted"}

