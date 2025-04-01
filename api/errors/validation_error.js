const { StatusCodes } = require('http-status-codes');
const CustomError = require('./customError');

/**
 * @class ValidationError
 * @extends CustomError
 * @description Custom error for authentication-related errors
 */
class ValidationError extends CustomError {
  /**
   * @param {string} message - Human-readable error message
   */
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = StatusCodes.BAD_REQUEST;
  }
}

module.exports = ValidationError;
