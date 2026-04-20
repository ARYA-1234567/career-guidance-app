import sys
try:
    import google.generativeai as genai
    print(f"SUCCESS: Imported from {genai.__file__}")
    print(f"Version: {getattr(genai, '__version__', 'unknown')}")
except Exception as e:
    print(f"FAILED: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()

print("\nPython Path:")
for p in sys.path:
    print(f"  {p}")
