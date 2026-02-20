from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from enum import Enum
from typing import Optional


# -----------------------------
# User Role Enum
# -----------------------------

class UserRole(str, Enum):
    user = "user"
    vendor = "vendor"
    admin = "admin"


# -----------------------------
# Base Schema
# -----------------------------

class UserBase(BaseModel):
    email: str
    name: str = Field(..., min_length=2, max_length=100)
    image_url: Optional[str] = None
    role: UserRole


# -----------------------------
# Create Schema
# -----------------------------


class UserCreate(BaseModel):
    email: str
    name: str = Field(..., min_length=2, max_length=100)
    password: str = Field(..., min_length=6)
    image_url: Optional[str] = None


# -----------------------------
# Response Schema
# -----------------------------

class UserResponse(UserBase):
    user_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# -----------------------------
# Update Name & Image
# -----------------------------

class UserUpdateNameImage(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    image_url: Optional[str] = None

# -----------------------------
# Login Schema
# -----------------------------

class LoginSchema(BaseModel):
    email: str
    password: str
