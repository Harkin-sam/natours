const multer = require('multer');
const sharp = require('sharp');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError.js');
const handlerFactory = require('./../controllers/handlerFactory');

//MULTER:  is a very popular middleware for handling multi-part form data i.e a from encoding which is used to upload files from a form, we can use it for any file upload

// package installation: npm i multer

// we will allows the use to upload photo in the updateMe route

//bodyparser cannot handle file

// CONFIGURE MULTER UPLOAD

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     //cb is callbackFn it works like next(), null means no error
//     cb(null, 'public/img/users'); // 'null' means if there's no error save to that destination path
//   },
//   filename: (req, file, cb) => {
//     //'file' here is req.file response. re.file has a mimetype property

//     // naming system: user-767675753ajyv-3340002.jpeg , user-useID-currentTimeStamp, this naming convention ensures that no image file has the same name

//     const ext = file.mimetype.split('/')[1]; // jpg, png or webp etc

//     // definition on how we wanna store our files
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });

const multerStorage = multer.memoryStorage(); // this will make the image be stored as a buffer to be available for 'sharp', here the filename will not really get set because its a temporary placeholder in memory

const multerFilter = (req, file, cb) => {
  // in the function the goal is to test if the uploaded file is an image, if so we pass 'true' in the callback function else we pass false along with an error

  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image, Please upload only images', 400), false);
  }
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter }); //dest means destination

//image is uploaded ot the file system no the DB so in the Db we put a link to reference the image

exports.uploadUserPhoto = upload.single('photo');
// this will be used as middleware , upload.single('photo') we use the single cos we want to upload one single element or field, and into 'single' we pass the name of the field in the form that is going to hold the image to upload, it put eh info of the file on the request object

//MIDDLEWARE FOR RESIZING THE IMAGES
exports.resizeUserPhoto = catchAsync (async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`
  // npm i sharp : we use the sharp library to process resizing images

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`); // this will crop the image to square, format to jpeg and compress it by 90%

  next();
});

// FILTERING /SANITIZING OBJECT from req.body
const filterObj = (obj, ...allowedFields) => {
  // ...allowFields turns the args to an array of args

  const newObj = {};

  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });

  return newObj;
};

//UPDATING THE CURRENTLY AUTHENTICATED USER
exports.updateMe = catchAsync(async (req, res, next) => {
  console.log(req.file); // log uploaded file
  // console.log(req.body);

  // 1) Create error if use POSTs/try to update password data

  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. please use /updateMyPassword',
        400
      )
    );
  }

  //2) UPDATE USER DATA

  // Filter ot unwanted field names that are not allowed to be updated
  const filteredBody = filterObj(req.body, 'name', 'email');

  if (req.file) {
    filteredBody.photo = req.file.filename;
  } // for User photo reference in  the MongoDB

  // Since we are not dealing with password, we can use .findByIdAndUpdate
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

// DELETING CURRENT USER
exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  //code means deleted
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

//GET /me endpoint using it as middleware hack
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

//GET
// exports.getAllUsers = catchAsync(async (req, res, next) => {
//   //error 500 means internal server error
//   const users = await User.find();

//   // SEND RESPONSE
//   res.status(200).json({
//     status: 'success',
//     results: users.length,
//     data: {
//       users,
//     },
//   });
// });
exports.getAllUsers = handlerFactory.getAll(User);

// exports.getUser = (req, res) => {
//   //error 500 means internal server error
//   res.status(500).json({
//     status: 'success',
//     message: 'This route is not yet defined',
//   });
// };
exports.getUser = handlerFactory.getOne(User);

exports.createUser = (req, res) => {
  //error 500 means internal server error
  res.status(500).json({
    status: 'success',
    message: 'This route is not yet defined! please use /signup instead',
  });
};

// exports.updateUser = (req, res) => {
//   //error 500 means internal server error
//   res.status(500).json({
//     status: 'success',
//     message: 'This route is not yet defined',
//   });
// };
exports.updateUser = handlerFactory.updateOne(User); // Do not update user password with this cos findByIdAndUpdate doesn't run the 'save' middleware

// exports.deleteUser = (req, res) => {
//   //error 500 means internal server error
//   res.status(500).json({
//     status: 'success',
//     message: 'This route is not yet defined',
//   });
// };

exports.deleteUser = handlerFactory.deleteOne(User);
