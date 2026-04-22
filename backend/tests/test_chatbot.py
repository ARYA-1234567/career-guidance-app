import requests
import json

# Replace with your actual local or dev URL
BASE_URL = "http://localhost:8000"

def test_parent_chatbot():
    print("Testing Parent Chatbot Endpoint...")
    
    # We need a valid parent_access_id from the DB for this to work
    # For now, we'll just test the schema validation and basic auth handling
    payload = {
        "messages": [{"role": "user", "content": "How can I help my child?"}],
        "career_title": "Software Engineer",
        "active_section": "roadmap",
        "user_profile": {},
        "match_score": 90,
        "user_category": "Parent",
        "language": "en",
        "access_id": "PAR114787" # Using the ID from the user's screenshot
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/career-chatbot", json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Test FAILED: {e}")

if __name__ == "__main__":
    # This requires the server to be running locally
    # test_parent_chatbot()
    print("Test script ready. Run 'python tests/test_chatbot.py' when server is up.")
