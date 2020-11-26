const mongoose = require('mongoose');
const crypto = require('crypto');
const moment = require('moment-timezone');


/**
 * Gateway Transaction Schema
 * @private
 */
const pocketType = ['main', 'hotel', 'rest', 'other']

const gatewayTransactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true
  },
  paymentDate: {
    type: Date,
    required: true
  },
  amount: {
    type: Number,
    default: 0,
    required: true,
  },
  hotelAmount: {
    type: Number,
    default: 0
  },
  restAmount: {
    type: Number,
    default: 0
  },
  // otherAmount: {
  //   type: Number,
  //   min: 0,
  //   default: 0
  // },
  detail: {
    type: String,
    default: 'no payment detail',
  },
  category: {
    type: String,
    default: 'main',
    enum: pocketType
  },
  lineUserId: {
    type: String,
    default: 'user undefind',
  },
  // amountMiniPocket1: {
  //   type: Number,
  //   default: 0,
  // },
  // amountMiniPocket2: {
  //   type: Number,
  //   default: 0,
  // },
  // amountMiniPocket3: {
  //   type: Number,
  //   default: 0,
  // },
  authorizationCode: {
    type: Number,
    required: true,
  },
}, {
  timestamps: true,
});

/**
 * Methods
 */
gatewayTransactionSchema.method({
  transform() {
    const transformed = {};
    const fields = ['transactionId', 'status', 'paymentDate', 'amount', 'hotelAmount', 'restAmount', 'authorizationCode'];

    fields.forEach((field) => {
      transformed[field] = this[field];
    });

    return transformed;
  },
});


module.exports = mongoose.model('GatewayTransaction', gatewayTransactionSchema);