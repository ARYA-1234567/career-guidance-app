import json
import random

streams = ["Science", "Commerce", "Arts"]
locations = ["Urban", "Rural", "Coastal"]
backgrounds = ["First-Gen College Student", "Multigenerational", "Agricultural Background"]

# RIASEC Dimension Data
riasec_types = {
    "Realistic": {
        "interests": ["building hardware", "repairing vehicles", "outdoor activities", "robotics"],
        "strengths": ["practical problem solving", "tool operation", "physical coordination"],
        "careers": ["Mechanical Engineer", "Agricultural Technician", "Civil Engineer"],
    },
    "Investigative": {
        "interests": ["coding", "data analysis", "scientific research", "math puzzles"],
        "strengths": ["analytical thinking", "research", "logical reasoning"],
        "careers": ["Data Scientist", "Software Engineer", "Research Analyst"],
    },
    "Artistic": {
        "interests": ["design", "writing", "music", "UI/UX", "storytelling"],
        "strengths": ["creativity", "originality", "visual aesthetics"],
        "careers": ["UI/UX Designer", "Content Creator", "Architect"],
    },
    "Social": {
        "interests": ["teaching", "healthcare", "counseling", "community service"],
        "strengths": ["empathy", "communication", "coaching"],
        "careers": ["Nurse", "Teacher", "HR Specialist"],
    },
    "Enterprising": {
        "interests": ["business", "marketing", "debating", "event management"],
        "strengths": ["leadership", "persuasion", "public speaking"],
        "careers": ["Marketing Manager", "Entrepreneur", "Sales Director"],
    },
    "Conventional": {
        "interests": ["accounting", "data entry", "organizing events", "logistics"],
        "strengths": ["attention to detail", "organization", "accuracy"],
        "careers": ["Accountant", "Logistics Manager", "Quality Assurance Analyst"],
    }
}

def generate_profiles(count=100):
    profiles = []
    riasec_keys = list(riasec_types.keys())
    for i in range(count):
        primary_riasec = random.choice(riasec_keys)
        # Pick a secondary that is different
        secondary_riasec = random.choice([k for k in riasec_keys if k != primary_riasec])
        
        type_data1 = riasec_types[primary_riasec]
        type_data2 = riasec_types[secondary_riasec]
        
        profile = {
            "id": f"student_{i+1}",
            "stream": random.choice(streams),
            "location": random.choice(locations),
            "background": random.choice(backgrounds),
            "riasec_code": f"{primary_riasec[0]}{secondary_riasec[0]}",
            "interests": [random.choice(type_data1["interests"]), random.choice(type_data2["interests"])],
            "strengths": [random.choice(type_data1["strengths"]), random.choice(type_data2["strengths"])],
            "values": ["financial stability", "work-life balance", "social impact", "creative freedom", "career growth"][i % 5],
            "ground_truth_matches": [random.choice(type_data1["careers"]), random.choice(type_data2["careers"])]
        }
        profiles.append(profile)
    return profiles

if __name__ == "__main__":
    test_profiles = generate_profiles(100)
    with open("test_profiles.json", "w") as f:
        json.dump(test_profiles, f, indent=4)
    print("Generated 100 evaluation profiles in test_profiles.json")
