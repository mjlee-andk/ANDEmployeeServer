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

var fcmSend = function(token, title, message) {
	var fcmMessage = { 
	    to: token, 	    
	    notification: {
	        title: title, 
	        body: message 
	    }
	}

	fcm.send(fcmMessage, function(err, response){
		var resultCode = 404;
	    var message = "에러가 발생했습니다.";

	    if (err) {
	        console.log("Something has gone wrong!")
	    } else {
	        console.log("Successfully sent with response: ", response)
	        // console.log("response.results[0]",response.results[0])
	        resultCode = 200;
	        message = "성공";
	    }
	})
}

var fcmMultiSend = function(tokens, title, message) {
	var fcmMessage = { 
	    registration_ids: tokens, 	    
	    notification: {
	        title: title, 
	        body: message 
	    }
	}

	fcm.send(fcmMessage, function(err, response){
		var resultCode = 404;
	    var message = "에러가 발생했습니다.";

	    if (err) {
	        console.log("Something has gone wrong!")
	    } else {
	        console.log("Successfully sent with response: ", response)
	        resultCode = 200;
	        message = "성공";
	    }
	})
}
 
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
	        message = "성공";
	    }
	    res.status(200).json(
	      {
	        'code': resultCode,
	        'message': message
	      }
	    );
	})
}

var fcmMultiSendAPI = function(tokens, title, message) {
	var fcmMessage = { 
	    registration_ids: tokens, 	    
	    notification: {
	        title: title, 
	        body: message 
	    }
	}

	fcm.send(fcmMessage, function(err, response){
		var resultCode = 404;
	    var message = "에러가 발생했습니다.";

	    if (err) {
	        console.log("Something has gone wrong!")
	    } else {
	        console.log("Successfully sent with response: ", response)
	        resultCode = 200;
	        message = "성공";
	    }
	})
}

// 생일 당사자 및 푸시알람 선택한 직원에게 보내기
var fcmBirthAPI = function(req, res) {

	// 오늘 생일인 사람 DB에서 검색
	// 푸시알람 테이블에서 알람 받기로한 사람 검색

	// var today = moment().format('08-30');
	var today = moment().format('MM-DD');

	var fcmMessageList = [];

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
		  message = "성공";

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

		  var promiseList = [];
		  
			for(var i in rows) {

				const promise = new Promise(function(resolve, reject){
					var department_id = rows[i].department_id;
					var user_id = rows[i].user_id;

					var query2 = 'SELECT u.device_token, u.account FROM push_birth AS pb LEFT JOIN users AS u ON pb.user_id = u.id WHERE u.is_push = 1 AND pb.select_department_id = "' + department_id + '" AND pb.deletedat IS NULL AND pb.user_id != "' + user_id + '"';

					var title = rows[i].name + " " + rows[i].position_name + " 생일";
					var contents = rows[i].department_name + " " + rows[i].name + " " + rows[i].position_name + "님의 생일을 축하해주세요.";

				  	connection.query(query2, (error2, rows2, fields2) => {
						var resultCode = 404;
						var message = "에러가 발생했습니다.";

						if (error2){
						  throw error2;
						  reject();
						}
						else {
						  resultCode = 200;
						  message = "성공";

						  fcmMessage = {
						  	'title': title,
						  	'contents': contents,	
						  	'tokens': _.filter(rows2, function(val) {
						  		return val['device_token'] != null;
						  	})
						  }

						  fcmMessageList.push(fcmMessage);

						  resolve();
						}
					});
				});

				promiseList.push(promise);
				
			}

			Promise.all(promiseList).then( (values) => {
				console.log("최종 결과", fcmMessageList)
				// res.status(200).json(
				// 	{
				//         'code': resultCode,
				//         'message': message,
				//         'data': fcmMessageList
		  //     		}
			 //    );

			 	var promiseList = [];
			    for(var j in fcmMessageList) {
			    	var item = fcmMessageList[j];
			    	var fcmTitle = item.title;
			    	var fcmContents = item.contents;
			    	var fcmTokens = item.tokens;

			    	if(fcmTokens.length > 0) {
			    		var tokens = [];
			    		for(var k in fcmTokens) {
			    			var token = fcmTokens[k].device_token;

			    			tokens.push(token);
				    	}

				    	var fcmMessage = { 
				    		registration_ids: tokens,
						    notification: {
						        title: fcmTitle, 
						        body: fcmContents 
						    }
						}

						fcm.send(fcmMessage, function(err, response){
							var resultCode = 404;
						    var message = "에러가 발생했습니다.";

						    var promise = new Promise(function(resolve, reject){
								if (err) {
							        console.log("Something has gone wrong!")
							        reject();
							    } else {
							        console.log("Successfully sent with response: ", response)

							        resultCode = 200;
							        message = "성공"
							        resolve();
							    }
						    })

						    promiseList.push(promise);						    						    
						})
			    	}
			    }

			    Promise.all(promiseList).then((values) => {
			    		res.status(200).json(
			    		{
				        	'code': resultCode,
				        	'message': message
				      	}
				    );
			    })
			    
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
	fcmSend: fcmSend,
  	fcmSendAPI: fcmSendAPI,
  	fcmMultiSendAPI: fcmMultiSendAPI,
  	fcmBirthAPI: fcmBirthAPI
}
