const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  tour: {
    type: mongoose.Schema.ObjectId,
    ref: 'Tour',
    required: [true, 'Booking must belong to a Tour!'],
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Booking must belong to a User!'],
  },
  price: {
    type: Number,
    required: [true, 'Booking must have a price'],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  paid: {
    // this can be used if the user is using other medium outside of stripe, or used cash so he can use the API to set the paid property
    type: Boolean,
    default: true,
  },
});



bookingSchema.pre(/^find/, function (next){
    this.populate('user').populate({
        path: 'tour',
        select: 'name' // only select the tour name when populate
    })

    next();
})

const Booking = mongoose.model('Booking', bookingSchema)


module.exports = Booking;


// parent referencing in the bookings model this means keeping reference to the tour and to the user who booked the tour in the model
