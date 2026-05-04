import sqlite3
import json
import os

db_path = "backend/app.db"

if not os.path.exists(db_path):
    print(f"Database {db_path} not found.")
    exit(1)

conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

print("Migrating existing aggregation data...")

try:
    cursor.execute("SELECT id, participating_jobs, participating_hospitals FROM aggregation_rounds")
    rows = cursor.fetchall()
    
    for row in rows:
        rid = row['id']
        p_jobs = row['participating_jobs']
        p_hospitals = row['participating_hospitals']
        
        c_jobs = json.dumps(p_jobs.split(",")) if p_jobs else "[]"
        c_nodes = json.dumps(p_hospitals.split(",")) if p_hospitals else "[]"
        
        cursor.execute(
            "UPDATE aggregation_rounds SET contributing_jobs = ?, contributing_nodes = ? WHERE id = ?",
            (c_jobs, c_nodes, rid)
        )
    
    conn.commit()
    print(f"Migrated {len(rows)} records.")
except sqlite3.OperationalError as e:
    print(f"No old columns to migrate from or error: {e}")

conn.close()
