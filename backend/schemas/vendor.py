from pydantic import BaseModel, ConfigDict
from datetime import time
from schemas.user import UserResponse

class VendorBase(BaseModel):
    phone_number: str
    cart_image_url: str
    opening_time: time
    closing_time: time

class VendorCreate(VendorBase):
    pass

class VendorResponse(VendorBase):
    vendor_id: int
    user_id: int
    user: UserResponse | None = None

    model_config = ConfigDict(from_attributes=True)
