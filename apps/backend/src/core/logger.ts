import winston from 'winston';
import { config } from './config';

const { combine, timestamp, json, errors } = winston.format;

export interface LogMeta {
  orgId?: string;
  requestId?: string;
  userId?: string;
  [key: string]: unknown;
}

const logger = winston.createLogger({
  level: config.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'ISO' }),
    json()
  ),
  defaultMeta: {},
  transports: [
    new winston.transports.Console({
      silent: config.NODE_ENV === 'test',
    }),
  ],
});

function formatLog(message: string, meta: LogMeta = {}) {
  return {
    message,
    timestamp: new Date().toISOString(),
    orgId: meta.orgId ?? 'unknown',
    requestId: meta.requestId ?? 'unknown',
    userId: meta.userId ?? 'unknown',
    ...meta,
  };
}

export const log = {
  info: (message: string, meta?: LogMeta) => logger.info(formatLog(message, meta)),
  warn: (message: string, meta?: LogMeta) => logger.warn(formatLog(message, meta)),
  error: (message: string, meta?: LogMeta) => logger.error(formatLog(message, meta)),
  debug: (message: string, meta?: LogMeta) => logger.debug(formatLog(message, meta)),
};

export default log;
