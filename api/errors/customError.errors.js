/**
 * @class CustomError
 * @extends Error
 * @description Base class for creating custom error types in the application.
 *
 * This class serves as a foundation for defining specific error types, such as `AuthenticationError` or `BadRequestError`.
 * By extending the built-in `Error` class, it allows for consistent error handling and provides additional flexibility
 * for defining custom error properties and behaviors.
 *
 * ### Key Features:
 * - Inherits from the built-in `Error` class.
 * - Automatically sets the `name` property to the class name for easier debugging.
 * - Provides a foundation for creating more specific error types.
 *
 * @example
 * // Example usage:
 * const CustomError = require('./customError');
 * throw new CustomError('Something went wrong');
 */
class CustomError extends Error {
  /**
   * Creates an instance of `CustomError`.
   *
   * @param {string} message - A human-readable error message describing the error.
   *   - Example: "Something went wrong" or "Invalid operation".
   */
  constructor(message) {
    // Call the constructor of the built-in `Error` class with the provided message.
    super(message);

    // Set the name of the error to the class name for easier debugging.
    this.name = this.constructor.name;
  }
}

// Export the `CustomError` class for use in other parts of the application.
module.exports = CustomError;
