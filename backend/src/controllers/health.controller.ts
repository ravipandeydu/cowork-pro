import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { asyncHandler } from '@/middlewares/errorHandler';
import { isDatabaseConnected } from '@/config/database';
import { env } from '@/config/env';
import { HttpStatusCode } from '@/types/error.types';

// Health check response interface
interface IHealthResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  environment: string;
  version: string;
  services: {
    database: {
      status: 'connected' | 'disconnected' | 'connecting';
      responseTime?: number;
    };
    memory: {
      used: string;
      total: string;
      percentage: string;
    };
    cpu: {
      usage: string;
    };
  };
}

// Detailed health check response interface
interface IDetailedHealthResponse extends IHealthResponse {
  system: {
    platform: string;
    arch: string;
    nodeVersion: string;
    pid: number;
  };
  database: {
    name: string;
    host: string;
    readyState: number;
    collections?: string[];
  };
}

// Check database connection with response time
const checkDatabaseHealth = async (): Promise<{ status: 'connected' | 'disconnected' | 'connecting'; responseTime?: number }> => {
  try {
    const startTime = Date.now();
    
    // Simple ping to check database connectivity
    if (mongoose.connection.db) {
      await mongoose.connection.db.admin().ping();
    } else {
      throw new Error('Database connection not available');
    }
    
    const responseTime = Date.now() - startTime;
    
    return {
      status: isDatabaseConnected() ? 'connected' : 'disconnected',
      responseTime,
    };
  } catch (error) {
    return {
      status: 'disconnected',
    };
  }
};

// Get memory usage information
const getMemoryUsage = (): { used: string; total: string; percentage: string } => {
  const memoryUsage = process.memoryUsage();
  const totalMemory = memoryUsage.heapTotal;
  const usedMemory = memoryUsage.heapUsed;
  const percentage = ((usedMemory / totalMemory) * 100).toFixed(2);

  return {
    used: `${(usedMemory / 1024 / 1024).toFixed(2)} MB`,
    total: `${(totalMemory / 1024 / 1024).toFixed(2)} MB`,
    percentage: `${percentage}%`,
  };
};

// Get CPU usage (simplified)
const getCpuUsage = (): { usage: string } => {
  const cpuUsage = process.cpuUsage();
  const totalUsage = cpuUsage.user + cpuUsage.system;
  
  return {
    usage: `${(totalUsage / 1000000).toFixed(2)} seconds`,
  };
};

/**
 * @desc    Basic health check endpoint
 * @route   GET /health
 * @access  Public
 */
export const healthCheck = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const databaseHealth = await checkDatabaseHealth();
  const memoryUsage = getMemoryUsage();
  const cpuUsage = getCpuUsage();

  // Determine overall health status
  const isHealthy = databaseHealth.status === 'connected';

  const healthResponse: IHealthResponse = {
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
    services: {
      database: databaseHealth,
      memory: memoryUsage,
      cpu: cpuUsage,
    },
  };

  const statusCode = isHealthy ? HttpStatusCode.OK : HttpStatusCode.SERVICE_UNAVAILABLE;

  res.status(statusCode).json({
    success: isHealthy,
    data: healthResponse,
  });
});

/**
 * @desc    Detailed health check endpoint with system information
 * @route   GET /health/detailed
 * @access  Public
 */
export const detailedHealthCheck = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const databaseHealth = await checkDatabaseHealth();
  const memoryUsage = getMemoryUsage();
  const cpuUsage = getCpuUsage();

  // Get database collections (if connected)
  let collections: string[] = [];
  try {
    if (isDatabaseConnected() && mongoose.connection.db) {
      const db = mongoose.connection.db;
      const collectionsList = await db.listCollections().toArray();
      collections = collectionsList.map(col => col.name);
    }
  } catch (error) {
    // Ignore error, collections will remain empty
  }

  // Determine overall health status
  const isHealthy = databaseHealth.status === 'connected';

  const detailedHealthResponse: IDetailedHealthResponse = {
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
    services: {
      database: databaseHealth,
      memory: memoryUsage,
      cpu: cpuUsage,
    },
    system: {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      pid: process.pid,
    },
    database: {
      name: mongoose.connection.name || 'unknown',
      host: mongoose.connection.host || 'unknown',
      readyState: mongoose.connection.readyState,
      ...(collections.length > 0 && { collections }),
    },
  };

  const statusCode = isHealthy ? HttpStatusCode.OK : HttpStatusCode.SERVICE_UNAVAILABLE;

  res.status(statusCode).json({
    success: isHealthy,
    data: detailedHealthResponse,
  });
});

/**
 * @desc    Readiness probe for Kubernetes/Docker
 * @route   GET /health/ready
 * @access  Public
 */
export const readinessCheck = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const isReady = isDatabaseConnected();

  if (isReady) {
    res.status(HttpStatusCode.OK).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
    });
  } else {
    res.status(HttpStatusCode.SERVICE_UNAVAILABLE).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      reason: 'Database not connected',
    });
  }
});

/**
 * @desc    Liveness probe for Kubernetes/Docker
 * @route   GET /health/live
 * @access  Public
 */
export const livenessCheck = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // Simple liveness check - if the process is running, it's alive
  res.status(HttpStatusCode.OK).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
  });
});