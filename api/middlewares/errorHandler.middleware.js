const { StatusCodes } = require('http-status-codes');

const errorHandler = (err, req, res, next) => {
  console.log(err.message);
  let customError = {
    statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
    msg: err.message || 'Something went wrong try again later',
  };

  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    customError.msg = 'Invalid JSON syntax';
    customError.statusCode = StatusCodes.BAD_REQUEST;
  }

  if (err.name === 'JsonWebTokenError') {
    customError.msg = 'Invalid token, please login again';
    customError.statusCode = StatusCodes.UNAUTHORIZED;
  }

  if (err.name === 'TokenExpiredError') {
    customError.msg = 'Token expired, please login again';
    customError.statusCode = StatusCodes.UNAUTHORIZED;
  }

  return res.status(customError.statusCode).json({ msg: customError.msg });
};

module.exports = errorHandler;
