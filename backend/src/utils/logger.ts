import winston from 'winston';
import path from 'path';
import { env, isDevelopment, isProduction } from '@/config/env';
import '@/types/logger.types';

// Define log levels
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

// Define colors for console output
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  debug: 'blue',
};

// Add colors to winston
winston.addColors(logColors);

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaString = '';
    if (Object.keys(meta).length > 0) {
      metaString = `\n${JSON.stringify(meta, null, 2)}`;
    }
    return `${timestamp} [${level}]: ${message}${metaString}`;
  })
);

// Custom format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create transports array
const transports: winston.transport[] = [];

// Console transport (always enabled in development)
if (isDevelopment()) {
  transports.push(
    new winston.transports.Console({
      level: env.LOG_LEVEL,
      format: consoleFormat,
    })
  );
}

// File transports (enabled in production and development)
if (isProduction() || isDevelopment()) {
  // Ensure logs directory exists
  const logsDir = path.dirname(env.LOG_FILE_PATH);
  
  // Combined log file (all levels)
  transports.push(
    new winston.transports.File({
      filename: env.LOG_FILE_PATH,
      level: env.LOG_LEVEL,
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );

  // Error log file (errors only)
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

// Create logger instance
export const logger = winston.createLogger({
  levels: logLevels,
  level: env.LOG_LEVEL,
  format: fileFormat,
  transports,
  exitOnError: false,
  silent: env.NODE_ENV === 'test', // Disable logging in test environment
});

// Add custom methods to logger instance
logger.logError = (message: string, error?: Error | any, meta?: any): void => {
  const logMeta = {
    ...meta,
    ...(error && {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
        ...(error.code && { code: error.code }),
        ...(error.status && { status: error.status }),
      },
    }),
  };

  logger.error(message, logMeta);
};

logger.logWarn = (message: string, meta?: any): void => {
  logger.warn(message, meta);
};

logger.logInfo = (message: string, meta?: any): void => {
  logger.info(message, meta);
};

logger.logDebug = (message: string, meta?: any): void => {
  logger.debug(message, meta);
};

logger.logAuth = (message: string, meta?: any): void => {
  logger.info(`Auth: ${message}`, meta);
};

// Create a stream object for Morgan HTTP request logging
export const loggerStream = {
  write: (message: string): void => {
    // Remove trailing newline and log as info
    logger.info(message.trim());
  },
};

// Helper functions for structured logging
export const logError = (message: string, error?: Error | any, meta?: any): void => {
  const logMeta = {
    ...meta,
    ...(error && {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
        ...(error.code && { code: error.code }),
        ...(error.status && { status: error.status }),
      },
    }),
  };

  logger.error(message, logMeta);
};

export const logWarn = (message: string, meta?: any): void => {
  logger.warn(message, meta);
};

export const logInfo = (message: string, meta?: any): void => {
  logger.info(message, meta);
};

export const logDebug = (message: string, meta?: any): void => {
  logger.debug(message, meta);
};

// HTTP request logging helper
export const logHttpRequest = (req: any, res: any, responseTime?: number): void => {
  const logData = {
    method: req.method,
    url: req.originalUrl || req.url,
    statusCode: res.statusCode,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress,
    ...(responseTime && { responseTime: `${responseTime}ms` }),
    ...(req.user && { userId: req.user.id }),
  };

  const message = `${req.method} ${req.originalUrl || req.url} ${res.statusCode}`;
  
  if (res.statusCode >= 400) {
    logger.warn(message, logData);
  } else {
    logger.info(message, logData);
  }
};

// Database operation logging helper
export const logDatabaseOperation = (operation: string, collection: string, meta?: any): void => {
  logger.debug(`Database ${operation}`, {
    operation,
    collection,
    ...meta,
  });
};

// Authentication logging helper
export const logAuthEvent = (event: string, userId?: string, meta?: any): void => {
  logger.info(`Auth: ${event}`, {
    event,
    ...(userId && { userId }),
    ...meta,
  });
};

// Performance logging helper
export const logPerformance = (operation: string, duration: number, meta?: any): void => {
  const level = duration > 1000 ? 'warn' : 'debug'; // Warn if operation takes more than 1 second
  
  logger.log(level, `Performance: ${operation}`, {
    operation,
    duration: `${duration}ms`,
    ...meta,
  });
};

// Security event logging helper
export const logSecurityEvent = (event: string, severity: 'low' | 'medium' | 'high', meta?: any): void => {
  const level = severity === 'high' ? 'error' : severity === 'medium' ? 'warn' : 'info';
  
  logger.log(level, `Security: ${event}`, {
    event,
    severity,
    timestamp: new Date().toISOString(),
    ...meta,
  });
};

export default logger;