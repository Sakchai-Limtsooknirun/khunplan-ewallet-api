const uuidv4 = require('uuid/v4');
const crypto = require('crypto');
const moment = require('moment-timezone');
const GatewayTransaction = require('../models/gatewayTransaction.model');
const APIError = require('../utils/APIError');
const httpStatus = require('http-status');
const Customer = require('../models/customer.model');
const Transaction = require('../models/transaction.model');

exports.transfer = async (accountNumber, amount, destinationAccountNumber, detail, category) => {
    const reference = uuidv4();
    const transaction = new Transaction();
    const transactionBeneficiary = new Transaction();
    if (category === 'main') {
      transaction.amount = -amount;
      transaction.otherAmount = -amount;
      transactionBeneficiary.amount = amount;
    } else if (category === 'rest') {
      transaction.amount = -amount;
      transaction.restAmount = -amount;
      transactionBeneficiary.restAmount = amount;
    } else if (category === 'hotel') {
      transaction.amount = -amount;
      transaction.hotelAmount = -amount;
      transactionBeneficiary.hotelAmount = amount;
    }
    transaction.operation = 'transfer';
    transaction.accountNumber = accountNumber;
    transaction.destinationAccountNumber = destinationAccountNumber;
    transaction.reference = 'transfer_to_account:' + destinationAccountNumber;
    transaction.detail = detail;
    transaction.category = category
    const savedTransaction = await transaction.save();
    const savedCustomer = await Customer.findOne({ 'accountNumber': accountNumber });

    transactionBeneficiary.operation = 'transfer';
    transactionBeneficiary.accountNumber = destinationAccountNumber;
    transactionBeneficiary.reference = 'transfer_from_account:' + accountNumber;
    // transactionBeneficiary.detail = detail;
    // transactionBeneficiary.category = category
    const savedTransactionBeneficiary = await transactionBeneficiary.save();

    const response = { transaction: transaction.transform(), customer: savedCustomer.transformBalance() }
    
    return response;
  };