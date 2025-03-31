/**
 * @file Authentication controller for SpaceMania workspace management system
 * @module controllers/auth
 * @description Handles user registration and authentication processes including:
 * - User registration with email/password
 * - User login with email/password
 * - JWT token generation for authenticated users
 * @requires ../users/users
 * @requires bcryptjs
 * @requires jsonwebtoken
 */

const {
    createUser,
    findUserByEmail,
    comparePassword,
    generateAuthToken
} = require('../users/users');

/**
 * @async
 * @function register
 * @description Registers a new user in the system
 * @param {Object} req - Express request object
 * @param {string} req.body.name - User's full name
 * @param {string} req.body.email - User's email address
 * @param {string} req.body.password - User's password (will be hashed)
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} Response object containing:
 * - user: The newly created user object (without password)
 * - token: JWT authentication token
 * @throws {Error} Will throw an error if:
 * - Email already exists
 * - Validation fails (invalid email/password format)
 * - Database operation fails
 */
const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const user = await createUser(name, email, password);
        const token = generateAuthToken(user.id);
        res.status(201).json({ user, token });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

/**
 * @async
 * @function login
 * @description Authenticates an existing user and generates an access token
 * @param {Object} req - Express request object
 * @param {string} req.body.email - User's registered email
 * @param {string} req.body.password - User's password
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} Response object containing:
 * - user: The authenticated user object (without password)
 * - token: JWT authentication token
 * @throws {Error} Will throw an error if:
 * - Email doesn't exist
 * - Password doesn't match
 * - Account is locked/suspended
 */
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await findUserByEmail(email);

        if (!user || !(await comparePassword(user, password))) {
            throw new Error('Invalid login credentials');
        }

        const token = generateAuthToken(user.id);
        res.json({ user, token });
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
};

module.exports = { register, login };