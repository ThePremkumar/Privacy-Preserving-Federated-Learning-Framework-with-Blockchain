with open('src/app/dashboard/patients/page.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if '/' in line and not ('</' in line or '/>' in line or '://' in line or '/*' in line or '//' in line):
        print(f"Potential regex start at line {i+1}: {line.strip()}")
