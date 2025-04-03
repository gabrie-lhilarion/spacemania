/**
 * Centralized export file for custom error classes.
 *
 * This file consolidates all custom error classes into a single module, making it easier to import them
 * in other parts of the application. By organizing error classes in this way, the codebase becomes
 * more maintainable and modular.
 *
 * ### Exported Classes:
 * - `CustomError`: Base class for creating custom error types.
 * - `BadRequestError`: Represents errors caused by invalid or malformed client requests (HTTP 400).
 * - `NotFoundError`: Represents errors caused by resources not being found (HTTP 404).
 * - `AuthenticationError`: Represents errors related to authentication failures (HTTP 401).
 * - `ValidationError`: Represents errors caused by validation failures.
 *
 * @example
 * // Example usage:
 * const { BadRequestError, AuthenticationError } = require('./errors');
 * throw new BadRequestError('Invalid input data');
 * throw new AuthenticationError('Invalid token');
 */

// Importing all custom error classes from their respective files.
const CustomError = require('./customError.errors');
const BadRequestError = require('./bad_request.errors');
const NotFoundError = require('./not_found.error');
const AuthenticationError = require('./authentication.errors');
const ValidationError = require('./validation_error.errors');

// Exporting all custom error classes as a single module.
module.exports = {
  CustomError,
  BadRequestError,
  NotFoundError,
  AuthenticationError,
  ValidationError,
};
