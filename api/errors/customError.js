/**
 * CustomError class
 * @class CustomError
 * @description Custom error class for
 * generic
 */

class CustomError extends Error {
  /**
   * @param {string} message - Human-readable error message
   */
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}

module.exports = CustomError;
