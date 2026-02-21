from pydantic import BaseModel

class FoodLikeRequest(BaseModel):
    food_id: int

    class Config:
        orm_mode = True