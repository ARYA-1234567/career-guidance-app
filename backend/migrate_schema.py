import sqlite3
import shutil
import os

DB_PATH = "career_guidance.db"
BACKUP_PATH = "career_guidance.backup.db"

def migrate():
    print("Initializing Core Database Upgrade...")
    
    # 1. Verification of DB existence
    if not os.path.exists(DB_PATH):
        print(f"Error: Database {DB_PATH} not found.")
        return
        
    # 2. Safety Backup
    print(f"Step 1: Creating safety backup at {BACKUP_PATH}...")
    shutil.copy2(DB_PATH, BACKUP_PATH)
    print("Backup complete.")
    
    # 3. Schema Modification
    print("Step 2: Connecting to Neural Core to apply schema update...")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Check if the column exists to avoid errors on multiple runs
        cursor.execute("PRAGMA table_info(users)")
        columns = [col[1] for col in cursor.fetchall()]
        
        if "selected_career" not in columns:
            print("Missing 'selected_career' column detected. Patching schema...")
            cursor.execute("ALTER TABLE users ADD COLUMN selected_career VARCHAR")
            conn.commit()
            print("Schema patch applied successfully! The chosen career can now be permanently locked in.")
        else:
            print("Schema is already patched. 'selected_career' exists.")
            
    except Exception as e:
        print(f"Error during migration: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
