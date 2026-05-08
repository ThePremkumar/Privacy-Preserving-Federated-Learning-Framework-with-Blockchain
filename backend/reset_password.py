"""
Reset superadmin password to superadmin123
Run from backend/ directory with venv activated.
"""
import sqlite3
import bcrypt

DB_PATH = "app.db"
NEW_PASSWORD = "superadmin123"

# Hash with bcrypt
hashed = bcrypt.hashpw(NEW_PASSWORD.encode(), bcrypt.gensalt()).decode()

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

# Update superadmin
cur.execute("UPDATE users SET password_hash = ? WHERE username = 'superadmin'", (hashed,))
affected = cur.rowcount
conn.commit()
conn.close()

print(f"[OK] Updated {affected} row(s). superadmin password reset to: {NEW_PASSWORD}")
print(f"     Hash: {hashed[:30]}...")
