import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null, mongod: null };
}

async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    if (process.env.NODE_ENV === 'development') {
      // Development mode: Use in-memory MongoDB
      if (!cached.mongod) {
        cached.mongod = await MongoMemoryServer.create();
      }
      
      const uri = cached.mongod.getUri();
      console.log(`[Dev Mode] Connecting to in-memory MongoDB at ${uri}`);
      
      cached.promise = mongoose.connect(uri, opts).then((mongoose) => {
        return mongoose;
      });
    } else {
      // Production mode: Use standard MongoDB URI
      const MONGODB_URI = process.env.MONGODB_URI;
      
      if (!MONGODB_URI) {
        throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
      }

      cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
        return mongoose;
      });
    }
  }
  
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectToDatabase;
