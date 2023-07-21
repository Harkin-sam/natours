// The goal of the function is tp catch async errors
module.exports = (fn) => {
    return (req, res, next) => {
     fn(req, res, next).catch(err => next(err))}
      // next(err) propagate the error to the error handling middleware
   }
   