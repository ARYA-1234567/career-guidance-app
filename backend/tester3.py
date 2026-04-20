import sys
import traceback
import google.generativeai as genai
from dotenv import load_dotenv
import os

sys.path.append('c:\\Users\\aryam\\career_guidance\\backend')
load_dotenv()
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))

try:
    print("Testing gemini-2.5-flash")
    resp = genai.GenerativeModel('models/gemini-2.5-flash').generate_content('hi')
    print("Success:", repr(resp.text))
except Exception as e:
    print("FAIL 2.5-flash")

try:
    print("Testing gemini-2.0-flash")
    resp = genai.GenerativeModel('models/gemini-2.0-flash').generate_content('hi')
    print("Success:", repr(resp.text))
except Exception as e:
    print("FAIL 2.0-flash")
