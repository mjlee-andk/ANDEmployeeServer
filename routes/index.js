var express = require('express');
var router = express.Router();
const userController = require('../controllers');

router.get('/', userController.basicAPI);
router.get('/test', userController.testAPI);
router.post('/post_test', userController.postTestAPI);

// 사용자
router.post('/user/login', userController.loginAPI);
router.post('/user/changepassword', userController.changePasswordAPI);

//
// 직원
//

// 직원목록조회
router.get('/employees', userController.getEmployeesAPI);


// // 게시판
// router.get('/board', userController.getBoardsAPI);


module.exports = router;
