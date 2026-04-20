import ast
import os
import builtins
import glob

def get_imported_names(tree):
    names = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                names.add(alias.asname or alias.name.split('.')[0])
        elif isinstance(node, ast.ImportFrom):
            if node.module:
                for alias in node.names:
                    names.add(alias.asname or alias.name)
    return names

def check_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        src = f.read()
    try:
        tree = ast.parse(src)
    except Exception as e:
        print(f"Syntax error in {filepath}: {e}")
        return

    imported_names = get_imported_names(tree)
    builtin_names = set(dir(builtins))
    # Add common globals typically injected or safe for this app scope
    safe_globals = {'__name__', '__file__', 'print', 'BaseModel', 'Any', 'Dict', 'List', 'Optional', 'app'}

    for node in ast.walk(tree):
        if isinstance(node, ast.Name) and isinstance(node.ctx, ast.Load):
            name = node.id
            if name not in imported_names and name not in builtin_names and name not in safe_globals:
                # To be less noisy, we ignore variables that might be assigned locally 
                # This is a naive check; full static resolution needs pyflakes.
                pass

print("Starting deep static analysis...")
try:
    import pyflakes.api
    import pyflakes.reporter
    import sys
    for f in glob.glob("backend/**/*.py", recursive=True):
        if hasattr(pyflakes.api, 'checkPath'):
            pyflakes.api.checkPath(f)
except ImportError:
    print("Installing pyflakes to perform true static analysis...")
    os.system("pip install pyflakes > nul")
    import pyflakes.api
    for f in glob.glob("backend/**/*.py", recursive=True):
        pyflakes.api.checkPath(f)
print("Analysis complete.")
