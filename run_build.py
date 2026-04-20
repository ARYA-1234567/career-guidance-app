import subprocess
out = subprocess.run(['npm', 'run', 'build'], cwd='frontend', capture_output=True, text=True, shell=True)
print("STDOUT:", out.stdout)
print("STDERR:", out.stderr)
