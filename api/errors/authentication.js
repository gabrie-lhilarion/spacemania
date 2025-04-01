const { StatusCodes } = require('http-status-codes');
const CustomError = require('./customError');

/**
 * @class AuthenticationError
 * @extends CustomError
 * @description Custom error for authentication-related errors
 */
class AuthenticationError extends CustomError {
  /**
   * @param {string} message - Human-readable error message
   */
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = StatusCodes.UNAUTHORIZED;
  }
}

module.exports = AuthenticationError;
