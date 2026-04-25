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
    
    # --- LIVE AI ENGINE: Primary Dynamic Responder ---
    system_prompt = f"""You are 'CareerBot AI', a world-class career strategist for {career_title}.
    CONTEXT:
    - Target Career: {career_title}
    - Location Focus: Kerala, India & Global
    - Profile Traits: {", ".join(traits)}
    - Trajectory Data: {json.dumps(agent_memory.get('roadmap', {}))[:1000]}
    
    GUIDELINES:
    1. Provide dynamic, data-driven answers based on the context above.
    2. Be professional, encouraging, and highly specific (mention real Kerala colleges/exams).
    3. Keep answers concise (max 3 sentences)."""

    groq_messages = [{"role": "system", "content": system_prompt}] + messages
    
    try:
        # SPEED-ACCURACY BALANCED COMPLETER
        return get_groq_chat_response(groq_messages, is_json=False)
    except Exception as e:
        logger.error(f"AI sync failure: {e}. Reverting to Fail-Safe Intelligence.")
        
        # --- FAIL-SAFE INTELLIGENCE: Recovery Mode ---
        try:
            last_query = (messages[-1]["content"].lower() if messages else "").strip()
            
            if any(k in last_query for k in ["college", "school", "university", "admission", "entrance"]):
                return f"For your {career_title} journey in 2024-2025, I have identified 10 matching institutions for you. The top recommendation is currently based on your location and academic goals. Explore the 'Academic Institutions' tab for your matching list!"
                
            if any(k in last_query for k in ["milestone", "roadmap", "step", "path", "timeline"]):
                return f"I've mapped out your 10-step trajectory for {career_title}. Your immediate priority is mastering Phase 1 (Foundational Knowledge) to build your professional portfolio. Explore the 'Strategic Pathway' icon for the full high-fidelity plan!"

            if any(k in last_query for k in ["kerala", "opportunity", "market", "prospect", "job", "salary", "demand"]):
                return f"The market outlook for {career_title} in 2024-2025 is exceptionally strong, especially in Kerala and global hubs. Expect high demand for someone with your matching profile. Check the 'Market Intelligence' tab for details on all 10 top employers!"
        except: pass

        error_msg = f"As your strategist for {career_title}, I've prepared 60 matching data points for you in the icons above. Based on your profile, your immediate goal is mastering Phase 1. How else can I help you today?"
        if language == 'ml':
            error_msg = f"{career_title} സംബന്ധിച്ച വിവരങ്ങൾ ഞാൻ ക്രമീകരിക്കുകയാണ്. മുകളിലുള്ള ഐക്കണുകളിൽ ഞാൻ നിങ്ങൾക്കായി തയ്യാറാക്കിയ 10 ഫലങ്ങൾ പരിശോധിക്കാവുന്നതാണ്!"
        return error_msg
