import os
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from dotenv import load_dotenv
import jwt
from jwt import PyJWTError

from database import SessionLocal
from models.user import User

load_dotenv()

# --- Config ---
SECRET_KEY = os.getenv("SECRET_KEY", "CHANGE_ME")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 600 # Long expiry for convenience

# --- Password Hashing ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str):
    return pwd_context.verify(plain, hashed)

# --- OAuth2 ---
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# --- Token Logic ---
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# --- DB Dependency ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Get Current User ---
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    auth_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authentication",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise auth_exception
    except PyJWTError:
        raise auth_exception

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise auth_exception
    
    return user

