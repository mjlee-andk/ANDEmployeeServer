var express = require('express');
var router = express.Router();
const fcmController = require('../controllers/fcm');

router.post('/send', fcmController.fcmSendAPI); // 푸시알람 보내기
router.get('/birth', fcmController.fcmBirthAPI); // 생일 푸시 알람 

module.exports = router;
