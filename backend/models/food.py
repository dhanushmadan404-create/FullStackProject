from sqlalchemy import Column, Integer, String, Text, Float, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class Food(Base):
    __tablename__ = "foods"

    food_id = Column(Integer, primary_key=True, index=True)
    food_name = Column(String(255), nullable=False)
    food_image_url = Column(Text)
    category = Column(String(100))
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)

    vendor_id = Column(
        Integer,
        ForeignKey("vendors.vendor_id", ondelete="CASCADE"),
        nullable=False
    )

    vendor = relationship(
        "Vendor",
        back_populates="foods"
    )
