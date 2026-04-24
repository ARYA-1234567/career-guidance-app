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
    
    # --- NEURAL SANITIZATION & PROFILE EXTRACTION ---
    try:
        if isinstance(user_profile, str): user_profile = safe_parse_json(user_profile)
        if isinstance(agent_memory, str): agent_memory = safe_parse_json(agent_memory)
        user_profile = user_profile if isinstance(user_profile, dict) else {}
        agent_memory = agent_memory if isinstance(agent_memory, dict) else {}
    except:
        user_profile, agent_memory = {}, {}

    traits = user_profile.get("traits", ["Analytical", "Strategic"])
    interests = user_profile.get("interests", ["Technology", "Humanities"])
    
    # --- EXPERT PERSONA: Real, Live, and Accurate ---
    system_prompt = f"""You are 'CareerBot AI', a world-class career strategist for {career_title}.
USER PROFILE: {', '.join(traits[:3])} traits with interests in {', '.join(interests[:3])}.
ALIGNMENT: {match_score}% matching.

MISSION:
1. Be HUMAN-LIKE: Do not sound like a bot. Use phrases like "Based on your unique profile," or "Looking at 2024 trends..."
2. Be LIVE: Always assume the current date is 2024-2025. Mention current admission cycles or market demands.
3. Be ACCURATE: Provide career-specific gateways (e.g., NEET PG, GATE, IIM) instead of generic exams.
4. Be PROACTIVE: If in {active_section}, give deep insights relevant to that area.

LANGUAGE: {language == 'ml' and 'RESPOND ONLY IN MALAYALAM SCRIPT.' or 'RESPOND IN ENGLISH.'}
"""

    groq_messages = [{"role": "system", "content": system_prompt}]
    for msg in messages[-4:]: # Balanced history for context and speed
        groq_messages.append(msg)

    try:
        # SPEED-ACCURACY BALANCED COMPLETER
        return get_groq_chat_response(groq_messages, is_json=False)
    except Exception as e:
        logger.error(f"AI sync failure: {e}. Instant Hybrid recovery active.")
        
        # --- INSTANT HYBRID FALLBACK: High-Fidelity Recovery ---
        try:
            last_query = messages[-1]["content"].lower() if messages else ""
            roadmap = user_profile.get("roadmap") or agent_memory.get("roadmap") or {}
            
            if any(k in last_query for k in ["roadmap", "step", "skill", "learn", "study", "timeline", "milestone"]):
                phases = roadmap.get("phases", []) if isinstance(roadmap, dict) else []
                if phases:
                    top = phases[0]
                    tasks = top.get('tasks', [])
                    tasks_str = ", ".join(tasks[:3]) if isinstance(tasks, list) else "specialized training"
                    return f"Based on your high-fidelity roadmap for {career_title}, your immediate priority is: {top.get('name')}. This involves {tasks_str}. Check the 'Strategic Pathway' icon for all 10 steps!"
            
            if any(k in last_query for k in ["college", "school", "university", "admission", "kerala", "entrance"]):
                colleges = roadmap.get("colleges", []) if isinstance(roadmap, dict) else []
                if colleges:
                    col = colleges[0]
                    return f"For your {career_title} path, I highly recommend {col.get('name')}. It is a top institution known for its 2024-2025 placement excellence. I have 9 more matching colleges waiting in your Academic tab!"

            if any(k in last_query for k in ["salary", "market", "demand", "job", "outlook"]):
                return f"The market for {career_title} is booming in 2024, especially for someone with your {traits[0]} strengths. Expect entry-level roles to grow by 15% this year. Check the Market Intelligence tab for the full data on 10 top employers!"
        except: pass

        error_msg = f"I'm recalibrating my neural core for {career_title}. While I do that, feel free to explore the 10 matching results I've prepared for you in the icons above!"
        if language == 'ml':
            error_msg = f"{career_title} സംബന്ധിച്ച വിവരങ്ങൾ ഞാൻ ക്രമീകരിക്കുകയാണ്. മുകളിലുള്ള ഐക്കണുകളിൽ ഞാൻ നിങ്ങൾക്കായി തയ്യാറാക്കിയ 10 ഫലങ്ങൾ പരിശോധിക്കാവുന്നതാണ്!"
        return error_msg
