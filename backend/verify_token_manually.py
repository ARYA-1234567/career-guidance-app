import os
from jose import jwt
import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from main import User, SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES

# Mock token generation
def create_test_token(email: str):
    expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode({"sub": email, "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")
    except Exception as e:
        return f"ERROR: {str(e)}"

# Test
email = "test@example.com"
token = create_test_token(email)
print(f"Generated Token for {email}: {token[:20]}...")
verified_email = verify_token(token)
print(f"Verified Email: {verified_email}")

if email == verified_email:
    print("SUCCESS: JWT logic is sound.")
else:
    print("FAIL: JWT logic mismatch.")
