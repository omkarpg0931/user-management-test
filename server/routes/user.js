var express = require('express');
var router = express.Router();
var userController = require('../controllers/userController');
var tokenHelper = require('../helpers/token')

router.post('/login', userController.login);

router.post('/register', userController.addUser);

router.post('/user/password', userController.forgotPassword);

router.post('/user', tokenHelper.checkAuth, userController.addUser);

router.put('/user', userController.updateUser);

router.delete('/user', tokenHelper.checkAuth, userController.removeUser);

router.get('/users', tokenHelper.checkAuth, userController.listAllUsers);

router.get('/user', tokenHelper.checkAuth, userController.getUser);

router.get('/logout', function(req, res) {
  req.logout();
  res.status(200).json({
    status: 'Bye!'
  });
});


module.exports = router;