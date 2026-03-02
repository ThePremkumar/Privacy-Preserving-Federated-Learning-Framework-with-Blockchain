# Step-by-Step Setup Guide

This guide provides instructions on how to set up and run the Federated Learning Healthcare Platform.

## 1. Backend Setup

The backend is built with FastAPI and handles federated learning orchestration, RBAC, and blockchain auditing.

### Prerequisites
- Python 3.10+
- Virtual Environment (venv)

### Installation & Run
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. (Optional) Create a virtual environment if not already present:
   ```powershell
   python -m venv venv
   ```
3. Activate the virtual environment:
   ```powershell
   # Windows
   .\venv\Scripts\activate
   ```
4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
5. Run the server (defaults to port 8001):
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
   ```

**Health Check URL:** [http://localhost:8001/api/v1/status/health](http://localhost:8001/api/v1/status/health)

---

## 2. Frontend Setup

The frontend is a Next.js application providing a high-tech dashboard for different roles.

### Prerequisites
- Node.js (v18+)
- npm

### Installation & Run
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

**App URL:** [http://localhost:3000](http://localhost:3000)

---

## 3. Default Credentials

Use these credentials to access the platform. Access levels are restricted based on roles.

### Super Admin (Full System Access)
- **Specialist ID**: `superadmin`
- **Secure Passcode**: `admin123`
- *Note: Restricted from viewing raw patient data for compliance.*

### Clinical Doctor (Medical Access)
- **Specialist ID**: `doctor_valerie`
- **Secure Passcode**: `doctorpassword123`
- *Note: Can view patients, predictions, and NLP insights.*

---

## 4. Role Permissions Matrix

| Module | Super Admin | Doctor | Hospital Admin |
| :--- | :---: | :---: | :---: |
| **Dashboard** | ✅ | ✅ | ✅ |
| **Patient Records** | ❌ (RBAC Restricted) | ✅ | ❌ |
| **Model Predictions** | ❌ | ✅ | ❌ |
| **NLP Clinical Notes** | ❌ | ✅ | ❌ |
| **Federated Training** | ✅ | ❌ | ✅ |
| **Blockchain Audit** | ✅ | ❌ | ✅ |
| **Model Health** | ✅ | ❌ | ❌ |

---

## 5. Troubleshooting

### Common Backend Errors

#### ❌ `Error: [Errno 13] Permission denied` (venv)
- **Cause**: This happens if you try to create/re-create the `venv` folder while it's currently active or the terminal is locking a file in that directory.
- **Fix**: Simply skip the `python -m venv venv` step if the folder already exists. Just run `.\venv\Scripts\activate` to start using it.

#### ❌ `ERROR: [WinError 10013] An attempt was made to access a socket...`
- **Cause**: Port `8000` is already being used by another process.
- **Fix (Option A - Force Close)**: Stop the process using that port by running this in PowerShell:
  ```powershell
  Stop-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess -Force
  ```
- **Fix (Option B - Change Port)**: Use a different port, such as `8001`:
  ```bash
  uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
  ```

#### ❌ `ModuleNotFoundError`
- **Cause**: A dependency is missing from your environment.
- **Fix**: Ensure your venv is active and run:
  ```bash
  pip install -r requirements.txt
  ```

### General Tips
- Ensure your terminal is running at the project root or the specific `frontend`/`backend` directory as indicated.
- For most Windows permission issues, try running your Terminal/PowerShell as **Administrator**.
