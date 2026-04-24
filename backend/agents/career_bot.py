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
    
    section_key = active_section.upper() if active_section.upper() in SYSTEM_PROMPTS else "DEFAULT"
    base_prompt = SYSTEM_PROMPTS[section_key]
    
    # Personalize the system context with user info
    profile_summary = f"Student Category: {user_category}. Match Score for {career_title}: {match_score}%. "
    profile_summary += f"Interests: {', '.join(user_profile.get('interests', []))}. "
    profile_summary += f"Strengths: {', '.join(user_profile.get('strengths', []))}. "
    
    if agent_memory:
        profile_summary += f"Long-term Memories/Insights: {json.dumps(agent_memory)}. Use these to personalize your approach."
    
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
    groq_messages = [
        {"role": "system", "content": full_system_prompt}
    ]
    
    # Add conversation history
    for msg in messages:
        # Avoid duplicated system prompts in history
        if msg.get("role") == "system": continue
        groq_messages.append({
            "role": msg["role"],
            "content": msg["content"]
        })

    try:
        # We set is_json=False because we want plain text for the chat interface
        return get_groq_chat_response(groq_messages, is_json=False)
    except Exception as e:
        logger.error(f"CareerBot AI failed: {str(e)}. Attempting Hybrid Intelligence fallback...")
        
        # --- HYBRID INTELLIGENCE: Pull from Trajectory Memory if AI fails ---
        last_user_query = messages[-1]["content"].lower() if messages else ""
        
        if agent_memory and isinstance(agent_memory, dict):
            # Try to find relevant data in the roadmap
            roadmap = agent_memory.get("roadmap", {})
            if "roadmap" in agent_memory and not roadmap: # Handle nested structure
                 roadmap = agent_memory.get("roadmap", {})

            if "roadmap" in last_user_query or "steps" in last_user_query:
                phases = roadmap.get("phases", [])
                if phases:
                    top_phase = phases[0]
                    return f"I'm currently syncing my neural core, but looking at your roadmap for {career_title}, your first step is: {top_phase.get('name', '')}. It involves tasks like {', '.join(top_phase.get('tasks', [])[:3])}. Check the 'Strategic Pathway' icon for all 10 steps!"
            
            if "college" in last_user_query or "school" in last_user_query or "university" in last_user_query:
                colleges = roadmap.get("colleges", [])
                if colleges:
                    top_col = colleges[0]
                    return f"While my connection is recalibrating, I can see that {top_col.get('name', 'top institutions')} is a great matching choice for {career_title}. You can find 10 more matching colleges in the 'Academic Institutions' icon!"

            if "resource" in last_user_query or "study" in last_user_query or "learn" in last_user_query:
                phases = roadmap.get("phases", [])
                if phases:
                    resources = phases[0].get("resources", [])
                    if resources:
                        return f"You should start with these matching resources: {', '.join(resources[:3])}. I have 10 more phases of resources waiting for you in the 'Strategic Pathway' icon!"

        # Final friendly fallback if memory lookup fails too
        error_msg = f"I'm currently recalibrating my accuracy for {career_title}. While I do that, feel free to explore the 10 matching results I've prepared for you in the icons above!"
        if language == 'ml':
            error_msg = f"{career_title} സംബന്ധിച്ച വിവരങ്ങൾ ഞാൻ ക്രമീകരിക്കുകയാണ്. അതിനിടയിൽ, മുകളിലുള്ള ഐക്കണുകളിൽ ഞാൻ നിങ്ങൾക്കായി തയ്യാറാക്കിയ 10 ഫലങ്ങൾ പരിശോധിക്കാവുന്നതാണ്!"
        return error_msg
