/**
 * @file admin.controller.js
 * @description Controller for admin-specific functionalities in the application.
 * Handles requests related to the admin dashboard and other admin features.
 */

/**
 * @function getAdminDashboard
 * @description Handles the logic for retrieving the admin dashboard.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.user - The authenticated user's information (set by the authentication middleware).
 * @param {Object} res - The HTTP response object.
 *
 * @returns {void} Sends a JSON response with a welcome message for the admin dashboard.
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
 */
const getAdminDashboard = (req, res) => {
  res.status(200).json({ message: 'Welcome to the admin dashboard' });
};

module.exports = { getAdminDashboard };
