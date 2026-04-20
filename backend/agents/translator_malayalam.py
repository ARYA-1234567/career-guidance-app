import os
import requests
import base64
from typing import Dict, Optional

from dotenv import load_dotenv

load_dotenv()

SARVAM_API_KEY = os.getenv("SARVAM_API_KEY")

def translate_to_malayalam(text: str) -> str:
    """
    Translate English text to Malayalam using Sarvam AI Mayura:v1 model.
    """
    if not SARVAM_API_KEY:
        return text
        
    url = "https://api.sarvam.ai/translate"
    payload = {
        "input": text,
        "source_language_code": "en-IN",
        "target_language_code": "ml-IN",
        "model": "mayura:v1"
    }
    headers = {
        "api-subscription-key": SARVAM_API_KEY,
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(url, json=payload, headers=headers)
        if response.status_code == 200:
            return response.json().get('translated_text', text)
        else:
            print(f"Sarvam Translation Error: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Translation failure: {e}")
        
    return text

def speak_malayalam(text: str) -> Optional[str]:
    """
    Synthesize Malayalam text to speech using Sarvam AI Bulbul:v3 model.
    Returns base64 encoded audio or None on failure.
    """
    if not SARVAM_API_KEY:
        return None

    url = "https://api.sarvam.ai/text-to-speech"
    payload = {
        "input": text,
        "target_language_code": "ml-IN",
        "speaker": "meera", # Meera is a common female speaker for ML
        "model": "bulbul:v3",
        "speech_sample_rate": 24000
    }
    headers = {
        "api-subscription-key": SARVAM_API_KEY,
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(url, json=payload, headers=headers)
        if response.status_code == 200:
            return response.json().get('audios', [None])[0]
        else:
            print(f"Sarvam TTS Error: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"TTS failure: {e}")

    return None
