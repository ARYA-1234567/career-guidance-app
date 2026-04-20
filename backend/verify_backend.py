import requests
import json

API_BASE = "http://localhost:8000"

def test_auth_and_persistence():
    # 1. Signup
    print("Testing Signup...")
    signup_data = {
        "email": "test_verify@example.com",
        "password": "password123",
        "full_name": "Verification User"
    }
    res = requests.post(f"{API_BASE}/api/auth/signup", json=signup_data)
    if res.status_code != 200:
        print(f"Signup failed: {res.text}")
        # Could already exist, try login
    else:
        print("Signup Successful.")

    # 2. Login
    print("Testing Login...")
    login_data = {
        "username": "test_verify@example.com",
        "password": "password123"
    }
    res = requests.post(f"{API_BASE}/api/auth/login", data=login_data)
    if res.status_code != 200:
        print(f"Login failed: {res.text}")
        return
    token = res.json()["access_token"]
    print("Login Successful. Token received.")

    # 3. Save Profile
    print("Testing Profile Save...")
    sample_history = [
        {"role": "ai", "content": "Hello!"},
        {"role": "user", "content": "I am a student interested in Science and High Salary."}
    ]
    res = requests.post(
        f"{API_BASE}/api/profiles/save",
        json={"history": sample_history},
        headers={"Authorization": f"Bearer {token}"}
    )
    if res.status_code != 200:
        print(f"Profile Save failed: {res.text}")
        return
    print("Profile Save Successful.")

    # 4. Fetch Latest Profile
    print("Testing Profile Retrieval...")
    res = requests.get(
        f"{API_BASE}/api/profiles/latest",
        headers={"Authorization": f"Bearer {token}"}
    )
    if res.status_code != 200:
        print(f"Profile Retrieval failed: {res.text}")
        return
    
    data = res.json()
    print("Profile Retrieval Successful.")
    print(f"Retrieved Personality: {json.dumps(data['personality'], indent=2)[:200]}...")

    print("\nVERIFICATION COMPLETE: ALL BACKEND SYSTEMS OPERATIONAL.")

if __name__ == "__main__":
    test_auth_and_persistence()
