import { Logger } from 'winston';

// Extend the Winston Logger interface with custom methods
declare module 'winston' {
  interface Logger {
    logError(message: string, error?: Error | any, meta?: any): void;
    logWarn(message: string, meta?: any): void;
    logInfo(message: string, meta?: any): void;
    logDebug(message: string, meta?: any): void;
    logAuth(message: string, meta?: any): void;
  }
}

export interface CustomLogger extends Logger {
  logError(message: string, error?: Error | any, meta?: any): void;
  logWarn(message: string, meta?: any): void;
  logInfo(message: string, meta?: any): void;
  logDebug(message: string, meta?: any): void;
  logAuth(message: string, meta?: any): void;
}