import os
import json
from utils.genai_client import get_gemini_2_flash
from typing import Dict, Any, Optional

SYSTEM_PROMPT = """You are an expert Career Requirements & Skill Gap Analyst (Specialist in 2025/2026 Industry Standards).

Your goal is to provide a DEFINITIVE list of requirements for a target career and compare them with the student's current profile.

## ANALYSIS METHODOLOGY:
1. **Full Requirements Mapping**: Identify ALL prerequisites:
   - **Academic**: Degrees, specific branches, and CGPA benchmarks.
   - **Technical**: Languages, frameworks, tools, and platforms.
   - **Soft Skills**: Critical interpersonal and cognitive abilities.
   - **Certifications**: Industry-standard credentials (e.g. AWS, CISSP, CMA).
2. **Gap Identification**: Precisely identify what the student is missing based on their profile.
3. **BRIDGE THE GAP**: Suggest the exact resources (courses/projects) to meet every requirement.

## OUTPUT FORMAT (strict JSON):
{
    "career": "...",
    "essential_requirements": [
        {"area": "Academic/Technical/etc", "requirement": "Provide 5 to 7 specific requirements", "importance": "Critical/Desired"}
    ],
    "tools_and_tech_stack": ["List 8 to 12 specific tools, languages, and platforms"],
    "current_standing": "Brief summary of where the student stands",
    "skill_gaps": [
        {
            "gap": "List 5 to 7 specific Skill/Tool/Prerequisite Name gaps",
            "priority": "High/Medium/Low",
            "recommendation": "Provide highly specific course/project/certification link or name to bridge this"
        }
    ],
    "ready_percentage": 65
}
"""

def analyze_skill_gap(career: str, profile: Dict[str, Any], language: Optional[str] = "en") -> str:
    """
    Identify skill gaps between student's profile and target career using Gemini 2.0 Flash.
    """
    from tavily import TavilyClient
    from utils.groq_client import get_groq_response
    tavily = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))
    
    # Live Search for 2025 skill demands
    search_query = f"top in-demand skills and essential tools for {career} 2025 2026 job market"
    search_context = ""
    try:
        results = tavily.search(query=search_query, search_depth="basic", max_results=5)
        for res in results.get("results", []):
            search_context += f"Source: {res.get('url')}\nContent: {res.get('content')}\n\n"
    except Exception as e:
        print(f"Tavily search failed for skill gap: {e}")

    try:
        prompt = (
            f"CAREER: {career}\n"
            f"STUDENT PROFILE:\n"
            f"Current Strengths: {', '.join(profile.get('strengths', []))}\n"
            f"Interests: {', '.join(profile.get('interests', []))}\n"
            f"Background: {profile.get('category', 'Not specified')}\n\n"
            f"LIVE 2025 WEB CONTEXT:\n{search_context}\n\n"
            "Now analyze the skill gaps using the Live Web Context for 2025 requirements. Provide a precise JSON report."
        )
        
        if language == 'ml':
            prompt += "\n\nCRITICAL: Respond NATIVELY in MALAYALAM script for ALL fields including 'career', 'area', 'requirement', 'importance', 'tools_and_tech_stack', 'current_standing', 'gap', 'priority', and 'recommendation'. Strictly NO ENGLISH should be present in the output. Every field must be in Malayalam."

        raw_text = get_groq_response(SYSTEM_PROMPT, prompt, is_json=True)
        return raw_text
        
    except Exception as e:
        print(f"FAIL: Skill Gap Analyst - {str(e)}")
        # Fallback profile or error handling
        return json.dumps({"error": f"Internal Skill Gap analysis failed: {str(e)}"})
