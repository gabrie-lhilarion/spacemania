const { StatusCodes } = require('http-status-codes');
const CustomError = require('./customError');

/**
 * @class BadRequestError
 * @extends CustomError
 * @description Custom error for bad request errors
 */
class BadRequestError extends CustomError {
  /**
   * @param {string} message - Human-readable error message
   */
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = StatusCodes.BAD_REQUEST;
  }
}

module.exports = BadRequestError;
