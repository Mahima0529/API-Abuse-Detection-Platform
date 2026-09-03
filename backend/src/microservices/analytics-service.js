const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const analyticsRoutes = require('../routes/analytics.routes');
const { initializeKafka } = require('../config/kafka');
const { initAnalyticsConsumer } = require('../consumers/analytics.consumer');
const { connectDB } = require('../config/db');

const app = express();
const PORT = process.env.ANALYTICS_SERVICE_PORT || 5003;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Service Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    service: 'Analytics & Telemetry Microservice',
    port: PORT,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.use('/api/v1/analytics', analyticsRoutes);

connectDB();
initializeKafka().then(() => {
  initAnalyticsConsumer();
});

app.listen(PORT, () => {
  console.log(`[Analytics Service] Microservice running on port ${PORT}`);
});
