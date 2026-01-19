from pydantic import BaseModel, ConfigDict

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

    model_config = ConfigDict(from_attributes=True)
