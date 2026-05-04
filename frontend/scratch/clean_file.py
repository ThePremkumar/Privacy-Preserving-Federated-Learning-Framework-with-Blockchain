import os

path = 'src/app/dashboard/patients/page.tsx'
with open(path, 'rb') as f:
    content = f.read()

# Replace common weird characters or just filter for printable ASCII + common whitespace
cleaned = content.replace(b'\xef\xbb\xbf', b'') # Remove BOM
try:
    text = cleaned.decode('utf-8')
except UnicodeDecodeError:
    text = cleaned.decode('latin-1')

# Write back as clean UTF-8
with open(path, 'w', encoding='utf-8') as f:
    f.write(text)

print("File cleaned and rewritten as UTF-8.")
