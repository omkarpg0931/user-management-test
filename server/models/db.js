var mongoose = require('mongoose');

var config = require('../config');

mongoose.connect(config.db);
var db = mongoose.connection;

db.on('error', function() {
  throw new Error('Unable to connect to database');
});

db.on('connected', function() {
  console.log('Mongoose connected');
});
db.on('disconnected', function() {
  console.log('Mongoose disconnected');
});