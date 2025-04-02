// Importing the `http-status-codes` library to use standard HTTP status codes.
// This library provides a set of constants for HTTP status codes, improving code readability and maintainability.
const { StatusCodes } = require('http-status-codes');

/**
 * Error-handling middleware for Express.js applications.
 *
 * This middleware is responsible for catching and processing errors that occur during the request-response cycle.
 * It formats the error into a standardized response and sends it back to the client.
 *
 * ### Workflow:
 * 1. Logs the error message to the console for debugging purposes.
 * 2. Creates a `customError` object with default values:
 *    - `statusCode`: Defaults to `500` (Internal Server Error) if not provided.
 *    - `msg`: Defaults to a generic error message if not provided.
 * 3. Checks for specific error types and customizes the error message and status code accordingly:
 *    - **SyntaxError**: Handles invalid JSON syntax in the request body.
 *    - **JsonWebTokenError**: Handles invalid JWT tokens.
 *    - **TokenExpiredError**: Handles expired JWT tokens.
 * 4. Sends the formatted error response to the client with the appropriate status code and message.
 *
 * @param {Error} err - The error object that was thrown during request processing.
 *   - Contains information about the error, such as its message, name, and status code.
 * @param {import('express').Request} req - The Express request object.
 *   - Contains information about the HTTP request, such as headers, query parameters, and body.
 * @param {import('express').Response} res - The Express response object.
 *   - Used to send a response back to the client.
 * @param {import('express').NextFunction} next - The Express next function.
 *   - Used to pass control to the next middleware in the stack (not used here).
 *
 * @returns {void} Sends a JSON response to the client with the error message and status code.
 *
 * @example
 * // Example usage in an Express app:
 * const errorHandler = require('./middlewares/errorHandler.middleware');
 * app.use(errorHandler);
 */
const errorHandler = (err, req, res, next) => {
  // Log the error message to the console for debugging purposes.
  console.log(err.message);

  // Create a custom error object with default values.
  let customError = {
    statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR, // Default to 500 if no status code is provided.
    msg: err.message || 'Something went wrong try again later', // Default to a generic error message if no message is provided.
  };

  // Handle specific error types and customize the error response.

  // Case 1: Invalid JSON syntax in the request body.
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    customError.msg = 'Invalid JSON syntax'; // Set a specific error message.
    customError.statusCode = StatusCodes.BAD_REQUEST; // Set the status code to 400 (Bad Request).
  }

  // Case 2: Invalid JWT token.
  if (err.name === 'JsonWebTokenError') {
    customError.msg = 'Invalid token, please login again'; // Set a specific error message.
    customError.statusCode = StatusCodes.UNAUTHORIZED; // Set the status code to 401 (Unauthorized).
  }

  // Case 3: Expired JWT token.
  if (err.name === 'TokenExpiredError') {
    customError.msg = 'Token expired, please login again'; // Set a specific error message.
    customError.statusCode = StatusCodes.UNAUTHORIZED; // Set the status code to 401 (Unauthorized).
  }

  // Send the formatted error response to the client.
  return res.status(customError.statusCode).json({ msg: customError.msg });
};

// Export the `errorHandler` middleware for use in other parts of the application.
module.exports = errorHandler;
