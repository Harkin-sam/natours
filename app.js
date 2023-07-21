// const fs = require('fs');
const path = require('path') // this is a built-in node module used to manipulate path

// its kinda a general convention to have all EXPRESS configuration in app js
// orders is really important in express

const express = require('express');
const morgan  = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp')

const AppError = require('./utils/appError');
const globalErrorHandler = require('./errorController')
const tourRouter = require('./routes/tourRoutes.js')

const userRouter = require('./routes/userRoutes.js')
const reviewRouter = require('./routes/reviewRoutes.js')
const bookingRouter = require('./routes/bookingRoutes')
const viewRouter = require('./routes/viewRoutes')


const cookieParser = require('cookie-parser');
// in order to get access to the cookie in any incoming request, we use a package installed 'npm i cookie-parser'

const app = express();
//express is a function which upon calling will add a bunch of methods to app variable

//SETTING UP our render template Engine (PUG)
// npm i pug
// pug is a simple white space sensitive syntax for writing html
app.set('view engine', 'pug'); 

// Defining where this views is located in our file system, pug template are actually called views in express
app.set('views', path.join(__dirname, 'views')) // this create a path joining the directory name /view

//1) GLOBAL MIDDLEWAREs

// Serving static files
app.use(express.static(path.join(__dirname, 'public')));

// SETTING SECURITY HTTP HEADERS: we need to always put in the beginning of our code 
// app.use(helmet()); 

// in app.use we use a function itself not a function call name only
app.use( helmet({ contentSecurityPolicy: false }) );



// DEVELOPMENT LOGGING 
if(process.env.NODE_ENV === 'development'){  
// there is also third party middleware called morgan, which can be used for login and development cases, use npm i morgan

app.use(morgan('dev')); // this provides much details about our req and res
}


//IMPLEMENTING RATE LIMITING: to prevent hacker using too many request to guess the credentials of a user 
// limit request from same IP
const limiter = rateLimit({
    max: 100, // max no of requests
    windowMs: 60 * 60 * 1000, // means per 1hr
    message: 'Too many request from this IP, please try again in an hour' // this is the error message that will display
})

app.use('/api', limiter) //using it as middleware


//BODY PARSER, reading data from the body into req.body

// This is a middleware from express to access the request body,
app.use(express.json({limit : '10kb'})); // the limit here will limit the size of the request body to 10kb to prevent infecting the body with malicious code
app.use(express.urlencoded({extended: true, limit: '10kb'})) // an express built-in middleware to parse data from a url encoded form 

// COOKIE PARSER
app.use(cookieParser()); // parses the data from the cookie


// DATA SANITIZATION against No SQL query injection 

app.use(mongoSanitize()); // this looks at the req.body and params and filter out all of the $ signs and sql query 

// DATA SANITIZATION against XSS

app.use(xss()); // this will clean any use input from malicious html code

// PREVENTING PARAMETER POLLUTION: i it helps to clean up the query string
app.use(hpp({
    whitelist: [
        'duration',
        'ratingsQuantity',
        'ratingsAverage',
        'maxGroupSize',
        'difficulty',
        'price'
    ]
})); // whitelist simply an array of properties we allow duplicates in the query string

// MIDDLEWARE a functions basically used to modify the incoming request, we use them to access and process the  'post'request from the client
//express.json() here is the middleware, a middleware has access to the req, res and next function as 3rd args


// we must define middleware before any of our route handler

//SERVING STATIC FILES from folder
//using the simple built in middleware
// app.use(express.static(`${__dirname}/public`))
// app.use(express.static(path.join(__dirname, 'public')));


//CREATING OUR MIDDLEWARE
// app.use((req, res, next) => {

//     console.log('Hello form the middleware'); // this applies to every single request

//     next(); //never forget to use next in all of your middlewares or else the code will break
// });

// Test Middleware
app.use((req, res, next) => {

    // we can also define custom property on the request object
    req.requestTime = new Date().toISOString();

    // console.log(req.cookies)
    next();
})

//READFILE -> json
// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`)
// );


// // ROUTE HANDLERS
// const getAllTours = (req, res) => {

//     console.log(req.requestTime)
//   // using the JSend json format ot send response
//   res.status(200).json({
//     status: 'success',
//     requestedAt: req.requestTime,
//     results: tours.length,
//     data: {
//       tours: tours,
//     },
//   });
// };

// // Responding to variable, it represented with column snd the variable name, here we use 'id'

// //NB: you can have multiple parameters /api/v1/tours/:id/:x/:y

// //NB: you can have optional parameters /api/v1/tours/:id/:x/:y? so y here is optional


// //GET by ID
// const getTour = (req, res) => {
//   console.log(req.params); // ->{id: 'id'}

//   const id = req.params.id * 1; // this trick is used to convert strings to numbers,  by multiplying string by 1

//   const tour = tours.find((el) => el.id === id);

//   // for invalid id handling
//   if (!tour) {
//     return res.status(404).json({
//       status: 'fail',
//       message: 'invalid id',
//     });
//   }

//   res.status(200).json({
//     status: 'success',
//     data: {
//       tours: tour,
//     },
//   });
// };

// //POST
// const createTour = (req, res) => {
//   // console.log(req.body) // body is a property that is going to e available on the request bcos weve use a middleware on app

//   const newId = tours[tours.length - 1].id + 1;

//   const newTour = Object.assign({ id: newId }, req.body);

//   // Object.assign is to create a new object  by merging 2 existing objects together

//   tours.push(newTour);

//   fs.writeFile(
//     `${__dirname}/dev-data/data/tours-simple.json`,
//     JSON.stringify(tours),
//     (err) => {
//       // status code 201 stands for created
//       res.status(201).json({
//         status: 'success',
//         data: {
//           tour: newTour,
//         },
//       });
//     }
//   );
// };

// // PATCH
// const updateTour = (req, res) => {
//   if (+req.params.id > tours.length) {
//     return res.status(404).json({
//       status: 'fail',
//       message: 'invalid id',
//     });
//   }

//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour: '<Updated tour here...>',
//     },
//   });
// };

// // DELETE
// const deleteTour = (req, res) => {
//   if (+req.params.id > tours.length) {
//     return res.status(404).json({
//       status: 'fail',
//       message: 'invalid id',
//     });
//   }

//   // when we have a delete request the response code is always 204 ,  204 means no content
//   res.status(204).json({
//     status: 'success',
//     data: null, // to show the item we deleted no longer exist
//   });
// };




// const getAllUsers = (req, res) => {

//     //error 500 means internal server error
//      res.status(500).json({
//         status: 'success',
//         message: 'This route is not yet defined'
//      })

// }

// const getUser = (req, res) => {

//     //error 500 means internal server error
//      res.status(500).json({
//         status: 'success',
//         message: 'This route is not yet defined'
//      })

// }

// const createUser = (req, res) => {

//     //error 500 means internal server error
//      res.status(500).json({
//         status: 'success',
//         message: 'This route is not yet defined'
//      })

// }

// const updateUser = (req, res) => {

//     //error 500 means internal server error
//      res.status(500).json({
//         status: 'success',
//         message: 'This route is not yet defined'
//      })

// }
// const deleteUser = (req, res) => {

//     //error 500 means internal server error
//      res.status(500).json({
//         status: 'success',
//         message: 'This route is not yet defined'
//      })

// }




// GET
// app.get('/api/v1/tours', getAllTours);
// app.get('/api/v1/tours/:id', getTour);

// // POST
// app.post('/api/v1/tours', createTour);

// // PATCH
// app.patch('/api/v1/tours/:id', updateTour);

// // delete
// app.delete('/api/v1/tours/:id', deleteTour);

// ROUTES refactored
// creating and mounting multiple router

// Mounting a new router on a route
// const tourRouter = express.Router(); // here we created this new router and saved it in this variable, then we use it as middle ware ^^
// const userRouter = express.Router();


// tourRouter.route('/').get(getAllTours).post(createTour)

// tourRouter.route('/:id').get(getTour).patch(updateTour).delete(deleteTour);
 
//ROUTES
app.use('/', viewRouter);

// we use the mounted middleware located here after the  required variable has been declared
app.use('/api/v1/tours', tourRouter);
app.use ('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);


// implementing 'Users' routes
// userRouter.route('/').get(getAllUsers).post(createUser)

// userRouter.route('/:id').get(getUser).patch(updateUser).delete(deleteUser)


//HANDLING UNHANDLED ROUTES
// since the middleware act according in the specific order as written in the code, this is position down in code stack so that any req that get here must have passed through all routes handlers, and if if it eventually get here it means it does not match or its not meant for the server so this middleware serves as the error message 

app.all('*', (req, res, next) => {
    // res.status(404).json({
    //     status: 'fail',
    //     message: `Cant find ${req.originalUrl} on this server`
    // })

    // another syntax
    // const err = new Error(`cant find ${req.originalUrl} on this server`)
    // err.status = 'fail';
    // err.statusCode = 404;

    // next(err); // once you pass in err args in the next function it signifies that the req is an err and instead of moving to the next middleware in the stack it automatically looks for the central error handling middleware and pass the arg to it to handle it

    // Better Error refactoring
    next(new AppError(`cant find ${req.originalUrl} on this server`, 404 ))
}); 

// .all() works for all the http methods, get,post, create and the rest 
// '*' stands for all routes


// GLOBAL CENTRAL ERROR HANDLING MIDDLEWARE THAT WILL JUST CATCH ALL ERRORS AND HANDLE THEM ACCORDINGLY
// if your  middleware has 4 args express will automatically know that it an error handling middleware and it will only call it when there is an error 

app.use(globalErrorHandler);

// To start up a server
// const port = 3000;
// app.listen(port, () => {
//   console.log(`App running on port ${port}...`);
// });



module.exports = app;

// IMPORTANT-NOTE: IN JSON EVERYTHING HAS TO BE IN QUOTE strictly DOUBLE QUOTE



// npm i express-rate-limit
// this is to install package for implementing rate limit: which is a security measure to prevent to many request from a single one IP to the server in a certain amount of time 


// npm i helmet 
// this helmet package is used for setting security HTTP headers



//npm i express-mongo-sanitize
// this package is used to sanitize or prevent query injection attack like logging email: {$gte: ''} which could access data base as true from invader 



// npm i xss-clean 
// this is also for sanitization 


// npm i hpp
// this prevent parameter pollution 