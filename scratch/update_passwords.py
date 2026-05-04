import sqlite3
import bcrypt
import uuid

def update_passwords():
    conn = sqlite3.connect('backend/app.db')
    cursor = conn.cursor()
    
    # Mapping of old username to new username and password
    updates = [
        ('himsr_node', 'himsr_node_1', 'node@1'),
        ('apollo_node', 'apollo_node_1', 'node@1'),
        ('aiims_node', 'aiims_node_1', 'node@1')
    ]
    
    for old_username, new_username, password in updates:
        # Check if user exists with old or new username
        cursor.execute("SELECT id FROM users WHERE username = ? OR username = ?", (old_username, new_username))
        row = cursor.fetchone()
        
        if row:
            user_id = row[0]
            # Generate new hash
            salt = bcrypt.gensalt()
            hashed = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
            
            cursor.execute("UPDATE users SET username = ?, password_hash = ? WHERE id = ?", (new_username, hashed, user_id))
            print(f"Updated {old_username} -> {new_username} with password {password}")
        else:
            print(f"User {old_username}/{new_username} not found in database")
            
    conn.commit()
    conn.close()

if __name__ == "__main__":
    update_passwords()
