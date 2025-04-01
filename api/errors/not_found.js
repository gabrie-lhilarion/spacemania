const { StatusCodes } = require('http-status-codes');
const CustomError = require('./customError');

/**
 * @class NotFoundError
 * @extends CustomError
 * @description Custom error for resource not found errors
 */
class NotFoundError extends CustomError {
  /**
   * @param {string} message - Human-readable error message
   */
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = StatusCodes.NOT_FOUND;
  }
}

module.exports = NotFoundError;
