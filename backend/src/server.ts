import { createServer } from 'http';
import App from '@/app';
import { env } from '@/config/env';
import { logger } from '@/utils/logger';
import { database } from '@/config/database';

class Server {
  private app: App;
  private server: any;
  private dbConnection = database;

  constructor() {
    this.app = new App();
  }

  public async start(): Promise<void> {
    try {
      // Initialize database connection
      await this.initializeDatabase();

      // Start HTTP server
      await this.startHttpServer();

      // Log successful startup
      this.logStartupInfo();

    } catch (error) {
      logger.logError('Failed to start server', error as Error, {
        port: env.PORT,
        environment: env.NODE_ENV,
      });
      process.exit(1);
    }
  }

  private async initializeDatabase(): Promise<void> {
    try {
      logger.logInfo('Connecting to database...');
      await this.dbConnection.connect();
      logger.logInfo('Database connected successfully');
    } catch (error) {
      logger.logError('Database connection failed', error as Error, {
        mongoUri: env.MONGODB_URI.replace(/\/\/.*@/, '//***:***@'), // Hide credentials
      });
      throw error;
    }
  }

  private async startHttpServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.server = createServer(this.app.getApp());

        // Store server reference in app for graceful shutdown
        this.app.getApp().set('server', this.server);

        this.server.listen(env.PORT, () => {
          resolve();
        });

        this.server.on('error', (error: NodeJS.ErrnoException) => {
          if (error.syscall !== 'listen') {
            reject(error);
            return;
          }

          const bind = typeof env.PORT === 'string' ? `Pipe ${env.PORT}` : `Port ${env.PORT}`;

          switch (error.code) {
            case 'EACCES':
              logger.logError(`${bind} requires elevated privileges`, error);
              reject(error);
              break;
            case 'EADDRINUSE':
              logger.logError(`${bind} is already in use`, error);
              reject(error);
              break;
            default:
              reject(error);
          }
        });

        // Handle server timeout
        this.server.timeout = 30000; // 30 seconds

        // Handle keep-alive timeout
        this.server.keepAliveTimeout = 65000; // 65 seconds

        // Handle headers timeout
        this.server.headersTimeout = 66000; // 66 seconds

      } catch (error) {
        reject(error);
      }
    });
  }

  private logStartupInfo(): void {
    const startupInfo = {
      message: 'Server started successfully',
      port: env.PORT,
      environment: env.NODE_ENV,
      nodeVersion: process.version,
      platform: process.platform,
      architecture: process.arch,
      processId: process.pid,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };

    logger.logInfo('🚀 Server startup complete', startupInfo);

    // Log available endpoints
    const baseUrl = `http://localhost:${env.PORT}`;
    const endpoints = {
      'Health Check': `${baseUrl}/health`,
      'API Info': `${baseUrl}/api/v1`,
      'Detailed Health': `${baseUrl}/health/detailed`,
      'Readiness Probe': `${baseUrl}/health/ready`,
      'Liveness Probe': `${baseUrl}/health/live`,
    } as Record<string, string>;

    if (env.NODE_ENV === 'development') {
      endpoints['API Documentation'] = `${baseUrl}/api-docs`;
    }

    logger.logInfo('📍 Available endpoints:', endpoints);

    // Log environment-specific information
    if (env.NODE_ENV === 'development') {
      logger.logInfo('🔧 Development mode enabled');
      logger.logInfo('📝 API documentation available at /api-docs');
    } else if (env.NODE_ENV === 'production') {
      logger.logInfo('🏭 Production mode enabled');
      logger.logInfo('🔒 Security features active');
    }

    // Log database information
    logger.logInfo('Database connection established', {
      status: 'connected',
      connectionState: this.dbConnection.getConnectionStatus(),
    });
  }

  public async stop(): Promise<void> {
    try {
      logger.logInfo('Shutting down server...');

      // Close HTTP server
      if (this.server) {
        await new Promise<void>((resolve, reject) => {
          this.server.close((err?: Error) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        });
        logger.logInfo('HTTP server closed');
      }

      // Close database connection
      await this.dbConnection.disconnect();
      logger.logInfo('Database connection closed');

      logger.logInfo('Server shutdown complete');
    } catch (error) {
      logger.logError('Error during server shutdown', error as Error);
      throw error;
    }
  }
}

// Create and start server
const server = new Server();

// Start the server
server.start().catch((error) => {
  logger.logError('Failed to start application', error);
  process.exit(1);
});

// Export server instance for testing
export default server;