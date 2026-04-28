# HealthConnect Platform Frontend

This is the frontend for the **Privacy-Preserving Federated Learning Healthcare Platform**, built with Next.js 14, React, Tailwind CSS, and Framer Motion. It provides clinical, administrative, and system governance interfaces for multiple roles within the healthcare ecosystem.

## 🚀 Features

- **Clinical Command Center (Doctor Dashboard)**: High-fidelity analytics, real-time risk stratification (Low/Moderate/High), and clinical intelligence widgets.
- **Real-Time Notifications**: WebSocket-based push notifications for background training jobs and clinical alerts.
- **Federated Network Monitor**: Visualized model training across hospital nodes, tracking convergence and privacy metrics.
- **Enterprise Design System**: Modern, medical-grade UI using glassmorphism, semantic token mapping, and subtle micro-interactions.
- **Role-Based Access Control (RBAC)**: Secure multi-tenant architecture supporting Super Admin, Admin, Hospital, and Doctor roles.
- **System Governance**: Full CRUD interfaces for managing hospital node details, user management, and role administration for system admins.

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4, Lucide Icons
- **Animation**: Framer Motion
- **Charts**: Recharts
- **State Management**: React Hooks (useState, useEffect, useMemo)
- **API Client**: Axios

## 📦 Getting Started

First, run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

Ensure the FastAPI backend is running on `http://localhost:8001` for the API and WebSocket connections to function properly.

## 📡 Key Endpoints Integrated

- `/api/v1/auth/*`: JWT authentication and role fetching.
- `/api/v1/doctor/summary`: Clinical analytics and patient distribution.
- `/api/v1/notifications`: Real-time and persisted alerts.
- `/api/v1/ws/notifications`: WebSocket listener for live updates.
- `/api/v1/training/*`: ML background task triggers and monitoring.
