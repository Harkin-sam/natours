const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('./../models/tourModel');
const User = require('./../models/userModel');
const Booking = require('./../models/bookingModel');
const catchAsync = require('./../utils/catchAsync');
const handlerFactory = require('./../controllers/handlerFactory');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  //1) GET THE CURRENTLY BOOKED TOUR
  const tour = await Tour.findById(req.params.tourID);

  //2) CREATE CHECKOUT SESSION
  //for this install the stripe npm package: npm i stripe
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'], // card is for credit-card
    // success_url: `${req.protocol}://${req.get('host')}/?tour=${
    //   req.params.tourID
    // }&user=${req.user.id}&price=${tour.price}`, //  immediately the card has been successfully charged and purchase successful, user will be redirected to this url, it will be a get request
    success_url: `${req.protocol}://${req.get('host')}/my-tours?alert=booking`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`, // page showed if the user choose to cancel the payment
    customer_email: req.user.email, // because the bookings route is protected the user details will be on the req
    client_reference_id: req.params.tourID,
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${tour.name} Tour`,
            images: [`${req.protocol}://${req.get('host')}/img/tours/${tour.imageCover}`],
            description: tour.summary,
          },
          unit_amount: tour.price * 100,
        },
        // name: `${tour.name} Tour`,
        // description: tour.summary,
        // images: [`https://www.natours.dev/img/tours/${tour.imageCover}`], // this images needs to be live images o.e images that are hosted on the internet cos stripe will upload this images to their server, these works in production
        // amount: tour.price * 100,// this amount is expected to be in cents 41 = 100 cents
        // currency: 'usd',
        quantity: 1,
      },
    ],
  });

  //3) CREATE SESSION AS RESPONSE
  res.status(200).json({
    status: 'success',
    session,
  });
});

// to create a bookings we need the user's id the tours ID and the price, this is unsafe practice, safe practice involves using WEBHOOKS

// exports.createBookingCheckout = catchAsync(async (req, res, next) => {
//   // This is only TEMPORARY, because its UNSECURE: everyone can make bookings without paying
//   const { tour, user, price } = req.query;

//   if (!tour && !user && !price) return next();

//   await Booking.create({ tour, user, price });

//   res.redirect(req.originalUrl.split('?')[0])
// });

const createBookingCheckout = async (sessionData) => {
  const tour = sessionData.client_reference_id;
  const user = (await User.findOne({ email: sessionData.customer_email })).id; // read the ID from the queried doc
  const price = sessionData.amount_total / 100;
  await Booking.create({ tour, user, price });
};

// PAYMENT WITH STRIPE WEBHOOK
// stripe will call this function when the payment is successful
// the function receives the body for the request with the signature and webhook secret to create an event which will contain a session, using that session data we can create new booking in the database
exports.webhookCheckout = (req, res, next) => {
  const signature = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    ); // the body here is available in raw form i.e as a stream
  } catch (err) {
    return res.status(400).send(`webhook error: ${err.message}
    `);

    // we receive the response here cos it is stripe that will call the webhook
  }

  if (event.type === 'checkout.session.completed') {
    createBookingCheckout(event.data.object);

    res.status(200).json({ received: true }); // response to stripe
  }
};

exports.createBooking = handlerFactory.createOne(Booking);
exports.getBooking = handlerFactory.getOne(Booking);
exports.getAllBookings = handlerFactory.getAll(Booking);
exports.updateBooking = handlerFactory.updateOne(Booking);
exports.deleteBooking = handlerFactory.deleteOne(Booking);

// WE USE STRIPE WEBHOOKS WHEN THE APP HAS ALREADY BEEN DEPLOYED
