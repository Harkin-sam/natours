// script(src='https://js.stripe.com/v3/') this in the tour.pug file exposes the stripe object to the Global scope
import axios from 'axios';
import { showAlert } from './alerts';

export const bookTour = async (tourId) => {
  try {
    const stripe = Stripe(
      'pk_test_51NS56gKwmtSEN4GnKsaLtb8LenuKzWbQE9QeFNBkUdmiO15yH8L4XbTemf4i6oWptCjy9BHlBJ9K45lkj11rw5hS00JySvRLab'
    ); // use your Publishable key here

    //  GET CHECKOUT SESSION FROM API
    const session = await axios(
      `/api/v1/bookings/checkout-session/${tourId}`
    ); // this is automatically a GET request

    // console.log(session);

    // CREATE CHECKOUT FORM + CHARGE CREDIT CARD
    await stripe.redirectToCheckout({ sessionId: session.data.session.id });
  } catch (err) {
    // console.log(err);
    showAlert('error', err);
  }
};



// user will immediately receive email if payment is received by stripe 