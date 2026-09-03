const { TOPICS, subscribeConsumer } = require('../config/kafka');

const alertLogs = [];

const initAlertsConsumer = () => {
  subscribeConsumer(TOPICS.SECURITY_ABUSE, 'alerts-group', async (event) => {
    const { eventType, payload, timestamp } = event;

    if (eventType === 'ENTITY_BLOCKED' || eventType === 'HIGH_RISK_DETECTED') {
      const alertMsg = `[ALERT] ${eventType} for IP ${payload.ipAddress || payload.entityValue} (Risk Score: ${payload.score || payload.riskScore}). Block TTL: ${payload.ttlSeconds || 300}s`;
      console.warn(`[Kafka Alerts Consumer] ${alertMsg}`);

      alertLogs.unshift({
        id: event.id,
        eventType,
        entity: payload.ipAddress || payload.entityValue,
        score: payload.score || payload.riskScore,
        alertMsg,
        timestamp,
      });

      if (alertLogs.length > 50) alertLogs.pop();
    }
  });

  console.log('[Kafka Consumer] Alerts Consumer initialized (Group: alerts-group).');
};

const getAlertLogs = () => alertLogs;

module.exports = {
  initAlertsConsumer,
  getAlertLogs,
};
