import os
import json
import logging
import re
from typing import List, Dict
from groq import Groq


logger = logging.getLogger("GroqRouter")

def get_groq_response(system_prompt: str, user_prompt: str, is_json: bool = True, prefer_fast_model: bool = False) -> str:
    """
    Robust Groq API router.
    Attempts multiple models in sequence to bypass daily token exhaustion limits.
    """
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY is missing from environment")

    client = Groq(api_key=api_key)
    
    # Global priority list for reliability
    models = [
        "llama-3.3-70b-versatile",
        "llama-3.1-8b-instant",
        "gemma2-9b-it",
        "llama-3.2-3b-preview",
        "mixtral-8x7b-32768",
        "llama3-70b-8192",
        "llama3-8b-8192"
    ]
    
    if prefer_fast_model:
        # Move lighter, faster models to the top
        models = [m for m in ["llama-3.1-8b-instant", "llama-3.2-3b-preview", "gemma2-9b-it"] if m in models] + [m for m in models if m not in ["llama-3.1-8b-instant", "llama-3.2-3b-preview", "gemma2-9b-it"]]
    
    response = None
    last_error = None
    
    import time
    for model_name in models:
        for attempt in range(2): # Total 2 attempts per model
            try:
                sys_content = system_prompt
                if is_json:
                    sys_content += "\n\nCRITICAL: Always respond in valid JSON ONLY. Do not wrap in markdown blocks."
                    
                response = client.chat.completions.create(
                    model=model_name,
                    messages=[
                        {"role": "system", "content": sys_content},
                        {"role": "user", "content": user_prompt}
                    ],
                    temperature=0.15,
                    max_tokens=3000,
                    timeout=20.0 # Standard timeout
                )
                raw_text = response.choices[0].message.content.strip()
                
                # Clean JSON strictly
                if is_json:
                    if "```json" in raw_text:
                        raw_text = raw_text.split("```json")[1].split("```")[0].strip()
                    elif "```" in raw_text:
                        raw_text = raw_text.split("```")[1].split("```")[0].strip()
                    # Aggressively strip any <think>...</think> reasoning blocks
                    raw_text = re.sub(r'<think>.*?</think>', '', raw_text, flags=re.DOTALL).strip()
                        
                return raw_text
                
            except Exception as e:
                err_str = str(e)
                if "429" in err_str or "rate" in err_str.lower():
                    # Daily token limits are non-retryable for the same model
                    if "tokens per day" in err_str.lower():
                        logger.warning(f"TPD Exhausted on {model_name}. Jumping to next node.")
                        break # Break out of attempts, try next model
                    
                    # Extract wait time
                    match = re.search(r"try again in (?:(\d+)m)?([\d\.]+)s", err_str)
                    wait_time = 2.0 * (attempt + 1) # Exponential growth
                    if match:
                        mins = int(match.group(1)) if match.group(1) else 0
                        secs = float(match.group(2))
                        wait_time = (mins * 60) + secs
                    
                    if wait_time > 15.0 and attempt == 0:
                        logger.warning(f"Extreme rate limit on {model_name} ({wait_time}s). Skipping to next...")
                        break
                    
                    logger.warning(f"Rate limited on {model_name} (Attempt {attempt+1}). Waiting {wait_time:.1f}s...")
                    time.sleep(wait_time + 0.1)
                    continue # Try next attempt
                else:
                    last_error = err_str
                    # Handle Payload Too Large (413)
                    if "413" in err_str:
                        user_prompt = user_prompt[:len(user_prompt)//2] + " [TRUNCATED]"
                        continue
                    
                    logger.warning(f"Model {model_name} failed: {e}. Skipping...")
                    break # Try next model
            
    # If we exit the loop and have no response
    logger.error(f"All Groq models failed. Last error: {last_error}")
    raise Exception(f"All AI routing nodes failed: {last_error}")

def get_groq_chat_response(messages: List[Dict[str, str]], is_json: bool = False) -> str:
    """
    Robust Groq API router for CHAT (multi-turn).
    Sends the full message history to the AI.
    """
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY is missing from environment")

    client = Groq(api_key=api_key)
    
    # TURBO-CHARGE: Prioritize speed for Vercel/Render timeouts
    models = [
        "llama-3.1-8b-instant",      # Fast for assessment/chat
        "llama-3.2-3b-preview",      # Extremely fast backup
        "gemma2-9b-it",
        "mixtral-8x7b-32768",
        "llama-3.3-70b-versatile",   # Higher intelligence, but slower
    ]
    
    import time
    last_error = None
    
    for model_name in models:
        try:
            # SPEED-FIRST COMPLETER
            response = client.chat.completions.create(
                model=model_name,
                messages=messages,
                temperature=0.7,
                max_tokens=600,   # Keep it concise for speed
                timeout=8.0       # Strict timeout to fail-over fast
            )
            raw_text = response.choices[0].message.content.strip()
            
            # Remove <think>...</think> reasoning blocks
            raw_text = re.sub(r'<think>.*?</think>', '', raw_text, flags=re.DOTALL).strip()
            
            if is_json:
                if "```json" in raw_text:
                    raw_text = raw_text.split("```json")[1].split("```")[0].strip()
                elif "```" in raw_text:
                    raw_text = raw_text.split("```")[1].split("```")[0].strip()
                    
            logger.info(f"Chat response from {model_name}: {len(raw_text)} chars")
            return raw_text
            
        except Exception as e:
            err_str = str(e)
            logger.warning(f"Model {model_name} failed: {err_str[:200]}")
            
            if "429" in err_str or "rate" in err_str.lower():
                # Check if it's a daily token exhaustion (can't retry same model)
                if "tokens per day" in err_str.lower() or "day" in err_str.lower():
                    logger.warning(f"TPD exhausted on {model_name}, moving to next...")
                    continue
                
                # Extract wait time and do a short sleep before next model
                wait_match = re.search(r"try again in (?:(\d+)m)?([\d\.]+)s", err_str)
                if wait_match:
                    mins = int(wait_match.group(1)) if wait_match.group(1) else 0
                    secs = float(wait_match.group(2))
                    wait_secs = (mins * 60) + secs
                    if wait_secs <= 20.0:
                        logger.info(f"Rate limit on {model_name}, waiting {wait_secs}s...")
                        time.sleep(wait_secs + 0.5)
                        # Retry same model once
                        try:
                            response = client.chat.completions.create(
                                model=model_name,
                                messages=messages,
                                temperature=0.4,
                                max_tokens=1500,
                                timeout=45.0
                            )
                            raw_text = response.choices[0].message.content.strip()
                            raw_text = re.sub(r'<think>.*?</think>', '', raw_text, flags=re.DOTALL).strip()
                            if is_json and "```json" in raw_text:
                                raw_text = raw_text.split("```json")[1].split("```")[0].strip()
                            return raw_text
                        except:
                            pass
                    else:
                        logger.warning(f"Wait too long ({wait_secs}s) for {model_name}, skipping...")
                continue
            else:
                last_error = err_str
                continue
            
    logger.error(f"Chat routing failed. Last error: {last_error}")
    raise Exception(f"Chat AI routing nodes failed: {last_error}")

def get_groq_streaming_chat_response(messages: List[Dict[str, str]]):
    """
    Generator for streaming chat responses from Groq with fallback support.
    """
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY is missing from environment")

    client = Groq(api_key=api_key)
    
    # Production streaming models in priority order for maximum stability
    models = [
        "llama-3.1-8b-instant",       # Fast and generous limits
        "llama-3.3-70b-versatile",    # Primary intelligence
        "gemma2-9b-it",
        "llama-3.2-3b-preview",
        "mixtral-8x7b-32768",
        "llama3-70b-8192",
    ]
    
    for model_name in models:
        try:
            completion = client.chat.completions.create(
                model=model_name,
                messages=messages,
                temperature=0.2,
                max_tokens=800,
                stream=True,
                timeout=30.0
            )
            
            for chunk in completion:
                content = chunk.choices[0].delta.content
                if content:
                    yield content
            
            # Successfully finished the stream
            return

        except Exception as e:
            logger.warning(f"Streaming failed on {model_name}: {str(e)[:100]}. Trying next node...")
            last_error = str(e)
            continue
            
    logger.error(f"Global Streaming Failure: {last_error}")
    yield "\n\n⚠️ **Neural Link Overloaded**\nI'm currently experiencing high network latency due to rate limits. Please wait **1 minute**, then summarize your last thought to continue our session."
    return
