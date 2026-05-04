import sqlite3
import os

db_path = "backend/app.db"

if not os.path.exists(db_path):
    print(f"Database {db_path} not found.")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# List of columns to add to aggregation_rounds
# Using TEXT for JSON types as per SQLite convention in SQLAlchemy
columns_to_add = [
    ("global_model_version", "INTEGER DEFAULT 1"),
    ("contributing_jobs", "TEXT"),
    ("contributing_nodes", "TEXT"),
    ("node_weights", "TEXT"),
    ("blockchain_status", "TEXT DEFAULT 'confirmed'"),
    ("privacy_epsilon", "REAL DEFAULT 1.0"),
    ("notes", "TEXT"),
    ("started_at", "DATETIME"),
    ("completed_at", "DATETIME"),
    ("duration_seconds", "INTEGER")
]

notifications_columns = [
    ("severity", "TEXT DEFAULT 'info'"),
    ("sound", "TEXT DEFAULT 'chime'"),
    ("target_roles", "TEXT"),
    ("meta_data", "TEXT")
]

print(f"Applying migrations to {db_path}...")

# Migration for aggregation_rounds
for col_name, col_type in columns_to_add:
    try:
        cursor.execute(f"ALTER TABLE aggregation_rounds ADD COLUMN {col_name} {col_type}")
        print(f"Added column to aggregation_rounds: {col_name}")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print(f"Column {col_name} already exists in aggregation_rounds, skipping.")
        else:
            print(f"Error adding {col_name} to aggregation_rounds: {e}")

# Migration for notifications
for col_name, col_type in notifications_columns:
    try:
        cursor.execute(f"ALTER TABLE notifications ADD COLUMN {col_name} {col_type}")
        print(f"Added column to notifications: {col_name}")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print(f"Column {col_name} already exists in notifications, skipping.")
        else:
            print(f"Error adding {col_name} to notifications: {e}")

conn.commit()
conn.close()
print("Migration completed.")