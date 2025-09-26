-- Database schema for Office Room Management System

-- Tabel rooms
CREATE TABLE rooms (
    id SERIAL PRIMARY KEY,
    nama_ruangan VARCHAR(100) NOT NULL UNIQUE,
    luas DECIMAL(10,2) NOT NULL CHECK (luas > 0),
    kapasitas_max INTEGER NOT NULL CHECK (kapasitas_max > 0),
    occupancy INTEGER DEFAULT 0 CHECK (occupancy >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel connections
CREATE TABLE connections (
    id SERIAL PRIMARY KEY,
    room_from INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
    room_to INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(room_from, room_to),
    CHECK (room_from != room_to)
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for updating updated_at
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes for performance
CREATE INDEX idx_rooms_nama ON rooms(nama_ruangan);
CREATE INDEX idx_rooms_occupancy ON rooms(occupancy);
CREATE INDEX idx_connections_from ON connections(room_from);
CREATE INDEX idx_connections_to ON connections(room_to);
CREATE INDEX idx_connections_both ON connections(room_from, room_to);