from pydantic import BaseModel, ConfigDict
from datetime import datetime


class ReviewBase(BaseModel):
    comment: str


class ReviewCreate(ReviewBase):
    vendor_id: int
    food_id: int


class ReviewUpdate(BaseModel):
    comment: str


class ReviewResponse(ReviewBase):
    review_id: int
    user_id: int
    vendor_id: int
    food_id: int
    created_at: datetime

    class Config:
        from_attributes = True   # (if using Pydantic v2)
