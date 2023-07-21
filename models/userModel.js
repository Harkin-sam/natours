const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const { truncate } = require('fs');

// produce a schema name, email, password, passwordConfirm

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name'],
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true, // this transforms any email provided to lowercase
    validate: [validator.isEmail, 'Please provide a valid email'], // validator.isEmail is a built in fn tha comes with validator package to validate email
  },
  photo: { 
    type: String, 
    default: 'default.jpg' }, // to make all new user have default photo until they upload new one
  role: {
    type: String,
    enum: ['user', 'admin', 'guide', 'lead-guide'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'User must have a password'],
    minlength: 8, // to make the password not more than 8
    select: false, // this will make sure the password is never visible to the client , this is very important, we cant even point to it using 'this' keyword
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      // This validator will on work on SAVE!!! or when we create a new object, it will not work for update
      validator: function (el) {
        return el === this.password;
      },
      message: 'password are not the same',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false, // to hide the active flag
  },
});

// using DOCUMENT MIDDLEWARE to encrypt data

// This occurs between getting the data and saving it in the database
userSchema.pre('save', async function (next) {
  // if the Password has not been modified return and call the next middleware
  if (!this.isModified('password')) return next();

  //else encrypt using popular algorithm called  bcrypt
  // install it first using npm i bcryptjs

  this.password = await bcrypt.hash(this.password, 12); // 12 here means how cpu intensive the encryption should be

  this.passwordConfirm = undefined; // this is to reset rhe passwordConfirm since its done validating

  next();
});

//USING QUERY MIDDLEWARE FOR THE DELETED USER MARKED active: false
// it runs before any query, '/^find/ is a regex that works for all find queries find(), findbyid, findandupdate etc

userSchema.pre(/^find/, function (next) {
  // this points to the current query
  this.find({ active: { $ne: false } }); // only find documents with active not equal to false
  next();
});

//  A FUNCTION TO CHECK IF THE GIVEN PASSWORD IS THE SAME AS THE ONE STORED IN THE DOCUMENT

// USING AN iNSTANCE METHOD: an instance method is basically a method that is gonna e available on all documents of a certain collection, its defined on the schema

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  // bcrypt can encrypt and decrypt to compare ie comparing hashed value with unhashed values

  return await bcrypt.compare(candidatePassword, userPassword);

  // the awaited  compare method on bcrypt returns true or false
};

userSchema.methods.changedPasswordAfter = function (JWTTimeStamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    // console.log(changedTimeStamp, JWTTimeStamp)

    return JWTTimeStamp < changedTimeStamp;
  }
  // false means NOT changed
  return false;
};

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000; // WEremoved 1s bcos sometimes it takes time to update a database do to cater for the delay, it just a small hack to ensure the JWT token is always created after the password has been changed
  next();
});

userSchema.methods.createPasswordResetToken = function () {
  // using the built in node crypto module to generate  random num in hexadecimal of 32bit size
  const resetToken = crypto.randomBytes(32).toString('hex');

  // encrypting it and set as password reset token, bcos the safety rule is every password/token  must be saved in an encrypted form to be in the DB
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // convert to send + 10 mins in seconds

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;

// NOTE THIS PRINCIPLES
//1 Never a store plain password in the database always encrypt user password
