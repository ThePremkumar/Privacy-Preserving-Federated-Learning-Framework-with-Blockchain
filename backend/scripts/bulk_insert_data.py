import pandas as pd
import sqlite3
import json
import uuid
import os
import hashlib
from datetime import datetime

# Configuration
CSV_PATH = "backend/data/healthcare_dataset.csv"
DB_PATH = "backend/app.db"
HOSPITAL_ID = "hosp_himsr"  # Default node ID
USER_ID = "system_bulk_import"

def bulk_insert():
    if not os.path.exists(CSV_PATH):
        print(f"Error: CSV file not found at {CSV_PATH}")
        return

    print(f"Reading dataset: {CSV_PATH}...")
    df = pd.read_csv(CSV_PATH)
    total_rows = len(df)
    print(f"Detected {total_rows:,} records.")

    # Calculate Hash
    with open(CSV_PATH, "rb") as f:
        sha256_hash = hashlib.sha256(f.read()).hexdigest()

    # Connect to SQLite
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # 1. Create the DatasetUpload record
        upload_id = str(uuid.uuid4())
        columns = ",".join(df.columns)
        now = datetime.utcnow().isoformat()

        print("Creating upload entry in database...")
        cursor.execute("""
            INSERT INTO dataset_uploads (id, filename, hospital_id, uploaded_by, record_count, columns, sha256_hash, status, uploaded_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (upload_id, "healthcare_dataset_bulk.csv", HOSPITAL_ID, USER_ID, total_rows, columns, sha256_hash, "completed", now))

        # 2. Prepare records for bulk insertion
        print(f"Preparing {total_rows:,} records for batch insertion...")
        
        # Convert dataframe to list of tuples for sqlite executemany
        # Every row must be a JSON string as per the schema
        records = []
        for idx, row in df.iterrows():
            record_id = str(uuid.uuid4())
            row_json = row.to_json()
            records.append((record_id, upload_id, idx, row_json))
            
            if len(records) % 50000 == 0:
                print(f"  Processed {len(records):,} rows...")

        # 3. Execute batch insertion
        print("Executing bulk insertion (this might take a moment)...")
        cursor.executemany("""
            INSERT INTO dataset_records (id, upload_id, row_index, data)
            VALUES (?, ?, ?, ?)
        """, records)

        conn.commit()
        print(f"\nSUCCESS: Successfully imported {total_rows:,} records.")
        print(f"New Upload ID: {upload_id}")
        print("-" * 40)
        print("You can now select this dataset in the training dashboard.")

    except Exception as e:
        conn.rollback()
        print(f"FAILED: An error occurred: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    bulk_insert()
