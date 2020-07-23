var express = require('express');
var router = express.Router();
const fcmController = require('../controllers/fcm');

router.post('/send', fcmController.fcmSendAPI); // 푸시알람 보내기
router.post('/birth', fcmController.fcmBirthdayAPI); // 푸시알람 보내기

module.exports = router;
