import sqlite3
import uuid
from datetime import datetime, timedelta

db_path = "backend/app.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# 1. Create a mock dataset upload
upload_id = str(uuid.uuid4())
cursor.execute("""
    INSERT INTO dataset_uploads (id, filename, hospital_id, uploaded_by, record_count, columns, status, uploaded_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
""", (
    upload_id, 
    "clinical_data_may_2026.csv", 
    "hosp_himsr", 
    "himsr_node", 
    1250, 
    "age,gender,bp,sugar,label", 
    "completed", 
    (datetime.utcnow() - timedelta(days=2)).isoformat()
))

# 2. Create a mock training job
cursor.execute("""
    INSERT INTO training_jobs (id, hospital_id, upload_id, started_by, status, epochs, learning_rate, accuracy, loss, num_samples, started_at, completed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
""", (
    str(uuid.uuid4()),
    "hosp_himsr",
    upload_id,
    "himsr_node",
    "completed",
    50,
    "0.001",
    "0.924",
    "0.185",
    1250,
    (datetime.utcnow() - timedelta(hours=5)).isoformat(),
    (datetime.utcnow() - timedelta(hours=4, minutes=50)).isoformat()
))

conn.commit()
conn.close()
print("Successfully seeded mock hospital data for hosp_himsr.")
