const AppError = require('./utils/appError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  // console.log(err)
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];

  // const value = err.keyValue.name
  const message = `Duplicate field value: ${value}, Please use another value`;

  return new AppError(message, 400);
};

const handleValidationErrorEB = (err) => {
  //HANDLING MONGOOSE VALIDATION ERROR

  // looping over the errors in the schema by converting the object to and array using object.values
  const errors = Object.values(err.errors).map((el) => el.message);

  const message = `Invalid input data ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = (err) => {
  return new AppError('Invalid Token. Please Log in again', 401);
};

const handleJWTExpiredError = (err) => {
  return new AppError('Your token has expired! Please login again', 401);
};

const sendErrorDev = (err, req, res) => {
  //originalUrl is the entire url but no with the host and note startsWith is case sensitive 
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  } else {
    console.error(`ERROR 🚨`, err);
    // render error.pug page with the message
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message,
    });
  }
};

const sendErrorProd = (err, req, res) => {
  //a) API
  if (req.originalUrl.startsWith('/api')) {
    //A) Operational, trusted error: send message to the client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }

    // B) Programming or other unknown error: don't leak the error details
    // 1) Log the error
    console.error(`ERROR 🚨`, err);

    return res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    });
  }

  // b) RENDERED WEBSITE
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message,
    });

    // Programming or other unknown error: don't leak the error details
  } else {
    // log error
    console.error(`ERROR 🚨`, err);

    // Send generic message
    return res.status(500).render('error', {
      title: 'Something went wrong!',
      msg: 'Please try again later',
    });
  }
};

module.exports = (err, req, res, next) => {
  // this will basically show us where the error happened and the stack trace

  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
      error.message = err.message; 

    //Cast Error is an error from invalid id from DB in API call
    if (err.name === 'CastError') {
      error = handleCastErrorDB(error);
    }

    // error code 11000 identifies duplicate fields in database
    if (err.code === 11000) {
      error = handleDuplicateFieldsDB(error);
    }

    if (err.name === 'validationError') {
      error = handleValidationErrorEB(error);
    }
    if (err.name === 'JsonWebTokenError') {
      error = handleJWTError();
    }
    if (err.name === 'TokenExpiredError') {
      error = handleJWTExpiredError();
    }

    sendErrorProd(error, req, res);
  }
};

// GLOBAL CENTRAL ERROR HANDLING MIDDLEWARE THAT WILL JUST CATCH ALL ERRORS AND HANDLE THEM ACCORDINGLY
// if your  middleware has 4 args express will automatically know that it an error handling middleware and it will only call it when there is an error

// OPERATIONAL ERROR: this are problems that we can predict will happen at some point, so we just need to handle them in advance eg invalid path accessed, invalid user input(validator error form mongoose), failed to connect to server, failed to connect to database, request timeout

// PROGRAMMING ERROR: this are simply bugs we developers introduce to our code
