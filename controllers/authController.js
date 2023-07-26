// const util = require('util'); // this is a built-in promisify module provided by NODE
const crypto = require('crypto');
const { promisify } = require('util'); // destructured
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const Email = require('./../utils/email');

// JSON WEB TOKEN FUNCTION to sign
const signToken = (ID) => {
  return jwt.sign({ id: ID }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ), // converted config cookie variable to milliseconds
    // secure: true,
    httpOnly: true, // this is to ensure that the cookie cannot be modified in anyway by the browser not even delete it , only receive the cookie, store it and send it automatically along with every request
    secure: req.secure || req.headers('x-forwarded-proto') === 'https',
  };

  //x-forwarded-proto is heroku specific, heroku acts as a proxy which kinda redirect and modifies requests

  

  //SENDING JWT VIA COOKIE ; Creating a cookie
  res.cookie('jwt', token, cookieOptions);

  // To remove the password from the output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signUp = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: req.body.role,
  });

  // jwt => payload, secret-key, options:expiration time

  // should be at least 32 characters long stored in config file and processed from there

  //   const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
  //     expiresIn: process.env.JWT_EXPIRES_IN,
  //   });

  // const token = signToken(newUser._id);

  // SENDING WELCOME EMAIL
  const url = `${req.protocol}://${req.get('host')}/me`; // point to the user account page

  // console.log(url);

  new Email(newUser, url).sendWelcome();

  //code 201 means created, now we placed the 'token' in the response

  createSendToken(newUser, 201, req, res);
  //   res.status(201).json({
  //     status: 'success',
  //     token,
  //     data: {
  //       user: newUser,
  //     },
  //   });
});

//SigningUp Users using json web tokens
// install
// npm i jsonwebtoken

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //1) check if email and password exist
  if (!email || !password) {
    return next(new AppError('please provide email and password!', 400));

    //error 400 means bad request
  }

  //2) check if user exists && password is correct
  const user = await User.findOne({ email }).select('+password'); // select here is used to exclusively select the HIDDEN PASSWORD for the main purpose of verification

  // using the instance method here since it is available in all the user document

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));

    // error 401 means unauthorized access
  }

  //3) if everything is okay send the JWT to the client
  //   const token = signToken(user._id);

  //   res.status(200).json({
  //     status: 'success',
  //     token,
  //   });

  createSendToken(user, 200, req, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};

//PROTECT ROUTE ACCESS TO USER THAT ARE NOT LOGGED IN
exports.protect = catchAsync(async (req, res, next) => {
  let token;

  // 1) GETTING THE TOKEN
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt; // authenticate user based on cookies and not only authorized header
  }

  // console.log(token)

  if (!token) {
    return next(
      new AppError('You are not logged in! Please login to get access', 401)
    );
  }

  //2) VALIDATE TOKEN OR VERIFICATION TOKEN

  //promisify resolves the promise function
  const decodedData = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET
  );
  // verify() receives a callback function as third arg that is executed as soon  as the verification is done

  //console.log(decodedData);

  //3) CHECK IF THE USER STILL EXIST
  const currentUser = await User.findById(decodedData.id);
  if (!currentUser) {
    return next(
      new AppError('The User belonging to this token no longer exist', 401)
    );
  }

  //4) CHECK IF THE USER CHANGED PASSWORD AFTER THE TOKEN WAS ISSUED
  if (currentUser.changedPasswordAfter(decodedData.iat)) {
    return next(
      new AppError('User recently Changed password, Please log in again', 401)
    );
  }

  // GRANT ACCESS TO PROTECTED ROUTE since it been greatly checked
  req.user = currentUser; // so that we can use it in the next middleware function because its the request object that travels from middleware to middleware, so if we want to pass any data to through the channel we have to put it in the request flow

  res.locals.user = currentUser; // details placed for rendering template to pick
  next();
});

// standard of sending a token
// in the header

// set key t0 Authorization
// value to  'Bearer space token'

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // ...roles here is an array of args ['admin','lead-guide']
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      ); // 403 means forbidden
    }

    next(); // forwarded to the next handler
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) GET USER BASED ON POSTED EMAIL
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError('There is no user with this email address', 404));
  }

  // 2) GENERATE THE RANDOM RESET TOKEN
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // const message = `Forgot your password ? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, Please ignore this email`;

  try {
    
    //3) SEND TO THE USER'S EMAIL
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;

    // await sendEmail({
    //   email: user.email,
    //   subject: 'Your password reset Token (valid for 10 min)',
    //   message,
    // });

    // SENDING PASSWORD RESET EMAIL
    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token send to email',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        `There was an error sending the email. Try again later ${err.stack}`,
        500
      )
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) GET USER BASED ON THE TOKEN
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  // this will fins the user whole has the hashed token sent by the url /:token
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  }); // user will only exist if both conditions as satisfied

  // 2) IF TOKEN HAS NOT EXPIRED, AND THERES IS USER , SET NEW PASSWORD

  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  // now we need to save it cos these only modifies the document but not save it
  await user.save();

  //3) UPDATE changedPasswordAt property for the user

  //4)    LOG IN THE USER , SEND JWT

  //   const token = signToken(user._id);

  //   res.status(200).json({
  //     status: 'success',
  //     token,
  //   });

  createSendToken(user, 200, req, res);
});

// THIS FUNCTIONALITY IS ONLY OF LOGGED-IN USER for Updating his password without having to user forgot password
exports.updateMyPassword = catchAsync(async (req, res, next) => {
  //1) GET THE USER FROM THE COLLECTION & SELECT PASSWORD
  const user = await User.findById(req.user.id).select('+password');

  if (!user) {
    return next(new AppError('You are not a logged-in user', 401));
  }

  //2) CHECK IF THE POSTED CURRENT PASSWORD IS CORRECT
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong', 401));
  }

  //3) IF SO, UPDATED PASSWORD
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // User.findByIdAndUpdate will NOT work as intended

  //4) LOG IN USER , SEND JWT

  // const token = signToken(user._id);

  // res.status(200).json({
  //   status: 'success',
  //   token,
  // });

  // this makes the user stay logged in by creating a new jwt cookie
  createSendToken(user, 200, req, res);
});

// THIS MIDDLEWARE IS ONLY FOR RENDERING the PUG PAGES BASED ON THE AUTHORIZATION:only for rendered pages, no error

exports.isLoggedIn = async (req, res, next) => {
  // if the cookie exist
  if (req.cookies.jwt) {
    try {
      //verify the token
      const decodedData = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      //3) Check if the User still exist
      const currentUser = await User.findById(decodedData.id);
      if (!currentUser) {
        return next(); // simply move on to the next middleware but nothing will happen
      }

      //4) CHECK IF THE USER CHANGED PASSWORD AFTER THE TOKEN WAS ISSUED
      if (currentUser.changedPasswordAfter(decodedData.iat)) {
        return next();
      }

      // THERE IS A LOGGED IN USER
      res.locals.user = currentUser; // setting it that each pug template will have access to this data

      return next();
    } catch (err) {
      return next(); // move the the next middleware, meaning there's no logged in user
    }
  }

  next(); // if theres no cookie the next middleware will be called right away, no cookie no current user
}; // note we didnt use catchAsync here cos it creates bugs with jwt.verify when cookies is overitten so instead we catch here errors locally with try/catch block
