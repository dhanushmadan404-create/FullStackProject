from pydantic import BaseModel, ConfigDict
from datetime import time
class FoodBase(BaseModel):
    food_name: str
    food_image_url: str | None
    category: str | None
    latitude: float
    longitude: float

class FoodCreate(FoodBase):
    pass

class FoodResponse(FoodBase):
    food_id: int
    vendor_id: int
    total_likes: int 

    opening_time: time
    closing_time: time
   

    model_config = ConfigDict(from_attributes=True)
