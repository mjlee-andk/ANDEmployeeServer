var express = require('express');
var router = express.Router();
const userController = require('../controllers');

router.get('/', userController.basicAPI);
router.get('/test', userController.testAPI);
router.post('/post_test', userController.postTestAPI);

router.post('/user/login', userController.loginAPI);
router.post('/user/changepassword', userController.changePasswordAPI);

router.get('/employees', userController.getEmployeesAPI);

module.exports = router;
