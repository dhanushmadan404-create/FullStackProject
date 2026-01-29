from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Form,
    File,
    UploadFile
)
from sqlalchemy.orm import Session, joinedload
from typing import List
from datetime import time
import os
import uuid
import shutil
# universal unique identity
from database import get_db
from core.security import get_current_user
from models.user import User
from models.vendor import Vendor
from schemas.vendor import VendorResponse

router = APIRouter(prefix="/vendors", tags=["Vendors"])


# ================= IMAGE STORAGE =================
if os.environ.get("VERCEL"):
    UPLOAD_DIR = "/tmp/uploads/vendors"
else:
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    UPLOAD_DIR = os.path.join(BASE_DIR, "uploads", "vendors")

os.makedirs(UPLOAD_DIR, exist_ok=True)

def save_image(image: UploadFile) -> str:
    ext = image.filename.split(".")[-1]
    filename = f"{uuid.uuid4().hex}.{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)
# write binary
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)

    return f"/uploads/vendors/{filename}"


# create vendor
@router.post("", response_model=VendorResponse)
def create_vendor(
    phone_number: str = Form(...),
    opening_time: time = Form(...),
    closing_time: time = Form(...),
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if db.query(Vendor).filter(
        Vendor.user_id == current_user.user_id
    ).first():
        raise HTTPException(
            status_code=400,
            detail="Vendor already exists"
        )

    image_url = save_image(image)

    vendor = Vendor(
        phone_number=phone_number,
        opening_time=opening_time,
        closing_time=closing_time,
        cart_image_url=image_url,
        user_id=current_user.user_id
    )

    db.add(vendor)
    db.commit()
    db.refresh(vendor)
    return vendor

# get all vendors
@router.get("", response_model=List[VendorResponse])
def get_all_vendors(db: Session = Depends(get_db)):
    return db.query(Vendor).options(joinedload(Vendor.user)).all()


@router.get("/user/{user_id}")
def get_vendor_by_user(user_id: int, db: Session = Depends(get_db)):
    vendor = db.query(Vendor).filter(Vendor.user_id == user_id).first()
    if not vendor:
        return {"exists": False}
    
    # Return full data plus exists flag
    return {
        "exists": True,
        "vendor_id": vendor.vendor_id,
        "phone_number": vendor.phone_number,
        "cart_image_url": vendor.cart_image_url,
        "opening_time": vendor.opening_time.strftime("%H:%M:%S") if vendor.opening_time else None,
        "closing_time": vendor.closing_time.strftime("%H:%M:%S") if vendor.closing_time else None,
        "user_id": vendor.user_id
    }

# vendor id
@router.get("/{vendor_id}", response_model=VendorResponse)
def get_vendor(vendor_id: int, db: Session = Depends(get_db)):
    vendor = db.query(Vendor).filter(Vendor.vendor_id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return vendor


# update vendor
@router.put("", response_model=VendorResponse)
def update_vendor(
    phone_number: str | None = Form(None),
    opening_time: time | None = Form(None),
    closing_time: time | None = Form(None),
    image: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    vendor = db.query(Vendor).filter(
        Vendor.user_id == current_user.user_id
    ).first()

    if not vendor:
        raise HTTPException(
            status_code=404,
            detail="Vendor not found"
        )

    if phone_number:
        vendor.phone_number = phone_number
    if opening_time:
        vendor.opening_time = opening_time
    if closing_time:
        vendor.closing_time = closing_time
    if image:
        vendor.cart_image_url = save_image(image)

    db.commit()
    db.refresh(vendor)
    return vendor

# update vendor by id (Admin/Special use)
@router.put("/{vendor_id}", response_model=VendorResponse)
def update_vendor_by_id(
    vendor_id: int,
    phone_number: str | None = Form(None),
    opening_time: time | None = Form(None),
    closing_time: time | None = Form(None),
    image: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Only Admin or the Vendor owner can update
    vendor = db.query(Vendor).filter(Vendor.vendor_id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
        
    if current_user.role != "admin" and vendor.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    if phone_number:
        vendor.phone_number = phone_number
    if opening_time:
        vendor.opening_time = opening_time
    if closing_time:
        vendor.closing_time = closing_time
    if image:
        vendor.cart_image_url = save_image(image)

    db.commit()
    db.refresh(vendor)
    return vendor

# delete vendor
@router.delete("")
def delete_vendor(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    vendor = db.query(Vendor).filter(
        Vendor.user_id == current_user.user_id
    ).first()

    if not vendor:
        raise HTTPException(
            status_code=404,
            detail="Vendor not found"
        )

    db.delete(vendor)
    db.commit()
    return {"message": "Vendor deleted successfully"}

# delete vendor by id (Admin flow)
@router.delete("/{vendor_id}")
def delete_vendor_by_id(
    vendor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    vendor = db.query(Vendor).filter(Vendor.vendor_id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    db.delete(vendor)
    db.commit()
    return {"message": "Vendor deleted successfully"}

    return {"message": "Vendor deleted successfully"}
