import { Router } from 'express';
import {
  healthCheck,
  detailedHealthCheck,
  readinessCheck,
  livenessCheck,
} from '@/controllers/health.controller';

const router = Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Basic health check
 *     description: Returns basic health status of the application and its services
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Application is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       enum: [healthy, unhealthy]
 *                       example: healthy
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-15T10:30:00.000Z"
 *                     uptime:
 *                       type: number
 *                       example: 3600
 *                     environment:
 *                       type: string
 *                       example: "development"
 *                     version:
 *                       type: string
 *                       example: "1.0.0"
 *                     services:
 *                       type: object
 *                       properties:
 *                         database:
 *                           type: object
 *                           properties:
 *                             status:
 *                               type: string
 *                               enum: [connected, disconnected, connecting]
 *                               example: connected
 *                             responseTime:
 *                               type: number
 *                               example: 25
 *                         memory:
 *                           type: object
 *                           properties:
 *                             used:
 *                               type: string
 *                               example: "45.67 MB"
 *                             total:
 *                               type: string
 *                               example: "128.00 MB"
 *                             percentage:
 *                               type: string
 *                               example: "35.68%"
 *                         cpu:
 *                           type: object
 *                           properties:
 *                             usage:
 *                               type: string
 *                               example: "0.15 seconds"
 *       503:
 *         description: Application is unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: unhealthy
 */
router.get('/', healthCheck);

/**
 * @swagger
 * /health/detailed:
 *   get:
 *     summary: Detailed health check
 *     description: Returns detailed health status including system information
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Detailed health information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: healthy
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     uptime:
 *                       type: number
 *                     environment:
 *                       type: string
 *                     version:
 *                       type: string
 *                     services:
 *                       type: object
 *                     system:
 *                       type: object
 *                       properties:
 *                         platform:
 *                           type: string
 *                           example: "win32"
 *                         arch:
 *                           type: string
 *                           example: "x64"
 *                         nodeVersion:
 *                           type: string
 *                           example: "v18.17.0"
 *                         pid:
 *                           type: number
 *                           example: 12345
 *                     database:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                         host:
 *                           type: string
 *                         readyState:
 *                           type: number
 *                         collections:
 *                           type: array
 *                           items:
 *                             type: string
 */
router.get('/detailed', detailedHealthCheck);

/**
 * @swagger
 * /health/ready:
 *   get:
 *     summary: Readiness probe
 *     description: Kubernetes/Docker readiness probe endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Application is ready
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ready
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       503:
 *         description: Application is not ready
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "not ready"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 reason:
 *                   type: string
 *                   example: "Database not connected"
 */
router.get('/ready', readinessCheck);

/**
 * @swagger
 * /health/live:
 *   get:
 *     summary: Liveness probe
 *     description: Kubernetes/Docker liveness probe endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Application is alive
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: alive
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   example: 3600
 */
router.get('/live', livenessCheck);

export default router;