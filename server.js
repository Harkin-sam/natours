const mongoose = require('mongoose');
const dotenv = require('dotenv');

//UNCAUGHT EXCEPTIONS: this are errors that occurs in our synchronous code but are not handled anywhere, this listening should be done at the top of the code for it to catch the errors

process.on('uncaughtException', err => {
  console.log(`UNCAUGHT EXCEPTION! 🚨 shutting down...`);
  console.log(err.name, err.message);
  
    process.exit(1);
  
  
})

dotenv.config({ path: './config.env' });
const app = require('./app');



// console.log(app.get('env')); // -> this prints development cos be default express our environment to that but we can use node to tune it to the one we want maybe production mode

// this is the convention to create a config.env file and define all environment variables there

// using the dotenv here, it reads our variable from the file and save them in nodejs environment variables

// console.log(process.env)

// connecting with database
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

// to connect the first arg is the db string and the 2nd arg is and object for options to deal with applications warnings , mongoose returns a promise which is ten resolved with .then()
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    // useCreateIndex: true,
    // useFindAndModify: false,
  })
  .then(() => {
    // console.log(con.connections) pass  con in then();
    console.log('DB connection successful');
  });

// // SCHEMA
// const tourSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: [true, 'A tour must have a name'],
//     unique: true // this is to make each name have a unique name
//   },
//   rating: {
//     type: Number,
//     default: 4.5
//   },
//   price: {
//     type: Number,
//     required: [true, 'A tour must have a price']
//   },
// }); // we use the schema type options object is used to provide validation, description and specificity of properties

// // WE CREATE A MODEL OUT OF A SCHEMA
// const Tour = mongoose.model('Tour', tourSchema); // as a convention we use a capital  first letter  when naming models


// // CREATING DOCUMENTS AND TESTING THE MODEL
// const testTour = new Tour({
//   name: "The Park Camper",
//   price: 990,
// })

// testTour.save().then(doc => {console.log(doc)}).catch(err => {console.log('ERROR 🚨',err)}); // this will save the document in the database, save() returns a  promise that we cans then consume


// To start up a server
const port = process.env.PORT || 3000;
 const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

// we use a package called dotenv to process the config.emv file

// install it using npm i dotenv

//  to connect database with node js we fist need to get the connection string and put it in the config.env file and edit it by putting the name of the collection in he string

// the fo nodejs to interact with mongodb we need to install a driver called mongoose, using npm i mongoose@5 , version 5 is better

//MVC ARCHITECTURE ON EXPRESS APP
//


// EACH TIME THERE IS AN UNHANDLED REJECTION IN OUR APPLICATION: meaning errors outside express like failed DB connection or expired/ invalid paSSWORD to handle that, PROCESS SHOULD BE SET TO EMIT AN EVENT AND OBJECT, SO WE CAN SUBSCRIBE TO THAT EVENT LIKE THIS 

process.on('unhandledRejection', err => {
  console.log(err.name, err.message)
  console.log(`UNHANDLED REJECTION! 🚨 shutting down...`);
  // once there error in db connection all we an do is to shutdown our application, to shutdown application gracefully server.close() give us time to finish pending request or being handled then after it shutdown
  server.close(() =>{
    process.exit(1);
  })
  
  // code 0 stands for success and code 1 stands for uncalled exemption
})


