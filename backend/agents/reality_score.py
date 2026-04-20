import os
import json
from utils.genai_client import get_gemini_2_flash
from typing import Dict, Any, Optional

SYSTEM_PROMPT = """You are an expert Career Reality Score Agent (Gemini Agent 4.0).

Your goal is to provide a feasibility score (0-100) for a specific career given a student's profile.

## FEASIBILITY CRITERIA (0-100):
1. **Academic Preparedness (0-30)**: Does the student's background allow entry into this career?
2. **Current Strengths (0-30)**: Do they have the core competencies needed for success?
3. **Market Saturation (0-20)**: How difficult is it to get an entry-level job in Kerala/Gulf?
4. **Effort Required (0-20)**: How much specialized learning/certification is needed?

## OUTPUT FORMAT (strict JSON):
{
    "career": "...",
    "reality_score": 85,
    "breakdown": {
        "academic": 25,
        "strengths": 28,
        "market": 15,
        "effort": 17
    },
    "reasoning": "Explain WHY this score was given, and identifying specific gaps.",
    "is_achievable": true
}
"""

def evaluate_feasibility(career: str, profile: Dict[str, Any], language: Optional[str] = "en") -> str:
    """
    Evaluate the feasibility of a career path using Gemini 2.0 Flash.
    """
    from utils.groq_client import get_groq_response
    try:
        prompt = (
            f"CAREER: {career}\n"
            f"STUDENT PROFILE:\n"
            f"Traits: {', '.join(profile.get('traits', []))}\n"
            f"Interests: {', '.join(profile.get('interests', []))}\n"
            f"Strengths: {', '.join(profile.get('strengths', []))}\n"
            f"Background: {profile.get('category', 'Not specified')}\n\n"
            "Now provide the reality score and breakdown. Be realistic and identify potential challenges."
        )
        
        if language == 'ml':
            prompt += "\n\nCRITICAL: Respond NATIVELY in MALAYALAM script for ALL fields including 'career' and 'reasoning'. Strictly NO ENGLISH should be present in the output. Every field must be in Malayalam."

        raw_text = get_groq_response(SYSTEM_PROMPT, prompt, is_json=True)
        return raw_text
        
    except Exception as e:
        print(f"FAIL: Reality Score - {str(e)}")
        # Fallback profile or error handling
        return json.dumps({"error": f"Internal Reality Score analysis failed: {str(e)}"})
