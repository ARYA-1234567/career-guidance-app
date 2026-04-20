import sys
import traceback

sys.path.append('c:\\Users\\aryam\\career_guidance\\backend')
try:
    from utils.genai_client import get_gemini_pro
    model = get_gemini_pro()
    print("Model created.")
    resp = model.generate_content("Hi")
    print("Response:")
    print(resp.text)
except Exception as e:
    print("ERROR:")
    traceback.print_exc()
