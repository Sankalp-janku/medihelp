import mongoose from 'mongoose';
import { env } from './config/env.js';
import { app } from './app.js';

process.on('unhandledRejection', (err) => { console.error('unhandledRejection', err); process.exit(1); });
try {
  await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 10000, maxPoolSize: 20 });
} catch (err) {
  console.error('Cannot connect to MongoDB. Check MONGO_URI and network access:', err.message);
  process.exit(1);
}
mongoose.connection.on('disconnected', () => console.error('MongoDB disconnected'));
const server = app.listen(env.port, () => console.log(`Disha API on :${env.port}`));
server.requestTimeout = 60000;
const shutdown = () => server.close(() => mongoose.disconnect().then(() => process.exit(0)));
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
