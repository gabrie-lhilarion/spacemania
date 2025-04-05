/**
 * @file User database operations for SpaceMania workspace management system
 * @module db/users
 * @description Handles all database operations related to user authentication including:
 * - User creation with password hashing
 * - User lookup by email
 * - Password verification
 * - JWT token generation
 * @requires ../connection/connect
 * @requires bcryptjs
 * @requires jsonwebtoken
 */

const db = require('../connection/connect.connection');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * @async
 * @function createUser
 * @description Creates a new user with hashed password
 * @param {string} name - User's full name
 * @param {string} email - User's email address (must be unique)
 * @param {string} password - Plain text password (will be hashed)
 * @param {string} [role='user'] - User role (default: 'user')
 * @returns {Promise<Object>} The newly created user object (excluding password)
 * @throws {Error} Will throw an error if:
 * - Email already exists in database
 * - Password hashing fails
 * - Database operation fails
 */
const createUser = async (name, email, password, role = 'user') => {
  const hashedPassword = await bcrypt.hash(password, 8);
  const result = await db.query(
    'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *',
    [name, email, hashedPassword, role]
  );
  return result.rows[0];
};

/**
 * @async
 * @function findUserByEmail
 * @description Finds a user by their email address
 * @param {string} email - Email address to search for
 * @returns {Promise<Object|null>} User object if found, null otherwise
 * @throws {Error} Will throw an error if database query fails
 */
const findUserByEmail = async (email) => {
  const result = await db.query('SELECT * FROM users WHERE email = $1', [
    email,
  ]);
  return result.rows[0];
};

/**
 * @async
 * @function comparePassword
 * @description Compares a plain text password with a hashed password
 * @param {Object} user - User object containing hashed password
 * @param {string} user.password - Hashed password stored in database
 * @param {string} password - Plain text password to compare
 * @returns {Promise<boolean>} True if passwords match, false otherwise
 * @throws {Error} Will throw an error if bcrypt comparison fails
 */
const comparePassword = async (user, password) => {
  return await bcrypt.compare(password, user.password);
};

/**
 * @function generateAuthToken
 * @description Generates a JWT token for user authentication
 * @param {number} userId - ID of the user to generate token for
 * @returns {string} Signed JWT token containing user ID payload
 * @throws {Error} Will throw an error if JWT signing fails
 */
const generateAuthToken = (userId, userEmail, userRole) => {
  return jwt.sign(
    { id: userId, email: userEmail, role: userRole },
    process.env.JWT_SECRET
  );
};

/**
 * @async
 * @function getAllUsers
 * @description Fetches all users from the database.
 * @returns {Promise<Array<Object>>} An array of user objects.
 * @throws {Error} Will throw an error if the database query fails.
 */
const getAllUsers = async () => {
  const result = await db.query('SELECT * FROM users');
  return result.rows; // Return all rows
};

/**
 * @async
 * @function findUserById
 * @description Fetches a single user by their ID.
 * @param {number} id - The ID of the user to fetch.
 * @returns {Promise<Object|null>} The user object if found, or `null` if no user exists with the given ID.
 * @throws {Error} Will throw an error if the database query fails.
 */
const findUserById = async (id) => {
  const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0]; // Return the first row (user) if found
};

/**
 * @async
 * @function updateUser
 * @description Updates a user's details in the database.
 * @param {number} id - The ID of the user to update.
 * @param {Object} updates - An object containing the fields to update and their new values.
 * @returns {Promise<Object|null>} The updated user object if successful, or `null` if no user exists with the given ID.
 * @throws {Error} Will throw an error if the database query fails.
 * @example
 * // Example usage:
 * const updates = { name: 'New Name', email: 'newemail@example.com' };
 * const updatedUser = await updateUser(1, updates);
 */
const updateUser = async (id, updates) => {
  // Assuming `updates` is an object with keys matching column names
  const columns = Object.keys(updates)
    .map((key, index) => `${key} = $${index + 2}`)
    .join(', ');
  const values = Object.values(updates);
  const result = await db.query(
    `UPDATE users SET ${columns} WHERE id = $1 RETURNING *`,
    [id, ...values]
  );
  return result.rows[0]; // Return the updated user
};

/**
 * @async
 * @function deleteUser
 * @description Deletes a user from the database by their ID.
 * @param {number} id - The ID of the user to delete.
 * @returns {Promise<Object|null>} The deleted user object if successful, or `null` if no user exists with the given ID.
 * @throws {Error} Will throw an error if the database query fails.
 * @example
 * // Example usage:
 * const deletedUser = await deleteUser(1);
 */
const deleteUser = async (id) => {
  const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING *', [
    id,
  ]); // Return deleted user

  return result.rows[0];
};

module.exports = {
  createUser,
  findUserByEmail,
  comparePassword,
  generateAuthToken,
  getAllUsers,
  findUserById,
  updateUser,
  deleteUser,
};
