import sys
import os
import json
import asyncio

# Add project root to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from agents.career_twin import generate_career_twin
from agents.career_simulation import simulate_career_growth

async def test_new_modules():
    career = "Software Architect"
    profile = {
        "traits": ["Creative", "Analytical", "Leader"],
        "interests": ["System Design", "Cloud Computing", "AI"],
        "strengths": ["Python", "Scalability", "Problem Solving"],
        "category": "STEM"
    }
    
    print("\n--- Testing Career Twin ---")
    try:
        twin_res = generate_career_twin(career, profile)
        print("Success! Career Twin generated.")
        print(json.dumps(json.loads(twin_res), indent=2)[:500] + "...")
    except Exception as e:
        print(f"FAILED: Career Twin - {e}")

    print("\n--- Testing Career Simulation ---")
    try:
        sim_res = simulate_career_growth(career, profile)
        print("Success! Career Simulation generated.")
        print(json.dumps(json.loads(sim_res), indent=2)[:500] + "...")
    except Exception as e:
        print(f"FAILED: Career Simulation - {e}")

if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()
    asyncio.run(test_new_modules())
