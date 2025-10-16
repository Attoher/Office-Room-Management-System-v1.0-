import express from 'express';
import {
  getAllRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
  updateOccupancy,
  getRoomStats
} from '../controllers/roomController.js';

const router = express.Router();

// Room statistics
router.get('/stats', getRoomStats);

// Standard CRUD operations
router.get('/', getAllRooms);
router.get('/:id', getRoomById);
router.post('/', createRoom);
router.put('/:id', updateRoom);
router.delete('/:id', deleteRoom);
router.put('/:id/occupancy', updateOccupancy);

export default router;