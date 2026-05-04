import requests

base = 'http://localhost:8001/api/v1'

# Test superadmin
r = requests.post(f'{base}/auth/login', json={'username': 'superadmin', 'password': 'changeme'})
print(f'superadmin login HTTP {r.status_code}')
if r.status_code == 200:
    token = r.json().get('access_token')
    me = requests.get(f'{base}/auth/me', headers={'Authorization': f'Bearer {token}'})
    print(f'superadmin /me HTTP {me.status_code}')
    d = me.json()
    print(f'  role: {d["role"]}, username: {d["username"]}')

print()

# Test himsr_node
r2 = requests.post(f'{base}/auth/login', json={'username': 'himsr_node', 'password': 'HIMSR@2026'})
print(f'himsr_node login HTTP {r2.status_code}')
if r2.status_code == 200:
    token2 = r2.json().get('access_token')
    me2 = requests.get(f'{base}/auth/me', headers={'Authorization': f'Bearer {token2}'})
    print(f'himsr_node /me HTTP {me2.status_code}')
    d2 = me2.json()
    print(f'  role: {d2["role"]}, username: {d2["username"]}')
    hosp = d2.get('hospital') or {}
    print(f'  hospital.name: {hosp.get("name")}')
    print(f'  hospital.short_name: {hosp.get("short_name")}')
    print(f'  hospital.logo_initials: {hosp.get("logo_initials")}')
    print(f'  hospital.city: {hosp.get("city")}, state: {hosp.get("state")}')
else:
    print(f'  Error: {r2.text}')
