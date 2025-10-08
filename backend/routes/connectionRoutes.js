import express from 'express';
import { getAllConnections, createConnection, deleteConnection, debugConnections } from '../controllers/connectionController.js';

const router = express.Router();

// FIXED: Add proper route definitions
router.get('/debug', debugConnections);  // Put debug route before parameterized routes
router.get('/', getAllConnections);
router.post('/', createConnection);
router.delete('/:id', deleteConnection);

export default router;
