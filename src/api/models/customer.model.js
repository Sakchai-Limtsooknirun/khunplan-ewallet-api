const mongoose = require('mongoose');
const mongooseBD = require('../../config/mongoose');
const httpStatus = require('http-status');
const { omitBy, isNil } = require('lodash');
const bcrypt = require('bcryptjs');
const moment = require('moment-timezone');
const jwt = require('jwt-simple');
const APIError = require('../utils/APIError');
const autoIncrement = require('../services/mongooseAutoIncrement');
const { env, jwtSecret, jwtExpirationInterval, masterAccount, masterAccountPassword } = require('../../config/vars');
const uuidv4 = require('uuid/v4');

autoIncrement.initialize(mongooseBD.connect());

/**
* Customer Roles
*/
const roles = ['customer', 'admin'];

/**
 * Customer Schema
 * @private
 */
const customerSchema = new mongoose.Schema({
  groupOrRoomId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  type: {
    type: String,
    required: true
  },
  name: {
    type: String,
    maxlength: 128,
    index: true,
    trim: true,
  },
  role: {
    type: String,
    enum: roles,
    default: 'customer',
  },
  balance: {
    type: Number,
    min: 0,
    default: 0
  },

}, {
  timestamps: true,
});



/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */
customerSchema.pre('save', async function save(next) {
  try {
    // if (!this.isModified('password')) return next();

    // const rounds = env === 'test' ? 1 : 10;

    // const hash = await bcrypt.hash(this.password, rounds);
    // this.password = hash;
    return next();
  } catch (error) {
    return next(error);
  }
});

/**
 * Methods
 */
customerSchema.method({
  transformBalance() {
    const transformed = {};
    const fields = ['id', 'accountNumber', 'name', 'groupOrRoomId', 'type', 'role', 'balance', 'createdAt'];

    fields.forEach((field) => {
      transformed[field] = this[field];
    });

    return transformed;
  },
  transform() {
    const transformed = {};
    const fields = ['id', 'accountNumber', 'name', 'groupOrRoomId', 'type', 'role', 'createdAt'];

    fields.forEach((field) => {
      transformed[field] = this[field];
    });

    return transformed;
  },

  token() {
    const playload = {
      exp: moment().add(jwtExpirationInterval, 'minutes').unix(),
      iat: moment().unix(),
      sub: this._id,
    };
    return jwt.encode(playload, jwtSecret);
  },

  // async passwordMatches(password) {
  //   return bcrypt.compare(password, this.password);
  // },
});

/**
 * Statics
 */
customerSchema.statics = {

  roles,

  /**
   * Get customer
   *
   * @param {ObjectId} id - The objectId of customer.
   * @returns {Promise<Customer, APIError>}
   */
  async get(id) {
    try {
      let customer;

      if (mongoose.Types.ObjectId.isValid(id)) {
        customer = await this.findById(id).exec();
      }
      if (customer) {
        return customer;
      }

      throw new APIError({
        message: 'Customer does not exist',
        status: httpStatus.NOT_FOUND,
      });
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get Master Account
   *
   * @returns {Promise<Customer>}
   */
  async getMasterAccount() {
    const masterAccountData = {
      accountNumber: masterAccount,
      role: 'admin',
      name: 'admin',
      groupOrRoomId: 'admin',
      type: 'admin',
    };
    try {
      let customer = await this.findOne({ 'accountNumber': masterAccountData.accountNumber }).exec();
      
      if (customer) {
        return customer;
      }else{
        return await this.create(masterAccountData);
      }      
    } catch (error) {
      throw error;
    }
  },

  /**
   * Find customer by groupOrRoomId and tries to generate a JWT token
   *
   * @param {ObjectId} id - The objectId of customer.
   * @returns {Promise<Customer, APIError>}
   */
  async findAndGenerateToken(options) {
    const { groupOrRoomId, type, refreshObject } = options;
    if (!groupOrRoomId) throw new APIError({ message: 'An groupOrRoomId is required to generate a token' });

    const customer = await this.findOne({ groupOrRoomId }).exec();
    const err = {
      status: httpStatus.UNAUTHORIZED,
      isPublic: true,
    };
    if (type) {
      if (customer) {
        return { customer, accessToken: customer.token() };
      }
      err.message = 'Incorrect groupOrRoomId or type';
    } else if (refreshObject && refreshObject.groupOrRoomId === groupOrRoomId) {
      return { customer, accessToken: customer.token() };
    } else {
      err.message = 'Incorrect groupOrRoomId or refreshToken';
    }
    throw new APIError(err);
  },

  /**
   * List customers in descending order of 'createdAt' timestamp.
   *
   * @param {number} skip - Number of customers to be skipped.
   * @param {number} limit - Limit number of customers to be returned.
   * @returns {Promise<Customer[]>}
   */
  list({
    page = 1, perPage = 30, name, groupOrRoomId, role,
  }) {
    const options = omitBy({ name, groupOrRoomId, role }, isNil);

    return this.find(options)
      .sort({ createdAt: -1 })
      .skip(perPage * (page - 1))
      .limit(perPage)
      .exec();
  },

  /**
   * Return new validation error
   * if error is a mongoose duplicate key error
   *
   * @param {Error} error
   * @returns {Error|APIError}
   */
  checkDuplicateEmail(error) {
    if (error.name === 'MongoError' && error.code === 11000) {
      return new APIError({
        message: 'Validation Error',
        errors: [{
          field: 'groupOrRoomId',
          location: 'body',
          messages: ['"refreshObject" already exists'],
        }],
        status: httpStatus.CONFLICT,
        isPublic: true,
        stack: error.stack,
      });
    }
    return error;
  },
};

customerSchema.plugin(autoIncrement.plugin, {
  model: 'Customer',
  field: 'accountNumber',
  startAt: 1001,
  incrementBy: 1
});

/**
 * @typedef Customer
 */
module.exports = mongoose.model('Customer', customerSchema);
