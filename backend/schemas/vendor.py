from pydantic import BaseModel, ConfigDict
from datetime import time

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

    model_config = ConfigDict(from_attributes=True)
