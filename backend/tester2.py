import sys
import traceback
sys.path.append('c:\\Users\\aryam\\career_guidance\\backend')

try:
    from utils.genai_client import get_gemini_pro
    model = get_gemini_pro()
    model.generate_content('Hi')
    print("SUCCESS")
except Exception as e:
    with open('err.txt', 'w', encoding='utf-8') as f:
        f.write(traceback.format_exc())
    print("FAILED")
