import mongoose from 'mongoose';

const dbName = process.env.MONGO_DB || undefined;

export async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI is not set');
  await mongoose.connect(uri, dbName ? { dbName } : {});
  console.log('MongoDB connected');
}
