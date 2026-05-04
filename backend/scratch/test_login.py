import requests

def test_login():
    url = "http://localhost:8001/api/v1/auth/login"
    payload = {
        "username": "superadmin",
        "password": "changeme"
    }
    try:
        response = requests.post(url, json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_login()
