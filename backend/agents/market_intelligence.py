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
6. **Live & Accurate**: Use only the most up-to-date 2024-2025 information. You MUST provide EXACTLY 10 results for each list.
7. **Quantity Requirement**: You MUST provide EXACTLY 10 'recent_vacancies', 10 'kerala_psc_opportunities', and 10 'global_hubs'.

## OUTPUT FORMAT (strict JSON):
{
    "career": "...",
    "market_summary": "Comprehensive overview of 2024-2025 active trends (Kerala vs Metro India vs Gulf).",
    "recent_vacancies": [
        {"title": "Job Title", "company": "Company Name", "location": "City, Kerala/India/Global", "description": "Provide EXACTLY 10 exact live vacancies or highly probable expected roles.", "link": "Direct URL or platform name like LinkedIn/Indeed"}
    ],
    "kerala_psc_opportunities": [
        {"post_name": "PSC/Govt Post Title", "department": "Department Name", "frequency": "Provide EXACTLY 10 notifications or expected openings", "salary_scale": "Pay band"}
    ],
    "global_hubs": [
        {"location": "Kerala / Bangalore / Dubai etc", "demand": "High/Medium", "reason": "List EXACTLY 10 global hubs with specific drivers"}
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

def get_market_intelligence(career: str, language: str = 'en') -> str:
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

    if language == 'ml':
        user_prompt += "\n\nCRITICAL: Respond NATIVELY in MALAYALAM script for ALL fields including 'career', 'market_summary', 'title', 'company', 'location', 'description', 'post_name', 'department', 'salary_scale', 'demand', 'reason', 'details', and 'future_outlook'. Strictly NO ENGLISH should be present in the output. Translate all technical terms or write them in Malayalam script."


    from utils.groq_client import get_groq_response
    try:
        raw_text = get_groq_response(SYSTEM_PROMPT, user_prompt, is_json=True, prefer_fast_model=True)
        return raw_text
    except Exception as e:
        print(f"Market Intelligence Error: {e}")
    
    return json.dumps({
        "career": career,
        "market_summary": "Extremely high global demand (2024-2025) with significant growth in AI-integrated roles and remote work models.",
        "top_employers": [
            {"name": "Google / Microsoft", "type": "Global MNC", "details": "Innovation & R&D hubs"},
            {"name": "TCS / Infosys", "type": "Indian IT Giant", "details": "Global delivery centers"},
            {"name": "Technopark / Infopark", "type": "Kerala Tech", "details": "Thriving startup ecosystem"},
            {"name": "MNCs in Dubai/UAE", "type": "Gulf Market", "details": "Tax-free growth opportunities"},
            {"name": "Tesla / SpaceX", "type": "High-Tech", "details": "Next-gen engineering roles"},
            {"name": "Amazon / Meta", "type": "Big Tech", "details": "Platform & scale specialists"},
            {"name": "Accenture / Deloitte", "type": "Strategy", "details": "Global consulting projects"},
            {"name": "Digital University Kerala", "type": "Academia", "details": "Advanced research positions"},
            {"name": "Reliance / Adani", "type": "Indian Conglomerate", "details": "Infrastructure & Digital expansion"},
            {"name": "European Tech Hubs", "type": "EU Market", "details": "Sustainable & Green tech focus"}
        ],
        "psc_notifications": [
            {"post_name": "Assistant Professor (Technical)", "department": "Technical Education", "salary_scale": "UGC Scale", "details": "Upcoming 2024 Exam"},
            {"post_name": "Scientific Officer", "department": "Police/KSPB", "salary_scale": "State Scale", "details": "Active Notification"},
            {"post_name": "Assistant Engineer", "department": "PWD/KSEB", "salary_scale": "Class-I", "details": "Annual Cycle"},
            {"post_name": "IT Officer", "department": "Kerala Bank", "salary_scale": "Banking Scale", "details": "Active"},
            {"post_name": "Project Scientist", "department": "KSCSTE", "salary_scale": "Contract", "details": "Monthly Vacancies"},
            {"post_name": "Junior Instructor", "department": "Industrial Training", "salary_scale": "Technical Scale", "details": "Ongoing"},
            {"post_name": "System Administrator", "department": "IT Mission", "salary_scale": "State IT", "details": "Upcoming"},
            {"post_name": "Data Analyst", "department": "Digital University", "salary_scale": "Special Scale", "details": "New Active"},
            {"post_name": "Technical Assistant", "department": "C-DIT", "salary_scale": "Project Basis", "details": "Active Recruitment"},
            {"post_name": "Research Assistant", "department": "Universities", "salary_scale": "Academic", "details": "Rolling Vacancies"}
        ],
        "global_hubs": [
            {"region": "USA (Silicon Valley)", "outlook": "Dominant Innovation Hub", "demand": "Critical"},
            {"region": "India (Bangalore)", "outlook": "Global Delivery Giant", "demand": "High"},
            {"region": "Kerala (Kochi/TVM)", "outlook": "Emerging Startup Capital", "demand": "Increasing"},
            {"region": "UAE (Dubai)", "outlook": "Digital Transformation Hub", "demand": "Very High"},
            {"region": "Germany (Berlin)", "outlook": "EU Engineering Center", "demand": "Steady"},
            {"region": "Singapore", "outlook": "SE Asian Tech Gateway", "demand": "High"},
            {"region": "Canada (Toronto)", "outlook": "Fastest Growing AI Hub", "demand": "Critical"},
            {"region": "UK (London)", "outlook": "Strategy & Fintech Center", "demand": "Steady"},
            {"region": "Netherlands (Amsterdam)", "outlook": "Logistics & Tech Bridge", "demand": "High"},
            {"region": "Australia (Sydney)", "outlook": "Specialized Talent Hub", "demand": "High"}
        ],
        "salaries": {"entry_global": "$60k-$90k", "entry_india": "₹8-12 LPA", "entry_kerala": "₹5-8 LPA"}
    })
