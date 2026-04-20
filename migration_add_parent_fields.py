import sqlite3
import os

db_path = 'career_guidance.db'
if not os.path.exists(db_path):
    print(f"Error: {db_path} not found.")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

columns_to_add = [
    ("parent_whatsapp", "TEXT"),
    ("shared_with_parent", "BOOLEAN DEFAULT 1"),
    ("parent_pin", "TEXT DEFAULT ''")
]

for col_name, col_type in columns_to_add:
    try:
        cursor.execute(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}")
        print(f"Added column {col_name} to users table.")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e).lower():
            print(f"Column {col_name} already exists.")
        else:
            print(f"Error adding column {col_name}: {e}")

conn.commit()
conn.close()
print("Migration completed.")
