import requests

try:
    r = requests.post(
        'http://localhost:8001/api/v1/auth/login',
        json={'username': 'superadmin', 'password': 'superadmin123'},
        timeout=5
    )
    print(f'Status: {r.status_code}')
    if r.status_code == 200:
        data = r.json()
        print('Login OK!')
        print('Token type:', data.get('token_type'))
        user = data.get('user', {})
        print('Role:', user.get('role'))
        print('Username:', user.get('username'))
    else:
        print('Error:', r.text[:400])
except Exception as e:
    print('Connection error:', e)
