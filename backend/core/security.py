"""
security.py
-------------
This file handles:
1. Password hashing & verification
2. JWT token creation
3. JWT token validation
4. Current user extraction using OAuth2
"""

from datetime import datetime, timedelta
import os

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from dotenv import load_dotenv

# JWT library (PyJWT currently used)
import jwt
from jwt import PyJWTError

from database import SessionLocal
from models.user import User

# --------------------------------------------------
# ENV CONFIG (BEGINNER FRIENDLY ✅)
# --------------------------------------------------

# Simply load .env from project root
load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "CHANGE_ME")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60)
)

# --------------------------------------------------
# PASSWORD HANDLING
# --------------------------------------------------

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hash plain password before saving to DB"""
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    """Compare plain password with hashed password from DB"""
    return pwd_context.verify(plain, hashed)

# --------------------------------------------------
# OAUTH2 CONFIG
# --------------------------------------------------

"""
OAuth2PasswordBearer ONLY:
- Reads token from Authorization header
- Format: Authorization: Bearer <token>
"""
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# --------------------------------------------------
# TOKEN CREATION
# --------------------------------------------------

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    """
    Creates JWT token after successful login
    """
    to_encode = data.copy()

    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    to_encode.update({"exp": expire})

    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# --------------------------------------------------
# DATABASE DEPENDENCY
# --------------------------------------------------

def get_db():
    """Provides DB session to routes & dependencies"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --------------------------------------------------
# TOKEN VERIFICATION & CURRENT USER
# --------------------------------------------------

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """
    Runs automatically for protected routes
    """

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authentication",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str | None = payload.get("sub")

        if email is None:
            raise credentials_exception

    except PyJWTError:
        raise credentials_exception

    user = db.query(User).filter(User.email == email).first()

    if not user:
        raise credentials_exception

    return user
