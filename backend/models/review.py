from sqlalchemy import Column, Integer, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class Review(Base):
    __tablename__ = "reviews"

    review_id = Column(Integer, primary_key=True, index=True)
    comment = Column(Text, nullable=False)

    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"))
    vendor_id = Column(Integer, ForeignKey("vendors.vendor_id", ondelete="CASCADE"))
    food_id = Column(Integer, ForeignKey("foods.food_id", ondelete="CASCADE"))

    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="reviews")
    vendor = relationship("Vendor", back_populates="reviews")
    food = relationship("Food", back_populates="reviews")
