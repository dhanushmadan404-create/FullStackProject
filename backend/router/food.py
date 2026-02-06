from fastapi import APIRouter, Depends, HTTPException, Form, File, UploadFile
from sqlalchemy.orm import Session
from typing import List
import uuid, os, shutil

from database import get_db
from core.security import get_current_user
from models.food import Food
from models.vendor import Vendor
from models.user import User
from schemas.food import FoodResponse

router = APIRouter(prefix="/foods", tags=["Foods"])

# ================= IMAGE STORAGE =================
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

# ================= GET ALL FOODS =================
@router.get("/all", response_model=List[FoodResponse])
def get_all_foods(db: Session = Depends(get_db)):
    return db.query(Food).all()

# ================= CREATE FOOD =================
@router.post("", response_model=FoodResponse)
def create_food(
    food_name: str = Form(...),
    category: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    vendor_id: int = Form(...),  # now simple integer
    image: UploadFile = File(...),  # Method 1
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    vendor = db.query(Vendor).filter(
        Vendor.vendor_id == vendor_id,
        Vendor.user_id == current_user.user_id
    ).first()

    if not vendor:
        raise HTTPException(status_code=403, detail="Not authorized")

    food = Food(
        food_name=food_name,
        category=category.lower(),
        latitude=latitude,
        longitude=longitude,
        food_image_url=save_image(image),
        vendor_id=vendor.vendor_id
    )

    db.add(food)
    db.commit()
    db.refresh(food)
    return food

# ================= GET FOOD BY CATEGORY =================
@router.get("/category/{category}", response_model=List[FoodResponse])
def get_foods_by_category(category: str, db: Session = Depends(get_db)):
    foods = db.query(Food).filter(Food.category == category.lower().strip()).all()
    return foods

# ================= GET FOOD BY food id =================
@router.get("/{foodId}", response_model=FoodResponse)
def get_food_by_id(foodId: str, db: Session = Depends(get_db)):
    food = (
        db.query(Food)
        .filter(Food.food_id == foodId.strip())
        .first()
    )
    if not food:
        raise HTTPException(status_code=404, detail="Food not found")

    return food
# ================= GET FOOD BY VENDOR =================
@router.get("/vendor/{vendor_id}", response_model=List[FoodResponse])
def get_foods_by_vendor(vendor_id: int, db: Session = Depends(get_db)):
    foods = db.query(Food).filter(Food.vendor_id == vendor_id).all()
    return foods

# ================= DELETE FOOD =================
@router.delete("/{food_id}")
def delete_food(
    food_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    food = (
        db.query(Food)
        .join(Vendor)
        .filter(
            Food.food_id == food_id,
            Vendor.user_id == current_user.user_id
        )
        .first()
    )

    if not food:
        raise HTTPException(status_code=404, detail="Food not found")

    # delete image file
    if food.food_image_url:
        filename = food.food_image_url.split("/")[-1]
        file_path = os.path.join(UPLOAD_DIR, filename)
        if os.path.exists(file_path):
            os.remove(file_path)

    db.delete(food)
    db.commit()
    return {"message": "Food deleted successfully"}



# ================= DELETE ALL FOODS BY VENDOR =================
@router.delete("/{vendor_id}/foods")
def delete_foods_by_vendor(
    vendor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify vendor belongs to current user
    vendor = db.query(Vendor).filter(
        Vendor.vendor_id == vendor_id,
        Vendor.user_id == current_user.user_id
    ).first()

    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found or unauthorized")

    # Get all foods for this vendor
    foods = db.query(Food).filter(Food.vendor_id == vendor.vendor_id).all()

    if not foods:
        return {"message": "No foods to delete for this vendor"}

    # Delete images from disk
    for food in foods:
        if food.food_image_url:
            filename = food.food_image_url.split("/")[-1]
            file_path = os.path.join(UPLOAD_DIR, filename)
            if os.path.exists(file_path):
                os.remove(file_path)
        db.delete(food)

    db.commit()
    return {"message": f"Deleted {len(foods)} food items for vendor {vendor.vendor_id}"}
