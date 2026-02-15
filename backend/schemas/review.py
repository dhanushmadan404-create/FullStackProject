from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional


class ReviewBase(BaseModel):
    comment: str


class ReviewCreate(ReviewBase):
    vendor_id: Optional[int] = None
    food_id: int


class ReviewUpdate(BaseModel):
    comment: str


class ReviewResponse(ReviewBase):
    review_id: int
    user_id: Optional[int] = None
    vendor_id: Optional[int] = None
    food_id: int
    username: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
