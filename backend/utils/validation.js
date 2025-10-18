// utils/validation.js
export const validateRoomData = (req, res, next) => {
  const { nama_ruangan, luas, kapasitas_max, occupancy } = req.body;
  
  const errors = [];
  
  // Required field validation
  if (!nama_ruangan?.trim()) {
    errors.push('Nama ruangan harus diisi');
  }
  
  if (!luas || parseFloat(luas) <= 0) {
    errors.push('Luas ruangan harus lebih dari 0');
  }
  
  if (!kapasitas_max || parseInt(kapasitas_max) <= 0) {
    errors.push('Kapasitas maksimal harus lebih dari 0');
  }
  
  // Optional field validation
  if (occupancy !== undefined && occupancy !== null) {
    const occupancyValue = parseInt(occupancy);
    if (isNaN(occupancyValue) || occupancyValue < 0) {
      errors.push('Occupancy tidak boleh negatif');
    }
  }
  
  // Sanitization
  if (nama_ruangan) req.body.nama_ruangan = nama_ruangan.trim();
  if (luas) req.body.luas = parseFloat(luas);
  if (kapasitas_max) req.body.kapasitas_max = parseInt(kapasitas_max);
  if (occupancy !== undefined && occupancy !== null) {
    req.body.occupancy = parseInt(occupancy);
  }
  
  if (errors.length > 0) {
    return res.status(400).json({
      status: 'error',
      error: 'Validation failed',
      details: errors
    });
  }
  
  next();
};

export const validateConnectionData = (req, res, next) => {
  const { room_from, room_to } = req.body;
  
  const errors = [];
  
  if (!room_from || !room_to) {
    errors.push('room_from dan room_to harus diisi');
  }
  
  if (room_from === room_to) {
    errors.push('room_from dan room_to tidak boleh sama');
  }
  
  if (errors.length > 0) {
    return res.status(400).json({
      status: 'error',
      error: 'Validation failed',
      details: errors
    });
  }
  
  // Sanitization
  req.body.room_from = parseInt(room_from);
  req.body.room_to = parseInt(room_to);
  
  next();
};

export const validatePathfindingData = (req, res, next) => {
  const { tujuan, start } = req.body;
  
  const errors = [];
  
  if (!tujuan?.trim()) {
    errors.push('Tujuan harus diisi');
  }
  
  if (start && isNaN(parseInt(start))) {
    errors.push('Start harus berupa angka');
  }
  
  if (errors.length > 0) {
    return res.status(400).json({
      status: 'error',
      error: 'Validation failed',
      details: errors
    });
  }
  
  // Sanitization
  req.body.tujuan = tujuan.trim();
  req.body.start = start ? parseInt(start) : 1;
  
  next();
};