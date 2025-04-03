// Importing the `http-status-codes` library to use standard HTTP status codes.
// This library provides a set of constants for HTTP status codes, improving code readability and maintainability.
const { StatusCodes } = require('http-status-codes');

// Importing the base `CustomError` class.
// This class is extended to create specific custom error types, such as `BadRequestError`.
const CustomError = require('./customError.errors');

/**
 * @class BadRequestError
 * @extends CustomError
 * @description Custom error class for handling bad request errors.
 *
 * This class is used to represent errors that occur when the client sends an invalid or malformed request.
 * It extends the `CustomError` class to provide additional functionality and sets a default HTTP status code of `400 Bad Request`.
 *
 * ### Key Features:
 * - Inherits from the `CustomError` base class.
 * - Automatically sets the `statusCode` to `400` (Bad Request).
 * - Provides a human-readable error message for debugging and client responses.
 *
 * @example
 * // Example usage:
 * const BadRequestError = require('./bad_request');
 * throw new BadRequestError('Invalid input data');
 */
class BadRequestError extends CustomError {
  /**
   * Creates an instance of `BadRequestError`.
   *
   * @param {string} message - A human-readable error message describing the bad request error.
   *   - Example: "Invalid input data" or "Missing required fields".
   */
  constructor(message) {
    // Call the constructor of the parent `CustomError` class with the provided message.
    super(message);

    // Set the name of the error to the class name for easier debugging.
    this.name = this.constructor.name;

    // Set the HTTP status code to `400 Bad Request`.
    this.statusCode = StatusCodes.BAD_REQUEST;
  }
}

// Export the `BadRequestError` class for use in other parts of the application.
module.exports = BadRequestError;
