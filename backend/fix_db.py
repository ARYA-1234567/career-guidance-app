import sqlite3

db_path = 'career_guidance.db'

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check if 'gender' column exists
    cursor.execute("PRAGMA table_info(users)")
    columns = [row[1] for row in cursor.fetchall()]
    
    if 'gender' not in columns:
        cursor.execute("ALTER TABLE users ADD COLUMN gender TEXT")
        print("Successfully added 'gender' column to 'users' table.")
    else:
        print("'gender' column already exists in 'users' table.")
    
    conn.commit()
    conn.close()
except Exception as e:
    print(f"Error updating database: {e}")
