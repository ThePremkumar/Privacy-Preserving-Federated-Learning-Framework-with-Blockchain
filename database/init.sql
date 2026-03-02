-- Federated Learning Healthcare Database Schema
-- PostgreSQL Database Initialization Script

-- Create database if it doesn't exist
-- CREATE DATABASE IF NOT EXISTS federated_learning;

-- Use the database
-- \c federated_learning;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table for authentication and authorization
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('super_admin', 'admin', 'hospital', 'doctor')),
    hospital_id UUID REFERENCES hospitals(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

-- Hospitals table
CREATE TABLE IF NOT EXISTS hospitals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    contact_email VARCHAR(100) NOT NULL,
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    compliance_certificates JSONB DEFAULT '[]'::jsonb
);

-- Training rounds table
CREATE TABLE IF NOT EXISTS training_rounds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    round_number INTEGER NOT NULL UNIQUE,
    model_hash VARCHAR(64) NOT NULL,
    participating_hospitals UUID[] DEFAULT '{}',
    accuracy DECIMAL(5,4) DEFAULT 0.0000,
    loss DECIMAL(10,6) DEFAULT 0.000000,
    data_points INTEGER DEFAULT 0,
    convergence_achieved BOOLEAN DEFAULT false,
    anomaly_count INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    blockchain_tx_hash VARCHAR(66),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Model submissions table
CREATE TABLE IF NOT EXISTS model_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    round_number INTEGER NOT NULL REFERENCES training_rounds(round_number),
    hospital_id UUID NOT NULL REFERENCES hospitals(id),
    model_hash VARCHAR(64) NOT NULL,
    previous_hash VARCHAR(64),
    weights JSONB NOT NULL,
    data_size INTEGER NOT NULL,
    accuracy DECIMAL(5,4) DEFAULT 0.0000,
    loss DECIMAL(10,6) DEFAULT 0.000000,
    training_time_seconds INTEGER,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    blockchain_tx_hash VARCHAR(66)
);

-- Patients table (HIPAA compliant)
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id),
    patient_identifier VARCHAR(100) NOT NULL, -- Encrypted patient ID
    age_group VARCHAR(20), -- Age group instead of exact age for privacy
    gender VARCHAR(10),
    admission_date DATE,
    discharge_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Patient data table (anonymized)
CREATE TABLE IF NOT EXISTS patient_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id),
    data_type VARCHAR(50) NOT NULL, -- 'vital_signs', 'lab_results', 'diagnosis'
    data_values JSONB NOT NULL, -- Actual medical data
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_anomalous BOOLEAN DEFAULT false,
    anomaly_score DECIMAL(5,4)
);

-- Predictions table
CREATE TABLE IF NOT EXISTS predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id),
    model_type VARCHAR(50) NOT NULL,
    prediction JSONB NOT NULL, -- Prediction results
    confidence_score DECIMAL(5,4),
    predicted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    doctor_id UUID REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_notes TEXT
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    hospital_id UUID REFERENCES hospitals(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- System metrics table
CREATE TABLE IF NOT EXISTS system_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,6) NOT NULL,
    metric_unit VARCHAR(20),
    hospital_id UUID REFERENCES hospitals(id),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Model performance history
CREATE TABLE IF NOT EXISTS model_performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    round_number INTEGER NOT NULL REFERENCES training_rounds(round_number),
    hospital_id UUID REFERENCES hospitals(id),
    metric_type VARCHAR(50) NOT NULL, -- 'accuracy', 'precision', 'recall', 'f1_score'
    metric_value DECIMAL(5,4) NOT NULL,
    test_dataset_size INTEGER,
    evaluated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_hospital_id ON users(hospital_id);

CREATE INDEX IF NOT EXISTS idx_hospitals_name ON hospitals(name);
CREATE INDEX IF NOT EXISTS idx_hospitals_active ON hospitals(is_active);

CREATE INDEX IF NOT EXISTS idx_training_rounds_number ON training_rounds(round_number);
CREATE INDEX IF NOT EXISTS idx_training_rounds_created_at ON training_rounds(created_at);

CREATE INDEX IF NOT EXISTS idx_model_submissions_round ON model_submissions(round_number);
CREATE INDEX IF NOT EXISTS idx_model_submissions_hospital ON model_submissions(hospital_id);
CREATE INDEX IF NOT EXISTS idx_model_submissions_submitted_at ON model_submissions(submitted_at);

CREATE INDEX IF NOT EXISTS idx_patients_hospital_id ON patients(hospital_id);
CREATE INDEX IF NOT EXISTS idx_patients_admission_date ON patients(admission_date);

CREATE INDEX IF NOT EXISTS idx_patient_data_patient_id ON patient_data(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_data_type ON patient_data(data_type);
CREATE INDEX IF NOT EXISTS idx_patient_data_recorded_at ON patient_data(recorded_at);
CREATE INDEX IF NOT EXISTS idx_patient_data_anomalous ON patient_data(is_anomalous);

CREATE INDEX IF NOT EXISTS idx_predictions_patient_id ON predictions(patient_id);
CREATE INDEX IF NOT EXISTS idx_predictions_model_type ON predictions(model_type);
CREATE INDEX IF NOT EXISTS idx_predictions_predicted_at ON predictions(predicted_at);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_hospital_id ON audit_logs(hospital_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_system_metrics_name ON system_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_system_metrics_recorded_at ON system_metrics(recorded_at);

CREATE INDEX IF NOT EXISTS idx_model_performance_round ON model_performance(round_number);
CREATE INDEX IF NOT EXISTS idx_model_performance_hospital ON model_performance(hospital_id);
CREATE INDEX IF NOT EXISTS idx_model_performance_metric_type ON model_performance(metric_type);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hospitals_updated_at BEFORE UPDATE ON hospitals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default super admin user (password: admin123)
INSERT INTO users (username, email, password_hash, role) 
VALUES (
    'superadmin',
    'admin@federated-learning.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq9w5KS', -- bcrypt hash of 'admin123'
    'super_admin'
) ON CONFLICT (username) DO NOTHING;

-- Insert sample hospitals
INSERT INTO hospitals (name, contact_email, address) VALUES
    ('General Hospital', 'contact@general-hospital.com', '123 Main St, City, State 12345'),
    ('Medical Center', 'info@medical-center.com', '456 Oak Ave, City, State 67890'),
    ('University Hospital', 'admin@university-hospital.edu', '789 Campus Blvd, City, State 11111')
ON CONFLICT DO NOTHING;

-- Create views for common queries
CREATE OR REPLACE VIEW hospital_summary AS
SELECT 
    h.id,
    h.name,
    h.contact_email,
    h.is_active,
    COUNT(DISTINCT u.id) as user_count,
    COUNT(DISTINCT p.id) as patient_count,
    COUNT(DISTINCT ms.id) as model_submission_count,
    h.created_at
FROM hospitals h
LEFT JOIN users u ON h.id = u.hospital_id
LEFT JOIN patients p ON h.id = p.hospital_id
LEFT JOIN model_submissions ms ON h.id = ms.hospital_id
GROUP BY h.id, h.name, h.contact_email, h.is_active, h.created_at;

CREATE OR REPLACE VIEW training_round_summary AS
SELECT 
    tr.id,
    tr.round_number,
    tr.model_hash,
    tr.accuracy,
    tr.loss,
    tr.data_points,
    tr.convergence_achieved,
    COUNT(DISTINCT ms.hospital_id) as participating_hospitals_count,
    tr.started_at,
    tr.completed_at,
    tr.blockchain_tx_hash
FROM training_rounds tr
LEFT JOIN model_submissions ms ON tr.round_number = ms.round_number
GROUP BY tr.id, tr.round_number, tr.model_hash, tr.accuracy, tr.loss, tr.data_points, tr.convergence_achieved, tr.started_at, tr.completed_at, tr.blockchain_tx_hash;

-- Grant permissions (adjust as needed for your security model)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO federated_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO federated_user;

-- Create database user for the application
-- CREATE USER federated_user WITH PASSWORD 'secure_password';
-- GRANT CONNECT ON DATABASE federated_learning TO federated_user;

-- Log initialization
INSERT INTO audit_logs (action, resource_type, new_values) 
VALUES ('DATABASE_INITIALIZED', 'system', '{"status": "completed", "timestamp": "' || CURRENT_TIMESTAMP || '"}');

COMMIT;
