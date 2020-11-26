const uuidv4 = require('uuid/v4');
const crypto = require('crypto');
const moment = require('moment-timezone');
const GatewayTransaction = require('../models/gatewayTransaction.model');
const APIError = require('../utils/APIError');
const httpStatus = require('http-status');
const Customer = require('../models/customer.model');
const Transaction = require('../models/transaction.model');

async function simulateGatewayCall(card, amount, hotelAmount, restAmount, detail, category) {
    
    let status = 'success';
    if(card === '4242424242424242'){
        status = 'failure';
    }

    const hex = crypto.randomBytes(Math.ceil(6/2))
    .toString('hex')
    .slice(0,6);
    const auth_code = parseInt(hex, 16);

    return {
        'transactionId': uuidv4(),
        'status': status,
        'paymentDate': moment(),
        'amount': amount,
        'hotelAmount': hotelAmount,
        'restAmount': restAmount,
        'detail': detail,
        'category': category,
        'authorizationCode': auth_code,
    };
}

exports.debitCard = async (accountNumber, card, amount, hotelAmount, restAmount, detail, category) => {
    const gatewayResponse = await simulateGatewayCall(card, amount, hotelAmount, restAmount, detail, category);
    const gatewayTransaction = new GatewayTransaction(gatewayResponse);
    const savedGatewayTransaction = await gatewayTransaction.save();
    if(savedGatewayTransaction.status === 'failure'){
        throw new APIError({
            message: 'Payment Rejected',
            status: httpStatus.PAYMENT_REQUIRED,
          });
    }

    amount ? (amount = parseInt(amount)) : (amount=0)
    hotelAmount ? (hotelAmount = parseInt(hotelAmount)) : (hotelAmount=0)
    restAmount ? (restAmount = parseInt(restAmount)) : (restAmount = 0)
    const transaction = new Transaction();
    if (category === 'main') {
        transaction.amount = amount;
        transaction.hotelAmount = hotelAmount;
        transaction.restAmount = restAmount;
        if ((hotelAmount + restAmount) <= amount) {
            transaction.otherAmount = amount - (hotelAmount + restAmount)
        } 
        else throw 'sum anount of subPocket more than main amount'
    } else if(category === 'rest') {
        transaction.amount = restAmount;
        transaction.restAmount = restAmount;
    } else if(category === 'hotel') {
        transaction.amount = hotelAmount;
        transaction.hotelAmount = hotelAmount;
    } else throw 'invalid category'

    transaction.detail = detail;
    transaction.category = category;
    transaction.operation = 'deposit';
    transaction.accountNumber = accountNumber;
    transaction.reference = "payment_gateway_transaction:"+savedGatewayTransaction.transactionId;
    const savedTransaction = await transaction.save();
    const savedCustomer = await Customer.findOne({ 'accountNumber': accountNumber });
    const response = { transaction: transaction.transform(), customer: savedCustomer.transformBalance() }
    return response;
  };