import os
from dotenv import load_dotenv

load_dotenv()

try:
    import google.generativeai as gai
    gai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    HAS_GENAI = True
except (ImportError, AttributeError):
    HAS_GENAI = False

def get_gemini_pro():
    if not HAS_GENAI: return None
    return gai.GenerativeModel("gemini-1.5-flash")

def get_gemini_flash():
    if not HAS_GENAI: return None
    return gai.GenerativeModel("gemini-1.5-flash")

def get_gemini_2_flash():
    if not HAS_GENAI: return None
    return gai.GenerativeModel("gemini-1.5-flash")
