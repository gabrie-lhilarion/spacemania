/**
 * @file authRoles.middleware.js
 * @description Middleware to enforce role-based access control (RBAC) in the application.
 * Ensures that only users with specific roles can access certain routes.
 *
 * @module middlewares/authRoles.middleware
 */

const AuthenticationError = require('../errors/authentication.errors');

/**
 * @function authorizeRoles
 * @description Middleware factory function that returns a middleware to check if the user's role is authorized.
 *
 * @param {...string} allowedRoles - A list of roles that are allowed to access the route.
 * @returns {Function} Middleware function to enforce role-based access control.
 *
 * @example
 * // Allow only 'admin' users to access the route
 * router.get('/admin', authenticate, authorizeRoles('admin'), adminController);
 *
 * @example
 * // Allow both 'admin' and 'user' roles to access the route
 * router.get('/dashboard', authenticate, authorizeRoles('admin', 'user'), dashboardController);
 */
const authorizeRoles = (...allowedRoles) => {
  /**
   * Middleware function to check the user's role.
   *
   * @param {Object} req - The HTTP request object.
   * @param {Object} req.user - The user object attached by the authentication middleware.
   * @param {string} req.user.role - The role of the authenticated user.
   * @param {Object} res - The HTTP response object.
   * @param {Function} next - The next middleware function in the stack.
   *
   * @throws {AuthenticationError} If the user's role is not in the list of allowed roles.
   */
  return (req, res, next) => {
    // Extract the user's role from the request object (set by the authentication middleware)
    const userRole = req.user.role;

    // Check if the user's role is in the list of allowed roles
    if (!allowedRoles.includes(userRole)) {
      // If the user's role is not authorized, throw an AuthenticationError
      throw new AuthenticationError('Access denied');
    }

    // If the user's role is authorized, proceed to the next middleware or route handler
    next();
  };
};

module.exports = authorizeRoles;
