var validator = require('validator');
var bcrypt = require('bcrypt');
var User = require('../models/user.js');
var _ = require('../helpers/lodash.js');
var errors = require('../errors.json');
var jwtToken = require('../helpers/token.js');
var nodemailer = require('nodemailer');
var config = require('../config');

function addNewUser(userData) {
	var user = new User();
	console.log(userData);
	
	user.name = userData.name;
	user.email = userData.email_id;
	user.address = userData.address;
	user.setPassword(userData.password);

	user.save(function(err) {
		console.log(err);
		
		if(err){
			return err, null;
		} else{
			return null, user;
		}
	});
}

exports.addUser = function(req, res) {
	var userData = req.body;
	console.log(userData);
	
    var error = null;
    var data = [];
	var keys = ['name', 'password', 'email_id', 'address'];

	userData = _.keysRequired(keys, userData);

	if (!userData) {
		res.status(400).send(errors.error.emptyFieldErr);
	} else if (!validator.isEmail(userData.email_id)) {
		res.status(400).send(errors.error.invalidEmailErr);
	} else {
        error, registeredUser = addNewUser(userData);
        if (error) {
            res.status(error.code).send(error.message);
        } else {
            res.status(200).send("Successfully added user");
        }	
	}
};

exports.login = function(req, res) {
    var loginData = req.body;

    loginData.username = (loginData.username || '').toLowerCase().trim();
    loginData.password = (loginData.password || '') .trim();

    if(!loginData.username || !validator.isEmail(loginData.username)) {
        res.status(401).send(errors.error.invalidEmailErr);
    } else if(!loginData.password) {
        res.status(401).send(errors.error.invalidCredentials);
    } else {
		
		User.findOne({ email: loginData.username, role:'admin' }, function (err, userData) {
			console.log(userData);
			
			if (err) { 
				res.status(err.code).send("Internal Server Error");
			}

			if (!userData) {
				res.status(404).send(errors.error.invalidCredentials);
			}

			if (!userData.validPassword(loginData.password)) {
				res.status(404).send(errors.error.invalidCredentials);
			}else{
				var auth = true;

				if (userData.role == 'user'){
					auth=false;
				}
				var user = {
					'name' : userData.name,
					'id': userData.id,
					'auth': auth
				};

				message = {
					'token' : jwtToken.generateJwtToken(user),
					'user_type' : userData.is_admin,
					'message': "Login Successful"
				};

				delete req.body;
				res.status(200).send(message);
			}
		});
    }
};

exports.getUser = function(req, res) {
	var reqParams = req.query;
	if(!reqParams) {
		res.status(401).send("Invalid Request");
	} else if(!reqParams.id) {
		res.status(401).send("Invalid Request");
	} else {
	  	User
		.findById(reqParams.id)
		.exec(function(err, user) {			
			if(err){
				res.status(err.code).json(err.message);
			}else{
				var pickKeys = ['_id', 'name', 'email', 'address', 'role', 'created_date'];	
				user = _.pick(user, pickKeys);
				console.log(user);
				res.status(201).json(user);
			}
		});
	}
};

exports.forgotPassword = function(req, res){

	if (!validator.isEmail(req.body.email)) {
		res.status(400).send(errors.error.invalidEmailErr);
	} else {
		User
		.findOne({email: req.body.email})
		.exec(function(err, user) {		
			if(err){
				res.status(err.code).json(err.message);
			}else if(user){				
				var newPassword = Math.random().toString(36).slice(-8);

				var transporter = nodemailer.createTransport({
					service: 'gmail',
					auth: {
						user: config.email,
						pass: config.password
					}
				});

				var mailOptions = {
					from: config.email,
					to: req.body.email,
					subject: 'Reset Password',
					text: 'Your new password is ' + newPassword
				};

				transporter.sendMail(mailOptions, function(error, info){
					if (error) {
						console.log(error);
					} else {
						console.log('Email sent: ' + info.response);
					}
				});
				res.status(200).json(user);
			} else{
				res.status(404).json("User not found");
			}
		});
	}
}

exports.updateUser = function(req, res) {
	reqData = req.body;
	var newvalues = { $set: reqData };
	
	User.updateOne({ _id : reqData._id }, newvalues, function(err, response) {
		console.log(err);
		console.log(response);
		
		if (err){
			res.status(err.code).json(err.message);		
		} else{
			res.status(200).json("Successfully updated");
		}
	});
};

exports.listAllUsers = function(req, res) {
	decodedUser = jwtToken.decodeToken(req);
	User
	.find({})
	.where({active:true, '_id': {$ne: decodedUser.id}})
	.exec(function(err, users) {
		if(err){
			res.status(err.code).json(err.message);
		}else{
			console.log(users);
			var usersList = []
			var pickKeys = ['_id', 'name', 'email', 'address', 'role', 'created_date'];

			users = _.pickFromObjects(users, pickKeys);
			console.log(users);
			
			res.status(201).json(users);
		}
	 });
};

exports.removeUser = function(req, res) {
	reqParams = req.query;
	var newvalues = { $set: {active:false} };
	console.log(reqParams.id);
	
	User.updateOne({ _id : reqParams.id }, newvalues, function(err, response) {
		console.log(err);
		console.log(response);
		
		if (err){
			res.status(err.code).json(err.message);		
		} else{
			res.status(200).json("Successfully deleted");
		}
	});
};

