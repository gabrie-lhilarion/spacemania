// Importing the `http-status-codes` library to use standard HTTP status codes.
// This library provides a set of constants for HTTP status codes, improving code readability and maintainability.
const { StatusCodes } = require('http-status-codes');

// Importing the base `CustomError` class.
// This class is extended to create specific custom error types, such as `AuthenticationError`.
const CustomError = require('./customError.errors');

/**
 * @class AuthenticationError
 * @extends CustomError
 * @description Custom error class for handling authentication-related errors.
 *
 * This class is used to represent errors that occur during authentication processes, such as invalid credentials
 * or unauthorized access attempts. It extends the `CustomError` class to provide additional functionality
 * and sets a default HTTP status code of `401 Unauthorized`.
 *
 * ### Key Features:
 * - Inherits from the `CustomError` base class.
 * - Automatically sets the `statusCode` to `401` (Unauthorized).
 * - Provides a human-readable error message for debugging and client responses.
 *
 * @example
 * // Example usage:
 * const AuthenticationError = require('./authentication');
 * throw new AuthenticationError('Invalid token');
 */
class AuthenticationError extends CustomError {
  /**
   * Creates an instance of `AuthenticationError`.
   *
   * @param {string} message - A human-readable error message describing the authentication error.
   *   - Example: "Invalid token" or "Access denied".
   */
  constructor(message) {
    // Call the constructor of the parent `CustomError` class with the provided message.
    super(message);

    // Set the name of the error to the class name for easier debugging.
    this.name = this.constructor.name;

    // Set the HTTP status code to `401 Unauthorized`.
    this.statusCode = StatusCodes.UNAUTHORIZED;
  }
}

// Export the `AuthenticationError` class for use in other parts of the application.
module.exports = AuthenticationError;
