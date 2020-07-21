var express = require('express');
var router = express.Router();
const indexController = require('../controllers/index');
const boardController = require('../controllers/board');

//
// 사용자
//

router.post('/user/login', indexController.loginAPI); // 로그인
router.post('/user/changepassword', indexController.changePasswordAPI); // 비밀번호 변경

//
// 직원
//

router.get('/employees', indexController.employeesAPI); // 직원목록조회
router.get('/employee', indexController.employeeAPI); // 직원상세조회

//
// 메모
//

router.get('/memo', indexController.memoAPI); // 메모 조회
router.post('/memo/add', indexController.addMemoAPI); // 메모 처음 추가
router.post('/memo/update', indexController.updateMemoAPI); // 메모 수정


//
// 부서 목록
//

router.get('/departments', indexController.departmentsAPI);


//
// 게시판
//

router.get('/boards', boardController.boardsAPI);
router.get('/board', boardController.boardAPI);
router.post('/board/like', boardController.likeBoardAPI); // 게시글 좋아요/좋아요취소
router.post('/board/add', boardController.addBoardAPI); // 게시글 작성
router.post('/board/update', boardController.updateBoardAPI); // 게시글 수정
router.post('/board/delete', boardController.deleteBoardAPI); // 게시글 삭제


//
// 게시판 댓글
//

router.post('/comment/add', boardController.addCommentAPI); // 댓글 작성
router.post('/comment/update', boardController.updateCommentAPI); // 댓글 수정
router.post('/comment/delete', boardController.deleteCommentAPI); // 댓글 삭제
router.post('/comment/like', boardController.likeCommentAPI); // 댓글 좋아요/좋아요취소


module.exports = router;
