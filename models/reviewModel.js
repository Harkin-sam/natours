const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review cannot be empty'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    tour: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'Tour',
        required: [true, 'Review must belong to a tour'],
      },
    ],
    user: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Review must belong to a User'],
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// virtual object options are for fields that are not stored in te DB but are calculated using the fields in the DB but will be console logged with the output

//PREVENTING DUPLICATE REVIEWS ; preventing 2 reviews coming form the same user ir user writing multiple reviews for the same tour
// tourId and UserId must be unique
reviewSchema.index({tour: 1, user: 1}, {unique: true});

// QUERY MIDDLEWARE FOR POPULATING REVIEWS
// PRE-FIND

reviewSchema.pre(/^find/, function (next) {
  //   this.populate({ path: 'tour', select: 'name' }).populate({
  //     path: 'user',
  //     select: 'name photo', // select only the user name and photo to client using the id to populate
  //   });

  this.populate({
    path: 'user',
    select: 'name photo',
  });

  next();

  // this has 2 populate queries because it has to find both the users and the tour
});

// STATIC METHOD: we need this because te aggregate method is always called on the module
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  //using aggregation pipeline on the Model
  const stats = await this.aggregate([
    {
      $match: { tour: tourId }, // selecting the doc we wanna update
    },
    {
      $group: {
        _id: '$tour', // group by tour
        nRating: { $sum: 1 }, //numbers
        avgRating: { $avg: '$rating' }, // each reviews has rating field so we get the average
      },
    },
  ]);
  // console.log(stats);

  if(stats.length > 0){
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  }else{
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
 
};

//Because the Model is created after the schema: after a new review has been created
reviewSchema.post('save', function () {
  // this points to current review Model, constructor is the model who created that doc

  this.constructor.calcAverageRatings(this.tour);
}); // post middleware does not get access to next()

// UPDATING averageRatings when REVIEW is updated or deleted
//Query doc specifically to match findOneAndUpdate and findOneAndDelete
reviewSchema.pre(/^findOneAnd/, async function (next) {
   this.r = await this.findOne(); // retrieving the current document form the DB and save to new doc property called r, purposefully to pass data argument to from pre to the post middleware

  //  console.log(this.r)

   next();
}); 

reviewSchema.post(/^findOneAnd/, async function () {
  // await this.findOne(); // does NOT work here, the query has already executed
  await this.r.constructor.calcAverageRatings(this.r.tour);
});



const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;

// Note when we do not know how much our array will grow it is just best to opt for PARENT REFERENCING
