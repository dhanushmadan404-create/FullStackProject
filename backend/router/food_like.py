from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.food import Food
from models.food_like import FoodLike
from schemas.food_like import FoodLikeRequest
from core.security import get_current_user
from models.user import User

router = APIRouter(prefix="/foods", tags=["Foods"])

@router.post("/like")
def like_food(
    data: FoodLikeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1️⃣ Check if food exists
    food = db.query(Food).filter(Food.food_id == data.food_id).first()
    if not food:
        raise HTTPException(status_code=404, detail="Food not found")

    # 2️⃣ Check if already liked
    existing_like = db.query(FoodLike).filter(
        FoodLike.user_id == data.user_id,
        FoodLike.food_id == data.food_id
    ).first()

    if existing_like:
        return {
            "status": False,
            "message": "You already liked this cart"
        }

    # 3️⃣ Create new like
    new_like = FoodLike(
        user_id=data.user_id,
        food_id=data.food_id
    )

    db.add(new_like)
    db.commit()
    total_likes = (
        db.query(FoodLike)
        .filter(FoodLike.food_id == data.food_id)
        .count()
    )
    return {
        "status": True,
        "message": "You liked this food",
        "total_likes":total_likes
    }
@router.delete("/like")
def unlike_food(
    data: FoodLikeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    food = db.query(Food).filter(Food.food_id == data.food_id).first()
    if not food:
        raise HTTPException(status_code=404, detail="Food not found")

    like = (
        db.query(FoodLike)
        .filter(
            FoodLike.user_id == current_user.user_id,  
            FoodLike.food_id == data.food_id
        )
        .first()
    )

    if not like:
        raise HTTPException(status_code=400, detail="Like not found")

    db.delete(like)
    db.commit()

    total_likes = (
        db.query(FoodLike)
        .filter(FoodLike.food_id == data.food_id)
        .count()
    )

    return {
        "message": "Like removed successfully",
        "total_likes": total_likes
    }

@router.get("/liked")
def get_liked_foods(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    liked_foods = (
        db.query(FoodLike.food_id)
        .filter(FoodLike.user_id == current_user.user_id)
        .all()
    )
    # Return a flat list of IDs
    return [f[0] for f in liked_foods]
