const autoIncrement = require('../services/mongooseAutoIncrement');
const mongooseBD = require('../../config/mongoose');
const mongoose = require('mongoose');
const APIError = require('../utils/APIError');



const tempOfSubPocket = new mongoose.Schema({
groupOrRoomId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
},
total: {
    type: Number,
    default: 0
},
hotelPocket: {
    type: Number,
    default: 0
},
restPocket: {
    type: Number,
    default: 0
}, 
activate: {
    type: Boolean,
    default: false,
  }
});

tempOfSubPocket.method({
    transform() {
      const transformed = {};
      const fields = ['id', 'groupOrRoomId', 'total', 'groupOrRoomId', 'hotelPocket', 'restPocket', 'activate'];
  
      fields.forEach((field) => {
        transformed[field] = this[field];
      });
      return transformed;
    }
});


module.exports = mongoose.model('TempOfSubPocket', tempOfSubPocket);
