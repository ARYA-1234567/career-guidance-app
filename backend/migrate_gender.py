import sqlite3
import os

db_path = 'C:/Users/aryam/career_guidance/backend/career_guidance.db'

if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    try:
        cursor.execute("ALTER TABLE student_profiles ADD COLUMN gender TEXT")
        conn.commit()
        print("Successfully added gender column to student_profiles table.")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e).lower():
            print("Gender column already exists.")
        else:
            print(f"Error: {e}")
    finally:
        conn.close()
else:
    print("Database file not found.")
