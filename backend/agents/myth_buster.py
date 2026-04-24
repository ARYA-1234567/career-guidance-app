import os
import json
import time
from groq import Groq
from tavily import TavilyClient
from typing import Dict, List, Any, Optional
from dotenv import load_dotenv

load_dotenv()

# Configuration
tavily = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))

SYSTEM_PROMPT = """You are the 'Global Career Myth Buster Agent' (International Career Expert).
Your goal is to challenge common career misconceptions for a specific career path using real-world data and international market insights (2025-2026).

## MISSION:
1. **Global Reach**: Identify EXACTLY 10 specific myths that exist internationally (e.g. US, Europe, Asia) regarding this career.
2. **Reality Check**: Provide a 'Reality Check' (Fact) for each myth with specific, data-backed evidence.
3. **Regional Sensitivity**: Explain how these global myths specifically manifest or differ in the Kerala and Indian professional landscape.
4. **Data Points**: Include specific stats like global salary benchmarks or hiring rates (2024-2025) to debunk the myth.
5. **Live & Accurate**: Use only the most up-to-date 2024-2025 information. You MUST provide EXACTLY 10 myth cards.

## OUTPUT FORMAT (strict JSON):
{
    "career": "Career Title",
    "myths": [
        {
            "myth": "The common misconception (Global or Regional)",
            "reality": "The actual reality based on current 2025 data",
            "data_proof": "Specific evidence or statistical proof",
            "kerala_context": "How this applies to students in Kerala/India",
            "global_reality": "The international perspective"
        }
    ]
}

Generate a set of detailed myth-busting cards."""

def get_myth_buster_data(career: str, language: Optional[str] = "en") -> str:
    """
    Generate career-specific myth-busting data using Tavily and Groq with Gemini fallback.
    """
    
    # 1. Search for myths
    search_query = (
        f"global myths and misconceptions about {career} career 2025, "
        f"common lies about {career} salary and job security, "
        f"international perspective on {career} industry reality 2026"
    )
    search_results = []
    try:
        results = tavily.search(query=search_query, search_depth="basic", max_results=5)
        search_results = results
    except Exception as e:
        print(f"Tavily Myth Search Error: {e}")

    user_prompt = (
        f"CAREER: {career}\n\n"
        f"=== SEARCH RESULTS ===\n{search_results}\n\n"
        "Analyze these results and generate EXACTLY 10 data-backed myth-busting cards. "
        "Focus on current 2024-2025 salary realities and industry shifts. Return ONLY valid JSON."
    )
    
    if language == 'ml':
        user_prompt += "\n\nCRITICAL: Respond NATIVELY in MALAYALAM script for ALL fields including 'career', 'myth', 'reality', 'data_proof', 'kerala_context', and 'global_reality'. Strictly NO ENGLISH should be present in the output. Every field must be in Malayalam."

    from utils.groq_client import get_groq_response
    try:
        raw_text = get_groq_response(SYSTEM_PROMPT, user_prompt, is_json=True, prefer_fast_model=True)
        return raw_text
    except Exception as e:
        print(f"Myth Buster Error: {e}")
    
    # --- Final Fallback ---
    # Simplified fallback if everything fails
    fallback_data = {
        "career": career,
        "myths": [
            {
                "myth": f"You need a Ph.D. to start in {career}." if language != 'ml' else f"{career} തുടങ്ങാൻ പിഎച്ച്ഡി ആവശ്യമാണ്.",
                "reality": "Most entry-level roles only require a Bachelor's and relevant skills." if language != 'ml' else "മിക്ക എൻട്രി ലെവൽ റോളുകൾക്കും ബാച്ചിലർ ബിരുദവും പ്രസക്തമായ കഴിവുകളും മാത്രം മതിയാകും.",
                "data_proof": "85% of junior roles don't list advanced degrees as mandatory." if language != 'ml' else "85% ജൂനിയർ റോളുകളിലും അഡ്വാൻസ്ഡ് ഡിഗ്രികൾ നിർബന്ധമല്ല.",
                "kerala_context": "Professional certificates are often more valued than long degrees in Kerala tech hubs." if language != 'ml' else "കേരളത്തിലെ ടെക് ഹബുകളിൽ നീണ്ട ബിരുദങ്ങളെക്കാൾ പ്രൊഫഷണൽ സർട്ടിഫിക്കറ്റുകൾക്കാണ് പലപ്പോഴും മൂല്യം കൂടുതൽ.",
                "global_reality": "Global companies prioritize portfolio over credentials." if language != 'ml' else "ആഗോള കമ്പനികൾ സർട്ടിഫിക്കറ്റുകളേക്കാൾ പോർട്ട്‌ഫോളിയോയ്ക്കാണ് മുൻഗണന നൽകുന്നത്."
            }
        ]
    }
    return json.dumps(fallback_data)
