// user model
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var crypto = require('crypto');
var jwt = require('jsonwebtoken');
var secret = require('../config').secret;

var userSchema = new Schema({
  email: {
    type: String,
    unique: true,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  password: {
    type:String,
    required:true
  },
  address: {
    type:String,
    required:true
  },
  role: {
    type: String,
    default: 'user'
  },
  created_date: {
    type: Date,
    default: Date.now
  },
  active:{
    type: Boolean,
    default: true
  },
  salt:String
});

userSchema.methods.setPassword = function(password){
  this.salt = crypto.randomBytes(16).toString('hex');
  this.password = crypto.pbkdf2Sync(password, this.salt, 1000, 64, 'sha512').toString('hex');
};

userSchema.methods.validPassword = function(password) {
  var passwordHash = crypto.pbkdf2Sync(password, this.salt, 1000, 64, 'sha512').toString('hex');
  console.log(passwordHash);
  console.log(this.password);
  
  return this.password === passwordHash;
};

userSchema.methods.generateJwt = function() {
  var expiry = new Date();
  expiry.setDate(expiry.getDate() + 7);

  return jwt.sign({
    _id: this._id,
    email: this.email,
    name: this.name,
    exp: parseInt(expiry.getTime() / 1000),
  }, secret);
};

module.exports = mongoose.model('User', userSchema);