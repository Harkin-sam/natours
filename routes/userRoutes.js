const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');


const userRouter = express.Router();

// implementing 'Users' routes

//signup and login means only post data
userRouter.post('/signup', authController.signUp);
userRouter.post('/login', authController.login);
userRouter.get('/logout', authController.logout) // its a get request here because we just want to overwrite the existing cookie  to erase the user data

userRouter.post('/forgotPassword', authController.forgotPassword);
userRouter.patch('/resetPassword/:token', authController.resetPassword);

// PROTECT ALL ROUTES AFTER THIS MIDDLEWARE
userRouter.use(authController.protect); // This is to authenticate or protect all request on this user route from this point onwards, since middleware works in sequence 

userRouter.patch(
  '/updateMyPassword',
  authController.updateMyPassword
); // update current user password
// we always use authController.protect middleware for logged in user to cross-check

userRouter.get(
  '/me',
  userController.getMe,
  userController.getUser
);
userRouter.patch('/updateMe', userController.uploadUserPhoto, userController.resizeUserPhoto,  userController.updateMe);
userRouter.delete('/deleteMe',  userController.deleteMe);



//  Routes restricted to Admin role only
userRouter.use(authController.restrictTo('admin')); 

userRouter
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

userRouter
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = userRouter;


