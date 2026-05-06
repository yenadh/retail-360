// src/lib/mongodb.ts

import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is missing in environment variables");
}

type CachedConnection = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalWithMongoose = global as typeof global & {
  mongooseCache?: CachedConnection;
};

if (!globalWithMongoose.mongooseCache) {
  globalWithMongoose.mongooseCache = {
    conn: null,
    promise: null,
  };
}

export async function connectDB() {
  const cached = globalWithMongoose.mongooseCache;

  if (!cached) {
    throw new Error("Mongoose cache not initialized");
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI as string);
  }

  cached.conn = await cached.promise;

  return cached.conn;
}
