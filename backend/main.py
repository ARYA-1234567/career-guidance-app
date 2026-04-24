import os
import time
import asyncio
import sys
import logging

# Basic logging for cloud startup visibility
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

print(f"--- STARTUP DIAGNOSTICS ---")
print(f"Python Version: {sys.version}")
print(f"Current Directory: {os.getcwd()}")
try:
    print(f"Listing Directory: {os.listdir('.')}")
except:
    pass
print(f"---------------------------")
sys.stdout.flush() # Force Render to show these diagnostic logs immediately

from concurrent.futures import ThreadPoolExecutor
from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, String, JSON, Integer, DateTime, Boolean, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
import datetime
import uuid
import json
import random
import re
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from starlette.concurrency import run_in_threadpool

# Agents
from agents.self_assessment import (
    get_assessment_response,
    get_assessment_response_streaming,
    is_assessment_complete,
    extract_profile_from_messages,
    match_careers_from_profile
)
from agents.personality_analyzer import analyze_personality
from agents.career_matcher import match_careers
from agents.market_intelligence import get_market_intelligence
from agents.roadmap import generate_roadmap
from agents.myth_buster import get_myth_buster_data
from agents.reality_score import evaluate_feasibility
from agents.skill_gap import analyze_skill_gap
from agents.career_simulation import simulate_career_growth
from agents.translator_malayalam import translate_to_malayalam
from agents.college_lookup import lookup_affiliated_colleges, get_universities_for_career
from agents.scholarships import get_scholarship_data
from agents.simulation_agent import compare_scenarios, calculate_what_if_impact
from agents.career_bot import get_career_bot_response


from dotenv import load_dotenv

load_dotenv()

# Utility to safely parse JSON from LLM responses
def safe_parse_json(text: str) -> Any:
    """Cleans and parses JSON strings from LLM, handling markdown blocks."""
    if not text:
        return {}
    
    # Remove markdown code blocks if present
    clean_text = re.sub(r'```json\s*|\s*```', '', text).strip()
    
    try:
        return json.loads(clean_text)
    except json.JSONDecodeError:
        print(f"DEBUG: JSON parse failure for: {clean_text[:100]}...")
        # Try to find the first '{' and last '}'
        try:
            start = clean_text.find('{')
            end = clean_text.rfind('}') + 1
            if start != -1 and end != 0:
                return json.loads(clean_text[start:end])
        except:
            pass
        return {"error": "Failed to parse response", "raw": text}

# Security Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "super-secret-key-for-infinite-future-2025")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 24 hours

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="api/auth/login", auto_error=False)

# App initialization
app = FastAPI(title="ACGS - Career Guidance API", version="1.0")

@app.middleware("http")
async def forensic_log_requests(request: Request, call_next):
    # Performance and Accuracy Auditing
    start_time = time.time()
    print(f"DEBUG: [LINK START] {request.method} -> {request.url.path}")
    try:
        response = await call_next(request)
        duration = time.time() - start_time
        print(f"DEBUG: [LINK STABLE] {request.url.path} resolved in {duration:.2f}s")
        return response
    except Exception as e:
        print(f"CRITICAL: [LINK BROKEN] {str(e)}")
        # Global Accuracy Guard - ensure user never sees a raw crash
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=500,
            content={"error": "Neural Link Unstable", "message": "The guidance engine is currently re-calibrating. Please retry in 30 seconds."}
        )

# CORS Setup - Stable production-ready configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database Setup
# Use SQLite by default for simple local setup. Change to PostgreSQL in production.
# Absolute path to root database to avoid directory confusion
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./career_guidance.db")

# Handle PostgreSQL protocol variants for modern SQLAlchemy
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg2://", 1)
elif DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)

# Parse database URL details for logging (securely)
db_info = DATABASE_URL.split("@")[-1] if "@" in DATABASE_URL else DATABASE_URL.split("/")[-1]
print(f"DEBUG: Initializing database engine -> {db_info}")
sys.stdout.flush()
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    # Use pool_pre_ping for more resilient cloud connections (Neon/Render)
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Moved to startup handler below to prevent port-binding timeout
@app.on_event("startup")
async def startup_db_client():
    print("DEBUG: [STARTUP] Synchronizing database schema...")
    sys.stdout.flush()
    try:
        # Run in threadpool as create_all is blocking
        from starlette.concurrency import run_in_threadpool
        await run_in_threadpool(Base.metadata.create_all, bind=engine)
        print("DEBUG: [STARTUP] Database schema synchronization complete.")
    except Exception as e:
        print(f"CRITICAL: [STARTUP] Failed to synchronize database: {str(e)}")
    sys.stdout.flush()

class UserCreate(BaseModel):
    user_id: str
    password: str
    enable_parent_access: bool = False

class ChatRequest(BaseModel):
    messages: List[Dict[str, str]]
    career_title: str
    active_section: str
    user_profile: Dict[str, Any]
    match_score: int
    user_category: str
    language: Optional[str] = "en"
    access_id: Optional[str] = None

class UserLoginSchema(BaseModel):
    user_id: str
    password: str
    parent_whatsapp: Optional[str] = None

class ParentSettingsUpdate(BaseModel):
    shared_with_parent: bool
    parent_pin: str

class ParentVerifyRequest(BaseModel):
    pin: str

class ParentNoteCreate(BaseModel):
    content: str

class WhatsAppBotRequest(BaseModel):
    phone_number: str
    parent_id: str
    parent_pin: str
    origin_url: str
    language: Optional[str] = "en"

class ProfileUpdate(BaseModel):
    gender: str

# Services
from utils.whatsapp_bot import send_whatsapp_bot_message

class UserRoadmap(Base):
    __tablename__ = "user_roadmaps"
    __table_args__ = {'extend_existing': True}
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, index=True)
    career_id = Column(String, index=True)
    roadmap_json = Column(JSON)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class RoadmapTask(Base):
    __tablename__ = "roadmap_tasks"
    __table_args__ = {'extend_existing': True}
    id = Column(String, primary_key=True, index=True)
    roadmap_id = Column(String, index=True)
    phase_name = Column(String)
    task_text = Column(String)
    is_completed = Column(Integer, default=0) # 0 = no, 1 = yes
    completed_at = Column(DateTime, nullable=True)


class User(Base):
    __tablename__ = "users"
    __table_args__ = {'extend_existing': True}
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    parent_access_id = Column(String, unique=True, index=True)
    parent_whatsapp = Column(String, nullable=True)
    shared_with_parent = Column(Boolean, default=True)
    parent_pin = Column(String, default="")
    selected_career = Column(String, nullable=True)
    simulation_state = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class ParentNote(Base):
    __tablename__ = "parent_notes"
    __table_args__ = {'extend_existing': True}
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, index=True)
    content = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class UserActivity(Base):
    __tablename__ = "user_activity"
    __table_args__ = {'extend_existing': True}
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, index=True)
    activity_type = Column(String) # login, navigation, action
    description = Column(String)
    metadata_json = Column(JSON, nullable=True) # stores device, duration, specific action data
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

def record_activity(db: Session, user_id: str, act_type: str, description: str, metadata: dict = None):
    """Utility to log user activity for Agentic Memory."""
    try:
        activity = UserActivity(
            id=str(uuid.uuid4()),
            user_id=user_id,
            activity_type=act_type,
            description=description,
            metadata_json=metadata
        )
        db.add(activity)
        db.commit()
    except Exception as e:
        print(f"DEBUG: Failed to log activity - {str(e)}")
        db.rollback()

class UserTwin(Base):
    __tablename__ = "user_twins"
    __table_args__ = {'extend_existing': True}
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, index=True)
    career_id = Column(String)
    avatar_url = Column(String, nullable=True)
    stage = Column(Integer, default=0)
    language = Column(String, default="en")
    current_salary = Column(String, nullable=True)
    peak_salary = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class StudentProfile(Base):
    __tablename__ = "student_profiles"
    __table_args__ = {'extend_existing': True}
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, unique=True, index=True)
    gender = Column(String, nullable=True)
    personality = Column(JSON)
    agent_memory = Column(JSON, nullable=True) # Long-term psychological synthesis
    progress_stats = Column(JSON, nullable=True) # Percentage completion per module
    status = Column(String, default="pending")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class CareerModuleCache(Base):
    __tablename__ = "career_module_cache"
    __table_args__ = {'extend_existing': True}
    id = Column(String, primary_key=True, index=True)
    career_name = Column(String, index=True)
    module_type = Column(String, index=True) # myths, roadmap, universities, scholarships
    language = Column(String, default="en")
    content = Column(JSON)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


# Security Utilities
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(str(password))

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Dependency to get session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            print(f"DEBUG: [AUTH FAIL] Token missing 'sub' field")
            raise credentials_exception
    except JWTError as e:
        print(f"DEBUG: [AUTH FAIL] JWT Decode Error: {str(e)}")
        raise credentials_exception
        
    # Search match
    user = db.query(User).filter(User.user_id == user_id).first()
    if user is None:
        print(f"DEBUG: [AUTH FAIL] No user found with ID: {user_id}")
        raise credentials_exception
    return user

async def get_current_user_optional(token: Optional[str] = Depends(oauth2_scheme_optional), db: Session = Depends(get_db)):
    if not token:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            return None
        return db.query(User).filter(User.user_id == user_id).first()
    except:
        return None

# Routes
@app.get("/")
async def root():
    return {"message": "ACGS Backend is live!"}

@app.post("/api/chat/message")
async def chat_with_assessment(request: Request):
    data = await request.json()
    messages = data.get("messages", [])
    language = data.get("language", "en")
    
    # Get the AI response
    response_text = get_assessment_response(messages, language=language)
    
    # Add the response to messages to check completion
    messages.append({"role": "assistant", "content": response_text})
    
    # Standard response
    return {"content": response_text, "response": response_text}
@app.post("/api/chat/stream")
async def chat_with_assessment_stream(request: Request):
    data = await request.json()
    messages = data.get("messages", [])
    language = data.get("language", "en")
    
    from fastapi.responses import StreamingResponse
    
    async def event_generator():
        for chunk in get_assessment_response_streaming(messages, language=language):
            # Encode each chunk as SSE or simple text stream
            yield chunk
            
    return StreamingResponse(event_generator(), media_type="text/event-stream")

@app.post("/api/analyze/personality")
async def extract_personality(request: Request):
    data = await request.json()
    history = data.get("history", [])
    
    # Try using the user's new extraction method first
    profile_new = extract_profile_from_messages(history)
    
    if profile_new:
        # Translate the new extensive schema into the classic schema expected by frontend
        def ensure_list(item):
            if not item: return []
            return item if isinstance(item, list) else [str(item)]
            
        # Prioritize rich info from profiling session
        traits = list(set(ensure_list(profile_new.get("hidden_talents", [])) + ensure_list(profile_new.get("strengths", [])) + ensure_list(profile_new.get("traits", []))))
        interests = list(set(ensure_list(profile_new.get("interests", [])) + ensure_list(profile_new.get("favourite_subjects", []))))
        skills = list(set(ensure_list(profile_new.get("skills", [])) + ensure_list(profile_new.get("strengths", []))))
        values = list(set(ensure_list(profile_new.get("motivators", [])) + ensure_list(profile_new.get("values", []))))

        # Fallback to realistic defaults if still empty
        if not traits: traits = ["Determined", "Analytical", "Adaptable"]
        if not interests: interests = ["Technology", "Problem Solving", "Strategic Planning"]
        if not skills: skills = ["Critical Thinking", "Leadership", "Communication"]
        if not values: values = ["Growth", "Impact", "Innovation"]

        mapped_profile = {
            "traits": traits[:6],
            "interests": interests[:6],
            "skills": skills[:6],
            "values": values[:6],
            "confidence": 94,
            "analysis": str(profile_new.get("career_goals", profile_new.get("personality_summary", "Strong potential across multiple domains. Your combination of skills and interests leads to several high-value global trajectories.")))[:1000]
        }
        return {"personality": mapped_profile}

        
    # Fallback to old analyzer if PROFILE_COMPLETE not found
    personality_raw = analyze_personality(history)
    return {"personality": safe_parse_json(personality_raw)}

@app.post("/api/careers/match")
async def match_career_paths(request: Request):
    data = await request.json()
    profile = data.get("profile", {})
    language = data.get("language", "en")
    
    try:
        # Import the high-fidelity matcher
        from agents.career_matcher import match_careers
        raw_response = match_careers(profile)
        
        # Robust Parsing Layer
        parsed = safe_parse_json(raw_response)
        
        # Extract the list of careers from any format
        careers_list = []
        if isinstance(parsed, list):
            careers_list = parsed
        elif isinstance(parsed, dict):
            careers_list = parsed.get("matches", parsed.get("careers", parsed.get("recommendations", [])))
        
        if careers_list:
            mapped_matches = []
            for i, c in enumerate(careers_list[:10]):
                # Robust extraction with fallbacks
                career_name = c.get("career") or c.get("title") or f"Trajectory Match {i+1}"
                reason = c.get("reason") or c.get("why_matches") or "This path aligns with your core neural traits."
                salary = str(c.get("salary_range") or "Competitive")
                
                # Sanitize salary currency (ensure ₹ symbol is clean)
                if not any(curr in salary for curr in ["₹", "INR", "LPA"]):
                    salary = f"₹{salary}"
                
                mapped_matches.append({
                    "career": career_name,
                    "reason": reason,
                    "feasibility": c.get("feasibility", 85),
                    "salary_range": salary,
                    "local_demand": c.get("local_demand", "High"),
                    "category": c.get("category", "Global Moonshot"),
                    "hubs": c.get("hubs", ["Remote", "Bangalore", "Kochi", "Global"])
                })
            return {"matches": mapped_matches}
            
    except Exception as e:
        print(f"Match logic failure: {e}")
        
    return {"matches": [], "error": "Neural Matching Interrupted"}


@app.get("/api/market-intelligence/{career}")
async def fetch_market_data(career: str, db: Session = Depends(get_db), language: str = "en"):
    # 1. Cache Check
    cache = db.query(CareerModuleCache).filter(
        CareerModuleCache.career_name == career,
        CareerModuleCache.module_type == "market",
        CareerModuleCache.language == language
    ).first()
    if cache: return cache.content

    # 2. Threadpool call
    market_raw = await run_in_threadpool(get_market_intelligence, career, language=language)
    market_json = safe_parse_json(market_raw)
    
    # 3. Cache Save
    new_cache = CareerModuleCache(
        id=str(uuid.uuid4()),
        career_name=career,
        module_type="market",
        language=language,
        content=market_json
    )
    db.add(new_cache)
    db.commit()
    
    return market_json

@app.post("/api/roadmaps/generate")
async def create_roadmap(request: Request, db: Session = Depends(get_db)):
    data = await request.json()
    career = data.get("career", "")
    profile = data.get("profile", {})
    language = data.get("language", "en")
    
    # 1. Check Cache
    cache = db.query(CareerModuleCache).filter(
        CareerModuleCache.career_name == career,
        CareerModuleCache.module_type == "roadmap",
        CareerModuleCache.language == language
    ).first()
    if cache: return {"roadmap": cache.content}

    # 2. Call AI Agent via Threadpool
    roadmap_raw = await run_in_threadpool(generate_roadmap, career, profile, language=language)
    roadmap_json = safe_parse_json(roadmap_raw)
    
    # 3. Save to Cache
    new_cache = CareerModuleCache(
        id=str(uuid.uuid4()),
        career_name=career,
        module_type="roadmap",
        language=language,
        content=roadmap_json
    )
    db.add(new_cache)
    db.commit()
    
    return {"roadmap": roadmap_json}

@app.post("/api/simulate/trajectory")
async def fetch_trajectory(request: Request, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    data = await request.json()
    career = data.get("career", "")
    profile = data.get("profile", {})
    language = data.get("language", "en")
    trajectory_raw = simulate_career_growth(career, profile, language=language)
    trajectory_json = safe_parse_json(trajectory_raw)
    
    # NEW: Persist salary projections to the UserTwin
    if career and current_user:
        twin = db.query(UserTwin).filter(UserTwin.user_id == current_user.id, UserTwin.career_id == career).first()
        if twin:
            # Extract Year 1 salary for current, and peak_salary_projection
            sim_list = trajectory_json.get("simulation", [])
            if sim_list:
                twin.current_salary = f"₹{sim_list[0].get('salary', 'TBD')}"
            
            peak = trajectory_json.get("peak_salary_projection", "TBD")
            twin.peak_salary = f"₹{peak} LPA" if peak != "TBD" else "₹TBD"
            
            db.commit()

    return {"trajectory": trajectory_json}

@app.get("/api/myths/{career}")
async def fetch_career_myths(career: str, language: str = "en", db: Session = Depends(get_db)):
    # 1. Check Cache First
    cache = db.query(CareerModuleCache).filter(
        CareerModuleCache.career_name == career,
        CareerModuleCache.module_type == "myths",
        CareerModuleCache.language == language
    ).first()
    if cache: return cache.content

    # 2. Call AI Agent (Eco-Route) via Threadpool
    myths_raw = await run_in_threadpool(get_myth_buster_data, career, language=language)
    data = safe_parse_json(myths_raw)
    
    # 3. Save to Cache
    new_cache = CareerModuleCache(
        id=str(uuid.uuid4()),
        career_name=career,
        module_type="myths",
        language=language,
        content=data
    )
    db.add(new_cache)
    db.commit()
    return data

@app.get("/api/universities/{career}")
async def fetch_universities(career: str, language: str = "en", db: Session = Depends(get_db)):
    # 1. Check Cache First
    cache = db.query(CareerModuleCache).filter(
        CareerModuleCache.career_name == career,
        CareerModuleCache.module_type == "universities",
        CareerModuleCache.language == language
    ).first()
    if cache: return cache.content

    # 2. Call AI Agent (Eco-Route)
    uni_raw = get_universities_for_career(career, language=language)
    data = safe_parse_json(uni_raw)

    # 3. Save to Cache
    new_cache = CareerModuleCache(
        id=str(uuid.uuid4()),
        career_name=career,
        module_type="universities",
        language=language,
        content=data
    )
    db.add(new_cache)
    db.commit()
    return data

@app.get("/api/scholarships/{career}")
async def fetch_scholarships(career: str, language: str = "en", db: Session = Depends(get_db)):
    # 1. Check Cache First
    cache = db.query(CareerModuleCache).filter(
        CareerModuleCache.career_name == career,
        CareerModuleCache.module_type == "scholarships",
        CareerModuleCache.language == language
    ).first()
    if cache: return cache.content

    # 2. Call AI Agent
    scholarships_raw = get_scholarship_data(career, language=language)
    
    # 3. Save to Cache
    new_cache = CareerModuleCache(
        id=str(uuid.uuid4()),
        career_name=career,
        module_type="scholarships",
        language=language,
        content=scholarships_raw
    )
    db.add(new_cache)
    db.commit()
    return scholarships_raw

@app.post("/api/exams-skills")
async def fetch_exams_skills(request: Request, db: Session = Depends(get_db)):
    data = await request.json()
    career = data.get("career", "")
    profile = data.get("profile", {})
    language = data.get("language", "en")
    
    # 1. Check Cache
    # Note: Since this depends on career + localized profile, we cache by career_name 
    # but the content is generic enough to reuse if career matches.
    cache = db.query(CareerModuleCache).filter(
        CareerModuleCache.career_name == career,
        CareerModuleCache.module_type == "exams_skills",
        CareerModuleCache.language == language
    ).first()
    if cache: return cache.content

    # 2. Run both skills and roadmap internally (Combined logic)
    gap_raw = analyze_skill_gap(career, profile, language=language)
    roadmap_raw = generate_roadmap(career, profile, language=language)
    
    gap_data = safe_parse_json(gap_raw)
    roadmap_data = safe_parse_json(roadmap_raw)
    
    result = {
        "career": career,
        "exams": roadmap_data.get("entrance_exams", []),
        "essential_requirements": gap_data.get("essential_requirements", []),
        "skills": gap_data.get("required_skills", gap_data.get("skill_gaps", [])),
        "tools": gap_data.get("tools_and_tech_stack", gap_data.get("tools_and_tech", [])),
        "certifications": roadmap_data.get("key_certifications", [])
    }

    # 3. Save to Cache
    new_cache = CareerModuleCache(
        id=str(uuid.uuid4()),
        career_name=career,
        module_type="exams_skills",
        language=language,
        content=result
    )
    db.add(new_cache)
    db.commit()
    return result

@app.post("/api/reality-score")
async def fetch_reality_score(request: Request, db: Session = Depends(get_db)):
    data = await request.json()
    career = data.get("career", "")
    profile = data.get("profile", {})
    language = data.get("language", "en")

    # We don't cache reality score here strictly because it's hyper-personalized to the profile
    # but we can call evaluation with eco-routing
    score_raw = evaluate_feasibility(career, profile, language=language)
    return {"score": safe_parse_json(score_raw)}

@app.post("/api/skill-gap")
async def fetch_skill_gap(request: Request):
    data = await request.json()
    career = data.get("career", "")
    profile = data.get("profile", {})
    language = data.get("language", "en")
    gap_raw = analyze_skill_gap(career, profile, language=language)
    return {"gap": safe_parse_json(gap_raw)}

@app.post("/api/colleges/lookup")
async def fetch_affiliated_colleges(request: Request):
    data = await request.json()
    university = data.get("university", "")
    course = data.get("course", "")
    colleges_raw = lookup_affiliated_colleges(university, course)
    return {"colleges": safe_parse_json(colleges_raw)}

@app.get("/api/parent/{student_id}")
async def get_parent_view(student_id: str, db: Session = Depends(get_db)):
    # 1. Strip UI-specific prefix if present
    clean_id = student_id.replace("STU-", "").strip()
    
    # 2. Try to find user by screen name or ID (case-insensitive and trimmed)
    search_id = clean_id.lower()
    user = db.query(User).filter(
        (User.user_id.ilike(search_id)) | (User.id == clean_id)
    ).first()
    
    # Locate profile using UUID or Screen Name directly
    profile = None
    if user:
        profile = db.query(StudentProfile).filter(StudentProfile.user_id == user.id).first()
    else:
        profile = db.query(StudentProfile).filter(StudentProfile.user_id == clean_id).first()
        
    if not profile:
        return {"message": "No profile found. Please ensure the student has completed the assessment.", "status": "pending"}
    
    # Parse personality JSON safely
    p_data = profile.personality
    if isinstance(p_data, str):
        try:
            p_data = json.loads(p_data)
        except:
            p_data = {}
            
    # Map keys for frontend compatibility
    mapped_profile = {
        "name": user.user_id.split('@')[0].capitalize() if user else clean_id.split('@')[0].capitalize(),
        "education_level": p_data.get("education_level", "Higher Secondary"),
        "stream": p_data.get("stream", "General"),
        "top_strengths": p_data.get("strengths", p_data.get("traits", [])),
        "primary_career": p_data.get("top_career", p_data.get("career_goals", "Calculated Trajectory")),
        "career_goal": p_data.get("career_goals", p_data.get("top_career", "Strategic Growth")),
        "value_alignment": p_data.get("values", ["Empowerment", "Innovation", "Growth"]),
        "interests": p_data.get("interests", []),
        "analysis": p_data.get("analysis", ""),
        "logic_explanation": p_data.get("logic", f"Based on strong interest in {', '.join(p_data.get('interests', ['Learning']))} and {', '.join(p_data.get('strengths', ['Analytical']))} skills."),
        "confidence": p_data.get("confidence", 85)
    }
    
    # Enrichment for Parent Dashboard recommendations
    recommendations = p_data.get("matches", [
        {
            "career": mapped_profile["primary_career"],
            "why_suits": "Aligns with cognitive traits and expressed interests.",
            "skills_required": ["Critical Thinking", "Adaptability"],
            "future_scope": "Growing demand in digital-first markets."
        }
    ])
    
    # Ensure each recommendation has the required fields for parent view
    for rec in recommendations:
        if "career" not in rec: rec["career"] = rec.get("name", "Career Path")
        if "why_suits" not in rec: rec["why_suits"] = rec.get("reason", "Highly recommended based on current trajectory.")
        if "skills_required" not in rec: rec["skills_required"] = ["Communication", "Problem Solving"]
        if "future_scope" not in rec: rec["future_scope"] = "Strong growth outlook for 2026-2030."

    return {
        "status": "ready",
        "profile": mapped_profile,
        "recommendations": recommendations,
        "shared_with_parent": user.shared_with_parent if user else False,
        "parent_pin": user.parent_pin if user else "",
        "parent_guidance": [
            "Encourage exploration of these paths through internships or online courses.",
            "Avoid forcing decisions; allow the student to refine their interests naturally.",
            "Support their strengths and provide resources to bridge skill gaps."
        ]
    }

@app.get("/api/parent/lookup/{parent_id}")
async def parent_lookup(parent_id: str, db: Session = Depends(get_db), language: str = "en"):
    """Fetch student data using the Unique Parent Access ID (Read-only Pin-less)."""
    p_id_clean = parent_id.strip().upper()
    user = db.query(User).filter(func.upper(User.parent_access_id) == p_id_clean).first()
    if not user:
        raise HTTPException(status_code=404, detail="Invalid Parent ID")
    
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Student assessment profile not yet finalized.")
    
    p_data = profile.personality
    if isinstance(p_data, str):
        try: p_data = json.loads(p_data)
        except: p_data = {}
    
    roadmap_data = {}
    scholarships = []
    myths = []
    market_data = {}
    
    if user.selected_career:
        try:
            career = user.selected_career
            
            # --- ACCURACY GUARD: Force simulation refresh if stale ---
            sim_state = user.simulation_state
            is_stale = False
            if not sim_state:
                is_stale = True
            else:
                sim_career = sim_state.get("inputs", {}).get("career_a", "")
                if sim_career.lower().strip() != career.lower().strip():
                    is_stale = True
            
            if is_stale:
                print(f"DEBUG: [SYNC] Regenerating simulation for {career} (Stale detected)")
                # Generate a high-fidelity default simulation for the new career
                fresh_sim = compare_scenarios(
                    career_a=career,
                    career_b="General Practice", # Default comparison
                    user_profile=p_data,
                    scenario="Standard Path",
                    location="Kerala",
                    years_before_switch=3,
                    education="None",
                    work_type="Job",
                    language=language
                )
                user.simulation_state = fresh_sim
                db.commit()
            # --------------------------------------------------------
            
            # 1. Gather all cache results
            rm_cache = db.query(CareerModuleCache).filter(CareerModuleCache.career_name == career, CareerModuleCache.module_type == "roadmap").first()
            myth_cache = db.query(CareerModuleCache).filter(CareerModuleCache.career_name == career, CareerModuleCache.module_type == "myths").first()
            sch_cache = db.query(CareerModuleCache).filter(CareerModuleCache.career_name == career, CareerModuleCache.module_type == "scholarships").first()
            market_cache = db.query(CareerModuleCache).filter(CareerModuleCache.career_name == career, CareerModuleCache.module_type == "market").first()

            tasks = []
            
            # Only add tasks for items NOT in cache
            if not rm_cache: tasks.append(("roadmap", run_in_threadpool(generate_roadmap, career, p_data, language=language)))
            if not myth_cache: tasks.append(("myths", run_in_threadpool(get_myth_buster_data, career, language=language)))
            if not sch_cache: tasks.append(("scholarships", run_in_threadpool(get_scholarship_data, career, language=language)))
            if not market_cache: tasks.append(("market", run_in_threadpool(get_market_intelligence, career, language=language)))

            if tasks:
                # Run generations in parallel
                names = [t[0] for t in tasks]
                results = await asyncio.gather(*[t[1] for t in tasks])
                
                # Processed results mapping
                gen_results = dict(zip(names, results))
                
                # Update DB and return data
                if "roadmap" in gen_results:
                    roadmap_data = safe_parse_json(gen_results["roadmap"])
                    db.add(CareerModuleCache(id=str(uuid.uuid4()), career_name=career, module_type="roadmap", content=roadmap_data))
                
                if "myths" in gen_results:
                    myths_json = safe_parse_json(gen_results["myths"])
                    myths = myths_json.get("myths", []) if isinstance(myths_json, dict) else myths_json
                    db.add(CareerModuleCache(id=str(uuid.uuid4()), career_name=career, module_type="myths", content=myths_json))
                
                if "scholarships" in gen_results:
                    s_res = gen_results["scholarships"]
                    sch_json = s_res if isinstance(s_res, dict) else safe_parse_json(s_res)
                    scholarships = sch_json.get("scholarships", []) if isinstance(sch_json, dict) else sch_json
                    db.add(CareerModuleCache(id=str(uuid.uuid4()), career_name=career, module_type="scholarships", content=sch_json))
                
                if "market" in gen_results:
                    market_data = safe_parse_json(gen_results["market"])
                    db.add(CareerModuleCache(id=str(uuid.uuid4()), career_name=career, module_type="market", content=market_data))
                
                db.commit()

            # Final assignment from Cache (for items that were already there)
            if rm_cache: roadmap_data = rm_cache.content
            if myth_cache: myths = myth_cache.content.get("myths", []) if isinstance(myth_cache.content, dict) else myth_cache.content
            if sch_cache: scholarships = sch_cache.content.get("scholarships", []) if isinstance(sch_cache.content, dict) else sch_cache.content
            if market_cache: market_data = market_cache.content

        except Exception as e:
            print(f"DEBUG: Critical Parent Strategy Load Error - {str(e)}")

    # Map exact required fields for Parent Dashboard
    return {
        "status": "ready",
        "student_summary": {
            "name": user.user_id.split('@')[0].capitalize(),
            "education_level": p_data.get("education_level", "Higher Secondary"),
            "stream": p_data.get("stream", "Calculated"),
            "skills": p_data.get("skills", p_data.get("strengths", [])),
            "interests": p_data.get("interests", [])
        },
        "recommendations": p_data.get("matches", []),
        "selected_career": user.selected_career,
        "simulation_data": user.simulation_state,
        "roadmap": roadmap_data,
        "scholarships": scholarships,
        "myths": myths,
        "market": market_data,
        "personality": p_data,
        "logic_explanation": p_data.get("logic_explanation", p_data.get("analysis", ""))
    }

@app.get("/api/student/career_details")
async def get_student_career_details(lang: str = "en", current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Fetch complete unified career trajectory heavily utilizing the existing parent_lookup routine."""
    if not current_user.parent_access_id:
        raise HTTPException(status_code=400, detail="Student has no linked Parent Access ID.")
    try:
        return await parent_lookup(current_user.parent_access_id, db, language=lang)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to compile unified career details: {str(e)}")


@app.post("/api/user/profile")
async def update_student_profile(
    profile_data: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update student-specific profile fields (like gender)."""
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    
    if not profile:
        # Create a skeleton profile if it doesn't exist yet
        profile = StudentProfile(
            id=str(uuid.uuid4()),
            user_id=current_user.id,
            gender=profile_data.gender,
            status="pending"
        )
        db.add(profile)
    else:
        profile.gender = profile_data.gender
        
    db.commit()
    return {"message": "Profile updated successfully", "gender": profile.gender}

# Profile Routes
@app.post("/api/profiles/save")
async def save_profile(request: Request, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    data = await request.json()
    history = data.get("history", [])
    
    # Use existing analyzer to extract personality
    personality_json = analyze_personality(history)
    
    # NEW: Extract Agentic Memory (Psychological insights)
    agent_mem_json = extract_profile_from_messages(history)
    
    # Check if profile already exists for user
    existing_profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    
    if existing_profile:
        existing_profile.personality = personality_json
        existing_profile.agent_memory = agent_mem_json
        existing_profile.created_at = datetime.datetime.utcnow()
        db.commit()
        db.refresh(existing_profile)
        return {"id": existing_profile.id, "personality": existing_profile.personality}
    else:
        new_profile = StudentProfile(
            id=str(uuid.uuid4()),
            user_id=current_user.id,
            personality=personality_json,
            agent_memory=agent_mem_json,
            status="completed"
        )
        db.add(new_profile)
        db.commit()
        db.refresh(new_profile)
        return {"id": new_profile.id, "personality": new_profile.personality}

@app.get("/api/profiles/latest")
async def fetch_latest_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).order_by(StudentProfile.created_at.desc()).first()
    if not profile:
        raise HTTPException(status_code=404, detail="No assessment profile found")
    return {
        "personality": profile.personality,
        "agent_memory": profile.agent_memory,
        "progress_stats": profile.progress_stats
    }

@app.post("/api/translate")
async def translate_text(data: dict):
    """Bilingual translation endpoint using Sarvam AI."""
    text = data.get("text", "")
    target_lang = data.get("target_language", "ml-IN")
    # For now we only support ML, but we can expand
    translated = translate_to_malayalam(text)
    return {"translated_text": translated, "target_language": target_lang}

# Removed /api/speak as per user request (TTS Removal)

@app.get("/api/user/activity")
async def get_user_activity(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Retrieve the unified activity stream for the current user."""
    activities = db.query(UserActivity).filter(
        UserActivity.user_id == current_user.id
    ).order_by(UserActivity.created_at.desc()).limit(20).all()
    
    return [
        {
            "id": a.id,
            "type": a.activity_type,
            "description": a.description,
            "metadata": a.metadata_json,
            "timestamp": a.created_at.isoformat()
        } for a in activities
    ]

# Authentication Routes
@app.post("/api/auth/signup")
async def signup(user_data: UserCreate, db: Session = Depends(get_db)):
    try:
        user_id_clean = user_data.user_id.strip()
        print(f"DEBUG: Processing signup for {user_id_clean}")
        
        user_exists = db.query(User).filter(User.user_id == user_id_clean).first()
        if user_exists:
            raise HTTPException(status_code=400, detail="User ID already registered. Please login.")
            
        hashed_password = get_password_hash(user_data.password)
        
        parent_id = None
        parent_pin = ""
        
        if user_data.enable_parent_access:
            # Generate a unique Parent ID: PAR + 6 digits
            import random
            parent_id = f"PAR{random.randint(100000, 999999)}"
            # Check uniqueness
            while db.query(User).filter(User.parent_access_id == parent_id).first():
                parent_id = f"PAR{random.randint(100000, 999999)}"

        new_user = User(
            id=str(uuid.uuid4()),
            user_id=user_id_clean,
            hashed_password=hashed_password,
            parent_access_id=parent_id,
            parent_whatsapp=None,
            parent_pin=parent_pin
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        access_token = create_access_token(data={"sub": new_user.user_id, "role": "student"})
        response_data = {
            "access_token": access_token, 
            "token_type": "bearer", 
            "user": {
                "id": new_user.id, 
                "user_id": new_user.user_id, 
                "parent_id": new_user.parent_access_id,
                "parent_whatsapp": new_user.parent_whatsapp,
                "parent_pin": new_user.parent_pin,
                "gender": None
            }
        }
        
        # LOG ACTIVITY: Signup
        record_activity(db, new_user.id, "account_created", f"User {new_user.user_id} joined the Discovery Protocol", {"path": "auth.signup"})
        
        return response_data
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR: Signup crash - {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"System Registry Error: {str(e)}")

@app.post("/api/auth/login")
async def login(user_data: UserLoginSchema, db: Session = Depends(get_db)):
    user_id_clean = user_data.user_id.strip()
    print(f"DEBUG: Attempting login for {user_id_clean}")
    
    user = db.query(User).filter(User.user_id == user_id_clean).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid security credentials.")
    
    # Use run_in_threadpool for the CPU-bound password verification
    is_valid = await run_in_threadpool(verify_password, user_data.password, user.hashed_password)
    
    if not is_valid:
        raise HTTPException(status_code=401, detail="Invalid security credentials.")
    
    # Ensure legacy users get a Parent ID if they don't have one
    updated = False
    if not user.parent_access_id:
        parent_id = f"PAR{random.randint(100000, 999999)}"
        while db.query(User).filter(User.parent_access_id == parent_id).first():
            parent_id = f"PAR{random.randint(100000, 999999)}"
        user.parent_access_id = parent_id
        updated = True
    
    if not user.parent_pin:
        user.parent_pin = str(random.randint(1000, 9999))
        updated = True
    
    if user_data.parent_whatsapp:
        user.parent_whatsapp = user_data.parent_whatsapp
        updated = True
        
    if updated:
        db.commit()

    access_token = create_access_token(data={"sub": user_id_clean})
    
    # LOG ACTIVITY: Login
    record_activity(db, user.id, "login", f"User {user_id_clean} accessed the cockpit", {"method": "password"})
    
    # Fetch gender if profile exists
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == user.id).first()
    gender = profile.gender if profile else None

    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "user": {
            "id": user.id, 
            "user_id": user.user_id, 
            "parent_id": user.parent_access_id,
            "parent_whatsapp": user.parent_whatsapp,
            "parent_pin": user.parent_pin,
            "gender": gender,
            "selected_career": user.selected_career,
            "role": "student"
        }
    }

@app.post("/api/auth/parent/login")
async def parent_login(data: Dict[str, str], db: Session = Depends(get_db)):
    """Dedicated Parent Login via Unique Parent ID (Pin-less)."""
    p_id = data.get("parent_id", "").strip().upper()
    
    user = db.query(User).filter(func.upper(User.parent_access_id) == p_id).first()
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid Parent ID")
    
    # Optional check if parent access is actually permitted 
    # (since we removed parent_access_id generation, we just allow read-only access inherently if the ID is known)
    
    # Create token with parent role
    access_token = create_access_token(data={"sub": user.user_id, "role": "parent"})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "user_id": user.user_id,
            "parent_id": user.parent_access_id,
            "selected_career": user.selected_career,
            "role": "parent"
        }
    }

@app.get("/api/auth/me")
async def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    gender = profile.gender if profile else None
    return {
        "id": current_user.id, 
        "user_id": current_user.user_id, 
        "parent_id": current_user.parent_access_id,
        "selected_career": current_user.selected_career,
        "gender": gender
    }

@app.post("/api/user/select-career")
async def select_career(data: Dict[str, str], current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Permanently link a selected career to the user's account."""
    career = data.get("career")
    if not career:
        raise HTTPException(status_code=400, detail="No career provided")
    
    current_user.selected_career = career
    # CRITICAL: Clear stale simulation state when a new career is selected
    current_user.simulation_state = None
    db.commit()
    
    # LOG ACTIVITY: Career Linked
    record_activity(db, current_user.id, "career_selected", f"Pivot achieved: {career} linked to Neural Core", {"career": career})
    
    return {"message": "Career successfully selected", "career": career}


@app.post("/api/roadmap/complete-task")
async def complete_task(request: Request, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    data = await request.json()
    task_id = data.get("task_id")
    task = db.query(RoadmapTask).filter(RoadmapTask.id == task_id).first()
    if task:
        task.is_completed = 1
        task.completed_at = datetime.datetime.utcnow()
        db.commit()
        
        # LOG ACTIVITY: Task Milestone
        record_activity(
            db, current_user.id, "task_completed", 
            f"Roadmap Milestone: {task.task_text[:50]}...", 
            {"task_id": task_id, "phase": task.phase_name}
        )
        
        return {"success": True}
    return {"success": False, "error": "Task not found"}

# --- NEW FEATURES: SIMULATOR ---

@app.post("/api/simulation/compare")
async def run_simulation(request: Request, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    data = await request.json()
    career_a = data.get("career_a")
    career_b = data.get("career_b")
    profile = data.get("user_profile", {})
    scenario = data.get("scenario", "")
    location = data.get("location", "Kerala")
    years_before_switch = data.get("years_before_switch", 3)
    edu = data.get("additional_education", "None")
    work_type = data.get("work_type", "Job")
    language = data.get("language", "en") or request.query_params.get("language", "en")

    persist = data.get("persist", True)

    result = compare_scenarios(
        career_a, career_b, profile, scenario, location,
        years_before_switch, edu, work_type, language=language
    )
    
    # PERSISTENCE: Only save if persist flag is True (default)
    if persist:
        current_user.simulation_state = {
            "inputs": {
                "career_a": career_a,
                "career_b": career_b,
                "scenario": scenario,
                "location": location,
                "years_before_switch": years_before_switch,
                "additional_education": edu,
                "work_type": work_type,
                "language": language
            },
            "result": result,
            "last_updated": datetime.datetime.utcnow().isoformat()
        }
        db.commit()
    
    # LOG ACTIVITY: Simulation Executed
    record_activity(
        db, current_user.id, "simulation_executed", 
        f"Neural Projection: {career_a} vs {career_b} (Persist: {persist})", 
        {"career_a": career_a, "career_b": career_b, "scenario": scenario, "persist": persist}
    )
    
    return result

@app.post("/api/parent/simulation/compare")
async def run_parent_simulation(request: Request, db: Session = Depends(get_db)):
    data = await request.json()
    career_a = data.get("career_a")
    career_b = data.get("career_b")
    profile = data.get("user_profile", {})
    scenario = data.get("scenario", "")
    location = data.get("location", "Kerala")
    years_before_switch = data.get("years_before_switch", 3)
    edu = data.get("additional_education", "None")
    work_type = data.get("work_type", "Job")
    language = data.get("language", "en")

    result = compare_scenarios(
        career_a, career_b, profile, scenario, location,
        years_before_switch, edu, work_type, language=language
    )
    return result

@app.post("/api/simulation/whatif")
async def run_whatif(request: Request):
    data = await request.json()
    career = data.get("career")
    scenario = data.get("scenario")
    profile = data.get("user_profile", {})
    
    result = calculate_what_if_impact(career, scenario, profile)
    return result

# --- NEW FEATURE: CAREER CHATBOT ---

@app.post("/api/career-chatbot")
async def career_chatbot(
    payload: ChatRequest, 
    current_user: Optional[User] = Depends(get_current_user_optional), 
    db: Session = Depends(get_db)
):
    try:
        # Determine target user (Student or through Parent Access)
        target_user_id = None
        user_category = payload.user_category

        if current_user:
            target_user_id = current_user.id
        elif payload.access_id:
            # Parent access via ID - Make robust with casing and whitespace handling
            try:
                p_id_clean = str(payload.access_id).strip().upper()
                # Use func.upper() for case-insensitive DB lookup consistency
                parent_user = db.query(User).filter(func.upper(User.parent_access_id) == p_id_clean).first()
                if parent_user:
                    target_user_id = parent_user.id
                    user_category = "Parent"
                else:
                    logger.warning(f"Chatbot Auth: Parent ID {p_id_clean} not found in database.")
            except Exception as e:
                logger.error(f"Chatbot Auth Error: {str(e)}")

        if not target_user_id:
             raise HTTPException(status_code=401, detail="Authentication required or invalid Access ID")

        # Fetch Student Profile to get agent_memory
        profile = db.query(StudentProfile).filter(StudentProfile.user_id == target_user_id).first()
        agent_mem = profile.agent_memory if profile else None

        response = get_career_bot_response(
            messages=payload.messages,
            career_title=payload.career_title,
            active_section=payload.active_section,
            user_profile=payload.user_profile,
            match_score=payload.match_score,
            user_category=user_category,
            language=payload.language,
            agent_memory=agent_mem
        )
        return {"response": response, "is_welcome": False}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Serve built frontend static files
# The path matches what will be created in the Docker container (rooted at the application root)
frontend_dist = os.path.join(os.getcwd(), "frontend", "dist")

if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")
else:
    print(f"WARNING: Frontend distribution directory not found at {frontend_dist}. Please run 'npm run build' in the frontend folder.")

@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    """Catch-all route to serve index.html for SPA client-side routing."""
    index_file = os.path.join(frontend_dist, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {"message": "ACGS Backend is live! (Frontend build missing)"}


@app.post("/api/auth/send-whatsapp-bot")
async def send_whatsapp_bot(payload: WhatsAppBotRequest):
    """Trigger the backend bot to send a message."""
    try:
        success = send_whatsapp_bot_message(
            phone_number=payload.phone_number,
            parent_id=payload.parent_id,
            parent_pin=payload.parent_pin,
            origin_url=payload.origin_url,
            language=payload.language
        )
        return {"success": success}
    except Exception as e:
        print(f"ERROR: WhatsApp Bot failed - {str(e)}")
        raise HTTPException(status_code=500, detail="Bot service unavailable")


# --- Parent Access Endpoints ---

@app.post("/api/parent/save-settings")
async def save_parent_settings(
    settings: ParentSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    current_user.parent_whatsapp = settings.parent_whatsapp
    
    # Removed PIN modification
    db.commit()
    db.refresh(current_user)
    return {"message": "Parent settings saved successfully"}

# PIN verification is no longer strictly used, but kept for legacy fallback if requested by older agents
@app.post("/api/parent/verify-pin")
async def verify_parent_pin(
    request: ParentVerifyRequest,
    current_user: User = Depends(get_current_user)
):
    # Just auto-verify since PINs are deprecated
    return {"message": "Verified successfully"}

@app.get("/api/parent/notes")
async def get_parent_notes(
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    notes = db.query(ParentNote).filter(ParentNote.user_id == current_user.id).order_by(ParentNote.created_at.desc()).all()
    return {"notes": [{"content": n.content, "created_at": n.created_at} for n in notes]}

@app.post("/api/parent/notes")
async def add_parent_note(
    note: ParentNoteCreate, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    new_note = ParentNote(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        content=note.content
    )
    db.add(new_note)
    db.commit()
    return {"message": "Note added successfully"}

if __name__ == "__main__":
    import uvicorn
    Base.metadata.create_all(bind=engine)
    uvicorn.run(app, host="0.0.0.0", port=8000)
