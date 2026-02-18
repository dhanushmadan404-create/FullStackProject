from sqlalchemy import Column, Integer, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from database import Base

class FoodLike(Base):
    __tablename__ = "food_likes"

    id = Column(Integer, primary_key=True, index=True)

    # Foreign keys
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"))
    food_id = Column(Integer, ForeignKey("foods.food_id", ondelete="CASCADE"))

    # Prevent same user liking same food twice
    __table_args__ = (UniqueConstraint("user_id", "food_id", name="uq_user_food"),)

    # Relationships
    user = relationship("User", back_populates="food_likes")
    food = relationship("Food", back_populates="food_likes")

