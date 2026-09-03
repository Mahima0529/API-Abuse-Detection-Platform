const mongoose = require('mongoose');

const requestLogSchema = new mongoose.Schema(
  {
    ipAddress: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    endpoint: {
      type: String,
      required: true,
      index: true,
    },
    method: {
      type: String,
      required: true,
    },
    statusCode: {
      type: Number,
      required: true,
    },
    responseTimeMs: {
      type: Number,
      default: 0,
    },
    userAgent: {
      type: String,
      default: '',
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

// Compound index for querying user/IP activity over time ranges
requestLogSchema.index({ ipAddress: 1, timestamp: -1 });
requestLogSchema.index({ userId: 1, timestamp: -1 });

const RequestLog = mongoose.model('RequestLog', requestLogSchema);

module.exports = RequestLog;
