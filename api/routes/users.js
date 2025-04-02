// Importing the Express library to create a router instance.
// Express is a web application framework for Node.js that provides tools for building APIs and web applications.
const express = require('express');

// Importing the `users` controller module.
// This module contains the logic for handling user-related operations, such as fetching, updating, and deleting users.
const users = require('../controllers/users');

// Importing the `authMiddleware` function.
// This middleware is responsible for verifying the JWT token in the `Authorization` header of incoming requests.
// It ensures that only authenticated users can access the protected routes.
const authMiddleware = require('../middlewares/auth.middleware');

// Creating a new router instance using Express.
// The `userRouter` will define routes related to user operations.
const userRouter = express.Router();

/**
 * @route GET /
 * @description Fetches all users from the database.
 * @access Protected (Requires a valid JWT token)
 * @middleware authMiddleware - Verifies the user's authentication.
 * @controller users.getAllUsers - Handles the logic for fetching all users.
 */
userRouter.get('/', authMiddleware, users.getAllUsers);

/**
 * @route GET /:id
 * @description Fetches a single user by their ID.
 * @access Protected (Requires a valid JWT token)
 * @middleware authMiddleware - Verifies the user's authentication.
 * @controller users.getSingleUser - Handles the logic for fetching a user by ID.
 * @param {string} id - The ID of the user to fetch (provided as a URL parameter).
 */
userRouter.get('/:id', authMiddleware, users.getSingleUser);

/**
 * @route PUT /:id
 * @description Updates a user's details.
 * @access Protected (Requires a valid JWT token)
 * @middleware authMiddleware - Verifies the user's authentication.
 * @controller users.updateUser - Handles the logic for updating a user's details.
 * @param {string} id - The ID of the user to update (provided as a URL parameter).
 * @body {object} updates - The fields to update (provided in the request body).
 */
userRouter.put('/:id', authMiddleware, users.updateUser);

/**
 * @route DELETE /:id
 * @description Deletes a user by their ID.
 * @access Protected (Requires a valid JWT token)
 * @middleware authMiddleware - Verifies the user's authentication.
 * @controller users.deleteUser - Handles the logic for deleting a user by ID.
 * @param {string} id - The ID of the user to delete (provided as a URL parameter).
 */
userRouter.delete('/:id', authMiddleware, users.deleteUser);

// Exporting the `userRouter` instance for use in other parts of the application.
// This allows the routes defined here to be mounted in the main application file (e.g., `server.js`).
module.exports = userRouter;
