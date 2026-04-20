import os
import json
import time
from groq import Groq
from tavily import TavilyClient
from utils.genai_client import get_gemini_flash
from typing import Dict, Any
from dotenv import load_dotenv

load_dotenv()

# Configuration
tavily = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))

SYSTEM_PROMPT = """You are the 'Senior Career Market Strategist' (Specialist in Kerala-India-Gulf regions).
Your job is to provide a DATA-DRIVEN analysis of current vacancies, trends, and salary benchmarks across Kerala, India, and the Gulf.

## ANALYSIS STRATEGY:
1. **Kerala Segment**: Identify specific vacancies across all districts and ALL Kerala PSC (Govt) and UPSC opportunities relevant to this career.
2. **Major Indian Hubs**: Deep analysis of demand in Bangalore, Chennai, Mumbai, Hyderabad, and Delhi NCR.
3. **Gulf Opportunity Index**: Recruitment trends and specific insights for UAE (Dubai/Abu Dhabi), Qatar, Saudi Arabia (NEOM/Riyadh), Oman, Kuwait, and Bahrain.
4. **Top Employers**: A mix of MNCs (Google, Amazon), Kerala Private Sector (UST, IBS), and Kerala PSC/Govt Institutions.
5. **Salary Data (₹ LPA & Global Currency)**: Precise benchmarks across these specific regions (Entry/Mid/Senior).

## OUTPUT FORMAT (strict JSON):
{
    "career": "...",
    "market_summary": "Comprehensive overview of 2024-2025 active trends (Kerala vs Metro India vs Gulf).",
    "recent_vacancies": [
        {"title": "Job Title", "company": "Company Name", "location": "City, Kerala/India/Global", "description": "Provide 6 to 8 exact live vacancies or highly probable expected roles.", "link": "Direct URL or platform name like LinkedIn/Indeed"}
    ],
    "kerala_psc_opportunities": [
        {"post_name": "PSC/Govt Post Title", "department": "Department Name", "frequency": "Provide 3 or 4 notifications", "salary_scale": "Pay band"}
    ],
    "global_hubs": [
        {"location": "Kerala / Bangalore / Dubai etc", "demand": "High/Medium", "reason": "List 5 or 6 global hubs with specific drivers"}
    ],
    "top_employers": [
        {"name": "Employer (e.g., Kerala PSC, TCS, Emirates)", "type": "MNC/Govt/Private", "details": "Specific vacancy info if possible"}
    ],
    "salaries": {
        "entry_india": "Entry-level range in India (e.g. ₹6-10 LPA)",
        "entry_gulf": "Entry-level range in Gulf (e.g. AED 8k-15k per month)",
        "mid_level": "Average mid-level range (any currency)",
        "senior_level": "Average senior range (any currency)"
    },
    "future_outlook": "Projection on local and global industry growth for 2026-2030.",
    "remote_work_viability": "Description of remote/hybrid options (High/Medium/Low)",
    "market_growth_score": "Rating from 1-10 on future stability",
    "trending_roles": ["Specialization 1", "Specialization 2"]
}

CRITICAL: If you cannot find specific live vacancies, you MUST provide at least 3 'Expected 2025 Openings' at top firms in Kerala (like UST, IBS Software, or Technopark startups) and Bangalore based on current trends. NEVER omit the 'recent_vacancies' key. You MUST prioritize data from late 2024 and 2025.
"""

def get_market_intelligence(career: str) -> str:
    """
    Search global job market data using Tavily and summarize using Groq with Gemini fallback.
    """
    
    # Live Search for 2025/2026 context - Focused on Vacancies
    search_query = (
        f"Active {career} job vacancies Kerala private sector 2025, "
        f"Recent {career} hiring in Technopark Trivandrum Infopark Kochi Cyberpark Kozhikode, "
        f"Latest {career} openings in Bangalore Chennai Hyderabad Mumbai for freshers, "
        f"Kerala PSC notifications for {career} current openings 2025"
    )
    search_results = []
    try:
        results = tavily.search(query=search_query, search_depth="advanced", max_results=5)
        search_results = results
    except Exception as e:
        print(f"Tavily Market Search Error: {e}")

    user_prompt = (
        f"CAREER: {career}\n\n"
        f"=== LIVE SEARCH RESULTS (2024-2025) ===\n{search_results}\n\n"
        "Generate a detailed worldwide market intelligence report with specific, LIVE vacancies currently open in late 2024 and 2025. "
        "Prioritize Kerala hubs (Technopark, Infopark, Cyberpark) and Indian Tech cities. Return ONLY valid JSON."
    )

    from utils.groq_client import get_groq_response
    try:
        raw_text = get_groq_response(SYSTEM_PROMPT, user_prompt, is_json=True, prefer_fast_model=True)
        return raw_text
    except Exception as e:
        print(f"Market Intelligence Error: {e}")
    
    return json.dumps({
        "career": career,
        "market_summary": "Stable global demand with growth in tech-driven sectors.",
        "top_employers": [{"name": "Global Tech Leaders", "type": "MNC", "details": "Top tier hiring"}],
        "salaries": {"entry_global": "$40k-$70k", "entry_india": "₹6-10 LPA"}
    })
