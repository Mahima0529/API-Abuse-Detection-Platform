const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { initializeKafka } = require('../config/kafka');
const { initAlertsConsumer, getAlertLogs } = require('../consumers/alerts.consumer');
const { initLoggingConsumer } = require('../consumers/logging.consumer');
const { connectDB } = require('../config/db');

const app = express();
const PORT = process.env.ALERT_SERVICE_PORT || 5004;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Service Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    service: 'Alert & Notification Microservice',
    port: PORT,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get('/api/v1/alerts/feed', (req, res) => {
  const alerts = getAlertLogs();
  res.status(200).json({
    status: 'success',
    results: alerts.length,
    data: { alerts },
  });
});

connectDB();
initializeKafka().then(() => {
  initAlertsConsumer();
  initLoggingConsumer();
});

app.listen(PORT, () => {
  console.log(`[Alert Service] Microservice running on port ${PORT}`);
});
