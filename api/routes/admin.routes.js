/**
 * @file admin.routes.js
 * @description Defines routes for admin-specific functionalities in the application.
 * Ensures that only authenticated users with the 'admin' role can access these routes.
 *
 * @module routes/admin.routes
 */

const express = require('express');
const authenticate = require('../middlewares/auth.middleware'); // Middleware to verify JWT
const authorizeRoles = require('../middlewares/authRoles.middleware'); // Middleware for role-based access control
const { getAdminDashboard } = require('../controllers/admin.controller'); // Controller for admin dashboard

const router = express.Router();

/**
 * @route GET /admin/dashboard
 * @description Retrieves the admin dashboard.
 *
 * @access Protected (Requires authentication and 'admin' role)
 *
 * @middleware
 * - `authenticate`: Verifies the user's JWT token to ensure they are authenticated.
 * - `authorizeRoles('admin')`: Ensures that only users with the 'admin' role can access this route.
 *
 * @controller getAdminDashboard
 *
 * @example
 * // Request
 * GET /admin/dashboard
 * Authorization: Bearer <JWT_TOKEN>
 *
 * // Response (200 OK)
 * {
 *   "message": "Welcome to the admin dashboard"
 * }
 *
 * @example
 * // Unauthorized Access (403 Forbidden)
 * GET /admin/dashboard
 * Authorization: Bearer <JWT_TOKEN_WITHOUT_ADMIN_ROLE>
 *
 * {
 *   "error": "Access denied"
 * }
 */
router.get(
  '/dashboard',
  authenticate, // Ensure the user is authenticated
  authorizeRoles('admin'), // Ensure the user has the 'admin' role
  getAdminDashboard // Controller function for the admin dashboard
);

module.exports = router;
