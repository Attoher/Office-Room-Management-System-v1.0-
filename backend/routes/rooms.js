import express from 'express';
import {
    getAllRooms,
    getRoomById,
    createRoom,
    updateRoom,
    deleteRoom,
    updateOccupancy
} from '../controllers/roomController.js';

const router = express.Router();

router.get('/', getAllRooms);
router.get('/:id', getRoomById);
router.post('/', createRoom);
router.put('/:id', updateRoom);
router.delete('/:id', deleteRoom);
router.put('/:id/occupancy', updateOccupancy);

export default router;