// Importing the `http-status-codes` library to use standard HTTP status codes.
// This library provides a set of constants for HTTP status codes, improving code readability and maintainability.
const { StatusCodes } = require('http-status-codes');

// Importing the base `CustomError` class.
// This class is extended to create specific custom error types, such as `ValidationError`.
const CustomError = require('./customError.errors');

/**
 * @class ValidationError
 * @extends CustomError
 * @description Custom error class for handling validation-related errors.
 *
 * This class is used to represent errors that occur when input validation fails, such as missing required fields
 * or invalid data formats. It extends the `CustomError` class to provide additional functionality and sets a default
 * HTTP status code of `400 Bad Request`.
 *
 * ### Key Features:
 * - Inherits from the `CustomError` base class.
 * - Automatically sets the `statusCode` to `400` (Bad Request).
 * - Provides a human-readable error message for debugging and client responses.
 *
 * @example
 * // Example usage:
 * const ValidationError = require('./validation_error');
 * throw new ValidationError('Invalid input data');
 */
class ValidationError extends CustomError {
  /**
   * Creates an instance of `ValidationError`.
   *
   * @param {string} message - A human-readable error message describing the validation error.
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

// Export the `ValidationError` class for use in other parts of the application.
module.exports = ValidationError;
