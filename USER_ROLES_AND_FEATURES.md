# 📜 Windscrf: User Roles & Feature Documentation

This document provides a comprehensive breakdown of the features, pages, and workflows available to each user role within the **Privacy-Preserving Federated Learning Healthcare Platform**.

---

## 👑 Super Admin (Platform Governance)
The Super Admin is the ultimate authority, responsible for platform health, network membership, and the final stage of the Federated Learning lifecycle.

### 🏠 Dashboard Overview
- **Metrics**: Total hospitals, active admins, global model accuracy, and total processing rounds.
- **Activity**: Platform-wide audit logs showing major system changes.

### 📄 Key Pages & Features
- **Organizations Management (`/dashboard/organizations`)**: Full CRUD operations for hospitals. Super Admins can onboard new hospitals using localized data (including Zip/Pin codes), edit their details, or revoke access. The interface features an **"Essential Details"** view for efficient monitoring of the entire node network.
- **Admin Management (`/dashboard/admin-management`)**: Create and manage "Admin" users who oversee model governance.
- **Model Governance (`/dashboard/model-governance`)**:
    - **Global Aggregation**: The exclusive ability to run the **FedAvg** algorithm. This merges approved local models from hospitals into the new Global Model.
    - **Quality Control**: Access to the "Rejected Models" archive to study failures and improve data quality guidelines.
- **Reports & Analytics (`/dashboard/reports`)**: High-level statistical visualizations of platform growth and model convergence trends over time.
- **Audit Logs (`/dashboard/audit-logs`)**: A master trail of every critical interaction on the platform for compliance (HIPAA/GDPR).
- **Compliance Center (`/dashboard/compliance`)**: Monitor Differential Privacy (DP) budget consumption across the network.

---

## 👨‍💼 Admin (Governance & Model Review)
Admins serve as "Quality Control Officers." They monitor the network and vet the local models submitted by hospitals before they can affect the global model.

### 🏠 Dashboard Overview
- **Metrics**: Pending reviews, blocked organizations, and network-wide training jobs.

### 📄 Key Pages & Features
- **Interactive Network Map (`/dashboard/network-map`)**: A high-fidelity geographic visualization using Leaflet.js. Admins can monitor hospital node locations across the map, view real-time status pulses (Active/Idle/Offline), and access detailed node analytics via interactive side panels.
- **Model Review Gateway (`/dashboard/model-governance`)**: The primary workspace for vetting local training results. Admins inspect accuracy, loss curves, and per-class metrics before **Approving** or **Rejecting**.
- **Hospital Directory (`/dashboard/organizations`)**: View and manage hospital nodes. Admins can update registration details like zip codes and toggle active status to maintain network hygiene.
- **Network Monitor (`/dashboard/network-monitor`)**: Live status of hospital nodes (Online/Offline/Training).
- **Blockchain Audit Trail (`/dashboard/blockchain`)**: Verify the integrity of aggregation rounds using on-chain transaction hashes.

---

## 🏥 Hospital Node (Data Contributor)
Hospital Nodes are the "Engine" of the platform. They represent individual hospital centers responsible for local data management and model training.

### 🏠 Dashboard Overview
- **Metrics**: Local patient records, successful training completions, and contribution rank.
- **Training Status**: Status of current local training jobs.

### 📄 Key Pages & Features
- **Data Upload Center (`/dashboard/data-upload`)**:
    - **CSV Ingestion**: Upload medical datasets.
    - **Auto-Preprocessing**: Automated column detection and feature mapping for the underlying PyTorch models.
- **Local Training Engine (`/dashboard/trainings`)**:
    - **Differential Privacy (DP)**: Initiate local training with Gaussian noise injection to ensure patient records never leak.
    - **Submission**: Send completed local weights to Admins for review.
- **Doctor Management (`/dashboard/doctor-management`)**: Register and manage clinical staff (Doctors) who will use the AI for patient care.
- **Patient Management (`/dashboard/patients`)**: Full access to the patient registry for the entire facility. Admins can view comprehensive profiles, clinical timelines, and manage patient records.
- **Patient Referral Reviews (`/dashboard/patient-reviews`)** — **[NEW]**:
    - **Doctor Referral Inbox**: A dedicated interface to review patient records shared by doctors for administrative oversight.
    - **Annotation & Action**: Mark referrals as "Reviewed" or "Flagged," set administrative priority, and add notes that sync back to the referring doctor.
    - **Notification Badge**: Real-time unread counts for pending referrals in the sidebar.
- **Model Participation (`/dashboard/federated`)**: View the hospital's contribution level and rewards for participating in global model rounds.

---

## 🩺 Doctor (Clinical Diagnostic User) — *UPGRADED*
Doctors are the "End Users" who apply the AI's intelligence to real-world clinical scenarios. They balance AI insights with human expertise.

### 🏠 Dashboard Overview
- **Enhanced Clinical Charts**: Visual breakdowns of patient demographics (Age/Gender) and Risk Distribution (Low/Moderate/High).
- **Activity Feed**: Live updates on recent diagnostic predictions and anomaly detections.

### 📄 Key Pages & Features
- **Patient Registry (`/dashboard/patients`)**:
    - **Comprehensive Profiles**: Manage vitals (BP, Sugar, HR, Temp), medical history, and symptoms.
    - **Phygital Records**: Attach scanned medical reports (PDF/Images) directly to patient files.
- **Patient Detail View (`/dashboard/patients/[id]`)** — **[NEW]**:
    - **Clinical Timeline**: A unified medical history showing every registration, report upload, and AI prediction in chronological order.
    - **Quick Actions**: One-click "Run Prediction" or "Generate Report" from the patient profile.
- **Clinical Reports (`/dashboard/clinical-reports`)** — **[NEW]**:
    - **AI-Enhanced Reporting**: Generate structured medical reports that synthesize patient vitals with AI risk assessments.
    - **Recommendations**: Receive automated clinical recommendations based on AI findings (e.g., "Elevated BP — Specialist Referral Recommended").
- **AI Diagnostics (`/dashboard/predictions`)**:
    - **Inference Gateway**: Run the global model against a patient's current metrics to predict disease risk.
    - **NLP Insights (`/dashboard/nlp`)**: Use Natural Language Processing to extract hidden patterns from unstructured clinical notes.
- **Anomaly Alerts (`/dashboard/anomalies`)**: A high-priority list of patients whose metrics or AI scores indicate emergency-level risk.

---

## 🔄 The WorkFlow Loop

1. **🏥 Hospital** registers a **🩺 Doctor**.
2. **🩺 Doctor** registers a **Patient** and uploads vitals.
3. **🩺 Doctor** shares critical patient records via **"Send to Admin"** for high-priority review.
4. **🏥 Hospital Admin** reviews the referral, flags concerns, and prioritizes care in the **Patient Reviews** dashboard.
5. **🏥 Hospital** uploads a large **CSV Dataset** of historical patient data.
6. **🏥 Hospital** runs **Local Training** (DP-enabled) using that dataset.
7. **👨‍💼 Admin** reviews and **Approves** the training job.
8. **👑 Super Admin** aggregates it into a new **Global Model**.
9. **🩺 Doctor** uses the improved **Global Model** via the **Prediction Gateway** to diagnose their patient accurately.
10. **🩺 Doctor** generates a **Clinical Report** to finalize the patient's care plan.
