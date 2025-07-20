-- Database initialization script
-- This runs automatically when the PostgreSQL container starts for the first time

-- Create wellness_platform database (if not exists)
SELECT 'CREATE DATABASE wellness_platform'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'wellness_platform')\gexec

-- Connect to wellness_platform database
\c wellness_platform;

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    date_of_birth DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id VARCHAR(255) PRIMARY KEY,
    client_id VARCHAR(255) NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration INTEGER NOT NULL,
    type VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_client ON appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
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

-- Insert sample data for development (optional)
INSERT INTO clients (id, name, email, phone, created_at, updated_at) VALUES
    ('client-1', 'John Doe', 'john.doe@email.com', '+1-555-0101', NOW(), NOW()),
    ('client-2', 'Jane Smith', 'jane.smith@email.com', '+1-555-0102', NOW(), NOW()),
    ('client-3', 'Bob Johnson', 'bob.johnson@email.com', '+1-555-0103', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO appointments (id, client_id, appointment_date, appointment_time, duration, type, status, notes, created_at, updated_at) VALUES
    ('apt-1', 'client-1', CURRENT_DATE + INTERVAL '1 day', '09:00:00', 60, 'Consultation', 'scheduled', 'Initial consultation', NOW(), NOW()),
    ('apt-2', 'client-2', CURRENT_DATE + INTERVAL '2 days', '14:00:00', 45, 'Follow-up', 'scheduled', 'Follow-up session', NOW(), NOW()),
    ('apt-3', 'client-3', CURRENT_DATE + INTERVAL '3 days', '11:00:00', 90, 'Therapy Session', 'scheduled', 'Regular therapy session', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Grant permissions (if needed)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- Print success message
SELECT 'Database initialization completed successfully!' as message;
