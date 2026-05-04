from app.core.database import SessionLocal
from app.core.db_models import User

db = SessionLocal()
users = db.query(User).all()
for u in users:
    print(f"ID: {u.id} | Username: {u.username} | Role: {u.role} | Hospital: {u.hospital_id}")
db.close()
