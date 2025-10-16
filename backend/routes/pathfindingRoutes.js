import express from 'express';
import {
  findPath,
  pathfindingHealth,
  getGraphStructure
} from '../controllers/pathfindingController.js';

const router = express.Router();

// Pathfinding health check
router.get('/health', pathfindingHealth);

// Graph structure for debugging
router.get('/graph', getGraphStructure);

// Main pathfinding endpoint
router.post('/', findPath);

export default router;