import express from 'express';
import {
    getAllConnections,
    createConnection,
    deleteConnection
} from '../controllers/connectionController.js';

const router = express.Router();

router.get('/', getAllConnections);
router.post('/', createConnection);
router.delete('/:id', deleteConnection);

export default router;