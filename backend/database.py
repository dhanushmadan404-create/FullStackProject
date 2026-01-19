from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os
from fastapi import HTTPException # Added for get_db error handling

load_dotenv()  # 🔥 REQUIRED

DATABASE_URL = os.getenv("DATABASE_URL")

engine = None
SessionLocal = None
if DATABASE_URL:
    # SQLAlchemy 1.4+ requires 'postgresql://' instead of 'postgres://'
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
        
    engine = create_engine(DATABASE_URL, echo=True, pool_pre_ping=True)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
else:
    print("WARNING: DATABASE_URL not set. Database features will be unavailable.")

Base = declarative_base()

def get_db():
    if not SessionLocal:
        raise HTTPException(
            status_code=500, 
            detail="Database connection not configured. Please set DATABASE_URL in Vercel settings."
        )
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        print(f"Database session error: {e}")
        raise
    finally:
        db.close()

def init_db():
    if not engine:
        print("Skipping init_db: engine not configured.")
        return
    from models import user, food, vendor
    Base.metadata.create_all(bind=engine)
    print("Database initialized.")