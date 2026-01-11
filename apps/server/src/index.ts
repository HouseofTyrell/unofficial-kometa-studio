import Fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import { initDatabase, closeDatabase } from './db/database.js';
import { ConfigRepository } from './db/config.repository.js';
import { ProfileRepository } from './db/profile.repository.js';
import { validateMasterKey } from './crypto/encryption.js';
import { healthRoutes } from './routes/health.routes.js';
import { configRoutes } from './routes/config.routes.js';
import { profileRoutes } from './routes/profile.routes.js';

// Load environment variables
dotenv.config();

const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '127.0.0.1';
const DATABASE_PATH = process.env.DATABASE_PATH || './data/kometa-studio.db';
const MASTER_KEY = process.env.KOMETA_STUDIO_MASTER_KEY;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

async function start() {
  // Validate master key
  if (!MASTER_KEY) {
    console.error('ERROR: KOMETA_STUDIO_MASTER_KEY environment variable is required');
    console.error('Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"');
    process.exit(1);
  }

  if (!validateMasterKey(MASTER_KEY)) {
    console.error('ERROR: KOMETA_STUDIO_MASTER_KEY must be a valid 32-byte base64-encoded key');
    console.error('Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"');
    process.exit(1);
  }

  // Initialize database
  console.log(`Initializing database at ${DATABASE_PATH}`);
  initDatabase(DATABASE_PATH);

  // Create repositories
  const configRepo = new ConfigRepository();
  const profileRepo = new ProfileRepository(MASTER_KEY);

  // Create Fastify instance
  const fastify = Fastify({
    logger: {
      level: 'info',
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
    },
  });

  // Register CORS
  await fastify.register(cors, {
    origin: CORS_ORIGIN,
    credentials: true,
  });

  // Register routes
  await fastify.register(healthRoutes);
  await fastify.register(configRoutes, { configRepo, profileRepo });
  await fastify.register(profileRoutes, { profileRepo });

  // Error handler
  fastify.setErrorHandler((error, request, reply) => {
    fastify.log.error(error);
    reply.status(500).send({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log('\nShutting down gracefully...');
    await fastify.close();
    closeDatabase();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  // Start server
  try {
    await fastify.listen({ port: PORT, host: HOST });
    console.log(`\n🚀 Kometa Studio Server running at http://${HOST}:${PORT}`);
    console.log(`📁 Database: ${DATABASE_PATH}`);
    console.log(`🔒 Secrets encryption: enabled\n`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
