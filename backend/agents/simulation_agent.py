import os
import json
import logging
from typing import Dict, Any, List
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(filename='agents.log', level=logging.INFO)
logger = logging.getLogger("SimulationAgent")

def compare_scenarios(career_a: str, career_b: str, user_profile: Dict[str, Any], scenario: str, location: str = "India", years_before_switch: int = 3, education: str = "None", work_type: str = "Job", language: str = 'en') -> Dict[str, Any]:
    """Generates a side-by-side comparison of two careers with what-if impact."""
    from utils.groq_client import get_groq_response
    
    system_prompt = "You are a professional Global Career Strategist and Financial Analyst. You provide hyper-realistic, data-driven 10-year career trajectories including salaries, role progressions, and risk assessments based on current global and Indian market indices."
    
    user_prompt = f"""
    Perform a comparative analysis for {user_profile.get('name', 'the user')} between:
    CAREER A: {career_a}
    CAREER B: {career_b}
    
    SCENARIO: {scenario} (Location: {location}, Addtl Education: {education}, Years Before Switch: {years_before_switch}, Work Type: {work_type})

    RESEARCH GUIDELINES:
    1. For High-Skill Professional roles (Doctors, Surgeons, Lawyers), ensure salaries reflect long residency/training periods and high peak earnings.
    2. For Tech roles (Software, AI), reflect rapid early scaling and early ceiling potential.
    3. For Moonshot roles (Quantum, Space Tech), reflect high risk but exponential growth.
    """
    if language == 'ml':
        user_prompt += "\nRespond NATIVELY in MALAYALAM script for 'role', 'milestone', 'scenario_impact', and 'recommendation' fields. Do not use English script."

    user_prompt += f"""
    Return a STRICT JSON response:
    {{
        "career_a_data": {{
            "yearly_data": [
                 {{"year": 1, "role": "Junior/Resident", "salary": 0, "milestone": "Training"}},
                 {{"year": 3, "role": "Associate", "salary": 0, "milestone": "Certification"}},
                 {{"year": 5, "role": "Senior/Consultant", "salary": 0, "milestone": "Independence"}},
                 {{"year": 7, "role": "Lead/Specialist", "salary": 0, "milestone": "Authority"}},
                 {{"year": 10, "role": "Partner/Director", "salary": 0, "milestone": "Legacy"}}
            ],
            "risk_level": "High/Medium/Low",
            "final_salary": "₹XX LPA"
        }},
        "career_b_data": {{
            "yearly_data": [...],
            "risk_level": "High/Medium/Low",
            "final_salary": "₹XX LPA"
        }},
        "winner_at_year_10": "{career_b}",
        "winner_margin": "₹10 LPA",
        "crossover_year": 6,
        "scenario_impact": "{scenario} adds {location} leverage",
        "recommendation": "A 3-4 sentence personalized strategy based on {user_profile.get('name')}'s goals.",
        "confidence": 87,
        "gulf_opportunities": {{"country": "UAE", "salary": "₹250,000/mo", "best_year": 3, "requirements": "3yrs experience"}},
        "psc_opportunities": {{"post_name": "Specific Post (e.g. Health Inspector)", "exam": "Specific Exam", "salary_scale": "Scale"}},
        "kerala_opportunities": {{"hubs": ["Career Hub (e.g. Medical College)", "Hub 2"], "avg_salary": "₹XX LPA", "top_companies": ["Org 1", "Org 2"]}}
    }}
    
    IMPORTANT: Do NOT use generic placeholders like 'Asst Engineer' or 'Technopark' if they do not match the career. 
    Example for Medical/Health: use 'Health Inspector' or 'District Medical Office' and hubs like 'Medical College'.
    
    Ensure SALARY is in Lakhs Per Annum (LPA) for India and appropriate local currency for international.
    CRITICAL: The 'yearly_data' array MUST contain exactly 5 entries for Years 1, 3, 5, 7, and 10.
    """
    
    try:
        response = get_groq_response(system_prompt, user_prompt, is_json=True)
        try:
            return json.loads(response.strip("` \n\t").replace("```json", "").replace("```", ""))
        except json.JSONDecodeError:
            return {}
    except Exception as e:
        logger.error(f"Simulation comparison failed: {e}")
        return {}

def calculate_what_if_impact(career: str, scenario: str, user_profile: Dict[str, Any]) -> Dict[str, Any]:
    """Specific deep-dive into how one decision changes the current path."""
    from utils.groq_client import get_groq_response
    
    system_prompt = "You are a Career Path Optimization AI. You analyze how specific decisions (Gulf move, MBA, Startup) change the standard trajectory."
    
    user_prompt = f"Analyze impact of '{scenario}' on a career in {career}. Return JSON with updated_projection (years 1, 3, 5, 10), impact_summary, and risk_change."
    
    try:
        response = get_groq_response(system_prompt, user_prompt, is_json=True)
        try:
            return json.loads(response.strip("` \n\t").replace("```json", "").replace("```", ""))
        except json.JSONDecodeError:
            return {}
    except Exception as e:
        logger.error(f"What-if impact calculation failed: {e}")
        return {}
