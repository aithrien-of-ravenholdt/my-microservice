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

  // Define routes after SDK is ready
  app.get('/', (req, res) => {
    const context = { userId: 'ci-cd-lab' };
    const betaEnabled = unleash.isEnabled('show-beta-banner', context);

    console.log('🧪 DEBUG: Flag check for context:', context);
    console.log('🧪 Flag "show-beta-banner" is', betaEnabled ? 'ENABLED' : 'DISABLED');

    const baseMessage = 'Welcome to the CI/CD Release Engineering Lab 🚀';
    const betaMessage = '\n🧪 Beta Feature: Releasing smarter, one flag at a time.';

    res.send(baseMessage + (betaEnabled ? betaMessage : ''));
  });

  app.get('/health', (req, res) => res.status(200).send('OK'));

  app.listen(PORT, () => {
    console.log(`✅ App running on port ${PORT}`);
  });
});

unleash.on('error', console.error);
 
