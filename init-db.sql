-- Virtual Wellness Platform Database Schema
-- Compatible with Postman Mock API structure

-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clients table
-- Maps to Mock API clients response: {"id": "1", "name": "John Doe", "email": "john@example.com", "phone": "1234567890"}
CREATE TABLE IF NOT EXISTS clients (
    id VARCHAR(255) PRIMARY KEY, -- Using string IDs to match Mock API
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    date_of_birth DATE, -- Optional field, may not be in Mock API
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Appointments table
-- Maps to Mock API appointments response: {"id": "a1", "client_id": "1", "time": "2025-07-10T10:00:00Z"}
CREATE TABLE IF NOT EXISTS appointments (
    id VARCHAR(255) PRIMARY KEY, -- Using string IDs to match Mock API
    client_id VARCHAR(255) NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    appointment_date DATE NOT NULL, -- Extracted from API's "time" field
    appointment_time TIME NOT NULL, -- Extracted from API's "time" field
    duration INTEGER DEFAULT 60, -- Duration in minutes
    type VARCHAR(100) DEFAULT 'consultation', -- consultation, follow_up, therapy, assessment
    status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, confirmed, cancelled, completed
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- Trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply the trigger to both tables
DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at 
    BEFORE UPDATE ON clients 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_appointments_updated_at ON appointments;
CREATE TRIGGER update_appointments_updated_at 
    BEFORE UPDATE ON appointments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data that matches the Postman mock responses
-- This helps with initial testing and development

-- Sample clients (matching Postman mock structure)
INSERT INTO clients (id, name, email, phone, created_at, updated_at) VALUES
('1', 'John Doe', 'john@example.com', '1234567890', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('2', 'Jane Smith', 'jane@example.com', '9876543210', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('3', 'Alice Johnson', 'alice@example.com', '5551234567', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('4', 'Bob Wilson', 'bob@example.com', '5559876543', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- Sample appointments (derived from Postman mock structure)
-- Converting "2025-07-10T10:00:00Z" to separate date and time fields
INSERT INTO appointments (id, client_id, appointment_date, appointment_time, duration, type, status, notes, created_at, updated_at) VALUES
('a1', '1', '2025-07-10', '10:00:00', 60, 'consultation', 'scheduled', 'Initial consultation', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('a2', '2', '2025-07-11', '11:00:00', 45, 'follow_up', 'scheduled', 'Follow-up appointment', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('a3', '3', '2025-07-12', '14:30:00', 60, 'therapy', 'scheduled', 'Therapy session', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('a4', '4', '2025-07-15', '09:00:00', 30, 'assessment', 'scheduled', 'Health assessment', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('a5', '1', '2025-07-16', '15:00:00', 60, 'consultation', 'confirmed', 'Second consultation', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- Views for common queries
CREATE OR REPLACE VIEW upcoming_appointments_view AS
SELECT 
    a.id,
    a.client_id,
    a.appointment_date,
    a.appointment_time,
    a.duration,
    a.type,
    a.status,
    a.notes,
    c.name as client_name,
    c.email as client_email,
    c.phone as client_phone
FROM appointments a
JOIN clients c ON a.client_id = c.id
WHERE a.appointment_date >= CURRENT_DATE 
    AND a.status IN ('scheduled', 'confirmed')
ORDER BY a.appointment_date ASC, a.appointment_time ASC;

-- View for appointment statistics
CREATE OR REPLACE VIEW appointment_stats_view AS
SELECT 
    COUNT(*) as total_appointments,
    COUNT(*) FILTER (WHERE status = 'scheduled') as scheduled_count,
    COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_count,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
    COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_count,
    COUNT(*) FILTER (WHERE appointment_date >= CURRENT_DATE) as upcoming_count
FROM appointments;

-- Grant necessary permissions (adjust user as needed)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_app_user;