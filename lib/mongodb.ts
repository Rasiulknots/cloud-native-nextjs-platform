import mongoose from "mongoose";

function getMongoUri(): string {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("Missing MONGODB_URI in environment variables.");
  }

  return uri;
}

const MONGODB_URI = getMongoUri();

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Keep one cache object on the global scope so hot reloads in development
// don't create new connections on every code change.
const globalForMongoose = globalThis as typeof globalThis & {
  _mongooseCache?: MongooseCache;
};

const cached = globalForMongoose._mongooseCache ?? {
  conn: null,
  promise: null,
};

globalForMongoose._mongooseCache = cached;

export async function connectToDatabase(): Promise<typeof mongoose> {
  // Reuse the existing open connection whenever possible.
  if (cached.conn) {
    return cached.conn;
  }

  // If there is no active connection, create one shared promise so
  // concurrent requests don't start multiple connections at once.
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    // Reset the promise so the next attempt can retry cleanly.
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

export default connectToDatabase;
