require('dotenv').config();
const express = require('express');
const { initialize } = require('unleash-client');

const app = express();
const PORT = process.env.PORT || 3000;

// Expose health endpoint early so health checks don't fail
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Start the server immediately
app.listen(PORT, () => {
  console.log(`✅ App running on port ${PORT}`);
});

// Initialize Unleash SDK
const unleash = initialize({
  url: 'http://localhost:4242/api/',
  appName: 'cicd-lab-app',
  environment: 'development',
  customHeaders: {
    Authorization: process.env.UNLEASH_API_TOKEN,
  },
});

// Flag-aware route waits until Unleash is ready
unleash.on('ready', () => {
  console.log('✅ Unleash is ready');

  app.get('/', (req, res) => {
    const context = { userId: 'ci-cd-lab' };
    const betaEnabled = unleash.isEnabled('show-beta-banner', context);

    console.log(`🧪 Flag 'show-beta-banner' is ${betaEnabled ? 'ENABLED' : 'DISABLED'}`);

    const baseMessage = 'Welcome to the CI/CD Release Engineering Lab 🚀';
    const betaMessage = '\n🧪 Beta Feature: Releasing smarter, one flag at a time.';

    res.send(baseMessage + (betaEnabled ? betaMessage : ''));
  });
});

unleash.on('error', console.error);
 
