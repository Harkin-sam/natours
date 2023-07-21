const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('./../controllers/authController');
// const reviewController = require('./../controllers/reviewController')
const reviewRouter = require('./reviewRoutes');

// ROUTES refactored
// creating and mounting multiple router

// Mounting a new router on a route
const tourRouter = express.Router(); // here we created this new router and saved it in this variable, then we use it as middle ware ^^

//PARAM MIDDLEWARE: this is middleware that run only when a certain parameter is present in the url, eg maybe id,

// in th param middleware we get access to a 4th arg called (val) which is use to access the param in the route, it holds the value of the id parameter

//NESTED ROUTES
tourRouter.use('/:tourId/reviews', reviewRouter); // tour router  path will redirect to the review router to handle it

// tourRouter.param('id', tourController.checkID)

// so this will only only work wen there is id in the tours route

tourRouter
  .route('/top-5-tours')
  .get(tourController.aliasTopTours, tourController.getAllTours);

//tourController.aliasTopTours is a middleware for that action

tourRouter.route('/tour-stats').get(tourController.getTourStats);

tourRouter
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan
  );

// GEO-SPATIAL QUERIES: Finding Tours within Radius
tourRouter
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);
// /tours-within/223/center/-40,45/unit/mi

tourRouter.route('/distances/:latlng/unit/:unit').get(tourController.getDistances)


tourRouter
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour
  );

// we chained a middleware here in the post function, it runs the middleware first before the function call, we can use this to check the users credibility before posting if he has access or not

tourRouter
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

//so we have 2 middleware function in delete() for authentication and the other for authorization

//NESTED ROUTES : used when there is a clear parent child relationship between resources

//POST / tour/ ID / reviews     // so this here means to post the review resource on the tours resource

// GET / tour / ID / reviews // this get us all the reviews for this tour
// GET / tour / ID / reviews / review ID

// tourRouter.route('/:tourId/reviews').post(authController.protect, authController.restrictTo('user'), reviewController.createReview )

module.exports = tourRouter;
