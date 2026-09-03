const dotenv = require('dotenv');
dotenv.config();

const app = require('./app');
const { connectDB } = require('./config/db');
const { initializeKafka } = require('./config/kafka');
const { initAnalyticsConsumer } = require('./consumers/analytics.consumer');
const { initAlertsConsumer } = require('./consumers/alerts.consumer');
const { initLoggingConsumer } = require('./consumers/logging.consumer');

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception] Shutting down...', err.name, err.message);
  process.exit(1);
});

// Connect SQL Database via Prisma Engine
connectDB();

// Initialize Apache Kafka Event Engine & Consumer Services
initializeKafka().then(() => {
  initAnalyticsConsumer();
  initAlertsConsumer();
  initLoggingConsumer();
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`[Backend Server] Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT} (SQL Prisma Engine + Kafka Event Streaming)`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('[Unhandled Rejection] Shutting down...', err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
