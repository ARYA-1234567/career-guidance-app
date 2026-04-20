import os
import json
import time
import logging
from tavily import TavilyClient
from groq import Groq
from typing import Dict, List, Any, Optional
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger("CollegeLookup")

# Configuration
tavily_api_key = os.getenv("TAVILY_API_KEY")
tavily = TavilyClient(api_key=tavily_api_key) if tavily_api_key else None

SYSTEM_PROMPT_UNI = """You are the 'Kerala & Pan-India Educational Discovery Agent'.
Your goal is to identify ALL relevant Universities and Institutions in Kerala and major Tier-1 hubs across India (IITs, NITs, Central Universities) for a specific career.

## MISSION:
1. **Kerala Intensity**: Identify at least 8-10 top institutions within Kerala (Government, Aided, and Top Private).
2. **National Excellence**: Identify 5-7 major Tier-1 Indian hubs (IITs, NITs, IIMs, Central Universities).
3. **Comprehensive Coverage**: Aim for a total of 15 institutions.
4. **Data Depth**: For each institution, provide specific course names, estimated fee structures, admission intake periods, and the official website URL.

## OUTPUT FORMAT (strict JSON):
{
    "career": "Career Title",
    "universities": [
        {
            "name": "University/College Name",
            "location": "City, Kerala/India",
            "type": "Government/Aided/Private",
            "reputation": "Description of why it is good for this career",
            "programs": ["Course 1 (e.g. B.Tech in X)", "Course 2"],
            "fee_structure": "Estimated annual fee range (e.g. ₹50,000 - ₹1,00,000)",
            "intake_period": "Typical admission month (e.g. May-June)",
            "official_website": "Full URL to the college website"
        }
    ]
}
Generate a comprehensive list focusing heavily on Kerala and Top Indian Institutions."""

from utils.groq_client import get_groq_response

def get_universities_for_career(career: str, language: str = 'en') -> str:
    """
    Find top universities for a specific career using Tavily and Groq.
    Enhanced with resilience and language support.
    """
    fallback_data = {
        "career": career,
        "universities": [
            {
                "name": "Calicut University",
                "location": "Malappuram, Kerala",
                "type": "Government",
                "reputation": "One of the largest and oldest universities in Kerala with diverse professional courses.",
                "programs": ["Standard Specialized Degrees"]
            },
            {
                "name": "MG University",
                "location": "Kottayam, Kerala",
                "type": "Government",
                "reputation": "Renowned for academic excellence in sciences and humanities in Central Kerala.",
                "programs": ["Professional & Academic Tracks"]
            },
            {
                "name": "IIT Palakkad",
                "location": "Palakkad, Kerala",
                "type": "Government",
                "reputation": "Leading technical institution for engineering and technology research.",
                "programs": ["Engineering (various sectors)", "Research"]
            }
        ]
    }

    # Live Search for 2025/2026 context
    search_query = (
        f"List of all colleges in Kerala offering {career} courses 2025, "
        f"Top 10 professional institutes in Kerala for {career}, "
        f"Best Indian universities for {career} 2025 NIRF rankings"
    )
    
    search_results = "No search data available."
    if tavily:
        try:
            results = tavily.search(query=search_query, search_depth="advanced", max_results=5)
            search_results = str(results)
        except Exception as e:
            logger.warning(f"Tavily University Search Error: {e}")

    user_prompt = (
        f"CAREER: {career}\n"
        f"LANGUAGE: {language}\n\n"
        f"=== SEARCH RESULTS ===\n{search_results}\n\n"
        f"Identify at least 6 top universities. Current language is {language}. Return ONLY valid JSON."
    )

    try:
        current_system = SYSTEM_PROMPT_UNI
        if language == 'ml':
            current_system += "\nCRITICAL: Return 'name', 'location', 'reputation', 'programs' in Malayalam."
            
        return get_groq_response(current_system, user_prompt, is_json=True, prefer_fast_model=True)
    except Exception as e:
        logger.error(f"Groq University Lookup Error: {e}")
        return json.dumps(fallback_data)

def lookup_affiliated_colleges(university: str, course: str) -> str:
    """
    Find affiliated colleges using Tavily and summarize with Groq.
    """
    try:
        search_query = f"list of colleges affiliated to {university} offering {course} 2025 2026"
        search_results = "No search results."
        if tavily:
            results = tavily.search(query=search_query, search_depth="advanced", max_results=5)
            search_results = str(results)
        
        prompt = (
            f"Using the results below, list colleges affiliated with '{university}' for '{course}'.\n\n"
            f"=== SEARCH RESULTS ===\n{search_results}\n\n"
            "Return ONLY valid JSON."
        )
        
        return get_groq_response("You are an informative college lookup bot. Return JSON ONLY.", prompt, is_json=True)
        
    except Exception as e:
        logger.warning(f"College Lookup Agent Error: {e}")
        return json.dumps({"university": university, "colleges": []})
