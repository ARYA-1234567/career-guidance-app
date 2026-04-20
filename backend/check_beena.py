from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import sys
import os

sys.path.append(os.path.join(os.getcwd(), 'backend'))

try:
    DATABASE_URL = "sqlite:///career_guidance.db"
    engine = create_engine(DATABASE_URL)
    
    import main
    User = main.User
    StudentProfile = main.StudentProfile
    
    Session = sessionmaker(bind=engine)
    session = Session()
    
    beena = session.query(User).filter(User.user_id.ilike('beena')).first()
    if beena:
        print(f"--- USER FOUND ---")
        print(f"ID: {beena.id}")
        print(f"User ID (DB): {beena.user_id}")
        print(f"Selected Career: '{beena.selected_career}'")
        
        # Check profile
        profile = session.query(StudentProfile).filter(StudentProfile.user_id == beena.id).first()
        if profile:
            print(f"--- PROFILE FOUND ---")
            print(f"Profile Status: {profile.status}")
            print(f"Personality data exists? {bool(profile.personality)}")
        else:
            print("--- NO PROFILE FOUND FOR BEENA ---")
            print("Beena does NOT have any saved assessment profile in the database!")
    else:
        print("User 'Beena' not found in database.")
except Exception as e:
    print(f"Error during diagnostic: {e}")
