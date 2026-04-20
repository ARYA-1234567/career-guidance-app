from sqlalchemy import Column, String, Integer, DateTime, JSON, ForeignKey, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import datetime
import uuid

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    full_name = Column(String)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default="student") # student, parent, admin
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    profiles = relationship("StudentProfile", back_populates="user")
    assessments = relationship("Assessment", back_populates="user")

class Assessment(Base):
    __tablename__ = "assessments"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"))
    session_id = Column(String, unique=True, index=True)
    status = Column(String, default="active") # active, completed
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="assessments")
    messages = relationship("Message", back_populates="assessment")

class Message(Base):
    __tablename__ = "messages"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    assessment_id = Column(String, ForeignKey("assessments.id"))
    role = Column(String) # user, assistant
    content = Column(String)
    language = Column(String, default="en") # en, ml
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    assessment = relationship("Assessment", back_populates="messages")

class StudentProfile(Base):
    __tablename__ = "profiles"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"))
    stream = Column(String) # Science, Commerce, Arts
    interests = Column(JSON)
    strengths = Column(JSON)
    weaknesses = Column(JSON)
    personality_traits = Column(JSON)
    values = Column(JSON)
    work_style = Column(String)
    analysis = Column(String)
    confidence_score = Column(Integer)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="profiles")
    matches = relationship("CareerMatch", back_populates="profile")

class CareerMatch(Base):
    __tablename__ = "career_matches"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    profile_id = Column(String, ForeignKey("profiles.id"))
    career = Column(String)
    reality_score = Column(Integer)
    reason = Column(String)
    salary_range = Column(String)
    local_demand = Column(String)
    hubs = Column(JSON)
    
    profile = relationship("StudentProfile", back_populates="matches")

class Roadmap(Base):
    __tablename__ = "roadmaps"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    profile_id = Column(String, ForeignKey("profiles.id"))
    career = Column(String)
    phases = Column(JSON) # 24-month phases
    weekly_plan = Column(JSON)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class CareerTwin(Base):
    __tablename__ = "career_twins"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    profile_id = Column(String, ForeignKey("profiles.id"))
    career = Column(String)
    future_role = Column(String)
    salary_projection = Column(JSON)
    visual_metadata = Column(JSON)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class CareerSimulation(Base):
    __tablename__ = "simulations"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    profile_id = Column(String, ForeignKey("profiles.id"))
    career = Column(String)
    yearly_data = Column(JSON)
    peak_salary = Column(Float)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class MarketData(Base):
    __tablename__ = "market_data"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    career = Column(String, unique=True, index=True)
    salary_range = Column(String)
    demand = Column(String)
    kerala_hubs = Column(JSON)
    gulf_prospects = Column(JSON)
    fetched_at = Column(DateTime, default=datetime.datetime.utcnow)

class KeralaJob(Base):
    __tablename__ = "kerala_jobs"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    career = Column(String, unique=True, index=True)
    hubs = Column(JSON)
    gulf_opps = Column(JSON)
    psc_posts = Column(JSON)
    last_updated = Column(DateTime, default=datetime.datetime.utcnow)
