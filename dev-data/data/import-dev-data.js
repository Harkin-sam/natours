// A PERSONALIZED SCRIPT TO DELETE ALL AND UPLOAD DATA AT ONCE INTO DATABASE


const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('./../../models/tourModel.js');
const Review = require('./../../models/reviewModel.js');
const User = require('./../../models/userModel.js');

dotenv.config({ path: './config.env' });

// connecting with database
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log('DB connection successful');
  });


  // READING THE FILE 
  const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
  const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
  const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'));
  

  // IMPORT DATA INTO DATABASE
  const importData = async () => {
    try{

        await Tour.create(tours); // create can accept an array of object to create new document for each object

        await User.create(users, {validateBeforeSave: false}); // this options object here is to temporarily turn of the password validation in the model for the purpose of upload file

        await Review.create(reviews);

        console.log('data successfully loaded')
        
    }catch(err){
        console.log(err)
    }

    process.exit(); // this is used to terminate the process after done
  }


  // DELETE ALL DATA FROM THE COLLECTION
  const deleteData = async () => {
    try{

        await Tour.deleteMany() // this will delete all the document in the current Tour collection

        await User.deleteMany()
        await Review.deleteMany()

        console.log('data successfully deleted')

       
    }catch(err){
        console.log(err)
    }

    process.exit() //this is used to terminate the process after done
  }


  if (process.argv[2] === '--import'){
    importData();
  }else if (process.argv[2] === '--delete'){
    deleteData()
  }


  console.log(process.argv); // process.argv is an array of the path and the set the commands attached to it, we can use it to run commandline 

  // TO DELETE EXISTING DATA IN THE DATABASE : 
  // use 'node' + 'the file path' + '--delete' i.e node dev-data/data/import-dev-data.js --delete

  // TO DELETE  UPLOAD  DATA IN THE DATABASE : 
  // use node the path and --import i.e node dev-data/data/import-dev-data.js --import
  