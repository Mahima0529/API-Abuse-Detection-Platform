const { TOPICS, subscribeConsumer } = require('../config/kafka');
const { prisma } = require('../config/db');

const initLoggingConsumer = () => {
  subscribeConsumer(TOPICS.SECURITY_ABUSE, 'logging-group', async (event) => {
    const { eventType, payload } = event;

    // Asynchronously log audit record into SQL database
    try {
      await prisma.securityEvent.create({
        data: {
          eventType: eventType,
          entityType: 'IP',
          entityValue: payload.ipAddress || payload.entityValue || '127.0.0.1',
          riskScore: payload.score || payload.riskScore || 0,
          details: JSON.stringify(payload),
        },
      });
    } catch (err) {
      console.error('[Kafka Logging Consumer Error]:', err.message);
    }
  });

  console.log('[Kafka Consumer] Logging Consumer initialized (Group: logging-group).');
};

module.exports = {
  initLoggingConsumer,
};
