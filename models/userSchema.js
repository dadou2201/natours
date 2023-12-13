const mongoose = require('mongoose');
const validator = require('validator');

//name,email,photo,password,passwordConfirm:
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name!'],
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valide email'], //on utilise le validator de npm pr verif si l email est valide
  },
  photo: String,
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false, //ne montre pas le mdp ds la db et ds le postman
  },
  passwordConfirm: {
    type: String,
    require: [true, 'Pleae confirm your password'],
    validate: {
      //this only works on CREATE and SAVE !!!
      validator: function (el) {
        return el === this.password;
      },
      message: 'Password are not the same',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});
exports.userSchema = userSchema;
