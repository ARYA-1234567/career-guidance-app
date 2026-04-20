from sqlalchemy import create_engine, text
import json

engine = create_engine("sqlite:///career_guidance.db")
with engine.connect() as conn:
    result = conn.execute(text("SELECT * FROM student_profiles"))
    rows = result.fetchall()
    print(f"Found {len(rows)} student profiles.")
    for row in rows:
        # UserID in StudentProfile is often the UUID from User.id, let's verify
        print(f"ID: {row[0]}, UserID: {row[1]}, Status: {row[3]}")
    
    print("\nUsers Table:")
    result = conn.execute(text("SELECT * FROM users"))
    rows = result.fetchall()
    for row in rows:
        print(f"ID: {row[0]}, UserName: {row[1]}")
