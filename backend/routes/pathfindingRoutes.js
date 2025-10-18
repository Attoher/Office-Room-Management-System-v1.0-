import express from 'express';
import {
  findPath,
  pathfindingHealth,
  getGraphStructure
} from '../controllers/pathfindingController.js';
import { validatePathfindingData } from '../utils/validation.js';

const router = express.Router();

// Pathfinding health check
router.get('/health', pathfindingHealth);

// Graph structure for debugging
router.get('/graph', getGraphStructure);

// Main pathfinding endpoint dengan validation
router.post('/', validatePathfindingData, findPath);

export default router;