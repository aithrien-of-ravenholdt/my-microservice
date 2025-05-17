const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;

// Root route
app.get('/', (req, res) => {
  res.send('Welcome to Gabriel Cantero\'s CI/CD Portfolio App');
});

// Health check for probes
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.listen(PORT, () => {
  console.log(`✅ App running on port ${PORT}`);
});
 
