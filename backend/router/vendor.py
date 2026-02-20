anfrom fastapi import APIRouter, Depends, HTTPException, Form, File, UploadFile
from sqlalchemy.orm import Session
from datetime import time
import os, uuid, shutil
from database import get_db
from models.vendor import Vendor
from schemas.vendor import VendorResponse
from core.security import get_current_user
from models.user import User

router = APIRouter(prefix="/vendors", tags=["Vendors"])

# --- Image Upload Helper ---
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
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)
    return f"/uploads/vendors/{filename}"

# --- Create Vendor ---
@router.post("", response_model=VendorResponse)
def create_vendor(
    phone_number: str = Form(...),
    opening_time: time = Form(...),
    closing_time: time = Form(...),
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if db.query(Vendor).filter(Vendor.user_id == current_user.user_id).first():
        raise HTTPException(status_code=400, detail="Vendor already exists")

    vendor = Vendor(
        phone_number=phone_number,
        opening_time=opening_time,
        closing_time=closing_time,
        cart_image_url=save_image(image),
        user_id=current_user.user_id
    )

    db.add(vendor)
    db.commit()
    db.refresh(vendor)
    return vendor

# --- Get All Vendors ---
@router.get("", response_model=list[VendorResponse])
def get_all_vendors(db: Session = Depends(get_db)):
    return db.query(Vendor).all()

# --- Get Current Vendor ---
@router.get("/me")
def get_current_vendor_info(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    vendor = db.query(Vendor).filter(Vendor.user_id == current_user.user_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    return {
        "exists": True,
        "vendor_id": vendor.vendor_id,
        "phone_number": vendor.phone_number,
        "cart_image_url": vendor.cart_image_url,
        "opening_time": vendor.opening_time.strftime("%H:%M:%S") if vendor.opening_time else None,
        "closing_time": vendor.closing_time.strftime("%H:%M:%S") if vendor.closing_time else None,
        "user_id": vendor.user_id
    }

# --- Get Vendor By User ---
@router.get("/user/{user_id}")
def get_vendor_by_user(user_id: int, db: Session = Depends(get_db)):
    vendor = db.query(Vendor).filter(Vendor.user_id == user_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    return {
        "exists": True,
        "vendor_id": vendor.vendor_id,
        "phone_number": vendor.phone_number,
        "cart_image_url": vendor.cart_image_url,
        "opening_time": vendor.opening_time.strftime("%H:%M:%S") if vendor.opening_time else None,
        "closing_time": vendor.closing_time.strftime("%H:%M:%S") if vendor.closing_time else None,
        "user_id": vendor.user_id
    }

# --- Update Vendor ---
@router.put("", response_model=VendorResponse)
def update_vendor(
    phone_number: str = Form(None),
    opening_time: time = Form(None),
    closing_time: time = Form(None),
    image: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    vendor = db.query(Vendor).filter(Vendor.user_id == current_user.user_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    if phone_number: vendor.phone_number = phone_number
    if opening_time: vendor.opening_time = opening_time
    if closing_time: vendor.closing_time = closing_time
    if image: vendor.cart_image_url = save_image(image)

    db.commit()
    db.refresh(vendor)
    return vendor

