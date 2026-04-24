import os
import json
import logging
from typing import Dict, Any, Optional
from tavily import TavilyClient

logger = logging.getLogger("Scholarships")

SYSTEM_PROMPT = """You are a Global Scholarship Specialist (Specialist in Kerala/India).
Your job is to provide specific, high-fidelity scholarship opportunities for the given career.
PRIORITIZE 2024/2025 deadlines and Kerala/Central Govt grants. 
You MUST provide a comprehensive list of EXACTLY 10 active scholarships and grants.
Ensure ALL data is live, accurate, and up-to-date for the 2024-2025 academic year.

## OUTPUT FORMAT (strict JSON):
{
    "scholarships": [
        {"name": "...", "provider": "...", "amount": "...", "eligibility": "...", "deadline": "...", "required_documents": ["Doc 1", "Doc 2"], "link": "..."}
    ]
}
"""

def get_scholarship_data(career_title: str, language: str = 'en') -> Dict[str, Any]:
    """
    Fetches real-time scholarships for a given career from Tavily and synthesizes them using Groq.
    Enhanced with resilience and language support.
    """
    fallback_data = {
        "scholarships": [
            {"name": "E-Grantz (Kerala Gov)", "provider": "Government of Kerala", "amount": "Varies", "eligibility": "SC/ST/OBC/EWS students in Kerala", "deadline": "Ongoing", "link": "https://egrantz.kerala.gov.in"},
            {"name": "DCE Scholarship (Kerala)", "provider": "Directorate of Collegiate Education", "amount": "₹10,000 - ₹15,000", "eligibility": "Meritorious students in Kerala", "deadline": "Oct-Nov", "link": "https://dcescholarship.kerala.gov.in"},
            {"name": "National Scholarship Portal (NSP)", "provider": "Central Govt of India", "amount": "Up to ₹50,000", "eligibility": "Merit-cum-Means for minority/professional students", "deadline": "Oct-Dec", "link": "https://scholarships.gov.in"},
            {"name": "INSPIRE Scholarship", "provider": "DST, Govt of India", "amount": "₹80,000/yr", "eligibility": "Top 1% in Class 12 (Science)", "deadline": "Sept-Oct", "link": "https://online-inspire.gov.in"},
            {"name": "Central Sector Scheme (CSS)", "provider": "Ministry of Education", "amount": "₹12,000 - ₹20,000", "eligibility": "Top 20th percentile in Class 12", "deadline": "Oct-Nov", "link": "https://scholarships.gov.in"},
            {"name": "Reliance Foundation Scholarship", "provider": "Reliance Foundation", "amount": "Up to ₹2,00,000", "eligibility": "Undergraduate students in India", "deadline": "Aug-Sept", "link": "https://scholarships.reliancefoundation.org"},
            {"name": "HDFC Badhte Kadam Scholarship", "provider": "HDFC Bank", "amount": "₹30,000 - ₹1,00,000", "eligibility": "General/Professional students in India", "deadline": "Sept-Oct", "link": "https://www.buddy4study.com"},
            {"name": "Tata Trust Scholarship", "provider": "Tata Trusts", "amount": "Varies", "eligibility": "Professional & Medical students", "deadline": "Sept-Nov", "link": "https://www.tatatrusts.org"},
            {"name": "Chevening Scholarship", "provider": "UK Government", "amount": "Full Funding", "eligibility": "Postgraduate students (Global)", "deadline": "Aug-Nov", "link": "https://www.chevening.org"},
            {"name": "Fullbright-Nehru Fellowship", "provider": "USIEF", "amount": "Full Funding", "eligibility": "Research/Masters (India to US)", "deadline": "May-July", "link": "https://www.usief.org.in"}
        ]
    }

    tavily_key = os.getenv("TAVILY_API_KEY")
    if not tavily_key:
        logger.warning("No TAVILY_API_KEY found, returning fallback scholarships.")
        return fallback_data

    try:
        tavily = TavilyClient(api_key=tavily_key)
        search_query = f"ACTIVE scholarships for {career_title} degree students in Kerala and India deadlines 2024 2025 apply online"
        
        # Get live data from web with advanced depth for precision
        try:
            search_result = tavily.search(query=search_query, search_depth="advanced", max_results=5)
            context = ""
            for res in search_result.get("results", []):
                context += f"Title: {res.get('title')}\nURL: {res.get('url')}\nContent: {res.get('content')}\n\n"
        except Exception as te:
            logger.warning(f"Tavily search failed: {te}. Using AI reasoning only.")
            context = "No live web results available. Use your internal knowledge of Indian/Global scholarships."

        from utils.groq_client import get_groq_response
        
        # Use centralized router with live web context
        user_msg = f"Career: {career_title}\nLanguage: {language}\n\nLive Web Search Context:\n{context}"
        
        # If in Malayalam, instruct AI separately
        current_system = SYSTEM_PROMPT
        if language == 'ml':
            current_system += "\nCRITICAL: Return JSON values (name, eligibility) in Malayalam where appropriate to translate, but keep URLs as is."

        raw_text = get_groq_response(current_system, user_msg, is_json=True)
        
        if not raw_text or "error" in raw_text.lower():
            return fallback_data
            
        try:
            result = json.loads(raw_text.strip("` \n\t").replace("```json", "").replace("```", ""))
            return result
        except json.JSONDecodeError:
            return fallback_data

    except Exception as e:
        logger.error(f"Scholarships Agent Error: {str(e)}")
        return fallback_data
