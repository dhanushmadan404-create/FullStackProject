from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc
from database import get_db
from models.review import Review
from models.vendor import Vendor
from models.food import Food
from models.user import User
from schemas.review import ReviewCreate, ReviewResponse, ReviewUpdate
from core.security import get_current_user

router = APIRouter(prefix="/reviews", tags=["Reviews"])


# post
@router.post("", response_model=ReviewResponse)
def create_review(
    data: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    food = db.query(Food).filter(Food.food_id == data.food_id).first()
    if not food:
        raise HTTPException(status_code=404, detail="Food not found")

    # Use provided vendor_id or derive it from food
    vendor_id = data.vendor_id if data.vendor_id is not None else food.vendor_id

    review = Review(
        comment=data.comment,
        user_id=current_user.user_id,
        vendor_id=vendor_id,
        food_id=data.food_id
    )

    db.add(review)
    db.commit()
    db.refresh(review)

    # Return with username for immediate UI updates
    return {
        **review.__dict__,
        "username": current_user.name
    }

# delete

@router.delete("/{review_id}")
def delete_review(
    review_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    review = db.query(Review).filter(Review.review_id == review_id).first()

    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    if review.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    db.delete(review)
    db.commit()

    return {"message": "Review deleted successfully"}

# Patch
@router.patch("/{review_id}", response_model=ReviewResponse)
def update_review(
    review_id: int,
    data: ReviewUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    review = db.query(Review).filter(Review.review_id == review_id).first()

    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    if review.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    review.comment = data.comment

    db.commit()
    db.refresh(review)

    return review

@router.get("/food/{food_id}", response_model=list[ReviewResponse])
def get_reviews_by_food(food_id: int, db: Session = Depends(get_db)):
    reviews = (
        db.query(Review)
        .options(joinedload(Review.user))
        .filter(Review.food_id == food_id)
        .order_by(desc(Review.created_at))
        .all()
    )

    return [
        {
            "review_id": review.review_id,
            "comment": review.comment,
            "food_id": review.food_id,
            "user_id": review.user_id,
            "vendor_id": review.vendor_id,
            "created_at": review.created_at,
            "username": review.user.name if review.user else "User"
        }
        for review in reviews
    ]

