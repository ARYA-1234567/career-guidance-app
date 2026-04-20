import os
import json
from typing import Dict, Any, Optional
from tavily import TavilyClient
from utils.groq_client import get_groq_response

SYSTEM_PROMPT = """You are an expert Career Simulation Agent (Gemini Agent 7.0).

Your goal is to predict a student's potential career growth over a 10-year period for a specific career path.

## SIMULATION METRICS:
1. **Yearly Trajectory**: Predicted career milestones for Years 1, 3, 5, and 10.
2. **Salary Progression**: Projected salary in ₹ LPA for each milestone.
3. **Skill Development**: Required skills to stay competitive at each phase.
4. **Lifestyle Insights**: Likely work-life balance and lifestyle impact.

## OUTPUT FORMAT (strict JSON):
{
    "career": "...",
    "simulation": [
        {
            "year": 1,
            "role": "...",
            "salary": "X-Y LPA",
            "milestones": ["...", "..."],
            "lifestyle": "..."
        },
        {
            "year": 3,
            "role": "...",
            "salary": "...",
            "milestones": ["..."],
            "lifestyle": "..."
        },
        ...
    ],
    "peak_salary_projection": 35.5,
    "future_potential": "High/Moderate/Low"
}

Provide data for years 1, 3, 5, 10.
"""

def simulate_career_growth(career: str, profile: Dict[str, Any], language: Optional[str] = "en") -> str:
    """
    Simulate a 10-year career growth with live industry progression data.
    """
    tavily = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))
    
    # Search for 10-year growth trends with 2024-2025 context
    search_query = f"{career} career path 10 year progression salary growth and typical job titles India Global 2024 2025"
    search_context = ""
    try:
        results = tavily.search(query=search_query, search_depth="advanced", max_results=5)
        for res in results.get("results", []):
            search_context += f"Source: {res.get('url')}\nContent: {res.get('content')}\n\n"
    except Exception as e:
        print(f"Tavily search failed for career simulation: {e}")

    try:
        prompt = (
            f"CAREER: {career}\n"
            f"STUDENT PROFILE:\n"
            f"Current category: {profile.get('category', 'Not specified')}\n"
            f"Interests: {', '.join(profile.get('interests', []))}\n"
            f"Core Strengths: {', '.join(profile.get('strengths', []))}\n\n"
            f"LIVE GROWTH CONTEXT (BASELINE 2025):\n{search_context}\n\n"
            "Now simulate the 10-year growth trajectory (2025-2035) using the search context for accurate milestones and salary jumps. Be specific to current 2025 industry standards."
        )
        
        if language == 'ml':
            prompt += "\n\nCRITICAL: Respond NATIVELY in MALAYALAM script for ALL fields including 'career', 'role', 'salary', 'milestones', 'lifestyle', and 'future_potential'. Strictly NO ENGLISH should be present in the output. Every field must be in Malayalam."

        raw_text = get_groq_response(SYSTEM_PROMPT, prompt, is_json=True)
        return raw_text
        
    except Exception as e:
        print(f"FAIL: Career Simulation - {str(e)}")
        # Fallback profile or error handling
        return json.dumps({"error": f"Internal Career Simulation failed: {str(e)}"})
