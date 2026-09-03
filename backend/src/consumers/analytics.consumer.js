const { TOPICS, subscribeConsumer } = require('../config/kafka');

const analyticsMetrics = {
  totalProcessedEvents: 0,
  requestEventsCount: 0,
  authEventsCount: 0,
  abuseEventsCount: 0,
};

const initAnalyticsConsumer = () => {
  subscribeConsumer(TOPICS.API_REQUESTS, 'analytics-group', async (event) => {
    analyticsMetrics.totalProcessedEvents++;
    analyticsMetrics.requestEventsCount++;
  });

  subscribeConsumer(TOPICS.USER_AUTH, 'analytics-group', async (event) => {
    analyticsMetrics.totalProcessedEvents++;
    analyticsMetrics.authEventsCount++;
  });

  subscribeConsumer(TOPICS.SECURITY_ABUSE, 'analytics-group', async (event) => {
    analyticsMetrics.totalProcessedEvents++;
    analyticsMetrics.abuseEventsCount++;
  });

  console.log('[Kafka Consumer] Analytics Consumer initialized (Group: analytics-group).');
};

const getAnalyticsMetrics = () => analyticsMetrics;

module.exports = {
  initAnalyticsConsumer,
  getAnalyticsMetrics,
};
