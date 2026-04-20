import os
import json
import logging
import re
from typing import List, Dict, Any, Optional

logging.basicConfig(
    filename='agents.log',
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("SelfAssessment")

# --- PHASE 1: DISCIPLINED BACKGROUND REGISTRY ---

WELCOME_Q = {
    "en": {
        "q": "Welcome. I am Careerbot, your AI Career Counselor 🎯 To give you the most accurate career guidance, I need to understand you better. First, which category best describes you?",
        "opt": "School Student | College Student | Post Graduate | Working Professional"
    },
    "ml": {
        "q": "സ്വാഗതം. ഞാൻ കരിയർബോട്ട്, നിങ്ങളുടെ ഐടി കരിയർ കൗൺസിലർ 🎯 നിങ്ങൾക്ക് ഏറ്റവും അനുയോജ്യമായ കരിയർ കണ്ടെത്താൻ ഞാൻ നിങ്ങളെ സഹായിക്കാം. ആദ്യം, നിങ്ങൾ ഏത് വിഭാഗത്തിലാണ് ഉൾപ്പെടുന്നത്?",
        "opt": "സ്കൂൾ വിദ്യാർത്ഥി | കോളേജ് വിദ്യാർത്ഥി | ബിരുദാനന്തര ബിരുദം | തൊഴിൽ പ്രൊഫഷണൽ"
    }
}

DEPT_MAP = {
    "en": {
        "medical": "MBBS | BDS | Nursing | Pharmacy | Physiotherapy | Life Sciences | Other",
        "engineering": "Computer Science / IT | Mechanical / Civil / Elec | Robotics / AI | Biotech | Other",
        "commerce": "B.Com / Finance | BBA / Management | Accounting | Economics | Other",
        "arts": "Literature | Fine Arts | Psychology | Sociology | Design / Media | Other",
        "other": "General Studies | Specialized Training | Vocational Course"
    },
    "ml": {
        "medical": "എം.ബി.ബി.എസ് | ബി.ഡി.എസ് | നഴ്സിംഗ് | ഫാർമസി | ഫിസിയോതെറാപ്പി | ലൈഫ് സയൻസസ് | മറ്റുള്ളവ",
        "engineering": "കമ്പ്യൂട്ടർ സയൻസ് / ഐടി | മെക്കാനിക്കൽ / സിവിൽ / ഇലക്ട്രിക്കൽ | റോബോട്ടിക്സ് / എഐ | ബയോടെക് | മറ്റുള്ളവ",
        "commerce": "ബി.കോം / ഫിനാൻസ് | ബി.ബി.എ / മാനേജ്‌മെന്റ് | അക്കൗണ്ടിംഗ് | ഇക്കണോമിക്സ് | മറ്റുള്ളവ",
        "arts": "ലിറ്ററേച്ചർ | ഫൈൻ ആർട്സ് | സൈക്കോളജി | സോഷ്യോളജി | ഡിസൈൻ / മീഡിയ | മറ്റുള്ളവ",
        "other": "ജനറൽ സ്റ്റഡീസ് | പ്രത്യേക പരിശീലനം | വൊക്കേഷണൽ കോഴ്സ്"
    }
}

PHASE_1_REGISTRY = {
    "en": {
        "school student": [
            {"id": 2, "q": "Which standard/class are you currently in?", "opt": "Class 8 | Class 9 | Class 10 | Class 11 | Class 12"},
            {"id": 3, "q": "Which board are you studying in?", "opt": "CBSE | ICSE | State Board | Other"}
        ],
        "college student": [
            {"id": 2, "q": "Which field best matches your study area?", "opt": "Engineering / Technology | Medical / Life Sciences | Commerce / Business | Arts / Humanities | Other"},
            {"id": 3, "q": "Which department/specialization are you in?", "opt": "DYNAMIC_DEPT"},
            {"id": 4, "q": "Which university are you studying in?", "opt": "Major University | Private College | State University | Other"},
            {"id": 5, "q": "What is your current CGPA or percentage?", "opt": "8.5+ (Outstanding) | 7.0 - 8.5 (Good) | 6.0 - 7.0 (Average) | Below 6.0"}
        ],
        "post graduate": [
            {"id": 2, "q": "What is your post graduation degree?", "opt": "MBA | M.Tech / MS | MA / M.Com | PhD | Other"},
            {"id": 3, "q": "Which department/specialization are you in?", "opt": "DYNAMIC_DEPT"},
            {"id": 4, "q": "Which university are you from?", "opt": "IIT / IIM | Central University | State University | Other"},
            {"id": 5, "q": "What is your current CGPA or percentage?", "opt": "8.5+ | 7.0 - 8.5 | 6.0 - 7.0 | Below 6.0"}
        ],
        "working professional": [
            {"id": 2, "q": "Which field best matches your work area?", "opt": "IT / Software | Finance / Banking | Healthcare | Manufacturing | Creative / Media | Education"},
            {"id": 3, "q": "Which company or institution are you currently working with?", "opt": "MNC / Corporate | Startup | Government Sector | Educational Institution | Self-Employed"},
            {"id": 4, "q": "What is your current role or job title?", "opt": "Junior / Entry Level | Mid-Level Manager | Senior Executive | Freelancer | Business Owner"},
            {"id": 5, "q": "What is your current salary / experience level?", "opt": "0-3 Years Exp | 3-7 Years Exp | 7-12 Years Exp | 12+ Years Exp"},
            {"id": 6, "q": "Why are you looking for a career switch right now?", "opt": "Better Salary | Passion / Interest | Work-Life Balance | Growth Opportunities | Boredom"}
        ]
    },
    "ml": {
        "school student": [
            {"id": 2, "q": "നിങ്ങൾ ഇപ്പോൾ പഠിക്കുന്നത് ഏത് ക്ലാസ്സിലാണ്?", "opt": "ക്ലാസ് 8 | ക്ലാസ് 9 | ക്ലാസ് 10 | ക്ലാസ് 11 | ക്ലാസ് 12"},
            {"id": 3, "q": "നിങ്ങളുടേത് ഏത് സിലബസ് ആണ്?", "opt": "സി.ബി.എസ്.ഇ | ഐ.സി.എസ്.ഇ | സ്റ്റേറ്റ് ബോർഡ് | മറ്റുള്ളവ"}
        ],
        "college student": [
            {"id": 2, "q": "നിങ്ങളുടെ പഠന മേഖല ഏതാണ്?", "opt": "എഞ്ചിനീയറിംഗ് / ടെക്നോളജി | മെഡിക്കൽ / ലൈഫ് സയൻസസ് | കൊമേഴ്‌സ് / ബിസിനസ് | ആർട്സ് / ഹ്യുമാനിറ്റീസ് | മറ്റുള്ളവ"},
            {"id": 3, "q": "നിങ്ങളുടെ ഡിപ്പാർട്ട്മെന്റ് ഏതാണ്?", "opt": "DYNAMIC_DEPT"},
            {"id": 4, "q": "നിങ്ങൾ ഏത് സർവകലാശാലയിലാണ് പഠിക്കുന്നത്?", "opt": "പ്രധാന സർവകലാശാല | പ്രൈവറ്റ് കോളേജ് | സ്റ്റേറ്റ് യൂണിവേഴ്സിറ്റി | മറ്റുള്ളവ"},
            {"id": 5, "q": "നിങ്ങളുടെ സീജിപിഎ അല്ലെങ്കിൽ ശതമാനം എത്രയാണ്?", "opt": "8.5+ (മികച്ച രീതിയിൽ) | 7.0 - 8.5 (നല്ല രീതിയിൽ) | 6.0 - 7.0 (ശരാശരി) | 6.0 ന് താഴെ"}
        ],
        "post graduate": [
            {"id": 2, "q": "നിങ്ങളുടെ ബിരുദാനന്തര ബിരുദം ഏതാണ്?", "opt": "എം.ബി.എ | എം.ടെക് / എം.എസ് | എം.എ / എം.കോം | പി.എച്ച്.ഡി | മറ്റുള്ളവ"},
            {"id": 3, "q": "നിങ്ങളുടെ ഡിപ്പാർട്ട്മെന്റ് ഏതാണ്?", "opt": "DYNAMIC_DEPT"},
            {"id": 4, "q": "നിങ്ങൾ ഏത് സർവകലാശാലയിൽ നിന്നാണ്?", "opt": "IIT / IIM | സെൻട്രൽ യൂണിവേഴ്സിറ്റി | സ്റ്റേറ്റ് യൂണിവേഴ്സിറ്റി | മറ്റുള്ളവ"},
            {"id": 5, "q": "നിങ്ങളുടെ സിജിപിഎ അല്ലെങ്കിൽ ശതമാനം എത്രയാണ്?", "opt": "8.5+ | 7.0 - 8.5 | 6.0 - 7.0 | 6.0 ന് താഴെ"}
        ],
        "working professional": [
            {"id": 2, "q": "നിങ്ങളുടെ തൊഴിൽ മേഖല ഏതാണ്?", "opt": "ഐടി / സോഫ്റ്റ്‌വെയർ | ഫിനാൻസ് / ബാങ്കിംഗ് | ഹെൽത്ത് കെയർ | മാനുഫാക്ചറിംഗ് | ക്രിയേറ്റീവ് / മീഡിയ | വിദ്യാഭ്യാസം"},
            {"id": 3, "q": "നിങ്ങൾ ഇപ്പോൾ എവിടെയാണ് ജോലി ചെയ്യുന്നത്?", "opt": "എംഎൻസി / കോർപ്പറേറ്റ് | സ്റ്റാർട്ടപ്പ് | ഗവണ്മെന്റ് സെക്ടർ | എഡ്യൂക്കേഷണൽ ഇൻസ്റ്റിറ്റ്യൂഷൻ | സെൽഫ്-എംപ്ലോയ്ഡ്"},
            {"id": 4, "q": "നിങ്ങളുടെ നിലവിലെ തസ്തിക അല്ലെങ്കിൽ ജോലി എന്താണ്?", "opt": "ജൂനിയർ / എൻട്രി ലെവൽ | മിഡ്-ലെവൽ മാനേജർ | സീനിയർ എക്സിക്യൂട്ടീവ് | ഫ്രീലാൻസർ | ബിസിനസ്സ് ഉടമ"},
            {"id": 5, "q": "നിങ്ങളുടെ പ്രവൃത്തിപരിചയം എത്രയാണ്?", "opt": "0-3 വർഷം എക്സ്പീരിയൻസ് | 3-7 വർഷം എക്സ്പീരിയൻസ് | 7-12 വർഷം എക്സ്പീരിയൻസ് | 12+ വർഷം എക്സ്പീരിയൻസ്"},
            {"id": 6, "q": "നിങ്ങൾ എന്തിനാണ് കരിയർ മാറ്റാൻ ആഗ്രഹിക്കുന്നത്?", "opt": "മെച്ചപ്പെട്ട ശമ്പളം | താല്പര്യം | വർക്ക്-ലൈഫ് ബാലൻസ് | വളർച്ചാ അവസരങ്ങൾ | ബോറടി"}
        ]
    }
}

DEEP_COUNSELOR_PROMPT = """
You are an ADVANCED EXPERT CAREER COUNSELOR. Conduct a deep, professional career assessment.
Every single response you provide MUST be between 1 and 3 lines max. 
Focus on being concise, conversational, and direct. Avoid long explanations unless specifically asked.
Your mission is to deeply understand the user's Skills, Interests, Expectations, and Lifestyle before recommending a career.

### CORE OPERATING RULES:
1. ACTIVE MEMORY: Check the entire chat history. NEVER repeat a question or ask about a domain that was already covered.
2. CONTEXTUAL CONTINUITY: Every next question MUST be directly influenced by the user's PREVIOUS answer.
3. PROGRESSION: Move quickly. If you asked about skills, move to interests. If you asked about interests, move to lifestyle.

### STRICT FORMATTING:
- PURE QUESTIONS ONLY: No insights.
- SEPARATOR: Use the pipe symbol | for options.
- INTERACTIVE CHIPS: You MUST provide clickable options for the user to proceed.
- RESPONSE FORMAT:
  [[QUESTION]] Your deep follow-up question.
  <<OPTIONS>> Option 1 | Option 2 | Option 3 <</OPTIONS>>
"""

def get_anchored_session_context(messages: List[Dict[str, str]]) -> Dict[str, Any]:
    anchor_idx = -1
    for i in range(len(messages) - 1, -1, -1):
        content = messages[i].get("content", "").lower()
        if messages[i].get("role") == "assistant" and "welcome" in content and "career" in content:
            anchor_idx = i
            break
    if anchor_idx == -1: return {"phase": "welcome"}
    session_msgs = messages[anchor_idx+1:]
    user_msgs = [m for m in session_msgs if m.get("role") == "user"]
    step_idx = len(user_msgs)
    if not user_msgs: return {"phase": "welcome"}
    category_raw = user_msgs[0].get("content", "").lower().strip()
    last_cat = "college student"
    if "school" in category_raw: last_cat = "school student"
    elif "post" in category_raw or "graduate" in category_raw: last_cat = "post graduate"
    elif "work" in category_raw or "prof" in category_raw: last_cat = "working professional"
    elif "college" in category_raw: last_cat = "college student"
    
    field_choice = "engineering"
    for m in user_msgs:
        content = m.get("content", "").lower()
        if "medical" in content: field_choice = "medical"
        elif "commerce" in content or "business" in content: field_choice = "commerce"
        elif "arts" in content or "humanities" in content: field_choice = "arts"
        elif "engineer" in content or "tech" in content: field_choice = "engineering"
            
    return {"phase": "diagnostic", "branch": last_cat, "step_idx": step_idx, "field_choice": field_choice}

def get_assessment_response_streaming(messages: List[Dict[str, str]], language: str = 'en'):
    ctx = get_anchored_session_context(messages)
    lang = language if language in ['en', 'ml'] else 'en'
    
    if ctx["phase"] == "welcome":
        welcome_data = WELCOME_Q[lang]
        yield f"[[QUESTION]]{welcome_data['q']}\n\n<<OPTIONS>>{welcome_data['opt']}<</OPTIONS>>"
        return

    branch = ctx["branch"]
    step = ctx["step_idx"]
    registry = PHASE_1_REGISTRY[lang].get(branch, [])
    
    if step <= len(registry):
        q_data = registry[step - 1]
        opts_raw = q_data['opt']
        if opts_raw == "DYNAMIC_DEPT":
            field = ctx.get("field_choice", "engineering")
            opts_raw = DEPT_MAP[lang].get(field, DEPT_MAP[lang]["engineering"])
        opts = f"\n\n<<OPTIONS>>{opts_raw}<</OPTIONS>>" if opts_raw else ""
        yield f"[[QUESTION]]{q_data['q']}{opts}"
        return

    from utils.groq_client import get_groq_streaming_chat_response
    
    lang_instruction = "IMPORTANT: Conduct this assessment in English."
    if lang == 'ml':
        lang_instruction = "IMPORTANT: നിങ്ങൾ ഈ സംഭാഷണം പൂർണ്ണമായും മലയാളത്തിൽ തന്നെ നടത്തണം. മലയാളം ലാംഗ്വേജ് മാത്രം ഉപയോഗിക്കുക."

    system_msg = f"{DEEP_COUNSELOR_PROMPT}\n\n{lang_instruction}"
    # Pass the ENTIRE message history so it never forgets what it already asked
    ai_msgs = [{"role": "system", "content": system_msg}] + messages
    
    full_response = ""
    try:
        for chunk in get_groq_streaming_chat_response(ai_msgs):
            full_response += chunk
            yield chunk
        conclusion_keys = ["farewell", "outcome", "report", "luck", "conclusion", "journey", "തീരുമാനം", "യാത്ര"]
        if any(k in full_response.lower() for k in conclusion_keys) and len(messages) > 12:
            yield "\nPROFILE_COMPLETE: {}"
    except Exception as e:
        logger.error(f"Assessment streaming failed: {e}")
        fallback_q = {
            "en": "[[QUESTION]] I'm experiencing a minor sync delay. Let's focus on your strengths: which of these best describes your approach to work? <<OPTIONS>> Analytical & Logic-driven | Creative & Artistic | People & Leadership | Practical & Hands-on <</OPTIONS>>",
            "ml": "[[QUESTION]] ചെറിയൊരു സാങ്കേതിക തടസ്സം നേരിട്ടു. നമുക്ക് നിങ്ങളുടെ കഴിവുകളിൽ ശ്രദ്ധ കേന്ദ്രീകരിക്കാം: താഴെ പറയുന്നവയിൽ ഏതാണ് നിങ്ങളെ നന്നായി വിവരിക്കുന്നത്? <<OPTIONS>> അനലിറ്റിക്കൽ & ലോജിക് | ക്രിയേറ്റീവ് & ആർട്ടിസ്റ്റിക് | ലീഡർഷിപ്പ് & മാനേജ്‌മെന്റ് | പ്രാക്ടിക്കൽ & ഹാൻഡ്‌സ്-ഓൺ <</OPTIONS>>"
        }
        yield fallback_q[lang]

# --- NEW: HIGH-FIDELITY PROFILER & MATCHER ---

def extract_profile_from_messages(messages: List[Dict[str, str]]) -> dict:
    from utils.groq_client import get_groq_response
    
    chat_text = "\n".join([f"{m['role']}: {m['content']}" for m in messages])
    
    system_prompt = """
    You are an EXPERT PSYCHOLOGICAL PROFILER.
    Analyze the chat history and extract a deep professional profile.
    
    Return valid JSON with these keys:
    - strengths: list of strings
    - hidden_talents: list of strings
    - skills: list of strings
    - interests: list of strings
    - values: list of strings
    - motivators: list of strings
    - career_goals: string
    - personality_summary: string
    """
    
    try:
        resp = get_groq_response(system_prompt, chat_text, is_json=True)
        try:
            return json.loads(resp.strip("` \n\t").replace("```json", "").replace("```", ""))
        except json.JSONDecodeError:
            return {"strengths": [], "interests": [], "category": "General", "analysis": "Stable generic trajectory."}
    except Exception as e:
        logger.error(f"Profiling failed: {e}")
        return {}

def match_careers_from_profile(profile: dict, language: str = 'en') -> dict:
    from utils.groq_client import get_groq_response
    import time
    
    # Sequential Breathing Gap to avoid Rate Limit competition with Profiler
    time.sleep(1.0)
    
    profile_json = json.dumps(profile)
    
    system_prompt = """
    You are a WORLD-CLASS CAREER MARKET ANALYST.
    Analyze the user profile and cross-match it with real-world global job markets.
    
    Return valid JSON ONLY in this format:
    {
      "careers": [
        {
          "career": "Name of Job",
          "reason": "Why this matches the user profile deeply",
          "feasibility": 0-100 score,
          "salary_range": "X-Y LPA",
          "local_demand": "High/Medium/Low",
          "quick_path": "One sentence growth outlook"
        }
      ]
    }
    
    Rules:
    - Provide exactly 10 unique, diverse career trajectories.
    - Mix core traditional roles with high-growth 'Moonshot' roles.
    """
    
    # Safety Fallback matches (Expanded to 10 for diversity)
    safety_matches = {
        "careers": [
            {"career": "AI Integration Specialist", "reason": "High technical adaptability.", "feasibility": 85, "salary_range": "8-25 LPA", "local_demand": "Very High", "quick_path": "Rapid IT growth."},
            {"career": "Strategic Management Consultant", "reason": "Leadership and analytical alignment.", "feasibility": 78, "salary_range": "12-30 LPA", "local_demand": "High", "quick_path": "Tier-1 corporate track."},
            {"career": "Creative Solutions Architect", "reason": "Problem-solving and creative mix.", "feasibility": 90, "salary_range": "6-18 LPA", "local_demand": "High", "quick_path": "Startup trajectory."},
            {"career": "Digital Transformation Expert", "reason": "Matches modern organizational shifts.", "feasibility": 82, "salary_range": "10-22 LPA", "local_demand": "High", "quick_path": "Enterprise consulting."},
            {"career": "Data Science Strategist", "reason": "Exploits analytical and logic-driven traits.", "feasibility": 75, "salary_range": "14-35 LPA", "local_demand": "Exponential", "quick_path": "Global tech leadership."},
            {"career": "Sustainability Director", "reason": "Ideal for value-driven leadership.", "feasibility": 70, "salary_range": "15-28 LPA", "local_demand": "Emerging", "quick_path": "ESG corporate sector."},
            {"career": "Product Innovation Manager", "reason": "Bridges the gap between tech and user needs.", "feasibility": 88, "salary_range": "11-26 LPA", "local_demand": "High", "quick_path": "Product management track."},
            {"career": "UX Psychological Analyst", "reason": "Uses behavioral traits for tech design.", "feasibility": 92, "salary_range": "7-19 LPA", "local_demand": "High", "quick_path": "Creative tech growth."},
            {"career": "Quantum Computing Consultant", "reason": "A high-intellect 'Moonshot' path.", "feasibility": 45, "salary_range": "25-60 LPA", "local_demand": "Emerging", "quick_path": "R&D future track."},
            {"career": "Cybersecurity Ethical Hacker", "reason": "Essential for security-conscious profiles.", "feasibility": 80, "salary_range": "9-24 LPA", "local_demand": "Universal", "quick_path": "High-security corporate role."}
        ]
    }
    
    try:
        # Try Primary High-Intelligence Model
        resp = get_groq_response(system_prompt, profile_json, is_json=True)
        if resp and "careers" in resp:
            try:
                return json.loads(resp.strip("` \n\t").replace("```json", "").replace("```", ""))
            except json.JSONDecodeError:
                return safety_matches
        return safety_matches
    except Exception as e:
        logger.warning(f"Primary matching failed: {e}. Attempting Failover...")
        try:
            # Try Failover Faster Model (llama-3.1-8b-instant is usually easier to hit)
            from groq import Groq
            client = Groq(api_key=os.getenv("GROQ_API_KEY"))
            failover_resp = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "system", "content": system_prompt}, {"role": "user", "content": profile_json}],
                temperature=0.15, response_format={"type": "json_object"}
            )
            try:
                return json.loads(failover_resp.choices[0].message.content.strip("` \n\t").replace("```json", "").replace("```", ""))
            except json.JSONDecodeError:
                return safety_matches
        except Exception as fe:
            logger.error(f"Global Matching Failure: {fe}. Returning Safety Matches.")
            return safety_matches

def get_assessment_response(messages: List[Dict[str, str]], language: str = 'en') -> str:
    return "[[QUESTION]] Tell me more. <<OPTIONS>> Next | Unsure <<OPTIONS>>"

def is_assessment_complete(messages: List[Dict[str, str]]) -> bool:
    if not messages: return False
    last_msg = messages[-1].get("content", "").lower()
    conclusion_keys = ["farewell", "outcome", "report", "luck", "conclusion", "journey"]
    return any(k in last_msg for k in conclusion_keys) and len(messages) > 12
