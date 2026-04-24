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
    """
    Generate a context-aware response for the Career Chatbot.
    """
    from utils.groq_client import get_groq_chat_response
    
    # --- BULLETPROOF DATA SANITIZATION ---
    try:
        # Handle string inputs gracefully
        if isinstance(user_profile, str):
            try: user_profile = json.loads(user_profile)
            except: user_profile = {}
        
        if isinstance(agent_memory, str):
            try: agent_memory = json.loads(agent_memory)
            except: agent_memory = {}
            
        # Ensure we are working with dicts
        user_profile = user_profile if isinstance(user_profile, dict) else {}
        agent_memory = agent_memory if isinstance(agent_memory, dict) else {}
        
    except Exception as e:
        logger.error(f"Chatbot data sanitization failed: {e}")
        user_profile = {}
        agent_memory = {}

    section_key = active_section.upper() if active_section.upper() in SYSTEM_PROMPTS else "DEFAULT"
    base_prompt = SYSTEM_PROMPTS[section_key]
    
    # Personalize the system context with user info (Robust extraction)
    interests = user_profile.get('interests', [])
    strengths = user_profile.get('strengths', [])
    
    profile_summary = f"Student Category: {user_category}. Match Score for {career_title}: {match_score}%. "
    profile_summary += f"Interests: {', '.join(interests) if isinstance(interests, list) else 'Broad'}. "
    profile_summary += f"Strengths: {', '.join(strengths) if isinstance(strengths, list) else 'Diverse'}. "
    
    if agent_memory:
        profile_summary += f"Past Context: {json.dumps(agent_memory)[:500]}. "
    
    lang_instruction = "ALWAYS respond in English."
    if language == 'ml':
        lang_instruction = "CRITICAL: ALWAYS respond in MALAYALAM script. Every part of your response must be in Malayalam. Strictly NO ENGLISH should be present. Translate all technical terms or write them in Malayalam script."

    full_system_prompt = (
        f"{SYSTEM_PROMPT_HEADER}\n\n"
        f"{base_prompt}\n\n"
        f"CURRENT CONTEXT:\n"
        f"Career: {career_title}\n"
        f"User Profile: {profile_summary}\n\n"
        "REPLY GUIDELINES:\n"
        "1. Be helpful, encouraging, and direct.\n"
        f"2. {lang_instruction}\n"
        "3. If they ask about something related to another section, briefly answer and suggest they check that section icon.\n"
        "4. NEVER use internal monologue or <think> tags. Respond ONLY with the final message."
    )

    # Build the full message list with the system prompt at the top
    groq_messages = [{"role": "system", "content": full_system_prompt}]
    for msg in messages[-5:]: # Only last 5 for speed
        if msg.get("role") == "system": continue
        groq_messages.append({"role": msg["role"], "content": msg["content"]})

    try:
        # We set is_json=False because we want plain text for the chat interface
        return get_groq_chat_response(groq_messages, is_json=False)
    except Exception as e:
        logger.error(f"CareerBot AI failed: {str(e)}. Attempting Hybrid Intelligence fallback...")
        
        # --- HYBRID INTELLIGENCE: Pull from Trajectory Memory if AI fails ---
        try:
            last_user_query = messages[-1]["content"].lower() if messages else ""
            
            # Check for roadmap data in any memory slot
            roadmap = agent_memory.get("roadmap") or user_profile.get("roadmap") or {}
            
            if "roadmap" in last_user_query or "steps" in last_user_query or "timeline" in last_user_query or "skill" in last_user_query:
                phases = roadmap.get("phases", []) if isinstance(roadmap, dict) else []
                if phases and isinstance(phases, list):
                    top_phase = phases[0]
                    tasks = top_phase.get('tasks', [])
                    tasks_str = ", ".join(tasks[:3]) if isinstance(tasks, list) else "core training"
                    return f"I'm currently syncing my neural core, but looking at your high-fidelity roadmap for {career_title}, your immediate focus should be: {top_phase.get('name', 'Foundation')}. This involves {tasks_str}. You can see all 10 steps in the 'Strategic Pathway' icon!"
            
            if "college" in last_user_query or "school" in last_user_query or "university" in last_user_query:
                colleges = roadmap.get("colleges", []) if isinstance(roadmap, dict) else []
                if colleges and isinstance(colleges, list):
                    top_col = colleges[0]
                    col_name = top_col.get('name', 'Top Institutions') if isinstance(top_col, dict) else "top colleges"
                    return f"While my connection is recalibrating, I can see that {col_name} is a prime matching choice for your {career_title} path. There are 9 more matching institutions waiting for you in the 'Academic Institutions' icon!"

            if "resource" in last_user_query or "study" in last_user_query or "learn" in last_user_query:
                phases = roadmap.get("phases", []) if isinstance(roadmap, dict) else []
                if phases and isinstance(phases, list):
                    resources = phases[0].get("resources", [])
                    res_str = ", ".join(resources[:2]) if isinstance(resources, list) else "specialized courses"
                    return f"You should start with these matching resources for {career_title}: {res_str}. I've prepared a full study plan for you in the 'Strategic Pathway' icon!"

        except Exception as fallback_err:
            logger.error(f"Hybrid fallback logic failed: {fallback_err}")

        # Final friendly fallback if memory lookup fails too
        error_msg = f"I'm currently recalibrating my accuracy for {career_title}. While I do that, feel free to explore the 10 matching results I've prepared for you in the icons above!"
        if language == 'ml':
            error_msg = f"{career_title} സംബന്ധിച്ച വിവരങ്ങൾ ഞാൻ ക്രമീകരിക്കുകയാണ്. അതിനിടയിൽ, മുകളിലുള്ള ഐക്കണുകളിൽ ഞാൻ നിങ്ങൾക്കായി തയ്യാറാക്കിയ 10 ഫലങ്ങൾ പരിശോധിക്കാവുന്നതാണ്!"
        return error_msg
