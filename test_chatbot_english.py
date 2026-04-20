import os
import sys

# Ensure backend path is in sys.path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from agents.career_bot import get_career_bot_response

def test_chatbot():
    messages = [{"role": "user", "content": "\u0d0e\u0d28\u0d3f\u0d17\u0d4d\u0d15\u0d4d \u0d08 \u0d15\u0d30\u0d3f\u0d2f\u0d31\u0d3f\u0d28\u0d46 \u0d15\u0d41\u0d31\u0d3f\u0d1a\u0d4d\u0d1a\u0d4d \u0d15\u0d42\u0d1f\u0d41\u0d24\u0d32\u0d4d \u0d05\u0d31\u0d3f\u0d2f\u0d23\u0d2e\u0d46\u0d28\u0d4d\u0d28\u0d41\u0d23\u0d4d\u0d1f\u0d4d"}] # "I want to know more about this career" in Malayalam
    career = "Data Scientist"
    profile = {"interests": ["Math", "AI"], "strengths": ["Logic"]}
    
    print(f"Testing Chatbot with Malayalam input: {messages[0]['content']}")
    response = get_career_bot_response(
        messages=messages,
        career_title=career,
        active_section="default",
        user_profile=profile,
        match_score=90,
        user_category="Explorer"
    )
    print(f"\nAI Response:\n{response}")
    
    # Check if response contains Malayalam characters
    import re
    malayalam_range = re.compile(r'[\u0d00-\u0d7f]')
    if malayalam_range.search(response):
        print("\nFAILURE: Response contains Malayalam characters.")
    else:
        print("\nSUCCESS: Response is in English.")

if __name__ == "__main__":
    test_chatbot()
