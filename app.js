// CI/CD Lab App — Express server with runtime feature flag integration via Unleash
// Responds to root route with a deploy-time configuration-based beta banner (BETA_BANNER_ENABLED),
// while also supporting runtime feature toggles for other features.

require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Initialize Unleash SDK
let unleash;
try {
  const { initialize } = require('unleash-client');
  unleash = initialize({
    url: process.env.UNLEASH_URL,
    appName: process.env.UNLEASH_APP_NAME || 'cicd-lab-app',
    environment: process.env.NODE_ENV || 'development',
    refreshInterval: parseInt(process.env.UNLEASH_REFRESH_INTERVAL) || 2,
    customHeaders: {
      Authorization: process.env.UNLEASH_API_TOKEN,
    },
  });

  // Log when Unleash SDK is ready and fetch initial toggles
  unleash.on('ready', async () => {
    logger.info('✅ Unleash is ready');
    try {
      await unleash.repository.fetch();
      logger.info('🔄 Flags fetched on boot');
    } catch (error) {
      logger.error('Failed to fetch initial flags:', error);
    }
  });

  // Log Unleash client-side errors
  unleash.on('error', (err) => {
    logger.error('❌ Unleash error:', err);
  });
} catch (error) {
  logger.error('Failed to initialize Unleash:', error);
  process.exit(1);
}

// Root route with flag-controlled message
app.get('/', (req, res) => {
  const context = { 
    userId: 'ci-cd-lab',
    groupId: 'show-beta-banner'  // Add groupId to match Unleash configuration
  };
  let betaEnabled = false;

  if (unleash) {
    betaEnabled = unleash.isEnabled('show-beta-banner', context);
  } else {
    // Fallback to environment variable if Unleash is not available
    betaEnabled = process.env.BETA_BANNER_ENABLED === 'true';
  }

  logger.info(`Flag 'show-beta-banner' is ${betaEnabled ? 'ENABLED' : 'DISABLED'}`);

  const baseMessage = 'Welcome to the CI/CD Release Engineering Lab 🚀';
  const betaMessage = '\n🧪 Beta Feature: Releasing smarter, one flag at a time.';

  const response = baseMessage + (betaEnabled ? betaMessage : '');
  logger.info(`Responding with:\n${response}`);
  res.send(response);
});

// Health check route
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Error handling middleware
app.use((err, req, res) => {
  logger.error('Unhandled error:', err);
  res.status(500).send('Internal Server Error');
});

// Start the server
const server = app.listen(PORT, () => {
  logger.info(`✅ App running on port ${PORT}`);
});

// Graceful shutdown
const shutdown = async () => {
  logger.info('Received shutdown signal');
  
  // Close server
  server.close(() => {
    logger.info('Server closed');
  });

  // Cleanup Unleash
  if (unleash) {
    try {
      await unleash.destroy();
      logger.info('Unleash client destroyed');
    } catch (error) {
      logger.error('Error destroying Unleash client:', error);
    }
  }

  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
 
