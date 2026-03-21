# 🏥 Privacy-Preserving Federated Learning Healthcare Platform

**Enterprise SaaS Platform for Secure Healthcare AI with Blockchain Audit Trails**

A comprehensive production-ready federated learning system that enables collaborative AI training across hospitals while maintaining patient data privacy through differential privacy and providing blockchain-based audit trails for HIPAA-like compliance.

---

## 🚀 Production Status: Fully Operational

| Service | URL | Stack |
|---------|-----|-------|
| 🖥️ **Backend API** | http://localhost:8001 | FastAPI + SQLAlchemy + JWT |
| 🌐 **Frontend** | http://localhost:3000 | Next.js + TypeScript + Tailwind |
| 📚 **API Docs** | http://localhost:8001/docs | Interactive Swagger UI |

### Quick Start
```bash
# 1. Backend
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload

# 2. Frontend
cd frontend
npm install
npm run dev

# 3. Open http://localhost:3000
```

---

## 🔁 Core Workflow: Federated Learning Pipeline

The platform implements a complete **federated learning lifecycle** where hospitals train locally, submit results for review, and administrators aggregate approved models into a global model.

```
                    ┌──────────────────────────────────────────────────────────┐
                    │               FEDERATED LEARNING PIPELINE               │
                    └──────────────────────────────────────────────────────────┘

  🏥 HOSPITAL NODE                    👨‍💼 ADMIN / SUPER ADMIN                🌐 GLOBAL MODEL
  ─────────────────                   ─────────────────────                  ──────────────

  ┌─────────────┐     ┌──────────┐     ┌──────────────┐     ┌───────────┐     ┌──────────────┐
  │ Upload CSV  │────▶│  Train   │────▶│   Submit     │────▶│  Review   │────▶│  Aggregate   │
  │ Dataset     │     │  Model   │     │   for Review │     │  Approve/ │     │  FedAvg      │
  │             │     │  Locally │     │              │     │  Reject   │     │  Global Model│
  └─────────────┘     └──────────┘     └──────────────┘     └───────────┘     └──────────────┘
        │                  │                                      │                  │
        ▼                  ▼                                      ▼                  ▼
   SHA-256 Hash       Accuracy &                            Review Notes       Blockchain Hash
   Blockchain         Loss Metrics                          Audit Trail        Recorded On-Chain
```

### Step-by-Step Flow

| Step | Actor | Action | Result |
|------|-------|--------|--------|
| **1** | 🏥 Hospital | Upload CSV dataset | Data stored in DB, SHA-256 hash generated |
| **2** | 🏥 Hospital | Start local training | Model trained (50 epochs, ε=1.0 DP noise), accuracy & loss computed |
| **3** | 🏥 Hospital | Submit for review | Training job status → `submitted`, visible to admins |
| **4** | 👨‍💼 Admin | Review & approve/reject | Training job status → `approved` or `rejected` with notes |
| **5** | 👑 Super Admin | Aggregate approved jobs | FedAvg weighted averaging → global model updated |
| **6** | ⛓️ System | Record on blockchain | Immutable integrity hash stored on-chain |

---

## 🏗️ Architecture Overview

### System Design
```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         HEALTHCONNECT PLATFORM                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────┐                  │
│  │                   FRONTEND (Next.js)                   │                  │
│  │                                                        │                  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │                  │
│  │  │  Super   │ │  Admin   │ │ Hospital │ │  Doctor  │ │                  │
│  │  │  Admin   │ │Dashboard │ │   Node   │ │Dashboard │ │                  │
│  │  │Dashboard │ │          │ │Dashboard │ │          │ │                  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ │                  │
│  └────────────────────────────────────────────────────────┘                  │
│                              │ Axios + JWT                                    │
│  ┌────────────────────────────────────────────────────────┐                  │
│  │                  BACKEND (FastAPI)                      │                  │
│  │                                                        │                  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │                  │
│  │  │   Auth   │ │ Training │ │   Data   │ │ Federated│ │                  │
│  │  │  Service │ │  Service │ │  Upload  │ │  Service │ │                  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ │                  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │                  │
│  │  │Blockchain│ │    DP    │ │   NLP    │ │ Synthetic│ │                  │
│  │  │ Service  │ │ Service  │ │ Service  │ │Data Svc  │ │                  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ │                  │
│  └────────────────────────────────────────────────────────┘                  │
│                              │ SQLAlchemy                                     │
│  ┌────────────────────────────────────────────────────────┐                  │
│  │                DATABASE (SQLite / PostgreSQL)           │                  │
│  │                                                        │                  │
│  │  users │ hospitals │ training_jobs │ aggregation_rounds │                  │
│  │  dataset_uploads │ dataset_records │ audit_logs         │                  │
│  └────────────────────────────────────────────────────────┘                  │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Key Technologies

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Next.js 14, TypeScript, Tailwind CSS | Responsive RBAC dashboards |
| **Backend** | FastAPI, Python 3.8+ | REST API, async processing |
| **Database** | SQLAlchemy + SQLite (dev) / PostgreSQL (prod) | Persistent data storage |
| **Auth** | JWT (PyJWT + jose), bcrypt | Token-based authentication |
| **ML** | PyTorch, NumPy, Scikit-learn | Federated model training |
| **Privacy** | Custom DP Service (Gaussian mechanism) | Differential privacy |
| **Blockchain** | Web3.py, Ethereum (mock in dev) | Immutable audit trails |
| **NLP** | Custom NLP Service | Clinical note analysis |
| **Charts** | Recharts | Convergence visualization |

---

## 🎯 User Roles & Access Control (RBAC)

### Login Credentials

| Role | Username | Password | Dashboard |
|------|----------|----------|-----------|
| 👑 **Super Admin** | `superadmin` | `changeme` | Platform Governance, Model Governance, Aggregation |
| 👨‍💼 **Admin** | *(created by super admin)* | *(set at creation)* | Organizations, Model Review, Network Monitor |
| 🏥 **Hospital Node** | `hospital_node1` | `test1234` | Data Upload, Training, Model Participation |
| 🩺 **Doctor** | `Harish Raj` | `Harish` | Patients Registry, Diagnostics, Clinical Docs |

### Permission Matrix

| Permission | Super Admin | Admin | Hospital | Doctor |
|-----------|:-----------:|:-----:|:--------:|:------:|
| Manage Organizations (CRUD) | ✅ | ✅ | ❌ | ❌ |
| Edit Organization Details | ✅ | ✅ | ❌ | ❌ |
| Toggle Org Active/Inactive | ✅ | ✅ | ❌ | ❌ |
| Create Admin Users | ✅ | ❌ | ❌ | ❌ |
| Create Hospital Nodes | ✅ | ✅ | ❌ | ❌ |
| Create Doctors | ❌ | ❌ | ✅ | ❌ |
| Upload CSV Data | ❌ | ❌ | ✅ | ❌ |
| Start Local Training | ❌ | ❌ | ✅ | ❌ |
| Submit for Review | ❌ | ❌ | ✅ | ❌ |
| Review Training Jobs | ✅ | ✅ | ❌ | ❌ |
| Aggregate Global Model | ✅ | ❌ | ❌ | ❌ |
| View Aggregation History | ✅ | ✅ | ❌ | ❌ |
| View Network Monitor | ✅ | ✅ | ❌ | ❌ |
| View Model Participation | ❌ | ❌ | ✅ | ❌ |
| Run AI Predictions | ❌ | ❌ | ❌ | ✅ |
| Register Patients (Vitals + Docs) | ❌ | ❌ | ❌ | ✅ |
| Upload Medical Reports (PDF) | ❌ | ❌ | ❌ | ✅ |
| View Prediction History | ❌ | ❌ | ❌ | ✅ |
| NLP Clinical Note Analysis | ❌ | ❌ | ❌ | ✅ |

---

## 📁 Project Structure

### Backend
```
backend/
├── app/
│   ├── main.py                    # FastAPI application entry point
│   ├── core/
│   │   ├── config.py              # Settings, DP config, model config
│   │   ├── database.py            # SQLAlchemy engine & session
│   │   ├── db_models.py           # All SQLAlchemy models
│   │   ├── security.py            # JWT, bcrypt, audit logger
│   │   ├── dependencies.py        # Auth dependencies (get_current_user, require_role)
│   │   └── rbac.py                # Role definitions & permissions
│   ├── api/
│   │   ├── auth.py                # Login, register users/hospitals, update hospitals
│   │   ├── training.py            # Training lifecycle (start → review → aggregate)
│   │   ├── data_upload.py         # CSV upload & storage
│   │   ├── federated.py           # Federated learning rounds
│   │   ├── blockchain.py          # Blockchain audit endpoints
│   │   ├── admin.py               # Admin operations
│   │   ├── hospital.py            # Hospital operations
│   │   ├── doctor.py              # Doctor operations
│   │   ├── patients.py            # Patient management
│   │   └── predictions.py         # AI predictions
│   ├── services/
│   │   ├── auth_service.py        # Authentication (SQLAlchemy-backed)
│   │   ├── federated_service.py   # FedAvg engine
│   │   ├── blockchain_service.py  # Blockchain (mock in dev)
│   │   ├── dp_service.py          # Differential privacy (Gaussian noise)
│   │   ├── nlp_service.py         # NLP clinical note analysis
│   │   └── synthetic_data_service.py  # Synthetic data generation
│   ├── data/
│   │   ├── healthcare_trainer.py  # HealthcareMLP model & training
│   │   ├── healthcare_preprocessor.py # Auto column detection & preprocessing
│   │   ├── dataloader.py          # PyTorch DataLoader utilities
│   │   └── run_training.py        # Standalone training script
│   └── models/
│       ├── federated.py           # FederatedModel wrapper (PyTorch)
│       ├── healthcare_models.py   # Medical ML models
│       └── lstm.py                # LSTM architecture
├── data/
│   └── healthcare_dataset.csv     # Sample dataset (55,500 records)
├── requirements.txt
└── .env
```

### Frontend
```
frontend/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Landing page (Features, How it Works, Security)
│   │   ├── layout.tsx             # Root layout
│   │   ├── login/page.tsx         # Login page
│   │   └── dashboard/
│   │       ├── page.tsx           # Role-specific dashboard
│   │       ├── data-upload/       # CSV upload + training (Hospital)
│   │       ├── federated/         # Model participation / Network monitor
│   │       ├── model-governance/  # Review & aggregate (Admin/SuperAdmin)
│   │       ├── model-health/      # Model health monitoring
│   │       ├── organizations/     # Hospital management (CRUD, edit, toggle status)
│   │       ├── admin-management/  # Admin user management
│   │       ├── doctor-management/ # Doctor management (Hospital)
│   │       ├── patients/          # Patient records
│   │       ├── predictions/       # AI predictions (Doctor)
│   │       ├── prediction-history/# Prediction history & analytics
│   │       ├── nlp/               # NLP clinical note analysis
│   │       ├── anomalies/         # Anomaly detection alerts
│   │       ├── blockchain/        # Blockchain audit trail
│   │       ├── compliance/        # Compliance & security
│   │       ├── reports/           # Reports & analytics
│   │       ├── audit-logs/        # Audit logs
│   │       └── settings/          # System settings
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx        # RBAC-aware sidebar navigation
│   │   │   └── Topbar.tsx         # Top navigation bar
│   │   ├── guards/
│   │   │   └── RoleGuard.tsx      # Role-based route protection
│   │   └── ui/                    # Reusable UI components
│   ├── hooks/
│   │   └── useAuth.ts            # Authentication hook
│   └── lib/
│       └── api.ts                # Axios instance with JWT interceptor
├── package.json
└── tailwind.config.ts
```

---

## 📡 API Reference

### Authentication
```http
POST /api/v1/auth/login                    # Login (returns JWT tokens)
GET  /api/v1/auth/me                       # Get current user info
POST /api/v1/auth/register                 # Register new user
POST /api/v1/auth/register-hospital        # Register new hospital node
PUT  /api/v1/auth/hospitals/{hospital_id}  # Update hospital details (admin+)
GET  /api/v1/auth/users                    # List all users (admin+)
GET  /api/v1/auth/hospitals                # List all hospitals (admin+)
```

### Data Upload
```http
POST /api/v1/data/upload-csv              # Upload CSV file (hospital)
GET  /api/v1/data/uploads                 # List upload history (hospital)
```

### Training Lifecycle
```http
POST /api/v1/training/analyze-csv          # Analyze CSV columns (hospital/admin)
POST /api/v1/training/start                # Start local training (hospital)
GET  /api/v1/training/training-report/{id} # Get detailed training report
POST /api/v1/training/{id}/submit-for-review  # Submit for admin review (hospital)
GET  /api/v1/training/my-jobs              # List own training jobs (hospital)
GET  /api/v1/training/pending-reviews      # List pending reviews (admin+)
POST /api/v1/training/{id}/review          # Approve/reject training (admin+)
GET  /api/v1/training/all-jobs             # List all training jobs (admin+)
POST /api/v1/training/aggregate            # FedAvg aggregation (super_admin)
GET  /api/v1/training/aggregation-history  # Aggregation round history (admin+)
```

### Federated Learning
```http
POST /api/v1/fl/start-round              # Start new FL round (admin+)
POST /api/v1/fl/submit-update            # Submit model weights (hospital)
GET  /api/v1/fl/status                   # Get round status
GET  /api/v1/fl/history                  # Get round history
GET  /api/v1/fl/latest-model             # Get global model info
```

### Patient Management
```http
POST /api/v1/patients/                  # Register new patient (vitals + notes)
GET  /api/v1/patients/                  # List hospital patients
GET  /api/v1/patients/{id}              # Get detailed patient clinical file
POST /api/v1/patients/{id}/upload-report # Upload medical PDF/scan to record
```

### Predictions & AI Analysis
```http
POST /api/v1/predictions/run            # Run AI disease prediction
POST /api/v1/predictions/analyze-note   # Run NLP clinical note analysis
GET  /api/v1/predictions/               # Fetch all clinical diagnostic history
GET  /api/v1/predictions/anomalies      # Get high-risk clinical alerts
```

### Interactive Documentation
- **Swagger UI**: http://localhost:8001/docs
- **ReDoc**: http://localhost:8001/redoc

---

## 🗄️ Database Schema

### Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `users` | All platform users | id, username, email, password_hash, role, hospital_id |
| `hospitals` | Registered hospital nodes | id, name, contact_email, address, is_active |
| `dataset_uploads` | CSV upload metadata | id, filename, hospital_id, record_count, sha256_hash |
| `dataset_records` | Individual CSV rows | id, upload_id, row_index, data (JSON) |
| `training_jobs` | Local training runs | id, hospital_id, upload_id, status, epochs, accuracy, loss, weights_hash, model_weights |
| `aggregation_rounds` | Global model aggregation | id, round_number, global_accuracy, global_loss, blockchain_tx_hash |
| `audit_logs` | Access and action logs | id, user_id, action, resource, details, timestamp |

### Training Job Status Flow
```
pending → training → completed → submitted → approved → aggregated
                                           ↘ rejected
```

---

## 🔒 Security & Privacy

### Authentication
- **JWT Tokens**: Access tokens with configurable expiry (7 days default)
- **bcrypt**: Secure password hashing
- **HTTP Bearer**: Standard bearer token authentication
- **Role-based guards**: Server & client-side route protection

### Differential Privacy
| Parameter | Default | Description |
|-----------|---------|-------------|
| `epsilon (ε)` | 1.0 | Privacy budget per round |
| `delta (δ)` | 1e-5 | Failure probability |
| `max_budget` | 10.0 | Maximum cumulative privacy budget |
| `noise_scale` | 0.1 | Gaussian noise multiplier |
| `clipping_norm` | 1.5 | Gradient clipping boundary |

### Blockchain Audit
- **Development**: Mock blockchain service (in-memory transaction storage)
- **Production**: Ethereum-based smart contracts via Web3.py
- Every aggregation round generates a **SHA-256 hash** of the global model weights
- Transaction hash is stored on-chain for tamper-proof verification

---

## 🏥 Healthcare Features

### Compliance
- HIPAA-like audit trails with complete access logging
- Privacy budget enforcement with automated tracking
- **Clinical Data Registry**: Structured vital signs (BP, Sugar, HR, Temp) + Symptoms + History
- **Multi-File Support**: Secure storage for clinical datasets (CSV) and medical reports (PDF/JPG)
- Hospital-level data isolation (multi-tenancy)
- Patient data protection via zero-trust architecture

### AI / ML Models
- **HealthcareMLP**: Multi-layer perceptron with configurable hidden dims [256, 128, 64, 32]
- **LogisticRegressionMedical**: Binary disease prediction
- **RandomForestMedical**: Multi-class disease classification
- **DiseaseProgressionModel**: LSTM + Attention for progression prediction
- **MedicalEnsembleModel**: Weighted ensemble of multiple models
- **MedicalRiskAssessment**: Comprehensive patient risk scoring

### Training Configuration

| Parameter | Default | Description |
|-----------|---------|-------------|
| `epochs` | 50 | Training epochs for local model training |
| `learning_rate` | 0.001 | Optimizer learning rate |
| `batch_size` | 64 | Mini-batch size |
| `patience` | 7 | Early stopping patience |
| `local_epochs` (federated) | 10 | Local epochs per federated round |
| `epochs_per_round` (global) | 10 | Training epochs per aggregation round |
| `dropout` | 0.3 | Dropout rate for regularization |
| `hidden_dims` | [256, 128, 64, 32] | MLP hidden layer dimensions |

### Federated Aggregation
- **Algorithm**: FedAvg (Federated Averaging)
- **Weighting**: Proportional to each hospital's sample count
- **Privacy**: Gaussian noise added before aggregation (DP)
- **Validation**: Model accuracy tracked across aggregation rounds

### NLP & Clinical Analysis
- **Clinical Note Analysis**: Natural language processing of clinical notes
- **Entity Extraction**: Automatic extraction of medical entities from text
- **Sentiment Analysis**: Patient sentiment tracking from clinical documentation

---

## 🚀 Installation & Setup

### Prerequisites
- Python 3.8+
- Node.js 18+ & npm
- (Optional) PostgreSQL for production

### Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Linux/Mac)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your settings (SECRET_KEY, DATABASE_URL, etc.)

# Start server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SECRET_KEY` | `CHANGE-ME-IN-PRODUCTION` | JWT signing key |
| `DATABASE_URL` | `sqlite:///./app.db` | Database connection string |
| `BLOCKCHAIN_URL` | `http://localhost:8545` | Ethereum node URL |
| `SEED_ADMIN_USERNAME` | `superadmin` | Initial admin username |
| `SEED_ADMIN_EMAIL` | `admin@healthconnect.io` | Initial admin email |
| `SEED_ADMIN_PASSWORD` | `changeme` | Initial admin password |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8001/api/v1` | Frontend API base URL |

---

## 📊 Monitoring & Observability

### Health Check
```bash
curl http://localhost:8001/api/v1/status/health
```

### System Metrics
```bash
curl http://localhost:8001/api/v1/status/metrics
```

### Frontend Dashboards
| Dashboard | Role | Features |
|-----------|------|----------|
| **Super Admin** | Platform-wide view | Model governance, aggregation, organizations (CRUD), admin management |
| **Admin** | Management view | Network monitor, model review, blockchain audit, organization editing |
| **Hospital** | Operations view | Data upload, training (50 epochs), model participation, doctor management |
| **Doctor** | Clinical view | Patients, predictions, anomaly alerts, NLP analysis, prediction history |

---

## 🐳 Deployment

### Docker Compose (Production)
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports: ["8001:8001"]
    environment:
      - SECRET_KEY=${SECRET_KEY}
      - DATABASE_URL=postgresql://user:pass@postgres:5432/healthconnect

  frontend:
    build: ./frontend
    ports: ["3000:3000"]
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:8001/api/v1

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=healthconnect
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
```

### Cloud Options
- **AWS**: ECS + RDS PostgreSQL + ElastiCache
- **Azure**: Container Instances + Azure SQL + Redis Cache
- **GCP**: Cloud Run + Cloud SQL + Memorystore

---

## 🧪 Testing

### API Tests
```bash
# Health check
curl http://localhost:8001/api/v1/status/health

# Login
curl -X POST http://localhost:8001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"superadmin","password":"changeme"}'

# Upload CSV (requires hospital token)
curl -X POST http://localhost:8001/api/v1/data/upload-csv \
  -H "Authorization: Bearer <token>" \
  -F "file=@data/healthcare_dataset.csv"

# Start training (50 epochs)
curl -X POST http://localhost:8001/api/v1/training/start \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"upload_id":"<upload_id>","epochs":50}'

# Update hospital details (requires admin token)
curl -X PUT http://localhost:8001/api/v1/auth/hospitals/<hospital_id> \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Hospital Name","contact_email":"new@email.com"}'
```

---

## 🏆 Production Readiness

| Category | Status | Details |
|----------|--------|---------|
| **Authentication** | ✅ | JWT + bcrypt + RBAC |
| **Data Persistence** | ✅ | SQLAlchemy + SQLite/PostgreSQL |
| **CSV Upload** | ✅ | Multipart upload + SHA-256 hash |
| **Auto Column Detection** | ✅ | Dynamic CSV analysis & preprocessing |
| **Local Training** | ✅ | Real PyTorch HealthcareMLP (50 epochs, early stopping) |
| **Training Reports** | ✅ | Per-class metrics, confusion matrix, convergence history |
| **Review Workflow** | ✅ | Submit → Approve/Reject with notes |
| **Global Aggregation** | ✅ | FedAvg weighted averaging |
| **Blockchain Audit** | ✅ | SHA-256 + mock blockchain (dev) |
| **RBAC** | ✅ | 4-tier role system with granular permissions |
| **Privacy** | ✅ | Differential privacy (ε=1.0, δ=1e-5) |
| **Organization Management** | ✅ | Full CRUD: create, edit, toggle status (admin+) |
| **NLP Analysis** | ✅ | Clinical note analysis & entity extraction |
| **Patient Registry** | ✅ | Vitals, symptoms, history, file uploads |
| **AI Predictions** | ✅ | Disease prediction + anomaly detection |
| **Prediction History** | ✅ | Full diagnostic timeline & analytics |
| **Responsive UI** | ✅ | Next.js + Tailwind CSS |
| **Landing Page** | ✅ | Features, How it Works, Security sections |

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📚 Citation

```bibtex
@misc{healthconnect-federated-platform,
  title={Privacy-Preserving Federated Learning Framework with Blockchain},
  author={HealthConnect Research Team},
  year={2026},
  note={Enterprise platform for secure collaborative healthcare AI}
}
```

---

**🏥 HealthConnect — Transforming Healthcare AI with Privacy-Preserving Federated Learning** 🎯
