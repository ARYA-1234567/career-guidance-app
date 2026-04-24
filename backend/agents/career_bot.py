import os
import json
import logging
import re
from typing import List, Dict, Any, Optional
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(filename='agents.log', level=logging.INFO)
logger = logging.getLogger("CareerBot")

SYSTEM_PROMPT_HEADER = """You are a Professional Career Advisor (Expert Strategy Specialist). 
Always maintain the context of the specific career and user profile provided.
Ensure your responses are helpful, warm, and encourage the student's growth in an international and national context."""

SYSTEM_PROMPTS = {
    "ROADMAP": """You are an expert Career Roadmap Assistant. You help students understand the exact steps to achieve their career goals.
Focus on: timelines, specific skill acquisition order, learning resources, and practical milestones.
Keep answers concise (max 3 sentences).""",
    
    "SCHOOLS": """You are an expert Education & College Consultant. You help students find the best institutions for their chosen career.
Focus on: top universities (Global & India), entrance exams (JEE, NEET, etc.), fee structures, and application windows.
Keep answers concise (max 3 sentences).""",
    
    "REQUIREMENTS": """You are a Skill & Competency Specialist. You help students understand the hard and soft skills needed for a career.
Focus on: core degrees, trending certifications, technical tools, and necessary soft skills.
Keep answers concise (max 3 sentences).""",
    
    "MYTHS": """You are a Career Myth Buster. You help students separate fact from fiction regarding career paths.
Focus on: debunking common misconceptions, reality checks on salary expectations, and work-life balance truths.
Keep answers concise (max 3 sentences).""",
    
    "JOB MARKET": """You are a Market Intelligence Analyst. You help students understand current and future demand for careers.
Focus on: salary ranges (entry to senior), high-demand regions (India, Gulf, USA), and industry growth trends.
Keep answers concise (max 3 sentences).""",
    
    "DEFAULT": """You are a Professional Career Advisor. You help students with general questions about their chosen career path.
Keep answers concise (max 3 sentences)."""
}

def get_career_bot_response(
    messages: List[Dict[str, str]],
    career_title: str,
    active_section: str,
    user_profile: Dict[str, Any],
    match_score: int,
    user_category: str,
    language: Optional[str] = "en",
    agent_memory: Optional[Dict[str, Any]] = None
) -> str:
    from utils.groq_client import get_groq_chat_response, safe_parse_json
    
    # --- LIGHTNING SANITIZATION ---
    try:
        if isinstance(user_profile, str): user_profile = safe_parse_json(user_profile)
        if isinstance(agent_memory, str): agent_memory = safe_parse_json(agent_memory)
        user_profile = user_profile if isinstance(user_profile, dict) else {}
        agent_memory = agent_memory if isinstance(agent_memory, dict) else {}
    except:
        user_profile, agent_memory = {}, {}

    # --- LIGHTNING PROMPT: Minimal tokens for maximum speed ---
    system_prompt = f"You are 'CareerBot AI', an expert for {career_title}. Be accurate, fast, and professional. Match Score: {match_score}%. {language == 'ml' and 'Respond ONLY in Malayalam script.' or 'Respond in English.'}"

    groq_messages = [{"role": "system", "content": system_prompt}]
    for msg in messages[-3:]: # Only last 3 for extreme speed
        groq_messages.append(msg)

    try:
        # SPEED-FIRST COMPLETER
        return get_groq_chat_response(groq_messages, is_json=False)
    except Exception as e:
        logger.error(f"AI speed failure: {e}. Instant fallback active.")
        
        # --- INSTANT HYBRID FALLBACK ---
        try:
            last_query = messages[-1]["content"].lower() if messages else ""
            roadmap = user_profile.get("roadmap") or agent_memory.get("roadmap") or {}
            
            if any(k in last_query for k in ["roadmap", "step", "skill", "learn", "study", "timeline"]):
                phases = roadmap.get("phases", []) if isinstance(roadmap, dict) else []
                if phases:
                    top = phases[0]
                    tasks = top.get('tasks', [])
                    tasks_str = ", ".join(tasks[:2]) if isinstance(tasks, list) else "core training"
                    return f"Immediate Priority for {career_title}: {top.get('name')}. Tasks: {tasks_str}. Check the 'Strategic Pathway' icon for the full 10 steps!"
            
            if any(k in last_query for k in ["college", "school", "university", "admission"]):
                colleges = roadmap.get("colleges", []) if isinstance(roadmap, dict) else []
                if colleges:
                    col_name = colleges[0].get('name', 'Top Institutions')
                    return f"Top matching institution for you: {col_name}. You can find 9 more matching colleges in the 'Academic Institutions' icon!"
        except: pass

        error_msg = f"I'm syncing fresh data for {career_title}. While I do that, explore the 10 matching results I've prepared in the icons above!"
        if language == 'ml':
            error_msg = f"{career_title} വിവരങ്ങൾ ഞാൻ ക്രമീകരിക്കുകയാണ്. മുകളിലുള്ള ഐക്കണുകൾ പരിശോധിക്കുക!"
        return error_msg
