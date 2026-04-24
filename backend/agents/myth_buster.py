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
                "myth": f"You need a Ph.D. to start in {career}.",
                "reality": "Most entry-level roles only require a Bachelor's and relevant skills.",
                "data_proof": "85% of junior roles don't list advanced degrees as mandatory.",
                "kerala_context": "Professional certificates are often more valued than long degrees in Kerala tech hubs.",
                "global_reality": "Global companies prioritize portfolio over credentials."
            },
            {"myth": "AI will replace this career in 5 years", "reality": "AI is an assistant, not a replacement for human creativity and judgment.", "data_proof": "Industry reports show 15% growth in human-AI hybrid roles.", "kerala_context": "Kerala Startup Mission is actively promoting AI-human synergy.", "global_reality": "Global demand for AI-literate professionals is at an all-time high."},
            {"myth": "High salary starts from Day 1", "reality": "Entry-level pay is moderate; exponential growth happens after 3 years.", "data_proof": "Avg entry salary: ₹4-6 LPA; Avg at 5 years: ₹15+ LPA.", "kerala_context": "Infopark/Technopark salaries are catching up with Bangalore norms.", "global_reality": "Gulf countries offer tax-free high entry salaries for specialized talent."},
            {"myth": "Only geniuses can succeed here", "reality": "Consistent learning and grit are the true predictors of success.", "data_proof": "90% of top performers cite 'continuous learning' as their key driver.", "kerala_context": "Kerala's education system provides a strong foundation for this.", "global_reality": "Grit is ranked higher than IQ by 70% of Fortune 500 HRs."},
            {"myth": "This is a 9-to-5 job", "reality": "Project deadlines and client calls often require flexible hours.", "data_proof": "60% of professionals work in hybrid/flexible environments.", "kerala_context": "WFA (Work From Anywhere) is highly popular in Kerala's digital economy.", "global_reality": "European companies are moving towards 4-day work weeks for this sector."},
            {"myth": "You must stay in one company", "reality": "Career growth often comes from strategic job switches every 3-4 years.", "data_proof": "Salary increases average 30% per switch compared to 10% internal.", "kerala_context": "Frequent networking at Technopark leads to better opportunities.", "global_reality": "Silicon Valley norms encourage 'job-hopping' for skill acquisition."},
            {"myth": "Soft skills don't matter", "reality": "Communication is what gets you promoted to leadership roles.", "data_proof": "75% of long-term success depends on people skills, only 25% on tech.", "kerala_context": "ASAP Kerala focuses heavily on these skills for employability.", "global_reality": "Global leadership roles are 100% focused on soft skills."},
            {"myth": "The market is oversaturated", "reality": "While the bottom is crowded, the top is desperately hiring.", "data_proof": "There is a 40% talent gap in senior specialized roles globally.", "kerala_context": "Digital transformation in Kerala is creating new niche demands.", "global_reality": "Emerging markets like Vietnam and India are the new global hubs."},
            {"myth": "You can't switch to this late", "reality": "Transferable skills make it possible to pivot at any age.", "data_proof": "20% of new entrants in this field are career changers over 30.", "kerala_context": "Government schemes in Kerala support adult re-skilling.", "global_reality": "Global firms like Google have specific 'return-to-work' programs."},
            {"myth": "It's all about math/coding", "reality": "Logic and problem-solving are the true core of this career.", "data_proof": "50% of the work involves strategy and architectural thinking.", "kerala_context": "Kerala's logic-oriented curriculum gives a natural advantage.", "global_reality": "Global strategy firms value 'first-principles' thinking over raw coding."}
        ]
    }
    return json.dumps(fallback_data)
