from sqlalchemy import Column, Integer, String, TIMESTAMP, Text
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    name = Column(String, nullable=False)
    role = Column(String, nullable=False)
    image_url = Column(Text, nullable=True)

    created_at = Column(
        TIMESTAMP,
        nullable=False,
        default=datetime.utcnow
    )

    vendor = relationship(
        "Vendor",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan"
    )
    reviews = relationship("Review", back_populates="user", cascade="all, delete")
    food_likes = relationship("FoodLike", back_populates="user", cascade="all, delete")