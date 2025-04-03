// Importing the `NotFoundError` class from the errors module.
// This custom error is thrown when a requested resource (e.g., user) is not found.
const { NotFoundError } = require('../errors/index.errors');

// Importing the `users` module, which contains database operations for user-related actions.
// This module provides functions such as `getAllUsers`, `findUserById`, `updateUser`, and `deleteUser`.
const users = require('../database/users/user.users');

/**
 * @function getAllUsers
 * @description Fetches all users from the database.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next function to handle errors.
 * @returns {Promise<void>} Sends a JSON response containing all users.
 */
const getAllUsers = async (req, res, next) => {
  try {
    const allUsers = await users.getAllUsers();
    return res.status(200).json({ data: allUsers });
  } catch (error) {
    next(error); // Pass error to the global error handler
  }
};

/**
 * @function getSingleUser
 * @description Fetches a single user by their ID.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next function to handle errors.
 * @returns {Promise<void>} Sends a JSON response containing the user data if found.
 * @throws {NotFoundError} If the user with the given ID is not found.
 */
const getSingleUser = async (req, res, next) => {
  try {
    const id = req.params.id; // Extract the user ID from the request parameters
    const user = await users.findUserById(id);
    if (!user) {
      throw new NotFoundError('User not found'); // Throw error if user does not exist
    }
    res.status(200).json({ data: user });
  } catch (error) {
    next(error); // Pass error to the global error handler
  }
};

/**
 * @function updateUser
 * @description Updates a user's details in the database.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next function to handle errors.
 * @returns {Promise<void>} Sends a JSON response containing the updated user data.
 * @throws {NotFoundError} If the user with the given ID is not found.
 */
const updateUser = async (req, res, next) => {
  try {
    const id = req.params.id; // Extract the user ID from the request parameters
    const updates = req.body; // Extract the fields to update from the request body
    const user = await users.updateUser(id, updates);
    if (!user) {
      throw new NotFoundError('User not found'); // Throw error if user does not exist
    }
    res.status(200).json({ data: user });
  } catch (error) {
    next(error); // Pass error to the global error handler
  }
};

/**
 * @function deleteUser
 * @description Deletes a user by their ID from the database.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next function to handle errors.
 * @returns {Promise<void>} Sends a 204 No Content response if the user is successfully deleted.
 * @throws {NotFoundError} If the user with the given ID is not found.
 */
const deleteUser = async (req, res, next) => {
  try {
    const id = req.params.id; // Extract the user ID from the request parameters
    const user = await users.deleteUser(id);
    if (!user) {
      throw new NotFoundError('User not found'); // Throw error if user does not exist
    }
    res.status(204).send(); // 204 No Content must not include a response body
  } catch (error) {
    next(error); // Pass error to the global error handler
  }
};

// Exporting all controller functions for use in the routes file.
// These functions handle user-related operations such as fetching, updating, and deleting users.
module.exports = {
  getAllUsers,
  getSingleUser,
  updateUser,
  deleteUser,
};
