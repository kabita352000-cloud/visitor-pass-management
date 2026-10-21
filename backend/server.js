import 'dotenv/config';
import mongoose from 'mongoose';
import app from './app.js';
import { getJwtSecret } from './src/middleware/auth.js';

const port = Number(process.env.PORT) || 5000;
const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/visitor_pass_management';

try {
  getJwtSecret();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

try {
  await mongoose.connect(mongoUri);
  const server = app.listen(port, () => {
    console.info(`Visitor Pass API listening on port ${port}`);
  });

  const shutdown = async signal => {
    console.info(`${signal} received; closing API`);
    server.close(async error => {
      if (error) {
        console.error('Failed to close API server:', error);
        process.exitCode = 1;
      }
      await mongoose.disconnect();
    });
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
} catch (error) {
  console.error('MongoDB connection failed:', error.message);
  process.exit(1);
}
