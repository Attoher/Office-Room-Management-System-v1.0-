import express from 'express';
import {
    findPath
} from '../controllers/pathfindingController.js';

const router = express.Router();

router.post('/', findPath);

export default router;