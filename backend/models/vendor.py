from sqlalchemy import Column, Integer, String, Text, Time, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class Vendor(Base):
    __tablename__ = "vendors"

    vendor_id = Column(Integer, primary_key=True, index=True)
    phone_number = Column(String, nullable=False)
    cart_image_url = Column(Text, nullable=False)

    opening_time = Column(Time, nullable=False)
    closing_time = Column(Time, nullable=False)

    user_id = Column(
        Integer,
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
        unique=True
    )

    user = relationship(
        "User",
        back_populates="vendor",
        uselist=False
    )

    foods = relationship(
        "Food",
        back_populates="vendor",
        cascade="all, delete-orphan"
    )
