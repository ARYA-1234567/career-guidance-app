import os, glob

def replace_in_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Generic Replacements
    content = content.replace('import google.generativeai as genai', 'from groq import Groq')
    content = content.replace('genai.configure(api_key=os.getenv("GEMINI_API_KEY"))', '')
    content = content.replace('api_key = os.getenv("GEMINI_API_KEY")', 'api_key = os.getenv("GROQ_API_KEY")')
    content = content.replace('"your_gemini"', '"your_groq"')
    content = content.replace('PRO_MODEL = "gemini-1.5-pro"', '')
    content = content.replace('FLASH_MODEL_20 = "gemini-2.0-flash"', '')
    
    # 1. Chat flow in self_assessment:
    if "start_chat(history=[])" in content:
        # Self assessment
        old_try_block = """        model = genai.GenerativeModel(
            model_name=PRO_MODEL,
            system_instruction=SYSTEM_PROMPT
        )
        chat = model.start_chat(history=[])
        response = chat.send_message(messages[-1]["content"])
        return response.text"""
        new_try_block = """        client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        m = [{"role": "system", "content": SYSTEM_PROMPT}] + messages[:]
        response = client.chat.completions.create(model="llama3-70b-8192", messages=m)
        return response.choices[0].message.content"""
        content = content.replace(old_try_block, new_try_block)
    else:
        # Base model blocks
        old_try_block = """        model = genai.GenerativeModel(
            model_name=PRO_MODEL,
            system_instruction=SYSTEM_PROMPT
        )
        prompt = f"""
        new_try_block = """        client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        prompt = f"""
        content = content.replace(old_try_block, new_try_block)
        
        # For career matcher which used FLASH
        old_flash = """        model = genai.GenerativeModel(
            model_name=FLASH_MODEL_20,
            system_instruction=SYSTEM_PROMPT
        )
        prompt = f"""
        content = content.replace(old_flash, new_try_block)
        
        # Replace response generation
        content = content.replace('response = model.generate_content(prompt)\\n        return response.text', 'response = client.chat.completions.create(model="llama3-70b-8192", messages=[{"role": "system", "content": SYSTEM_PROMPT}, {"role": "user", "content": prompt}])\\n        return response.choices[0].message.content')
        
    with open(filepath, 'w') as f:
        f.write(content)

for py in glob.glob('backend/agents/*.py'):
    replace_in_file(py)
print("Groq Integration Complete!")
