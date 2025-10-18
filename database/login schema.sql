-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    nama_lengkap VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'guest',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Insert default admin user (password: admin123)
INSERT INTO users (email, password, nama_lengkap, role) 
VALUES (
    'admin@office.com', 
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdCv3r.iL.OGLYi', 
    'System Administrator', 
    'admin'
) ON CONFLICT (email) DO NOTHING;

-- Insert sample guest user (password: guest123)
INSERT INTO users (email, password, nama_lengkap, role) 
VALUES (
    'guest@office.com', 
    '$2b$12$8V/7uMM0yU7UaSmVC52sWeciS5Ro8t.V1v8uZ7pS9nHvJd8Q6r1Yi', 
    'Sample Guest', 
    'guest'
) ON CONFLICT (email) DO NOTHING;