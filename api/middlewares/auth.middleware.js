import jwt from 'jsonwebtoken';
const { AuthenticationError } = require('../errors/index');
/**
 * Authentication middleware that verifies the JWT token passed in the Authorization header.
 * The user details are decoded from the token and added to the request object as req.user.
 * If the token is invalid or missing, an error is thrown with the message "unauthorize".
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
const authMiddleware = async (req, res, next) => {
  const authorization = req.headers.authorization;
  try {
    if (!authorization) {
      throw new AuthenticationError('unauthorize');
    }
    const token = authorization.split(' ')[1];
    if (!token) {
      throw new AuthenticationError('unauthorize');
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decodedToken;
  } catch (error) {
    next(error);
  }
};

module.exports = { authMiddleware };
