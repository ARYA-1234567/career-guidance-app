import os
import json
import sys

# Ensure backend path is in sys.path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from agents.market_intelligence import get_market_intelligence

def test_market():
    career = "Software Engineer"
    print(f"Testing Market Intelligence for: {career}")
    response = get_market_intelligence(career)
    try:
        data = json.loads(response)
        print(json.dumps(data, indent=2))
        vacancies = data.get('recent_vacancies', [])
        if vacancies:
            print(f"\nSUCCESS: Found {len(vacancies)} vacancies.")
        else:
            print("\nWARNING: No vacancies found.")
    except Exception as e:
        print(f"\nERROR Parsing JSON: {e}")
        print("Raw Response:", response)

if __name__ == "__main__":
    test_market()
