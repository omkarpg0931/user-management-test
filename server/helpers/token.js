var jwt = require('jsonwebtoken');
var secret = require('../config').secret;

function getTokenFromHeader(req){
	if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'bearer') {
	  return req.headers.authorization.split(' ')[1];
	}
	
	return null;
}

exports.generateJwtToken = function (userData) {
	return jwt.sign(userData, secret);
}

exports.checkAuth = function (req, res, next) {
	var token = getTokenFromHeader(req);	
	try{
		var decoded = jwt.verify(token, secret);
		console.log(decoded);
		
		if (decoded.auth){
			next();
		} 
		else{
			return res.sendStatus(401);
		}
	} catch (err) {
		console.log(err);
		
		return res.sendStatus(500);
	}
	
};

exports.decodeToken = function (req) {
	var token = getTokenFromHeader(req);
	return jwt.decode(token);
};