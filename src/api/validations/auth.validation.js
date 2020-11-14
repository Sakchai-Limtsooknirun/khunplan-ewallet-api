const Joi = require('joi');

module.exports = {
  // POST /v1/auth/register
  register: {
    body: {
      groupOrRoomId: Joi.string().required(),
      type: Joi.string().required(),
    },
  },

  // POST /v1/auth/login
  login: {
    body: {
      groupOrRoomId: Joi.string().required(),
      type: Joi.string().required(),
    },
  },

  // POST /v1/auth/refresh
  refresh: {
    body: {
      groupOrRoomId: Joi.string().required(),
      refreshToken: Joi.string().required(),
    },
  },
};
