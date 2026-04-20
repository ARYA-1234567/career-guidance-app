import sys
import os
from dotenv import load_dotenv

sys.path.append(os.path.join(os.getcwd(), 'backend'))
load_dotenv(os.path.join(os.getcwd(), 'backend', '.env'))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import backend.main as main

engine = create_engine('sqlite:///backend/career_guidance.db')
session = sessionmaker(bind=engine)()
b = session.query(main.User).filter(main.User.user_id.ilike('beena')).first()
if b:
    print(f"Db User ID: {b.id}")
    p = session.query(main.StudentProfile).filter(main.StudentProfile.user_id == b.id).first()
    if p:
        print("Personality:")
        print(p.personality)
    else:
        print("No profile")
else:
    print("User not found")
