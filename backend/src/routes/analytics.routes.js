const express = require('express');
const {
  getRequestLogs,
  getDashboardMetrics,
  getKafkaEvents,
  getStats,
  evaluateRisk,
  getSecurityEvents,
  getBlockedEntities,
} = require('../controllers/analytics.controller');

const router = express.Router();

router.get('/requests', getRequestLogs);
router.get('/dashboard-metrics', getDashboardMetrics);
router.get('/kafka-events', getKafkaEvents);
router.get('/stats', getStats);
router.get('/risk-eval', evaluateRisk);
router.get('/security-events', getSecurityEvents);
router.get('/blocked-entities', getBlockedEntities);

module.exports = router;
