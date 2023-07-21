const Review = require('./../models/reviewModel');
const catchAsync = require ('./../utils/catchAsync');
const handlerFactory = require('./../controllers/handlerFactory');


// exports.getAllReviews = catchAsync(async (req, res, next) => {

//     let filter = {}
//     // check if theres is tourId exist 
//     if(req.params.tourId) filter = {tour: req.params.tourId}

//     const reviews = await Review.find(filter);

//     res.status(200).json({
//         status: "success",
//         result: reviews.length,
//         data: {
//             reviews
//         }
//     })
// });
exports.getAllReviews = handlerFactory.getAll(Review);


exports.getReview = handlerFactory.getOne(Review);

exports.setTourUserIds = (req, res, next) => {
      //AllOW NESTED ROUTES
      if(!req.body.tour) req.body.tour = req.params.tourId;
      if(!req.body.user) req.body.user = req.user.id;
  
      next();
}

exports.createReview = handlerFactory.createOne(Review)

// exports.createReview = catchAsync( async (req, res, next) => {

//     //AllOW NESTED ROUTES
//     if(!req.body.tour) req.body.tour = req.params.tourId;
//     if(!req.body.user) req.body.user = req.user.id;


//     const newReview = await Review.create(req.body);

//     res.status(201).json({
//         status: "success",
//         data: {
//             review: newReview
//         }
//     })
// });

// DELETE
exports.deleteReview = handlerFactory.deleteOne(Review)

//PATCH
exports.updateReview = handlerFactory.updateOne(Review);