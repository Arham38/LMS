import mongoose from 'mongoose';
import env from './env.js';

let isConnected = false;

export const connectDB = async (customUri) => {
  if (isConnected) {
    return mongoose.connection;
  }

  const uri = customUri || env.MONGO_URI;

  try {
    const conn = await mongoose.connect(uri);
    isConnected = true;
    if (env.NODE_ENV !== 'test') {
      console.log(`MongoDB Connected: ${conn.connection.host}`);
    }
    return conn.connection;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    if (env.NODE_ENV === 'production') {
      process.exit(1);
    } else if (env.NODE_ENV !== 'test') {
      console.warn('⚠️ Server continuing in development mode without active database connection.');
    }
  }
};

export const disconnectDB = async () => {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
};

export default connectDB;
