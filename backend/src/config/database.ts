import mongoose from 'mongoose';
import { env, getDatabaseUri } from './env';
import { logger } from '@/utils/logger';

class DatabaseConnection {
  private static instance: DatabaseConnection;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000; // 5 seconds

  private constructor() {}

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public async connect(): Promise<void> {
    try {
      const mongoUri = getDatabaseUri();
      
      // Mongoose connection options
      const options: mongoose.ConnectOptions = {
        maxPoolSize: 10, // Maintain up to 10 socket connections
        serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        bufferCommands: false, // Disable mongoose buffering
      };

      await mongoose.connect(mongoUri, options);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      logger.info('Successfully connected to MongoDB', {
        database: mongoUri.split('/').pop()?.split('?')[0],
        environment: env.NODE_ENV,
      });

      this.setupEventListeners();
    } catch (error) {
      this.isConnected = false;
      logger.error('Failed to connect to MongoDB', { error });
      await this.handleReconnection();
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await mongoose.disconnect();
      this.isConnected = false;
      logger.info('Disconnected from MongoDB');
    } catch (error) {
      logger.error('Error disconnecting from MongoDB', { error });
    }
  }

  public getConnectionStatus(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  private setupEventListeners(): void {
    mongoose.connection.on('connected', () => {
      this.isConnected = true;
      logger.info('Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (error) => {
      this.isConnected = false;
      logger.error('Mongoose connection error', { error });
    });

    mongoose.connection.on('disconnected', () => {
      this.isConnected = false;
      logger.warn('Mongoose disconnected from MongoDB');
      
      // Attempt to reconnect if not in test environment
      if (env.NODE_ENV !== 'test') {
        void this.handleReconnection();
      }
    });

    mongoose.connection.on('reconnected', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      logger.info('Mongoose reconnected to MongoDB');
    });

    // Handle process termination
    process.on('SIGINT', async () => {
      await this.gracefulShutdown('SIGINT');
    });

    process.on('SIGTERM', async () => {
      await this.gracefulShutdown('SIGTERM');
    });
  }

  private async handleReconnection(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('Max reconnection attempts reached. Giving up.', {
        attempts: this.reconnectAttempts,
        maxAttempts: this.maxReconnectAttempts,
      });
      return;
    }

    this.reconnectAttempts++;
    logger.info('Attempting to reconnect to MongoDB', {
      attempt: this.reconnectAttempts,
      maxAttempts: this.maxReconnectAttempts,
    });

    setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        logger.error('Reconnection attempt failed', { error });
      }
    }, this.reconnectInterval * this.reconnectAttempts); // Exponential backoff
  }

  private async gracefulShutdown(signal: string): Promise<void> {
    logger.info(`Received ${signal}. Gracefully shutting down database connection.`);
    
    try {
      await mongoose.connection.close();
      logger.info('Database connection closed successfully');
      process.exit(0);
    } catch (error) {
      logger.error('Error during graceful shutdown', { error });
      process.exit(1);
    }
  }
}

// Export singleton instance
export const database = DatabaseConnection.getInstance();

// Helper function for easy connection
export const connectToDatabase = async (): Promise<void> => {
  await database.connect();
};

// Helper function to check connection status
export const isDatabaseConnected = (): boolean => {
  return database.getConnectionStatus();
};