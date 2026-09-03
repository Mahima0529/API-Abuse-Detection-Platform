const { Kafka } = require('kafkajs');
const EventEmitter = require('events');

const broker = process.env.KAFKA_BROKER || '127.0.0.1:9092';
const clientId = process.env.KAFKA_CLIENT_ID || 'api-abuse-detection-service';

let producer = null;
let isUsingInMemoryKafka = false;
const eventStreamLog = [];
const eventBus = new EventEmitter();

// Define standard Kafka topics
const TOPICS = {
  API_REQUESTS: 'api-request-events',
  USER_AUTH: 'user-auth-events',
  SECURITY_ABUSE: 'security-abuse-events',
};

const kafka = new Kafka({
  clientId,
  brokers: [broker],
  connectionTimeout: 1000,
  retry: { retries: 1 },
});

const initializeKafka = async () => {
  try {
    const kafkaProducer = kafka.producer();
    await kafkaProducer.connect();
    producer = kafkaProducer;
    console.log(`[Kafka Engine] Connected to live Apache Kafka Broker at ${broker}`);
  } catch (err) {
    console.log(`[Kafka Engine Note] Standalone Kafka broker offline. Initializing high-performance In-Memory Event Streaming Engine.`);
    isUsingInMemoryKafka = true;
  }
};

/**
 * Asynchronously publishes an event to a Kafka topic without blocking client HTTP request latency.
 * @param {string} topic - Target Kafka topic name
 * @param {string} eventType - Specific event classification (e.g. REQUEST_RECEIVED, ENTITY_BLOCKED)
 * @param {Object} payload - Event data payload
 */
const publishEvent = async (topic, eventType, payload) => {
  const eventMessage = {
    id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    topic,
    eventType,
    payload,
    timestamp: new Date().toISOString(),
  };

  // Buffer in recent event stream log (keep last 100 events for monitoring)
  eventStreamLog.unshift(eventMessage);
  if (eventStreamLog.length > 100) eventStreamLog.pop();

  if (producer && !isUsingInMemoryKafka) {
    try {
      await producer.send({
        topic,
        messages: [{ value: JSON.stringify(eventMessage) }],
      });
    } catch (err) {
      console.error(`[Kafka Producer Error] Failed to publish to ${topic}:`, err.message);
    }
  } else {
    // Dispatch to in-memory event bus
    setImmediate(() => {
      eventBus.emit(topic, eventMessage);
      eventBus.emit('all-events', eventMessage);
    });
  }
};

/**
 * Subscribes a consumer callback to a Kafka topic.
 * @param {string} topic - Topic name to consume
 * @param {string} groupId - Consumer group ID
 * @param {Function} callback - Async handler receiving event message
 */
const subscribeConsumer = (topic, groupId, callback) => {
  if (producer && !isUsingInMemoryKafka) {
    const consumer = kafka.consumer({ groupId });
    consumer
      .connect()
      .then(() => {
        return consumer.subscribe({ topic, fromBeginning: false });
      })
      .then(() => {
        return consumer.run({
          eachMessage: async ({ message }) => {
            const parsed = JSON.parse(message.value.toString());
            callback(parsed);
          },
        });
      })
      .catch((err) => {
        console.warn(`[Kafka Consumer Notice - Group ${groupId}]: ${err.message}. Falling back to event bus.`);
        eventBus.on(topic, (eventMessage) => {
          callback(eventMessage).catch((e) => console.error(e.message));
        });
      });
  } else {
    // In-memory listener
    eventBus.on(topic, (eventMessage) => {
      callback(eventMessage).catch((err) => {
        console.error(`[Kafka Consumer Error - Group ${groupId}]:`, err.message);
      });
    });
  }
};

const getEventStreamLogs = () => eventStreamLog;

module.exports = {
  TOPICS,
  initializeKafka,
  publishEvent,
  subscribeConsumer,
  getEventStreamLogs,
  isInMemory: () => isUsingInMemoryKafka,
};
