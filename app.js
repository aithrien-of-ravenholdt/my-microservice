require('dotenv').config();

const express = require('express');
const { initialize } = require('unleash-client');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Unleash SDK
const unleash = initialize({
  url: 'http://localhost:4242/api/',
  appName: 'cicd-lab-app',
  environment: 'development',
  refreshInterval: 2,
  customHeaders: {
    Authorization: process.env.UNLEASH_API_TOKEN,
  },
});

unleash.on('ready', async () => {
  console.log('✅ Unleash is ready');
  await unleash.repository.fetch();
  console.log('🔄 Flags fetched on boot');
});

unleash.on('error', (err) => {
  console.error('❌ Unleash error:', err);
});

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

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.listen(PORT, () => {
  console.log(`✅ App running on port ${PORT}`);
});
 
