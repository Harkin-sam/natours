const express = require('express');
const viewsController = require('./../controllers/viewsController');
const authController = require('./../controllers/authController');


const router = express.Router();

router.use(viewsController.alerts); // this middleware runs for every request

// Render out base PUG template

// authController.isLoggedIn is made so every request will go through it, it runs for all the requests here it works like authController.protect to confirm if the user is loggedin we put the current user on res.local.user for rendering template

router.get('/', authController.isLoggedIn, viewsController.getOverview);

router.get('/tour/:slug', authController.isLoggedIn, viewsController.getTour);
router.get('/login', authController.isLoggedIn, viewsController.getLoginForm);
router.get('/me', authController.protect, viewsController.getAccount);
router.get('/my-tours', authController.protect, viewsController.getMyTours);


router.post('/submit-user-data', authController.protect, viewsController.updateUserData);



module.exports = router;



// ANYTHING IN RES.LOCALS WILL BE AVAILABLE ON OUR PUG TEMPLATE