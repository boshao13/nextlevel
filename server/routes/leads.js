const express = require('express');
const authenticate = require('../middleware/auth');

module.exports = function (leadLimiter) {
  const router = express.Router();
  return router;
};
