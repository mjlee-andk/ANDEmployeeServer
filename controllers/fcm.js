const mysql = require('mysql');
const uuid = require('uuid4');
const moment = require('moment');
const _ = require('underscore');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  port: 3307,
  password: 'polygon',
  database: 'andkorea'
});

connection.connect();

var FCM = require('fcm-node');
var serverKey = require('../config/and-employees-private-key.json');
var fcm = new FCM(serverKey);
 
var fcmSendAPI = function(req, res) { 
	const token = req.body.token;
	const title = req.body.title;
	const contents = req.body.contents;

	var fcmMessage = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
	    to: token, 
	    // collapse_key: 'your_collapse_key',
	    
	    notification: {
	        title: title, 
	        body: contents 
	    }
	    
	    // data: {  //you can send only notification or only data(or include both)
	    //     my_key: 'my value',
	    //     my_another_key: 'my another value'
	    // }
	}

	fcm.send(fcmMessage, function(err, response){
		var resultCode = 404;
	    var message = "에러가 발생했습니다.";

	    if (err) {
	        console.log("Something has gone wrong!")
	    } else {
	        console.log("Successfully sent with response: ", response)
	        // console.log(response.results[0].error)
	        resultCode = 200;
	        message = "성공"
	    }
	    res.status(200).json(
	      {
	        'code': resultCode,
	        'message': message
	      }
	    );
	})
}

// 생일 당사자 및 푸시알람 선택한 직원에게 보내기
var fcmBirthdayAPI = function(req, res) {

	// 오늘 생일인 사람 DB에서 검색
	// 푸시알람 테이블에서 알람 받기로한 사람 검색

	var today = moment().format('MM-DD');
	console.log(today);

	var fcmMessageList = [];

	// var query = 'SELECT * FROM employees WHERE birth LIKE "%' + today + '%"';
	// 오늘 생일인 사람 이름, 부서, 직책
	var query = 'SELECT e.name, e.department_id, d.name AS department_name, p.name AS position_name, u.id AS user_id FROM employees AS e LEFT JOIN positions AS p ON p.id = e.position_id LEFT JOIN departments AS d ON d.id = e.department_id LEFT JOIN users AS u ON u.employee_id = e.id WHERE e.birth LIKE "%' + today + '%"';

	connection.query(query, (error, rows, fields) => {
		var resultCode = 404;
		var message = "에러가 발생했습니다.";

		if (error){
		  throw error;
		}
		else {
		  resultCode = 200;
		  message = "성공"

		  console.log("생일자", rows)

		  if(rows.length == 0) {
		  	res.status(200).json(
				{
			        'code': resultCode,
			        'message': message,
			        'data': []
	      		}
		    );
		    return;
		  }

		  const promise = new Promise(function(resolve, reject){
		  	for(var i in rows) {
			  	var department_id = rows[i].department_id
			  	var user_id = rows[i].user_id
			  	console.log("department_id", department_id);
			  	console.log("user_id", user_id);

			  	// var query2 = 'SELECT u.device_token FROM users AS u LEFT JOIN employees AS e ON u.employee_id = e.id WHERE e.department_id = "' + department_id + '" AND u.is_push = 1';
			  	var query2 = 'SELECT u.device_token, u.account FROM push_birth AS pb LEFT JOIN users AS u ON pb.user_id = u.id WHERE u.is_push = 1 AND pb.select_department_id = "' + department_id + '" AND pb.deletedat IS NULL AND pb.user_id != "' + user_id + '"';
			  	
			  	var title = rows[i].name + " " + rows[i].position_name + " 생일";
			  	var contents = rows[i].department_name + " " + rows[i].name + " " + rows[i].position_name + "님의 생일을 축하해주세요."

			  	connection.query(query2, (error2, rows2, fields2) => {
					var resultCode = 404;
					var message = "에러가 발생했습니다.";

					if (error2){
					  throw error2;
					  reject();
					}
					else {
					  resultCode = 200;
					  message = "성공"

					  console.log("생일 알람 받을 사람 토큰", rows2)

					  fcmMessage = {
					  	'title': title,
					  	'contents': contents,	
					  	'tokens': rows2
					  }

					  console.log("생일 알람 결과", fcmMessage)
					  fcmMessageList.push(fcmMessage)

					  if(rows.length == (i + 1)) {
					  	resolve();
					  }
					}
				});
			  }
		  });
		  promise.then(function(data) {
				console.log("최종 결과", fcmMessageList)
				res.status(200).json(
					{
				        'code': resultCode,
				        'message': message,
				        'data': fcmMessageList
		      		}
			    );
			})
		}

		
	});

	// var fcmMessage = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
	//     to: token, 
	//     // collapse_key: 'your_collapse_key',
	    
	//     notification: {
	//         title: "생일 알람", 
	//         body: contents 
	//     }
	    
	//     // data: {  //you can send only notification or only data(or include both)
	//     //     my_key: 'my value',
	//     //     my_another_key: 'my another value'
	//     // }
	// }

	// fcm.send(fcmMessage, function(err, response){
	// 	var resultCode = 404;
	//     var message = "에러가 발생했습니다.";

	//     if (err) {
	//         console.log("Something has gone wrong!")
	//     } else {
	//         console.log("Successfully sent with response: ", response)
	//         // console.log(response.results[0].error)
	//         resultCode = 200;
	//         message = "성공"
	//     }
	//     res.status(200).json(
	//       {
	//         'code': resultCode,
	//         'message': message
	//       }
	//     );
	// })
}



module.exports = {
  fcmSendAPI: fcmSendAPI,
  fcmBirthdayAPI: fcmBirthdayAPI
}
