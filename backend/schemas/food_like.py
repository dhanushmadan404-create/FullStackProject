from pydantic import BaseModel

class FoodLikeRequest(BaseModel):
    user_id: int
    food_id: int

    class Config:
        orm_mode = True
