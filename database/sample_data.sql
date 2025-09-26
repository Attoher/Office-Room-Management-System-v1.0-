-- Sample data for Office Room Management System

-- Insert sample rooms
INSERT INTO rooms (nama_ruangan, luas, kapasitas_max, occupancy) VALUES
('Lobby', 50.0, 20, 5),
('Meeting Room A', 30.0, 10, 8),
('Meeting Room B', 25.0, 8, 3),
('Director Office', 40.0, 5, 2),
('Pantry', 20.0, 6, 1),
('Workstation Area', 100.0, 25, 18);

-- Insert sample connections
INSERT INTO connections (room_from, room_to) VALUES
(1, 2),  -- Lobby -> Meeting Room A
(1, 3),  -- Lobby -> Meeting Room B
(1, 4),  -- Lobby -> Director Office
(1, 5),  -- Lobby -> Pantry
(2, 3),  -- Meeting Room A -> Meeting Room B
(3, 6),  -- Meeting Room B -> Workstation Area
(4, 6),  -- Director Office -> Workstation Area
(5, 6);  -- Pantry -> Workstation Area