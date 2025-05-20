require('dotenv').config();

const express = require('express');
const { initialize } = require('unleash-client');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Unleash SDK for feature flagging
const unleash = initialize({
  url: 'http://localhost:4242/api/',
  appName: 'cicd-lab-app',
  environment: 'development',
  customHeaders: {
    Authorization: process.env.UNLEASH_API_TOKEN,
  },
});

// Handle Unleash SDK events
unleash.on('ready', () => {
  console.log('✅ Unleash is ready');
});

unleash.on('error', console.error);

// Main route with feature flag behavior
app.get('/', (req, res) => {
  const context = {
    userId: 'ci-cd-lab'  // or use any fixed string for testing
  };

  const betaEnabled = unleash.isEnabled('show-beta-banner', context);

  console.log(`🧪 Flag 'show-beta-banner' is ${betaEnabled ? 'ENABLED' : 'DISABLED'}`);

  const baseMessage = 'Welcome to the CI/CD Release Engineering Lab 🚀';
  const betaMessage = '\n🧪 Beta Feature: Releasing smarter, one flag at a time.';

  res.send(baseMessage + (betaEnabled ? betaMessage : ''));
});

// Health check endpoint for readiness/liveness probes
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

//Start the application server
app.listen(PORT, () => {
  console.log(`✅ App running on port ${PORT}`);
});
 
