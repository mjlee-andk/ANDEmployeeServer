var express = require('express');
var router = express.Router();
const userController = require('../controllers');

// router.get('/', userController.basicAPI);
// router.get('/test', userController.testAPI);
// router.post('/post_test', userController.postTestAPI);

// 사용자
router.post('/api/user/login', userController.loginAPI);
router.post('/api/user/changepassword', userController.changePasswordAPI);

//
// 직원
//

router.get('/api/employees', userController.employeesAPI); // 직원목록조회
router.get('/api/employeeAPI', userController.employeeAPI); // 직원상세조회

//
// 메모
//


router.get('/api/memo', userController.memoAPI); // 메모 조회
router.post('/api/memo/add', userController.addMemoAPI); // 메모 처음 추가
router.post('/api/memo/update', userController.updateMemoAPI); // 메모 수정


// // 게시판
// router.get('/board', userController.getBoardsAPI);


module.exports = router;
