// Importing the `jsonwebtoken` library to handle JSON Web Tokens (JWTs).
// This library provides methods to sign, verify, and decode JWTs.
const jwt = require('jsonwebtoken');

// Importing a custom `AuthenticationError` class from the errors module.
// This is used to throw specific errors related to authentication failures.
const { AuthenticationError } = require('../errors/index.errors');

/**
 * Authentication middleware for Express.js applications.
 *
 * This middleware is responsible for verifying the JWT token provided in the `Authorization` header of incoming requests.
 * If the token is valid, the decoded user information is attached to the `req` object as `req.user`.
 * If the token is invalid, missing, or not provided in the correct format, an `AuthenticationError` is thrown.
 *
 * ### Workflow:
 * 1. Extract the `Authorization` header from the request.
 * 2. Check if the header exists. If not, throw an `AuthenticationError`.
 * 3. Split the header value to extract the token (assumes the format: `Bearer <token>`).
 * 4. Verify the token using the `jsonwebtoken` library and the secret key (`process.env.JWT_SECRET`).
 * 5. Attach the decoded token (user details) to the `req.user` object.
 * 6. If any error occurs during the process, pass the error to the next middleware using `next(error)`.
 *
 * @param {import('express').Request} req - The Express request object.
 *   - Contains information about the HTTP request, such as headers, query parameters, and body.
 * @param {import('express').Response} res - The Express response object.
 *   - Used to send a response back to the client.
 * @param {import('express').NextFunction} next - The Express next function.
 *   - Used to pass control to the next middleware in the stack.
 *
 * @throws {AuthenticationError} If the token is missing, invalid, or cannot be verified.
 *
 * @example
 * // Example usage in an Express route:
 * const { authMiddleware } = require('./middlewares/auth.middleware');
 * app.get('/protected-route', authMiddleware, (req, res) => {
 *   res.json({ message: 'You have access!', user: req.user });
 * });
 */
const authMiddleware = async (req, res, next) => {
  // Extract the `Authorization` header from the request.
  const authorization = req.headers.authorization;

  try {
    // Check if the `Authorization` header is missing.
    if (!authorization) {
      // Throw an `AuthenticationError` if the header is not present.
      throw new AuthenticationError('unauthorize');
    }

    // Extract the token from the `Authorization` header.
    // Assumes the format: `Bearer <token>`.
    const token = authorization.split(' ')[1];

    // Check if the token is missing after splitting.
    if (!token) {
      // Throw an `AuthenticationError` if the token is not present.
      throw new AuthenticationError('unauthorize');
    }

    // Verify the token using the `jsonwebtoken` library.
    // The secret key is retrieved from the environment variable `JWT_SECRET`.
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the decoded token (user details) to the `req` object.
    req.user = decodedToken;
    next();
  } catch (error) {
    // Pass any errors that occur to the next middleware or error handler.
    next(error);
  }
};

// Export the `authMiddleware` function for use in other parts of the application.
module.exports = authMiddleware;
