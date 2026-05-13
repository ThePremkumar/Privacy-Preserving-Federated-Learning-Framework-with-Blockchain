import sys
import os

# Add the parent directory to sys.path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.core.db_models import User

def update_names():
    db = SessionLocal()
    try:
        users = db.query(User).all()
        for user in users:
            if not user.full_name:
                # Generate a nicer name from username
                name = user.username.replace("dr_", "").replace("_", " ").title()
                user.full_name = name
                print(f"Updated {user.username} -> {user.full_name}")
        db.commit()
        print("Update complete!")
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    update_names()
