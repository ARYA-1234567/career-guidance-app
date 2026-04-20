import sys
sys.path.append('c:\\Users\\aryam\\career_guidance\\backend')
from agents.self_assessment import get_assessment_response

messages = [
    {"role": "user", "content": "I am a high school student."},
    {"role": "ai", "content": "1. Option One\n2. Option Two\n3. Option Three\n4. Something else!"},
    {"role": "user", "content": "I choose Option Two."}
]

print(get_assessment_response(messages))
