import os
import json
import logging
from typing import Dict, Any, Optional
from tavily import TavilyClient

logger = logging.getLogger("Scholarships")

SYSTEM_PROMPT = """You are a Global Scholarship Specialist (Specialist in Kerala/India).
Your job is to provide specific, high-fidelity scholarship opportunities for the given career.
PRIORITIZE 2024/2025 deadlines and Kerala/Central Govt grants. 
You MUST provide a comprehensive list of at least 6 to 8 active scholarships and grants.

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
            {
                "name": "E-Grantz (Kerala Gov)",
                "provider": "Government of Kerala",
                "amount": "Varies by specific course",
                "eligibility": "For SC/ST/OBC and economically weaker section students pursuing professional degrees.",
                "link": "https://egrantz.kerala.gov.in"
            },
            {
                "name": "National Scholarship Portal (NSP)",
                "provider": "Central Government of India",
                "amount": "Up to ₹50,000 / year",
                "eligibility": "Merit-cum-Means scholarship for professional and technical courses.",
                "link": "https://scholarships.gov.in"
            }
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
