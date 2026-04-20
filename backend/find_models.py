import os
import sys
import google.generativeai as genai
from dotenv import load_dotenv

sys.path.append('c:\\Users\\aryam\\career_guidance\\backend')
load_dotenv()
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))

with open('models.txt', 'w', encoding='utf-8') as f:
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            f.write(m.name + '\n')
