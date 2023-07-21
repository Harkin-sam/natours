const express = require('express');
const bookingController = require('../controllers/bookingController');
const authController = require('./../controllers/authController');

const bookingRouter = express.Router();

bookingRouter.use(authController.protect); // to AUTHENTICATE all routes

bookingRouter
  .route('/checkout-session/:tourID')
  .get(bookingController.getCheckoutSession);

// Authenticate and Restricted to only ADMIN and LEAD-GUIDE from here on
bookingRouter.use(authController.restrictTo('admin', 'lead-guide'));

bookingRouter
  .route('/')
  .get(bookingController.getAllBookings)
  .post(bookingController.createBooking);

bookingRouter
  .route('/:id')
  .get(bookingController.getBooking)
  .patch(bookingController.updateBooking)
  .delete(bookingController.deleteBooking);

module.exports = bookingRouter;
