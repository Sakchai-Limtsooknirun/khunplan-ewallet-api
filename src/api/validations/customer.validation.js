const Joi = require('joi');
const Customer = require('../models/customer.model');

module.exports = {

  // POST /v1/ewallet/transfer
  walletTransfer: {
    body: {
      amount: Joi.number().positive().precision(2).min(10).required(),
      destinationAccountNumber: Joi.number().required()
    },
  },

  // POST /v1/ewallet/deposit
  walletDeposit: {
    body: {
      amount: Joi.number().positive().precision(2).min(10),
      card: Joi.string().creditCard().required()
    },
  },

  // GET /v1/customers
  listCustomers: {
    query: {
      page: Joi.number().min(1),
      perPage: Joi.number().min(1).max(100),
      name: Joi.string(),
      groupOrRoomId: Joi.string(),
      role: Joi.string().valid(Customer.roles),
    },
  },

  // POST /v1/customers
  createCustomer: {
    body: {
      groupOrRoomId: Joi.string().required(),
      type: Joi.string().required(),
      name: Joi.string().max(128),
      role: Joi.string().valid(Customer.roles),
    },
  },

  // PUT /v1/customers/:customerId
  replaceCustomer: {
    body: {
      groupOrRoomId: Joi.string().required(),
      type: Joi.string().required(),
      name: Joi.string().max(128),
      role: Joi.string().valid(Customer.roles),
    },
    params: {
      customerId: Joi.string().regex(/^[a-fA-F0-9]{24}$/).required(),
    },
  },

  // PATCH /v1/customers/:customerId
  updateCustomer: {
    body: {
      groupOrRoomId: Joi.string(),
      type: Joi.string(),
      name: Joi.string().max(128),
      role: Joi.string().valid(Customer.roles),
    },
    params: {
      customerId: Joi.string().regex(/^[a-fA-F0-9]{24}$/).required(),
    },
  },
};
