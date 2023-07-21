const mongoose = require('mongoose');
const slugify = require('slugify');
// const validator = require('validator');
// const User = require('./userModel');


// SCHEMA

// in the schema 1st arg  is the object for the schema definition and the 2nd arg is the object for the options

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true, // this is to make each name have a unique name
      trim: true,
      maxlength: [40, 'A tour name must have less or equal then 40 characters'], // this built-in validator is only used for string to specify maxlength and error message
      minlength: [10, 'A tour name must have more or equal then 10 characters'],

      // were using external validator library package here, isAlpha is to ensure that the name does not contain numbers or spaces
      // validate: [validator.isAlpha, 'Tour name must only contain characters']

    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either easy, medium or difficult',
      }, // in-built data validation
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'rating must be above 1.0 '], // in-built data validation for numbers and dates
      max: [5, 'rating must be below 5.0'],
      set: val => Math.round(val * 10) / 10 //this trick is to approximate numbers like 4.6666 -> 46.666 -> 4.7  , setter function: this function will run anytime a new value is set in this ratingsAverage Field
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      //custom validator, a custom validator only returns true or false for the conditions specifications,
      // this is standard format
      validate: {
        validator: function (val) {
          // 'this' here only points to the current doc on NEW document creation
          return val < this.price; 
        },
        message: 'Discount price ({VALUE}) should be below the regular price',
      },
     
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description'],
    },
    description: {
      type: String,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover Image'],
    },
    images: [String], // this means type of array of strings
    createdAt: {
      type: Date,
      default: Date.now(), // Mongodb automatically converts and parse the date timestamp to the readable format
      select: false, // this hide the details from being logged out in console
    },
    startDates: [Date], // this means an array of dates
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      // GeoSpatial Data: GeoJSON
      // first type here is a Subfield
      type: {
        type: String,
        default: "Point", // we can also specify other geometries like lines, polygons etc
        enum: ['Point']
      },
      coordinates: [Number], // longitude and latitude
      address: String,
      description: String
    },
    locations: [ // embedded documents: array of object, this will then create a brand new document inside the current document 'TOUR" so they will have an ID
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number
      }
    ],
    guides: [ // child referencing  
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User' // establishing referencing between different dataset model in mongoose, so this is linked ot User model
      }
   
    ]
    
  },
  {
    // for explicitly telling the scheme to consolelog the virtual properties
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// we use the schema type options object is used to provide validation, description and specificity of properties

// IMPROVING READ EFFICIENCY: to improving read/querying/sorting  speed performance in DB engine by examining ID index instead of reading the entire document for large data
//single field index
// tourSchema.index({price: 1}) // this means we sorting the price index in an ascending order , -1 means descending order
// Compound field index
tourSchema.index({price: 1, ratingsAverage: -1});
// we need to study the access pattern of the app to know and determine what field will be queried the most
tourSchema.index({slug: 1});
tourSchema.index({startLocation: '2dsphere' }) // 2d plane  sphere earth like sphere data 

// trim only works on strings and it removes the spaces in the beginning and the end

//VIRTUAL PROPERTIES

//durationWeeks is the name of the virtual property
// virtual prop will e created each time we get data from the database
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// VIRTUAL POPULATE: Tours and Reviews
//'reviews' name of the new populated array
tourSchema.virtual('reviews', {
  ref: "Review", // Model name
  foreignField: "tour", // the name of id field in reviewModel to make a connection 
  localField: '_id'  // name of the id in the current model that matches the value
})

// we pass a real function in the getter function not an arrow function because an arrow function does not have a 'this' keyword, the 'this' keyword in this case will be pointing to the current document

// Note we cannot use a virtual property in a query cos they are technically not part of the database

// DOCUMENT MIDDLEWARE : it runs before the .save() command and .create() they don't work for update

tourSchema.pre('save', function (next) {

  // console.log(this) // 'this' is the currently processed document

  this.slug = slugify(this.name, { lower: true }); //setting the slug property to the name in lowercase

  next();
});

// tourSchema.pre('save', async function (next) {

//   const guidesPromises = this.guides.map(async id => await User.findById(id) ) // this return guidesPromises as an array pf promises so we use promise.all() to resolve al promises 

//  this.guides =  await Promise.all(guidesPromises)
//   next();
// });

// we can have multiple pre-middleware and post middleware in the same HOOK or event, and hook is the 'save' event in this case , save event only works for .save() and .create() mongoose  method it might  not work for other methods

// tourSchema.pre('save', function(next){
//   console.log('will save document...');

//   next();
// })

// // Post middleware are initiated when all the pre-middleware are completed
// tourSchema.post('save', function(doc, next){
//   // here we cannot access the 'this' keyword but we can access finished document in 'doc'

//   console.log(doc);

//   next();
// })

// QUERY MIDDLEWARE : this middleware runs before any find query is executed
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } }); // this finds all docs with with secretTour: false

  // the document is just a regular object so we can set additional properties on it

  this.start = Date.now();

  // the 'this' keyword here will be pointing to the current query object not the document, and we can chain another query method on  it
  next();
});

// using the regex '/^find/' as the event means it matches all event that starts with find so it works for find, findOne and any works when any other find event is fired

tourSchema.pre(/^find/, function (next){
  this.populate({path: "guides",
  select: '-__v -passwordChangedAt'});
  
  next();

  // populate here is to fill the guides field with the actual data in the query not in the actual database, when getTour is queried and fetch populate() will replace the id reference in guide array in the db with the actual data of the of IDs
    //select will remove the selected option form the output data 
})


tourSchema.post(/^find/, function (docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds`);
  // console.log(docs);
  next();
});




// AGGREGATION MIDDLEWARE: This allows us to have hooks before and after an aggregation happens

// pre: before the aggregate happens
// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   // 'this': here will point to the current aggregation object
//   console.log(this.pipeline());
//   next();
// });

// WE CREATE A MODEL OUT OF A SCHEMA
const Tour = mongoose.model('Tour', tourSchema); // as a convention we use a capital  first letter  when naming models

module.exports = Tour;

// VIRTUAL PROPERTIES ARE BASICALLY FIELDS WE CAN DEFINE 0N OUR SCHEMA BUT ITS NOT PERSISTENT, SO THEY WILL NOT BE SAVED IN THE DATABASE

// VIRtual properties can be used for fields that can be derived from one another eg converting from miles to km



// we can also use external packages for validation
// like validator js
// npm i validator


// NDB is used for debugging Node js code by google
// npm i ndb --global

// set script in package.json to 'debug': "ndb server.js"
// enter npm run debug in console
// it will download and open a debugging browser 

// to fundamental aspect of debugging it to set break points
// this are can use to made certain part of our code freeze so that we can examine the variables