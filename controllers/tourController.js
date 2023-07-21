// const fs = require('fs');
const multer = require('multer');
const sharp = require('sharp');
const Tour = require('./../models/tourModel');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError.js');
const handlerFactory = require('./../controllers/handlerFactory');

// UPLOADING MULTIPLE IMAGES: Tour
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image, Please upload only images', 400), false);
  }
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

exports.uploadTourImages = upload.fields([
  {
    name: 'imageCover',
    maxCount: 1,
  },
  {
    name: 'images',
    maxCount: 3,
  },
]); // 'fields()' this is for uploading multiple files and different fields, we pass an array of fields in it

// upload.single('images') to upload single image (req.file)
// upload.array('images', 5) it used to upload or accept multiple files at the same name or fields : (req.files)

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  console.log(req.files); //req.files is used to log  details of multiple files

  if (!req.files.imageCover || !req.files.images) return next();

  // PROCESSING COVER IMAGE

  req.body.imageCover = `tour-${req.params.id}${Date.now()}-cover.jpeg`; // we put the image filename in the req body so that in the next middleware which is the actual route handler it will then put that data on the document in the DB when it updates it

  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333) // resized to 3:2 ratio
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`); // this will crop the image to square, format to jpeg and compress it by 90%

  // PROCESSING IMAGES
  req.body.images = [];
  await Promise.all(
    // we used map() so that we can save the result of the 3 promises of the aysnc functions so that we can await all of the using promise.all()
    req.files.images.map(async (file, index) => {
      const filename = `tour-${req.params.id}${Date.now()}-${index + 1}.jpeg`; // we don't name them with cover but with index

      await sharp(file.buffer) // we use file.buffer cos we are working on the current file in the loop
        .resize(2000, 1333) // resized to 3:2 ratio
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);

      req.body.images.push(filename);
    })
  ); // to resolve all array of promises before moving to next() otherwise req.body will be empty and file will not be saved

  (req.body);

  next();
});

//READFILE -> json
// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
// );

// PARAM MIDDLEWARE
// exports.checkID = (req, res, next, val) => {

//   console.log(`Tour id is ${val}`);
//   if (+req.params.id > tours.length) {
//     return res.status(404).json({
//       status: 'fail',
//       message: 'invalid id',
//     });
//   }

//   next();
// }

// chaining multiple middlewares
// exports.checkBody = (req, res, next) => {

//   if (!req.body?.name || !req.body?.price ) {
//     return res.status(400).json({
//       status: 'fail',
//       message: 'Missing Name or price',
//     });
//   }

//   next();
// }

// ALIASING  & PRE-FILLING API
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';

  next();
};

// // REFACTORING USING CLASSES
// class APIFeatures {
//   constructor(query, queryString) {
//     this.query = query;
//     this.queryString = queryString;
//   }

//   filter() {
//     const queryObj = { ...this.queryString };
//     const excludeFields = ['page', 'sort', 'limit', 'fields'];

//     excludeFields.forEach((el) => delete queryObj[el]);

//     // console.log(req.query, queryObj);

//     // 2) Advanced Filtering
//     let queryStr = JSON.stringify(queryObj);

//     // using regex to replace string
//     queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`); // match callback here will return the replaced matched word

//     // console.log(JSON.parse(queryStr));
//     this.query = this.query.find(JSON.parse(queryStr));

//     return this; // this here is the entire object class
//   }

//   sort() {
//     if (this.queryString.sort) {
//       const sortBy = this.queryString.sort.split(',').join(' ');

//       this.query = this.query.sort(sortBy); // sort('price ratingsAverage')
//       // query = query.sort(req.query.sort);
//     } else {
//       this.query = this.query.sort('-createdAt'); // this sort it in descending order based on the createAt time
//     }

//     return this;
//   }

//   limitFields(){
//      // FIELD LIMITING
//      if (this.queryString.fields) {
//       const fields = this.queryString.fields.split(',').join(' '); //'name duration price' this is the arg format for the select method
//       this.query = this.query.select(fields);

//       // this will select the properties name, duration, price only from the document
//       // we cannot remove id tho
//     } else {
//       this.query = this.query.select('-__v'); // the minus sign here excludes the property __v from the result, Prefix a field name you want to exclude with a '-' to exclude field
//     }

//     return this;
//   }

//   paginate(){
//     //PAGINATION

//     //127.0.01:8000/api/v1/tours?page=2&limit=10,

//     const page = this.queryString.page * 1 || 1;
//     const limit = this.queryString.limit * 1 || 100;
//     const skip = (page - 1) * limit;

//     this.query = this.query.skip(skip).limit(limit); // skip() is the amount of result that should be skipped before querying data

//     return this;
//   }
// }

// ROUTE HANDLERS
exports.getAllTours = handlerFactory.getAll(Tour);
// exports.getAllTours = catchAsync ( async (req, res, next) => {
//   // console.log(req.requestTime);
//   // using the JSend json format ot send response

//   // to get all the tours document from the database and this will return a promise that and the resolved valid promise returns the array of objects so we will await and so we have to turn this function into an async
//   // try {
//     // const tours = await Tour.find(); // find() get all the data from the db

//     // BUILDING THE QUERY

//     //1) Filtering
//     // creating a copy of the query
//     // const queryObj = { ...req.query };
//     // const excludeFields = ['page', 'sort', 'limit', 'fields'];

//     // excludeFields.forEach((el) => delete queryObj[el]);

//     // console.log(req.query, queryObj);

//     // // 2) Advanced Filtering

//     // let queryStr = JSON.stringify(queryObj);
//     // // using regex to replace string
//     // queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`); // match callback here will return the replaced matched word

//     // console.log(JSON.parse(queryStr));

//     // //{difficulty: 'easy', duration: {gte : 5}} frm req query
//     // // standard Express format {difficulty: 'easy', duration: {$gte : 5}} // gte means greater than or equals to, its this format we pass into the find() query

//     // // gte, gt, lte, lt this means greater than, less than or equal to, less than

//     // let query = Tour.find(JSON.parse(queryStr)); // this returns a promise of a query object which we can await or keep chaining methods to

//     // const query = Tour.find()
//     //   .where('duration')
//     //   .equals(5)
//     //   .where('difficulty')
//     //   .equals('easy');

//     // duration[gte]=5&difficulty=easy&sort=1&limit=10&price[lt]=1500

//     // SORTING
//     // if (req.query.sort) {
//     //   const sortBy = req.query.sort.split(',').join(' ');
//     //   console.log(sortBy);

//     //   query = query.sort(sortBy); // sort('price ratingsAverage')
//     //   // query = query.sort(req.query.sort);
//     // } else {
//     //   query = query.sort('-createdAt'); // this sort it in descending order based on the createAt time
//     // }

//     // WE CAN ALSO EXCLUDE or HIDE FIELDS BT JUSR SETTING THE select  PROPERTIES IN THE SCHEMA tp false i.e 'select:false'

//     // FIELD LIMITING
//     // if (req.query.fields) {
//     //   const fields = req.query.fields.split(',').join(' '); //'name duration price' this is the arg format for the select method
//     //   query = query.select(fields);

//     //   // this will select the properties name, duration, price only from the document
//     //   // we cannot remove id tho
//     // } else {
//     //   query = query.select('-__v'); // the minus sign here excludes the property __v from the result, Prefix a field name you want to exclude with a '-' to exclude field
//     // }

//     //PAGINATION

//     //127.0.01:8000/api/v1/tours?page=2&limit=10, lets say we have 100 documents in the db, 'limit' it the numbers of document per page 1.e 10 results per page with result 1-10 on page 1 and result 11-20 are on page 2 and so on

//     // const page = req.query.page * 1 || 1;
//     // const limit = req.query.limit * 1 || 100;
//     // const skip = (page - 1) * limit;

//     // query = query.skip(skip).limit(limit); // skip() is the amount of result that should be skipped before querying data

//     // if (req.query.page) {
//     //   const numTours = await Tour.countDocuments(); // this is to count the numbers of documents in the collection
//     //   if (skip >= numTours) {
//     //     throw new Error('This page does not exist');
//     //   }
//     // }

//     //EXECUTE QUERY
//     const features = new APIFeatures(Tour.find(), req.query)
//       .filter()
//       .sort()
//       .limitFields()
//       .paginate(); // this chaining only worked because when we call each method in the class it returns 'this'

//     const tours = await features.query;

//     // SEND RESPONSE
//     res.status(200).json({
//       status: 'success',
//       // results: tours.length,
//       data: {
//         tours,
//       },
//     });
//   // } catch (err) {
//   //   res.status(404).json({
//   //     status: 'fail',
//   //     message: err,
//   //   });
//   // }
// });

// Responding to variable, it represented with column snd the variable name, here we use 'id'

//NB: you can have multiple parameters /api/v1/tours/:id/:x/:y

//NB: you can have optional parameters /api/v1/tours/:id/:x/:y? so y here is optional

//GET by ID
exports.getTour = handlerFactory.getOne(Tour, { path: 'reviews' });

// exports.getTour = catchAsync (async (req, res, next) => {
//   // console.log(req.params); // ->{id: 'id'}

//   // const id = req.params.id * 1; // this trick is used to convert strings to numbers,  by multiplying string by 1

//   // const tour = tours.find((el) => el.id === id);

//   // // for invalid id handling
//   // if (!tour) {
//   //   return res.status(404).json({
//   //     status: 'fail',
//   //     message: 'invalid id',
//   //   });
//   // }

//   // res.status(200).json({
//   //   status: 'success',
//   //   data: {
//   //     tours: tour,
//   //   },
//   // });

//   // try {
//     // findById only finds one document
//     const tour = await Tour.findById(req.params.id).populate('reviews');
//     //populate reviews here fetches the reviews array in the review model liked to this particular tour iD as a virtual property
//     // behind the scenes its findOne

//     //Tour.findOne({_id: req.params.id}) this also works the same as findById

//   //Adding 404 not found error if tour is not found
//   if (!tour){
//     return (next( new AppError('No Tour found with that ID', 404)))
//   }

//     res.status(200).json({
//       status: 'success',
//       data: {
//         tour,
//       },
//     });
//   // } catch (err) {
//   //   res.status(404).json({
//   //     status: 'fail',
//   //     message: err,
//   //   });
//   // }
// });

// // The goal of the function is tp catch async errors
// const catchAsync = (fn) => {
//  return (req, res, next) => {
//   fn(req, res, next).catch(err => next(err))}
//    // next(err) propagate the error to the error handling middleware
// }

//POST
//CREATE
exports.createTour = handlerFactory.createOne(Tour);
// exports.createTour = catchAsync (async (req, res, next) => {
//   // console.log(req.body) // body is a property that is going to e available on the request bcos weve use a middleware on app

//   // const newId = tours[tours.length - 1].id + 1;

//   // const newTour = Object.assign({ id: newId }, req.body);

//   // // Object.assign is to create a new object  by merging 2 existing objects together

//   // tours.push(newTour);

//   // fs.writeFile(
//   //   `${__dirname}/dev-data/data/tours-simple.json`,
//   //   JSON.stringify(tours),
//   //   (err) => {
//   //     // status code 201 stands for created

//     //creating new tour from model
//     //  const newTour = new Tour();
//     // newTour.save()

//     //creating new tour right on the model
//     const newTour = await Tour.create(req.body);

//     res.status(201).json({
//       status: 'success',
//       data: {
//         tour: newTour,
//       },
//     });

//   })

// // PATCH
exports.updateTour = handlerFactory.updateOne(Tour);
// exports.updateTour = catchAsync (async (req, res, next) => {
//   // try {
//     // querying for the document we want to update and updating it
//     const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//       new: true,
//     });

//     // the 3rd argument is an options object new means it should return the new updated document

//     //Adding 404 not found error if tour is not found
//   if (!tour){
//     return (next( new AppError('No Tour found with that ID', 404)))
//   }
//     res.status(200).json({
//       status: 'success',
//       data: {
//         tour,
//       },
//     });

// } catch (err) {
//   res.status(404).json({
//     status: 'fail',
//     message: 'invalid dataset',
//   });
// }

// });

// DELETE
exports.deleteTour = handlerFactory.deleteOne(Tour);
// exports.deleteTour = catchAsync (async (req, res, next) => {
//   // when we have a delete request the response code is always 204 ,  204 means no content

//   // try {
//     const tour = await Tour.findByIdAndDelete({ _id: req.params.id });

//     //Adding 404 not found error if tour is not found
//   if (!tour){
//     return (next( new AppError('No Tour found with that ID', 404)))
//   }

//     res.status(204).json({
//       status: 'success',
//       data: null, // to show the item we deleted no longer exist
//     });

// } catch (err) {
//   res.status(404).json({
//     status: 'fail',
//     message: 'invalid dataset',
//   });
// }
// });

// this kind of export is used for exporting multiple variables, so this encapsulates them in an object that can be exported

//AGGREGATION PIPELINE: THIS can be used for statistical functionalities likes mean, averages etc

exports.getTourStats = catchAsync(async (req, res, next) => {
  // try {
  const stats = await Tour.aggregate([
    {
      // match ratingsAverage : match is basically to select document
      $match: { ratingsAverage: { $gte: 4.5 } },
    },

    //$group allows us to group document together using accumulators
    {
      $group: {
        // _id: null,
        _id: { $toUpper: '$difficulty' }, //$toUpper -> means to uppercase
        numTours: { $sum: 1 }, // this gets the numbers of tours in each group
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    //sort stage
    {
      $sort: { avgPrice: 1 }, // we have to use the same field names defined in the group stage bcos it has been defined
      // avgPrice: 1, 1 here means ascending order
    },
    // {
    //   $match: {
    //     _id: { $ne: 'EASY'} // $ne -> means not equal to
    //   } // this match exclude the id that its value is easy
    // }
  ]);
  // we pass in an array of stages in aggregate method, eac element in the array is the stages
  // $match: stage is to select or filter certain document

  // learn more abt aggregation here https://www.mongodb.com/docs/manual/reference/operator/aggregation-pipeline/

  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
  // } catch (err) {
  //   res.status(404).json({
  //     status: 'fail',
  //     message: err,
  //   });
  // }
});

// to get the startdates in a given year and the monthsplans numbers
exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  // try {
  const year = req.params.year * 1; // we multiply by 1 to transform it to a number

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      // to macth only the tours that are in the year start date
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' }, // group by the extracting the month of the date
        numTourStarts: { $sum: 1 }, // to count the numbers
        tours: {
          $push: '$name',
        }, // $push is used ot create an array
      },
    },
    {
      $addFields: { month: '$_id' }, // $addFields is used to add fields, this changes the id field to month
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: {
        numTourStarts: -1, // this sort in descending number with numTourStart as the reference
      },
    },
    {
      $limit: 6, // this will allow us to have 6 output
    },
  ]);

  // $unwind stage basically deconstruct an array field from the input document and output ine document for each element of the array

  res.status(200).json({
    status: 'success',
    data: {
      plan,
    },
  });
  // }
  // catch (err) {
  //   res.status(404).json({
  //     status: 'fail',
  //     message: err,
  //   });
  // }
});

// GEOSPATIAL QUERIES: Finding Tours within radius
// /tours-within/:distance/center/:latlng/unit/:unit
// /tours-within/223/center/-40,45/unit/mi
exports.getToursWithin = async (req, res, next) => {
  const { distance, latlng, unit } = req.params;

  const [lat, lng] = latlng.split(','); // split because latlng is a string

  // converting the distance to radius formula, mi means miles
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide correct latitude and longitude in the formate lat,lng',
        400
      )
    );
  }

  // console.log(distance, lat, lng, unit, radius);

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  // finds tour that are located within certain distance of our starting  point

  // $geoWithin finds document within certain geometry
  //$centerSphere takes in an array of coordinates and the radius // note when specifying the array the longitude  always comes first
  // we need to also add an index ot the startLocation field in the tour model

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours,
    },
  });
};

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  const [lat, lng] = latlng.split(','); // split because latlng is a string

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide correct latitude and longitude in the formate lat,lng',
        400
      )
    );
  }

  // for geospatial aggregate $geoNear always need to be the first stage in the pipeline, it requires that one of the field contains a geospatial index, if you have multiple fields with index, we use the $key parameter ot define them, but for this task we only need/use Startlocation

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        // starting point
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1], // *1 to convert to number
        },
        distanceField: 'distance', // this is the name of the field and all the calculated distances will be stored
        distanceMultiplier: multiplier, // to convert ot kilometers or miles
      },
    },
    {
      $project: {
        // names of the fields we want to keep and get rid of the rest in the final result object
        distance: 1,
        name: 1, // 1 means we want to keep it
      },
    },
  ]); // this result comes in meters

  res.status(200).json({
    status: 'success',
    data: {
      data: distances,
    },
  });
});

// aggregation pipeline is called on the model itself
