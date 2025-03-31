/**
 * @file User database operations for SpaceMania workspace management system
 * @module db/users
 * @description Handles all database operations related to user authentication including:
 * - User creation with password hashing
 * - User lookup by email
 * - Password verification
 * - JWT token generation
 * @requires ./index
 * @requires bcryptjs
 * @requires jsonwebtoken
 */

const db = require('./index');
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
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
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
const generateAuthToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET);
};

module.exports = {
    createUser,
    findUserByEmail,
    comparePassword,
    generateAuthToken
};