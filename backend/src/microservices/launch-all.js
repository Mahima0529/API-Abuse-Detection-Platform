/**
 * Unified Microservices Launcher
 * Boots Rate Limiting Service (5001), Abuse Detection Service (5002),
 * Analytics Service (5003), and Alert Service (5004) concurrently.
 */
console.log('====================================================');
console.log('LAUNCHING MICROSERVICES CLUSTER (PORTS 5001-5004)');
console.log('====================================================\n');

require('./rate-limiting-service');
require('./abuse-detection-service');
require('./analytics-service');
require('./alert-service');
