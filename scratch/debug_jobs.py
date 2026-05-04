from app.core.database import SessionLocal
from app.core.db_models import TrainingJob
import json

db = SessionLocal()
jobs = db.query(TrainingJob).all()
for j in jobs:
    print(f"ID: {j.id}, Status: {j.status}, Accuracy: {j.accuracy}, Loss: {j.loss}, Accuracy Type: {type(j.accuracy)}, Loss Type: {type(j.loss)}")
db.close()
