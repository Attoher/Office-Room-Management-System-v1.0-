import express from 'express';
import { 
  getAllConnections, 
  createConnection, 
  deleteConnection, 
  debugConnections,
  getRoomConnections 
} from '../controllers/connectionController.js';

const router = express.Router();

// Debug endpoint - harus di atas parameterized routes
router.get('/debug', debugConnections);

// Get connections for specific room
router.get('/room/:roomId', getRoomConnections);

// Standard CRUD operations
router.get('/', getAllConnections);
router.post('/', createConnection);
router.delete('/:id', deleteConnection);

export default router;