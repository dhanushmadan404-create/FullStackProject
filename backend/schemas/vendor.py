from pydantic import BaseModel, ConfigDict, Field
from datetime import time
from typing import Optional
from schemas.user import UserResponse


# -----------------------------
# Base Schema
# -----------------------------

class VendorBase(BaseModel):
    phone_number: str = Field(..., min_length=8, max_length=15)
    opening_time: time
    closing_time: time
    cart_image_url: Optional[str] = None


# -----------------------------
# Create Schema
# -----------------------------

class VendorCreate(BaseModel):
    phone_number: str = Field(..., min_length=8, max_length=15)
    opening_time: time
    closing_time: time
    # image comes from UploadFile, so not required here


# -----------------------------
# Update Schema
# -----------------------------

class VendorUpdate(BaseModel):
    phone_number: Optional[str] = Field(None, min_length=8, max_length=15)
    opening_time: Optional[time] = None
    closing_time: Optional[time] = None
    cart_image_url: Optional[str] = None


# -----------------------------
# Response Schema
# -----------------------------

class VendorResponse(VendorBase):
    vendor_id: int
    user_id: int
    user: Optional[UserResponse] = None

    model_config = ConfigDict(from_attributes=True)
