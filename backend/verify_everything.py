import sys
import os
sys.path.append(os.getcwd())

from agents.roadmap import generate_roadmap
from agents.myth_buster import get_myth_buster_data
from agents.skill_gap import analyze_skill_gap
from agents.college_lookup import get_universities_for_career
from agents.scholarships import get_scholarship_data
from agents.market_intelligence import get_market_intelligence

def test_everything():
    career = "AI Engineer"
    profile = {"category": "College Student", "strengths": ["Python", "Math"], "interests": ["AI"]}
    
    modules = [
        ("Roadmap", lambda: generate_roadmap(career, profile)),
        ("Myths", lambda: get_myth_buster_data(career)),
        ("Skill Gap", lambda: analyze_skill_gap(career, profile)),
        ("Schools", lambda: get_universities_for_career(career)),
        ("Scholarships", lambda: get_scholarship_data(career)),
        ("Job Market", lambda: get_market_intelligence(career))
    ]

    for name, func in modules:
        print(f"Testing {name} Module...")
        try:
            result = func()
            print(f"{name} Success (Parsed Length: {len(str(result))})")
        except Exception as e:
            print(f"{name} FAILED: {e}")

if __name__ == "__main__":
    test_everything()
