import os
import json
from typing import Dict, Any
from tavily import TavilyClient

SYSTEM_PROMPT = """You are a World-Class Career Strategist (Gemini Agent 3.0) specializing in '1:1 Neural Alignment' between personality and trajectory.

Your job is to match a student's profile to the TOP 10 highest-fidelity career paths in the world that DIRECTLY reflect their expressed interests.

## MATCHING METHODOLOGY (60/40 Interest-Fidelity Split):
1. **The Moonshots (Interest-Led)**: Identify 5 advanced, high-growth global trajectories. 
   - CRITICAL: These MUST be direct evolutions of the student's interests (e.g., if they like 'Drawing', suggest 'Lead XR Designer' or 'Industrial Product Strategist', NOT generic 'Blockchain').
2. **The Safety Nets (Contextual)**: Identify 5 prestigious and stable careers within the Indian/Kerala context that allow the user to utilize their core strengths.

## MATCHING CRITERIA:
- **Neural Interest Correlation (60%)**: Every result must have a clear "Interest Anchor."
- **Skill Aptitude (20%)**: Feasibility based on their expressed strengths.
- **Economic Potential (20%)**: High-paying, stable trajectories within that specific domain.

## CROSS-IMPACT ANALYSIS:
Your "why_matches" field MUST explain the synergy between disparate traits. 
Example: "Combined your interest in 'Music' with your skill in 'Mathematics' to suggest 'Acoustic AI Researcher'—a high-growth field in 2026."

## OUTPUT FORMAT (STRICT JSON):
{
    "matches": [
        {
            "career": "Specific Job Title",
            "category": "Global Moonshot" OR "Local Stability",
            "reason": "Explicit reference to traits/interests from the profile.",
            "feasibility": 85,
            "salary_range": "₹X-Y LPA",
            "local_demand": "High",
            "hubs": ["Global Remote", "Bangalore", "Kochi", "Dubai"],
            "why_matches": "One personalized 'Cross-Impact' sentence linking user profile to market demand."
        }
    ]
}
"""


from typing import List

def get_deterministic_fallback(interests: List[str]) -> Dict[str, Any]:
    """Provides a high-quality fallback mapping 40+ interests to accurate careers."""
    mapping = {
        # Tech & Engineering
        "ai": {"career": "AI Systems Architect", "salary": "₹15-45 LPA", "hubs": ["Bangalore", "San Francisco"]},
        "robotics": {"career": "Robotics Process Lead", "salary": "₹12-35 LPA", "hubs": ["Electronic City", "Munich"]},
        "coding": {"career": "Full Stack Architect", "salary": "₹8-30 LPA", "hubs": ["Infopark", "Hyderabad"]},
        "data": {"career": "Data Science Strategist", "salary": "₹10-40 LPA", "hubs": ["Bangalore", "London"]},
        
        # Medical & Science
        "medicine": {"career": "Specialist Surgeon / Digital Health", "salary": "₹12-60 LPA", "hubs": ["Kochi", "Dubai"]},
        "nursing": {"career": "Global Healthcare Manager", "salary": "₹6-15 LPA", "hubs": ["Kochi", "London", "Dublin"]},
        "psychology": {"career": "Neural UX Researcher", "salary": "₹8-22 LPA", "hubs": ["Remote", "Mumbai"]},
        "biology": {"career": "Bio-Tech Research Scientist", "salary": "₹10-30 LPA", "hubs": ["Hyderabad", "Boston"]},
        
        # Creative & Arts
        "design": {"career": "Product UX Lead", "salary": "₹9-25 LPA", "hubs": ["Pune", "Global Remote"]},
        "drawing": {"career": "Industrial Concept Artist", "salary": "₹8-20 LPA", "hubs": ["Bangalore", "Tokyo"]},
        "music": {"career": "Acoustic AI Researcher", "salary": "₹12-30 LPA", "hubs": ["Mumbai", "Berlin"]},
        "fashion": {"career": "Sustainable Apparel Strategist", "salary": "₹8-18 LPA", "hubs": ["Mumbai", "Paris"]},
        "acting": {"career": "XR Performance Capture Artist", "salary": "₹10-35 LPA", "hubs": ["Hyderabad", "LA"]},
        
        # Law, Service & Humanities
        "law": {"career": "International Cyber-Law Expert", "salary": "₹15-40 LPA", "hubs": ["Delhi", "Geneva"]},
        "teaching": {"career": "EdTech Curriculum Architect", "salary": "₹8-20 LPA", "hubs": ["Remote", "Dubai"]},
        "social work": {"career": "NGO Strategy Consultant", "salary": "₹6-15 LPA", "hubs": ["Geneva", "Delhi"]},
        "history": {"career": "Digital Heritage Archivist", "salary": "₹7-15 LPA", "hubs": ["Museums", "London"]},
        "sports": {"career": "Sports Analytics Lead", "salary": "₹10-25 LPA", "hubs": ["Manchester", "Mumbai"]},
        
        # Business & Finance
        "business": {"career": "E-commerce Growth Founder", "salary": "₹10-50 LPA", "hubs": ["Dubai", "Singapore"]},
        "finance": {"career": "Algorithmic Wealth Manager", "salary": "₹18-45 LPA", "hubs": ["Mumbai", "New York"]},
        "marketing": {"career": "Brand Growth Architect", "salary": "₹9-22 LPA", "hubs": ["Bangalore", "Amsterdam"]}
    }
    
    matches = []
    # Find up to 3 specific matches
    for inter in interests:
        key = inter.lower().strip()
        if key in mapping:
            match = mapping[key].copy()
            match.update({
                "category": "Global Moonshot",
                "reason": f"Aligned with your deep focus on {inter}.",
                "feasibility": 92,
                "local_demand": "High",
                "why_matches": "Direct neural alignment between demonstrated interests and high-growth market demand."
            })
            matches.append(match)
            if len(matches) >= 5: break
            
    # Add generic high-growth fallbacks to reach 10
    generic = [
        {"career": "Data Scientist", "category": "Global Moonshot", "salary": "₹12-40 LPA", "reason": "Universal high-demand trajectory."},
        {"career": "Blockchain Architect", "category": "Global Moonshot", "salary": "₹18-55 LPA", "reason": "Future-proof financial systems."},
        {"career": "Cybersecurity Expert", "category": "Local Stability", "salary": "₹10-30 LPA", "reason": "Critical infrastructure protection."},
        {"career": "Sustainable Energy Lead", "category": "Global Moonshot", "salary": "₹15-35 LPA", "reason": "Green transition leadership."},
        {"career": "Civil Services (IAS/IPS)", "category": "Local Stability", "salary": "₹7-15 LPA", "reason": "Prestigious administrative authority."}
    ]
    
    for g in generic:
        if len(matches) >= 10: break
        g.update({
            "feasibility": 88,
            "local_demand": "Very High",
            "hubs": ["Bangalore", "TVM", "Global Remote"],
            "why_matches": "High-fidelity stability match based on universal personality vectors."
        })
        matches.append(g)
        
    return {"matches": matches, "is_fallback": True}

def match_careers(profile_data: Dict[str, Any]) -> str:
    """
    Match personality profile using Search-Augmented Generation (RAG).
    """
    from utils.groq_client import get_groq_response
    tavily = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))
    
    try:
        # Step 1: Perform Global Industry Search
        raw_interests = profile_data.get("interests")
        if not raw_interests or not isinstance(raw_interests, list):
            raw_interests = ["Technology", "Modern Job Markets"]
        
        interests = ", ".join([str(i) for i in raw_interests])
        search_query = f"Futuristic and stable careers globally for someone interested in {interests}"
        search_context = ""
        try:
            results = tavily.search(query=search_query, search_depth="basic", max_results=3)
            for res in results.get("results", []):
                search_context += f"Trend: {res.get('content')}\n"
        except Exception as se:
            print(f"SEARCH FALLBACK: {se}")
            search_context = "Market Trend: Rising demand for AI, Sustainability, and Cross-platform development."

        # Step 2: Build Enhanced Prompt
        traits = ", ".join([str(t) for t in profile_data.get("traits", ["Adaptable"])])
        skills = ", ".join([str(s) for s in profile_data.get("skills", profile_data.get("strengths", ["Learning aptitude"]))])
        values = ", ".join([str(v) for v in profile_data.get("values", ["Growth"])])
        analysis = profile_data.get("analysis", "The user is highly adaptable with a focus on modern job markets.")
        
        prompt = (
            f"PERSONALITY PROFILE:\n"
            f"Traits: {traits}\n"
            f"Interests: {interests}\n"
            f"Skills: {skills}\n"
            f"Values/Motivators: {values}\n"
            f"Deep Psychological Analysis: {analysis}\n\n"
            f"LIVE WORLDWIDE CONTEXT:\n{search_context}\n\n"
            "Now follow your 50/50 matching methodology to generate 10 careers (5 Global, 5 Local)."
        )
        
        raw_text = get_groq_response(SYSTEM_PROMPT, prompt, is_json=True)
        return raw_text
        
    except Exception as e:
        print(f"FAIL: Career Matcher - {str(e)}")
        # CRITICAL: Trigger Deterministic Fallback instead of error JSON
        interests = profile_data.get("interests", ["Technology", "Growth"])
        fallback = get_deterministic_fallback(interests)
        return json.dumps(fallback)
