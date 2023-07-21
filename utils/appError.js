class AppError extends Error {
    constructor(message, statusCode){

        super(message);

        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor) // this way when a new object is created the constructor function is called then that function all will not appear in the stack trace
    }
}

module.exports = AppError;