var express = require('express');
var router = express.Router();
const userController = require('../controllers');

//
// 사용자
//

router.post('/api/user/login', userController.loginAPI); // 로그인
router.post('/api/user/changepassword', userController.changePasswordAPI); // 비밀번호 변경

//
// 직원
//

router.get('/api/employees', userController.employeesAPI); // 직원목록조회
router.get('/api/employee', userController.employeeAPI); // 직원상세조회

//
// 메모
//

router.get('/api/memo', userController.memoAPI); // 메모 조회
router.post('/api/memo/add', userController.addMemoAPI); // 메모 처음 추가
router.post('/api/memo/update', userController.updateMemoAPI); // 메모 수정


//
// 부서 목록
//

router.get('/api/departments', userController.departmentsAPI);

// // 게시판
// router.get('/board', userController.getBoardsAPI);


module.exports = router;
