const mongoose = require('mongoose');
const crypto = require('crypto');
const moment = require('moment-timezone');
const { omitBy, isNil } = require('lodash');
const Customer = require('../models/customer.model');
const { masterAccount, masterAccountPassword } = require('../../config/vars');

/**
* Indicates type of operation
*/
const operations = ['deposit', 'withdrawal', 'transfer'];
const pocketType = ['main', 'hotel', 'rest', 'other']
/**
 * Transaction Schema
 * @private
 */
const transactionSchema = new mongoose.Schema({
  operation: {
    type: String,
    required: true,
    enum: operations,
  },
  accountNumber: {
    type: 'Number',
    ref: 'Customer',
    required: true,
  },
  destinationAccountNumber: {
    type: 'Number',
    ref: 'Customer'
  },
  amount: {
    type: Number,
    default: 0,
  },
  hotelAmount: {
    type: Number,
    default: 0
  },
  restAmount: {
    type: Number,
    default: 0
  },
  otherAmount: {
    type: Number,
    default: 0
  },
  reference: {
    type: String,
  },
  detail: {
    type: String,
    default: 'no payment detail',
  },
  category: {
    type: String,
    default: 'main',
    enum: pocketType
  }
}, {
  timestamps: true,
});




/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */

transactionSchema.pre('save', async function save(next) {
  this.wasNew = this.isNew;
  return next();
});

const checkTotalBalance = (customer) => {
  mainBalance = customer.balance
  hotalBalance = customer.balanceHotelPocket
  restBalance = customer.balanceRestPocket
  otherBalance = customer.balanceOtherPocket
  total = hotalBalance + restBalance + otherBalance
  console.log("main: ", mainBalance, "total: ",total);
  if(mainBalance >= total) {
    return true
  } else throw 'invalid balance'
}
transactionSchema.post('save', async function save(doc, next) {
  try{
    if(this.wasNew){
      const currentCustomer = await Customer.findOne({ 'accountNumber': this.accountNumber });      
      const validBalance = checkTotalBalance(currentCustomer)
      // if(this.category) {
        // if(this.category==='main'){
            currentCustomer.balance += this.amount;
            currentCustomer.balance = currentCustomer.balance.toFixed(2); 
            currentCustomer.balanceHotelPocket += this.hotelAmount;
            currentCustomer.balanceHotelPocket = currentCustomer.balanceHotelPocket.toFixed(2);  
            currentCustomer.balanceRestPocket += this.restAmount;
            currentCustomer.balanceRestPocket = currentCustomer.balanceRestPocket.toFixed(2); 
            currentCustomer.balanceOtherPocket += this.otherAmount;
            currentCustomer.balanceOtherPocket = currentCustomer.balanceOtherPocket.toFixed(2);  
        // }
        // else if(this.category==='hotel') {
        //   if(validBalance){
        //     currentCustomer.balance += this.amount;
        //     currentCustomer.balance = currentCustomer.balance.toFixed(2);
        //     currentCustomer.balanceHotelPocket += this.amount;
        //     currentCustomer.balanceHotelPocket = currentCustomer.balanceHotelPocket.toFixed(2); 
        //   } 
        // }else if(this.category==='rest') {
        //   if(validBalance){ 
        //     currentCustomer.balance += this.amount;
        //     currentCustomer.balance = currentCustomer.balance.toFixed(2);
        //     currentCustomer.balanceRestPocket += this.amount;
        //     currentCustomer.balanceRestPocket = currentCustomer.balanceRestPocket.toFixed(2);  
        //   }
        // }else if(this.category==='other') {
        //   if(validBalance){ 
        //     currentCustomer.balance += this.amount;
        //     currentCustomer.balance = currentCustomer.balance.toFixed(2);
        //     currentCustomer.balanceOtherPocket += this.amount;
        //     currentCustomer.balanceOtherPocket = currentCustomer.balanceOtherPocket.toFixed(2); 
        //   }
        // }
      // }
      
      const savedCustomer = await currentCustomer.save();     
      
    }
    // if(this.wasNew && this.operation === 'transfer' && this.amount < 0){
    //   let fee = 0;
    //   let tempAmount = Math.abs(this.amount);

    //   if(tempAmount <= 1000){
    //     fee = 8 + (tempAmount * 0.03);
    //   }else if(tempAmount > 1000 && tempAmount <= 5000){
    //     fee = 6 + (tempAmount * 0.025);
    //   }else if(tempAmount > 5000 && tempAmount <= 10000){
    //     fee = 4 + (tempAmount * 0.02);
    //   }else if(tempAmount > 10000){
    //     fee = 3 + (tempAmount * 0.01);
    //   }
      

    //   if(fee > 0){
    //     const transFee = new Transaction();
    //     transFee.amount = -fee;
    //     transFee.amount = transFee.amount.toFixed(2);
    //     // transFee.detail = this.detail;
    //     // transFee.category = this.category
    //     transFee.operation = 'fee';
    //     transFee.accountNumber = this.accountNumber;
    //     transFee.reference = 'fee_from_transaction:' + this._id;
    //     const savedTransFee = await transFee.save();

    //     const masterAccount = await Customer.getMasterAccount();   
    //     masterAccount.balance -= savedTransFee.amount;
    //     const savedMasterAccount = await masterAccount.save();

    //   }

    // }

    return next();
  } catch (error) {
    return next(error);
  }
});

/**
 * Methods
 */
transactionSchema.method({
  transform() {
    const transformed = {};
    const fields = ['id', 'accountNumber', 'destinationAccountNumber', 'operation', 'amount', 'balanceHotelPocket', 'balanceRestPocket', 'balanceOtherPocket', 'reference', 'createdAt', 'detail','category'];

    fields.forEach((field) => {
      transformed[field] = this[field];
    });

    return transformed;
  },
});


/**
 * Statics
 */
transactionSchema.statics = { 
    /**
     * List customers transactions in descending order of 'createdAt' timestamp.
     *
     * @param {number} skip - Number of transactions to be skipped.
     * @param {number} limit - Limit number of transactions to be returned.
     * @returns {Promise<Transaction[]>}
     */
    list({
      page = 1, perPage = 30, accountNumber,
    }) {
      let options = omitBy({ accountNumber }, isNil);
      // if (accountNumber == masterAccount){
      //   options = {operation: 'fee'};
      // }
  
      return this.find(options)
        .sort({ createdAt: -1 })
        .skip(perPage * (page - 1))
        .limit(perPage)
        .exec();
    },
  
    
  };

  const Transaction = mongoose.model('Transaction', transactionSchema);
  
module.exports = Transaction;