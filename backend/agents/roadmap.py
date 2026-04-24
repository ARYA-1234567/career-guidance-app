import os
import json
import logging
import time
from typing import Dict, Any
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    filename='agents.log',
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("Roadmap")
SYSTEM_PROMPT = """You are an expert Career Architect. You create high-fidelity, actionable, and hyper-detailed 24-month career roadmaps.

## MISSION:
1. **Career-Matching Accuracy**: Every task, exam, and college MUST be a 100% direct match for the chosen career.
2. **NO GENERIC RESULTS**: STRICTLY FORBIDDEN to list general school exams (CBSE, PSEB, etc.) unless they are the primary professional gateway.
3. **Granular Detail**: Every task must be highly specific to the professional role.
4. **Relative Timelines**: Use 'Months 1-24' markers. Use relative terms like 'Standard Application Cycle'.
5. **Live & Accurate**: Use only 2024-2025 up-to-date data for career-specific gateways.
6. **Quantity Requirement**: You MUST provide EXACTLY 10 results for 'entrance_exams' and 10 results for 'colleges'. Each phase must have 10 career-specific tasks.

## OUTPUT FORMAT (strict JSON):
{
    "career": "Career Title",
    "phases": [
        {
            "name": "Phase 1: Foundation (Specific Title)",
            "timeline": "Months 1-3",
            "tasks": ["List EXACTLY 10 highly specific tasks (e.g. Complete CS50x)", "Task 2...", "Task 3...", "Task 4...", "Task 5...", "Task 6...", "Task 7...", "Task 8...", "Task 9...", "Task 10..."],
            "milestone": "Definitive achievement (e.g. GitHub portfolio initiated)",
            "resources": ["Provide 3 or 4 direct course links or highly specific platform names"],
            "prerequisites": ["Required background knowledge or tool access"],
            "top_learning_platforms": ["Best site for this specific phase"]
        }
    ],
    "weekly_plan": [
        {
            "week": 1,
            "topic": "Mastering X (Granular)",
            "tasks": ["Daily deep-work task 1", "Applied project task 2", "Review task 3"],
            "resource": "URL or specific book title"
        }
    ],
    "entrance_exams": [
        {
            "exam_name": "Provide EXACTLY 10 specific Exam Names",
            "conducting_body": "Body",
            "frequency": "Annually",
            "eligibility": "Requirements",
            "application_window": "Month-Month",
            "fees": "₹XXX"
        }
    ],
    "colleges": [
        {
            "name": "Provide EXACTLY 10 specific College Names (Include Kerala and Global)",
            "type": "Government/Private",
            "program": "B.Tech/BSc etc",
            "location": "City, State",
            "ranking": "NIRF/QS Rank if applicable",
            "fees_estimate": "Average tuition fees",
            "admission_mode": "Entrance Exam / Merit"
        }
    ],
    "estimated_cost": "₹X-Y total",
    "key_certifications": ["Cert 1", "Cert 2"],
    "local_institutions": ["Institution 1", "Institution 2"],
    "critical_skills": ["Skill 1", "Skill 2"]
}"""


from tavily import TavilyClient
from utils.groq_client import get_groq_response

def generate_roadmap(career: str, profile: Dict[str, Any], language: str = 'en') -> str:
    """
    Generate a comprehensive 24-month career roadmap with live 2025 web context.
    """
    tavily = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))
    
    # Live Search for standard cycles
    search_query = f"{career} entrance exams India standard application cycles fees and top colleges"
    search_context = ""
    try:
        results = tavily.search(query=search_query, search_depth="basic", max_results=5)
        for res in results.get("results", []):
            search_context += f"Source: {res.get('url')}\nContent: {res.get('content')}\n\n"
    except Exception as e:
        logger.warning(f"Tavily search failed for roadmap: {e}")

    profile_summary = (
        f"Category: {profile.get('category', 'Not specified')}\n"
        f"Strengths: {', '.join(profile.get('strengths', ['Not specified']))}\n"
        f"Interests: {', '.join(profile.get('interests', ['Not specified']))}\n"
        f"Values: {', '.join(profile.get('values', ['Not specified']))}\n"
    )
    
    user_prompt = (
        f"CAREER: {career}\n\n"
        f"STUDENT PROFILE:\n{profile_summary}\n\n"
        f"LIVE MARKET CONTEXT:\n{search_context}\n\n"
        "Generate a comprehensive, realistic, and actionable 24-month roadmap. "
        "Use relative timeframes (e.g., 'Month 1', 'Standard Cycle') and NEVER mention absolute years or specific calendar dates. "
        "Make it SPECIFIC to this exact career and this student's background. "
    )
    if language == 'ml':
        user_prompt += "\nCRITICAL: Respond NATIVELY in MALAYALAM script for ALL fields including 'career', 'name', 'tasks', 'milestone', 'topic', 'exam_name', 'conducting_body', 'eligibility', 'ranking_note', and 'estimated_cost'. Strictly NO ENGLISH should be present in the output. Translate all technical terms to their Malayalam equivalents or provide them in Malayalam script."

    user_prompt += "\nReturn ONLY valid JSON."

    try:
        return get_groq_response(SYSTEM_PROMPT, user_prompt, is_json=True)
    except Exception as e:
        logger.exception(f"Roadmap generation failed: {str(e)}")
        return json.dumps(get_fallback_roadmap(career))


def get_fallback_roadmap(career: str) -> dict:
    return {
        "career": career,
        "phases": [
            {
                "name": "Foundation Building",
                "timeline": "Months 1-4",
                "tasks": [
                    "Research the field thoroughly",
                    "Identify core skills required",
                    "Start an introductory online course",
                    "Join relevant online communities"
                ],
                "milestone": "Complete introductory certification",
                "resources": ["Coursera", "Khan Academy", "YouTube"]
            },
            {
                "name": "Skill Development",
                "timeline": "Months 5-10",
                "tasks": [
                    "Take intermediate courses",
                    "Build portfolio projects",
                    "Practice with real-world problems",
                    "Attend workshops or webinars"
                ],
                "milestone": "Complete 3 portfolio projects",
                "resources": ["Udemy", "FreeCodeCamp", "edX"]
            },
            {
                "name": "Advanced & Specialization",
                "timeline": "Months 11-18",
                "tasks": [
                    "Deep dive into specialization area",
                    "Pursue advanced certifications",
                    "Contribute to open source or research",
                    "Network with professionals"
                ],
                "milestone": "Earn industry-recognized certification",
                "resources": ["LinkedIn Learning", "Pluralsight"]
            },
            {
                "name": "Job-Ready Sprint",
                "timeline": "Months 19-24",
                "tasks": [
                    "Update resume and portfolio",
                    "Practice interview skills",
                    "Apply to internships and entry-level positions",
                    "Attend career fairs"
                ],
                "milestone": "Secure first job or internship",
                "resources": ["LinkedIn", "Naukri", "Internshala"]
            }
        ],
        "weekly_plan": [
            {"week": i+1, "topic": f"Week {i+1} Focus Area", "tasks": ["Study core concepts", "Practice exercises", "Review and revise"], "resource": "Online courses"}
            for i in range(12)
        ],
        "colleges": [
            {"name": "Indian Institute of Science (IISc)", "type": "Government", "program": "Integrated PhD/Masters", "location": "Bangalore", "ranking": "NIRF 1", "fees_estimate": "₹30,000/yr", "admission_mode": "GATE/JAM"},
            {"name": "IIT Bombay", "type": "Government", "program": "B.Tech/M.Tech", "location": "Mumbai", "ranking": "NIRF 3", "fees_estimate": "₹2,00,00/yr", "admission_mode": "JEE Advanced"},
            {"name": "IIT Delhi", "type": "Government", "program": "B.Tech/M.Tech", "location": "Delhi", "ranking": "NIRF 2", "fees_estimate": "₹2,00,00/yr", "admission_mode": "JEE Advanced"},
            {"name": "IIT Madras", "type": "Government", "program": "B.Tech/M.Tech", "location": "Chennai", "ranking": "NIRF 1", "fees_estimate": "₹2,00,00/yr", "admission_mode": "JEE Advanced"},
            {"name": "BITS Pilani", "type": "Private", "program": "B.E/M.E", "location": "Pilani/Goa", "ranking": "Top Private", "fees_estimate": "₹5,00,00/yr", "admission_mode": "BITSAT"},
            {"name": "NIT Calicut", "type": "Government", "program": "B.Tech", "location": "Kerala", "ranking": "Top NIT", "fees_estimate": "₹1,50,00/yr", "admission_mode": "JEE Main"},
            {"name": "CUSAT", "type": "Government", "program": "B.Tech/MSc", "location": "Kochi, Kerala", "ranking": "State Top", "fees_estimate": "₹60,000/yr", "admission_mode": "CAT/CUSAT"},
            {"name": "TKM College of Engineering", "type": "Govt-Aided", "program": "B.Tech", "location": "Kollam, Kerala", "ranking": "State Rank", "fees_estimate": "₹40,000/yr", "admission_mode": "KEAM"},
            {"name": "Government Engineering College", "type": "Government", "program": "B.Tech", "location": "Trivandrum", "ranking": "Top Govt Kerala", "fees_estimate": "₹10,000/yr", "admission_mode": "KEAM"},
            {"name": "Amrita Vishwa Vidyapeetham", "type": "Private", "program": "B.Tech", "location": "Coimbatore/Amritapuri", "ranking": "NIRF Top 10", "fees_estimate": "₹3,00,00/yr", "admission_mode": "AEEE"}
        ],
        "entrance_exams": [
            {"exam_name": "JEE Advanced", "conducting_body": "IITs", "frequency": "Annual", "eligibility": "Class 12 (Top 2.5L JEE Main)", "application_window": "April-May", "fees": "₹2,800"},
            {"exam_name": "JEE Main", "conducting_body": "NTA", "frequency": "Bi-Annual", "eligibility": "Class 12", "application_window": "Dec & March", "fees": "₹1,000"},
            {"exam_name": "GATE", "conducting_body": "IITs", "frequency": "Annual", "eligibility": "Graduation", "application_window": "Sept-Oct", "fees": "₹1,700"},
            {"exam_name": "KEAM", "conducting_body": "CEE Kerala", "frequency": "Annual", "eligibility": "Class 12", "application_window": "Feb-March", "fees": "₹700"},
            {"exam_name": "BITSAT", "conducting_body": "BITS Pilani", "frequency": "Annual", "eligibility": "Class 12 (75% PCM)", "application_window": "Jan-April", "fees": "₹3,400"},
            {"exam_name": "VITEEE", "conducting_body": "VIT", "frequency": "Annual", "eligibility": "Class 12", "application_window": "Nov-March", "fees": "₹1,350"},
            {"exam_name": "NEET UG", "conducting_body": "NTA", "frequency": "Annual", "eligibility": "Class 12 (PCB)", "application_window": "Feb-March", "fees": "₹1,700"},
            {"exam_name": "CUET", "conducting_body": "NTA", "frequency": "Annual", "eligibility": "Class 12", "application_window": "Feb-April", "fees": "₹650"},
            {"exam_name": "CAT (CUSAT)", "conducting_body": "CUSAT", "frequency": "Annual", "eligibility": "Class 12", "application_window": "Jan-Feb", "fees": "₹1,100"},
            {"exam_name": "JAM", "conducting_body": "IITs", "frequency": "Annual", "eligibility": "Graduation", "application_window": "Sept-Oct", "fees": "₹1,800"}
        ],
        "estimated_cost": "₹10,000 - ₹50,000",
        "key_certifications": ["Relevant industry certification"],
        "local_institutions": ["Check local universities", "Online platforms"]
    }
