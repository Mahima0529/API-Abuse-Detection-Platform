const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const proxy = require('express-http-proxy');

const app = express();
// Default to 8080 when running locally, or process.env.PORT when running in Docker
const PORT = process.env.GATEWAY_PORT || process.env.PORT || 8080;

// Target backend server configuration
const BACKEND_HOST = process.env.BACKEND_HOST || '127.0.0.1';
const BACKEND_PORT = process.env.BACKEND_PORT || 5000;
const backendUrl = process.env.BACKEND_URL || `http://${BACKEND_HOST}:${BACKEND_PORT}`;

app.use(cors());
app.use(morgan('dev'));

// Gateway Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    service: 'API Gateway',
    port: PORT,
    targetBackend: backendUrl,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Proxy all /api/v1 requests to single backend Express server at http://microservices-cluster:5000
app.use(
  '/api/v1',
  proxy(backendUrl, {
    proxyReqPathResolver: (req) => `/api/v1${req.url}`,
  })
);

app.listen(PORT, () => {
  console.log(`[API Gateway] Ingress Gateway running on port ${PORT}`);
  console.log(`[API Gateway] Forwarding /api/v1 -> ${backendUrl}`);
});
