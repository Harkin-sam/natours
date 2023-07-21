const Tour = require('./../models/tourModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const User = require('./../models/userModel');
const Booking = require('./../models/bookingModel');

//Anytime you have aysnc function wrapped in catchAsync you should always have 'next' in the arguments

exports.getOverview = catchAsync(async (req, res, next) => {
  //1) Get Tour data from the collection
  const tours = await Tour.find();
  //2) Build template

  //3) Render that template using tour data from 1)

  res.status(200).render('overview', {
    title: 'All Tours',
    tours: tours,
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  //1) Get the data, for the requested tour (including reviews and guides)
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user',
  });

  // error handling if there's no tour
  if (!tour) {
    return next(new AppError('There is no tour with that name', 404));
  }

  //2) Build template

  //3) Render template using data
  res
    .status(200)
    .set(
        'Content-Security-Policy',
        "default-src 'self' https://*.mapbox.com https://js.stripe.com/v3/;base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src https://js.stripe.com/v3/ https://cdnjs.cloudflare.com https://api.mapbox.com 'self' blob: ;script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests;"
    ) // Setting CSP headers to allow scripts from mapbox and stripe to be loaded
    .render('tour', {
      title: `${tour.name} Tour`,
      tour: tour,
    });
});

exports.getLoginForm = (req, res) => {
  res.status(200).render('login', {
    title: 'log into your account',
  });
};

exports.getAccount = (req, res) => {
  // render the account page, account.pug
  res.status(200).render('account', {
    title: 'Your Account',
  });
};

exports.getMyTours = catchAsync (async (req, res, next) => {
  // Find all the TOURS that the user has booked
  const bookings = await Booking.find({user: req.user.id})


  //2) Find tours with the returned IDs
  const tourIDs = bookings.map(el => el.tour);

  const tours  = await Tour.find({_id: {$in: tourIDs}}) // $in will select all the tours which have an '_id' in the tourIDs array

  res.status(200).render('overview', {
    title: 'My Tours',
    tours
  })
})

//Update user
exports.updateUserData = catchAsync(async (req, res, next) => {
  // console.log(req.body);
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email,
    },
    { new: true, runValidators: true }
  );

  res.status(200).render('account', {
    title: 'Your Account',
    user: updatedUser
  });
});

// Note we can never use findByIdAndUpdate to update password because that is not going to run the 'save' document middleware that will take care of encrypting our password

// when you wan to update password you have a seperate form and route for that to handle it
