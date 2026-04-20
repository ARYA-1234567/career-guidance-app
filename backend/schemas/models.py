from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class User(BaseModel):
    id: str
    name: str
    email: str
    role: str # student, parent

class ChatMessage(BaseModel):
    role: str # user, assistant
    content: str

class AssessmentRequest(BaseModel):
    user_id: str
    messages: List[ChatMessage]

class CareerMatchRequest(BaseModel):
    user_id: str
    profile: Dict[str, Any]

class RoadmapRequest(BaseModel):
    user_id: str
    career: str
    profile: Dict[str, Any]

class ParentModeRequest(BaseModel):
    student_id: str

class CareerTwinRequest(BaseModel):
    user_id: str
    career: str
    profile: Dict[str, Any]
