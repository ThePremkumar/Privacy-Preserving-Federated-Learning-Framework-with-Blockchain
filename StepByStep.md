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
- *Note: Global control over all nodes, users, and training.*

### System Admin (Registry Management)
- **Specialist ID**: `admin`
- **Secure Passcode**: `admin123`
- *Note: Can manage hospital node registries and training monitoring.*

### Hospital Node (Local Node Admin)
- **Specialist ID**: `hospital`
- **Secure Passcode**: `hospital123`
- *Note: Can register doctors to their specific node and manage local data.*

### Clinical Doctor (Medical Access)
- **Specialist ID**: `doctor_valerie`
- **Secure Passcode**: `doctorpassword123`
- *Note: Can view patient predictions, anomalies, and NLP insights.*

---

## 4. Role Permissions Matrix

| Module | Super Admin | Admin | Hospital Node | Doctor |
| :--- | :---: | :---: | :---: | :---: |
| **Manage Hospitals** | ✅ | ✅ | ❌ | ❌ |
| **Manage Users** | ✅ | ❌ | ✅ (Doctors only) | ❌ |
| **Federated Training** | ✅ | ✅ | ✅ | ❌ |
| **Blockchain Audit** | ✅ | ✅ | ✅ | ❌ |
| **Patient Predictions** | ❌ | ❌ | ❌ | ✅ |
| **Anomalies & NLP** | ❌ | ❌ | ❌ | ✅ |
| **Global Analytics** | ✅ | ✅ | ❌ | ❌ |

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

#### ❌ `OperationalError: no such column: hospitals.zip_code`
- **Cause**: The database schema in `db_models.py` was updated but the physical `app.db` file is out of date.
- **Fix**: Run the following command to manually add the column:
  ```powershell
  python -c "import sqlite3; conn=sqlite3.connect('app.db'); conn.cursor().execute('ALTER TABLE hospitals ADD COLUMN zip_code TEXT'); conn.commit(); conn.close()"
  ```

### General Tips
- **Organization Onboarding**: When registering new hospitals, ensure you include the **Zip/Pin Code**. This allows for localized training and better node grouping in future updates.
- **Node Monitoring**: Use the "Essential Details" toggle/view in the Organization Management dashboard for a high-density view of all network participants.
- **Interactive Map**: The Network Map (`/dashboard/network-map`) uses Leaflet.js. If you encounter issues with marker positions, ensure your browser has WebGL and hardware acceleration enabled.
- **Paginated Data**: The platform uses high-performance pagination for hospital and user lists. If data isn't appearing as expected, check the "Items Per Page" settings or use the search filters.
- Ensure your terminal is running at the project root or the specific `frontend`/`backend` directory as indicated.
- For most Windows permission issues, try running your Terminal/PowerShell as **Administrator**.
