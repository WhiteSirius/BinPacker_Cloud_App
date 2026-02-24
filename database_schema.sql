-- Database Schema for Bin Packer Cloud Application
-- PostgreSQL compatible schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Vehicles table
CREATE TABLE vehicles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    length_mm INTEGER NOT NULL,
    width_mm INTEGER NOT NULL,
    height_mm INTEGER NOT NULL,
    max_weight_kg FLOAT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Items table
CREATE TABLE items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    length_mm INTEGER NOT NULL,
    width_mm INTEGER NOT NULL,
    height_mm INTEGER NOT NULL,
    weight_kg FLOAT NOT NULL,
    can_rotate BOOLEAN DEFAULT TRUE,
    is_palletized BOOLEAN DEFAULT FALSE,
    destination VARCHAR(255),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Algorithm configurations table
CREATE TABLE algorithm_configurations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    max_stack_height INTEGER DEFAULT 3,
    max_weight_per_stack_kg FLOAT DEFAULT 1000.0,
    support_requirement_percentage FLOAT DEFAULT 100.0,
    enable_rotation BOOLEAN DEFAULT TRUE,
    enable_caching BOOLEAN DEFAULT TRUE,
    priority_volume_weight FLOAT DEFAULT 0.7,
    priority_weight_weight FLOAT DEFAULT 0.3,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Packing jobs table
CREATE TABLE packing_jobs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
    status VARCHAR(50) DEFAULT 'pending',
    algorithm_version VARCHAR(50) DEFAULT 'v3',
    efficiency_percentage FLOAT,
    total_weight_kg FLOAT,
    items_placed_count INTEGER DEFAULT 0,
    items_unplaced_count INTEGER DEFAULT 0,
    execution_time_ms INTEGER,
    result_data JSONB,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Packing job items (many-to-many with quantity)
CREATE TABLE packing_job_items (
    id SERIAL PRIMARY KEY,
    packing_job_id INTEGER NOT NULL REFERENCES packing_jobs(id) ON DELETE CASCADE,
    item_id INTEGER NOT NULL REFERENCES items(id),
    quantity INTEGER DEFAULT 1 NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Placed items table
CREATE TABLE placed_items (
    id SERIAL PRIMARY KEY,
    packing_job_id INTEGER NOT NULL REFERENCES packing_jobs(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    position_x_mm INTEGER NOT NULL,
    position_y_mm INTEGER NOT NULL,
    position_z_mm INTEGER NOT NULL,
    rotation_length_mm INTEGER NOT NULL,
    rotation_width_mm INTEGER NOT NULL,
    rotation_height_mm INTEGER NOT NULL,
    weight_kg FLOAT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User packing jobs (many-to-many with roles)
CREATE TABLE user_packing_jobs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    packing_job_id INTEGER NOT NULL REFERENCES packing_jobs(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'owner',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System logs table
CREATE TABLE system_logs (
    id SERIAL PRIMARY KEY,
    level VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    source VARCHAR(100) NOT NULL,
    packing_job_id INTEGER REFERENCES packing_jobs(id),
    user_id INTEGER REFERENCES users(id),
    log_metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX idx_vehicles_active ON vehicles(is_active);
CREATE INDEX idx_items_active ON items(is_active);
CREATE INDEX idx_items_destination ON items(destination);
CREATE INDEX idx_packing_jobs_status ON packing_jobs(status);
CREATE INDEX idx_packing_jobs_vehicle ON packing_jobs(vehicle_id);
CREATE INDEX idx_packing_jobs_created ON packing_jobs(created_at);
CREATE INDEX idx_placed_items_packing_job ON placed_items(packing_job_id);
CREATE INDEX idx_system_logs_level ON system_logs(level);
CREATE INDEX idx_system_logs_source ON system_logs(source);
CREATE INDEX idx_system_logs_created ON system_logs(created_at);
CREATE INDEX idx_user_packing_jobs_user ON user_packing_jobs(user_id);
CREATE INDEX idx_user_packing_jobs_packing_job ON user_packing_jobs(packing_job_id);

-- Insert default data
INSERT INTO vehicles (name, length_mm, width_mm, height_mm, max_weight_kg, description) 
VALUES ('EU Euroliner', 13620, 2480, 2700, 24000, 'Standard EU Euroliner truck dimensions');

INSERT INTO algorithm_configurations (name, is_default) 
VALUES ('Default Configuration', TRUE);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_algorithm_configurations_updated_at BEFORE UPDATE ON algorithm_configurations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_packing_jobs_updated_at BEFORE UPDATE ON packing_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 