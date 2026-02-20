from fastapi import APIRouter, Depends, HTTPException, Form, File, UploadFile
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
import os
import uuid
import shutil

from database import get_db
from models.food import Food
from models.vendor import Vendor
from models.user import User
from models.food_like import FoodLike
from schemas.food import FoodResponse
from core.security import get_current_user


router = APIRouter(prefix="/foods", tags=["Foods"])


# -----------------------------------
# Image Upload Configuration
# -----------------------------------

# If running on Vercel → use /tmp (only writable location)
UPLOAD_DIR = "/tmp/uploads/foods" if os.getenv("VERCEL") else "uploads/foods"

os.makedirs(UPLOAD_DIR, exist_ok=True)


def save_image(image: UploadFile) -> str:
    file_extension = image.filename.split(".")[-1]
    filename = f"{uuid.uuid4().hex}.{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)

    # This path will be used in frontend
    return f"/uploads/foods/{filename}"


# -----------------------------------
# Get All Foods
# -----------------------------------

@router.get("/all", response_model=List[FoodResponse])
def get_all_foods(db: Session = Depends(get_db)):
    foods = db.query(Food).all()
    result = []
    for food in foods:
        total_likes = db.query(func.count()).select_from(FoodLike).filter(FoodLike.food_id == food.food_id).scalar()
        result.append({
            "food_id": food.food_id,
            "food_name": food.food_name,
            "food_image_url": food.food_image_url,
            "category": food.category,
            "latitude": food.latitude,
            "longitude": food.longitude,
            "vendor_id": food.vendor_id,
            "total_likes": total_likes or 0
        })
    return result

# -----------------------------------
# Get Foods By Category
# -----------------------------------


@router.get("/category/{category}", response_model=List[FoodResponse])
def get_foods_by_category(
    category: str,
    db: Session = Depends(get_db),
):
    # fetch foods in category
    foods = db.query(Food).filter(
        Food.category == category.lower()
    ).all()

    if not foods:
        raise HTTPException(status_code=404, detail="No foods found for this category")

    response_list = []

    for food in foods:
        # count likes by food_id
        total_likes = (
            db.query(func.count())
            .select_from(FoodLike)
            .filter(FoodLike.food_id == food.food_id)
            .scalar()
        )

        response_list.append({
            "food_id": food.food_id,
            "food_name": food.food_name,
            "food_image_url": food.food_image_url,
            "category": food.category,
            "latitude": food.latitude,
            "longitude": food.longitude,
            "vendor_id": food.vendor_id,
            "total_likes": total_likes
        })

    return response_list

# -----------------------------------
# Create Food
# -----------------------------------

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
    # Verify vendor belongs to current user
    vendor = db.query(Vendor).filter(
        Vendor.vendor_id == vendor_id,
        Vendor.user_id == current_user.user_id
    ).first()

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


# -----------------------------------
# Get Food By ID
# -----------------------------------

@router.get("/{food_id}", response_model=FoodResponse)
def get_food(food_id: int, db: Session = Depends(get_db)):
    food = db.query(Food).filter(Food.food_id == food_id).first()

    if not food:
        raise HTTPException(status_code=404, detail="Food not found")

    total_likes = db.query(func.count()).select_from(FoodLike).filter(FoodLike.food_id == food.food_id).scalar()
    
    return {
        "food_id": food.food_id,
        "food_name": food.food_name,
        "food_image_url": food.food_image_url,
        "category": food.category,
        "latitude": food.latitude,
        "longitude": food.longitude,
        "vendor_id": food.vendor_id,
        "total_likes": total_likes or 0
    }


# -----------------------------------
# Get Foods By Vendor
# -----------------------------------

@router.get("/vendor/{vendor_id}", response_model=List[FoodResponse])
def get_foods_by_vendor(vendor_id: int, db: Session = Depends(get_db)):
    foods = db.query(Food).filter(Food.vendor_id == vendor_id).all()
    result = []
    for food in foods:
        total_likes = db.query(func.count()).select_from(FoodLike).filter(FoodLike.food_id == food.food_id).scalar()
        result.append({
            "food_id": food.food_id,
            "food_name": food.food_name,
            "food_image_url": food.food_image_url,
            "category": food.category,
            "latitude": food.latitude,
            "longitude": food.longitude,
            "vendor_id": food.vendor_id,
            "total_likes": total_likes or 0
        })
    return result


# -----------------------------------
# Delete Food
# -----------------------------------

@router.delete("/{food_id}")
def delete_food(
    food_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    food = db.query(Food).join(Vendor).filter(
        Food.food_id == food_id,
        Vendor.user_id == current_user.user_id
    ).first()

    if not food:
        raise HTTPException(status_code=404, detail="Food not found or unauthorized")

    # Delete image file if exists
    if food.food_image_url:
        filename = food.food_image_url.split("/")[-1]
        file_path = os.path.join(UPLOAD_DIR, filename)

        if os.path.exists(file_path):
            os.remove(file_path)

    db.delete(food)
    db.commit()

    return {"message": "Food deleted successfully"}


# -----------------------------------
# Update Food
# -----------------------------------

@router.put("/{food_id}", response_model=FoodResponse)
def update_food(
    food_id: int,
    food_name: str = Form(None),
    category: str = Form(None),
    latitude: float = Form(None),
    longitude: float = Form(None),
    image: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify food belongs to a vendor owned by the current user
    food = db.query(Food).join(Vendor).filter(
        Food.food_id == food_id,
        Vendor.user_id == current_user.user_id
    ).first()

    if not food:
        raise HTTPException(status_code=404, detail="Food not found or unauthorized")

    if food_name: food.food_name = food_name
    if category: food.category = category.lower()
    if latitude: food.latitude = latitude
    if longitude: food.longitude = longitude
    if image: food.food_image_url = save_image(image)

    db.commit()
    db.refresh(food)
    
    total_likes = db.query(func.count()).select_from(FoodLike).filter(FoodLike.food_id == food.food_id).scalar()
    
    return {
        "food_id": food.food_id,
        "food_name": food.food_name,
        "food_image_url": food.food_image_url,
        "category": food.category,
        "latitude": food.latitude,
        "longitude": food.longitude,
        "vendor_id": food.vendor_id,
        "total_likes": total_likes or 0
    }


# -----------------------------------
# Get Top 4 Most Liked Foods
# -----------------------------------

@router.get("/top-liked")
def get_top_liked_foods(db: Session = Depends(get_db)):

    top_foods = (
        db.query(
            Food,
            func.count(FoodLike.food_id).label("total_likes")
        )
        .outerjoin(FoodLike)
        .group_by(Food.food_id)
        .order_by(func.count(FoodLike.food_id).desc())
        .limit(4)
        .all()
    )

    result = []

    for food, total_likes in top_foods:
        result.append({
            "food_id": food.food_id,
            "food_name": food.food_name,
            "food_image_url": food.food_image_url,
            "category": food.category,
            "latitude": food.latitude,
            "longitude": food.longitude,
            "vendor_id": food.vendor_id,
            "total_likes": total_likes
        })

    return result
