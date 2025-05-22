// CI/CD Lab App — Express server with Unleash feature flag integration
// Supports both local and Kubernetes deployments with environment-based config

require('dotenv').config();

const express = require('express');
const { initialize } = require('unleash-client');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Unleash SDK (uses env vars if present, defaults to K8s config)
const unleash = initialize({
  url: process.env.UNLEASH_URL || 'http://unleash-server:4242/api/',
  appName: 'cicd-lab-app',
  environment: 'development',
  refreshInterval: 2,
  customHeaders: {
    Authorization: process.env.UNLEASH_API_TOKEN || 'default-token',
  },
});

// Log when Unleash SDK is ready and fetch initial toggles
unleash.on('ready', async () => {
  console.log('✅ Unleash is ready');
  await unleash.repository.fetch();
  console.log('🔄 Flags fetched on boot');
});

// Log Unleash client-side errors
unleash.on('error', (err) => {
  console.error('❌ Unleash error:', err);
});

// Root route with flag-controlled message
app.get('/', (req, res) => {
  const context = { userId: 'ci-cd-lab' };
  const betaEnabled = unleash.isEnabled('show-beta-banner', context);

  console.log(`🧪 Flag 'show-beta-banner' is ${betaEnabled ? 'ENABLED' : 'DISABLED'}`);

  const baseMessage = 'Welcome to the CI/CD Release Engineering Lab 🚀';
  const betaMessage = '\n🧪 Beta Feature: Releasing smarter, one flag at a time.';

  const response = baseMessage + (betaEnabled ? betaMessage : '');
  console.log(`📤 Responding with:\n${response}`);
  res.send(response);
});

// Health check route
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Start the app on defined port
app.listen(PORT, () => {
  console.log(`✅ App running on port ${PORT}`);
});
 
