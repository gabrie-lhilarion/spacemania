// Importing the `http-status-codes` library to use standard HTTP status codes.
// This library provides a set of constants for HTTP status codes, improving code readability and maintainability.
const { StatusCodes } = require('http-status-codes');

// Importing the base `CustomError` class.
// This class is extended to create specific custom error types, such as `NotFoundError`.
const CustomError = require('./customError.errors');

/**
 * @class NotFoundError
 * @extends CustomError
 * @description Custom error class for handling resource not found errors.
 *
 * This class is used to represent errors that occur when a requested resource cannot be found.
 * It extends the `CustomError` class to provide additional functionality and sets a default HTTP status code of `404 Not Found`.
 *
 * ### Key Features:
 * - Inherits from the `CustomError` base class.
 * - Automatically sets the `statusCode` to `404` (Not Found).
 * - Provides a human-readable error message for debugging and client responses.
 *
 * @example
 * // Example usage:
 * const NotFoundError = require('./not_found');
 * throw new NotFoundError('Resource not found');
 */
class NotFoundError extends CustomError {
  /**
   * Creates an instance of `NotFoundError`.
   *
   * @param {string} message - A human-readable error message describing the resource not found error.
   *   - Example: "Resource not found" or "User not found".
   */
  constructor(message) {
    // Call the constructor of the parent `CustomError` class with the provided message.
    super(message);

    // Set the name of the error to the class name for easier debugging.
    this.name = this.constructor.name;

    // Set the HTTP status code to `404 Not Found`.
    this.statusCode = StatusCodes.NOT_FOUND;
  }
}

// Export the `NotFoundError` class for use in other parts of the application.
module.exports = NotFoundError;
