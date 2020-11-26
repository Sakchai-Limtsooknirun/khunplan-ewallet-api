const uuidv4 = require('uuid/v4');
const crypto = require('crypto');
const moment = require('moment-timezone');
const GatewayTransaction = require('../models/gatewayTransaction.model');
const APIError = require('../utils/APIError');
const httpStatus = require('http-status');
const Customer = require('../models/customer.model');
const Transaction = require('../models/transaction.model');
const TempOfSubPocket = require('../models/tempOfSubPocket');
async function simulateGatewayCall(card, amount, hotelAmount, restAmount, detail, category, lineUserId) {
    
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
        'lineUserId': lineUserId,
    };
}

exports.debitCard = async (accountNumber, card, amount, hotelAmount, restAmount, detail, category, lineUserId) => {
    const gatewayResponse = await simulateGatewayCall(card, amount, hotelAmount, restAmount, detail, category, lineUserId);
    const gatewayTransaction = new GatewayTransaction(gatewayResponse);
    const savedGatewayTransaction = await gatewayTransaction.save();
    if(savedGatewayTransaction.status === 'failure'){
        throw new APIError({
            message: 'Payment Rejected',
            status: httpStatus.PAYMENT_REQUIRED,
        });
    }
    const savedCustomer = await Customer.findOne({ 'accountNumber': accountNumber });
    const tempSubPocket = await TempOfSubPocket.findOne({'groupOrRoomId' : savedCustomer.groupOrRoomId })
    console.log('tempSubPocket', tempSubPocket);
    amount ? (amount = parseInt(amount)) : (amount=0)
    hotelAmount ? (hotelAmount = parseInt(hotelAmount)) : (hotelAmount=0)
    restAmount ? (restAmount = parseInt(restAmount)) : (restAmount = 0)
    console.log('amount',amount);
    const transaction = new Transaction();
    // if (category === 'main') {
        console.log('activate',tempSubPocket.activate);
    if(tempSubPocket && parseInt(savedCustomer.balance) >= parseInt(tempSubPocket.total) && (tempSubPocket.activate == false)) {
        console.log("1111", parseInt(savedCustomer.balance) - (parseInt(tempSubPocket.hotelPocket)+parseInt(tempSubPocket.restPocket)));
        transaction.amount = amount;
        transaction.hotelAmount = tempSubPocket.hotelPocket;
        transaction.restAmount = tempSubPocket.restPocket;
        transaction.otherAmount = parseInt(savedCustomer.balance) - (parseInt(tempSubPocket.hotelPocket)+parseInt(tempSubPocket.restPocket)) + amount;
        tempSubPocket.activate = true;
        tempSubPocket.save();
    } else {
        console.log("3333");
        transaction.amount = amount;
        transaction.hotelAmount = hotelAmount;
        transaction.restAmount = restAmount;
    }
        // if ((hotelAmount + restAmount) <= amount) {
        //     transaction.otherAmount = amount - (hotelAmount + restAmount)
        // } 
        // else throw new APIError({
        //     message: 'sum anount of subPocket more than main amount',
        //     status: httpStatus.PAYMENT_REQUIRED,
        // });
    // } else if(category === 'rest') {
        // transaction.amount = restAmount;
        // transaction.restAmount = restAmount;
    // } else if(category === 'hotel') {
        // transaction.amount = hotelAmount;
        // transaction.hotelAmount = hotelAmount;
    // } else throw new APIError({
        // message: 'invalid category',
        // status: httpStatus.PAYMENT_REQUIRED,
    // });
    transaction.lineUserId = lineUserId
    transaction.detail = detail;
    transaction.category = category;
    transaction.operation = 'deposit';
    transaction.accountNumber = accountNumber;
    transaction.reference = "payment_gateway_transaction:"+savedGatewayTransaction.transactionId;
    const savedTransaction = await transaction.save();
    const savedCustomer2 = await Customer.findOne({ 'accountNumber': accountNumber });

    const response = { transaction: transaction.transform(), customer: savedCustomer2.transformBalance() }
    return response;
  };