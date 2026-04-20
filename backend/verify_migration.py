import sys
import os
sys.path.append(os.getcwd())

from agents.roadmap import generate_roadmap
from agents.myth_buster import get_myth_buster_data

def test_migration():
    print("Testing Roadmap Agent...")
    try:
        roadmap = generate_roadmap("Data Scientist", {"strengths": ["Python", "Math"], "interests": ["AI"]})
        print("Roadmap Success!")
    except Exception as e:
        print(f"Roadmap FAILED: {e}")

    print("\nTesting Myth Buster Agent...")
    try:
        myths = get_myth_buster_data("Doctor")
        print("Myth Buster Success!")
    except Exception as e:
        print(f"Myth Buster FAILED: {e}")

if __name__ == "__main__":
    test_migration()
