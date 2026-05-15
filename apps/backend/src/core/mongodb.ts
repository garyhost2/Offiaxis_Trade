import mongoose from 'mongoose';
import { config } from './config';
import log from './logger';

export async function connectDB(): Promise<void> {
  mongoose.set('strictQuery', true);

  mongoose.connection.on('connected', () => {
    log.info('MongoDB connected', { requestId: 'startup' });
  });

  mongoose.connection.on('error', (err: Error) => {
    log.error('MongoDB connection error', { requestId: 'startup', error: err.message });
  });

  mongoose.connection.on('disconnected', () => {
    log.warn('MongoDB disconnected', { requestId: 'startup' });
  });

  await mongoose.connect(config.MONGO_URL, {
    dbName: config.DB_NAME,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });
}

export { mongoose };
