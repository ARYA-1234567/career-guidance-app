import glob

for py in glob.glob('backend/agents/*.py'):
    with open(py, 'r') as f:
        content = f.read()
    
    # Replace the old decommissioned model string with the latest Llama-3.3
    content = content.replace('llama3-70b-8192', 'llama-3.3-70b-versatile')
    
    with open(py, 'w') as f:
        f.write(content)

print("Models upgraded to llama-3.3-70b-versatile!")
