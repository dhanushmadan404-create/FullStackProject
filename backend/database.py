from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os
from fastapi import HTTPException 

# Get absolute path to backend/.env
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_PATH = os.path.join(BASE_DIR, ".env")
load_dotenv(ENV_PATH)  # 🔥 REQUIRED

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
    from sqlalchemy import text
    
    try:
        with engine.connect() as conn:
            check_sql = text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='users' AND column_name='image';
            """)
            result = conn.execute(check_sql).fetchone()
            
            if result:
                print("Found old 'image' column. Renaming to 'image_url'...")
                conn.execute(text("ALTER TABLE users RENAME COLUMN image TO image_url;"))
                conn.commit()
                print("Migration successful: Renamed users.image to users.image_url")
    except Exception as e:
        print(f"Migration error (might already be fixed): {e}")

    Base.metadata.create_all(bind=engine)
    print("Database initialized.")