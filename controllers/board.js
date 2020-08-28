const mysql = require('mysql');
const uuid = require('uuid4');
const moment = require('moment');
const _ = require('underscore');
const fcmController = require('../controllers/fcm');
const config = require('../config/configure');

const connection = config.db;

var boardsAPI = function(req, res) {
  const category_id = req.query.category_id;
  const user_id = req.query.user_id;

  var query = 'SELECT b.id, b.user_id, u.account AS user_name, b.category_id, bca.name AS category_name, b.title, b.contents, b.image, b.createdat, b.click_count, (SELECT COUNT(*) FROM board_comments WHERE b.id = board_id AND deletedat IS NULL) AS comment_count, (SELECT COUNT(*) FROM board_likes WHERE b.id = board_id AND deletedat IS NULL) AS like_count, (SELECT id FROM board_likes WHERE b.id = board_id AND user_id = "' + user_id + '") AS board_likes_id, (SELECT deletedat FROM board_likes WHERE b.id = board_id AND user_id = "' + user_id + '") AS board_likes_deletedat FROM boards AS b LEFT JOIN users AS u ON b.user_id = u.id LEFT JOIN board_categories AS bca ON b.category_id = bca.id WHERE ';
  
  var queryWhere = 'b.category_id = "' + category_id + '" AND b.deletedat IS NULL ORDER BY b.createdat DESC';
  // 카테고리 아이디가 '' 로 올 경우 공지사항, 경조사 글만 조회
  if(category_id == '') {
  	queryWhere = '(b.category_id = "6797f061-c997-11ea-9982-20cf305809b8" OR b.category_id = "38509e8c-cb37-11ea-9982-20cf305809b8") AND b.deletedat IS NULL ORDER BY b.createdat DESC';
  }

  connection.query(query + queryWhere, (error, rows, fields) => {
    var resultCode = 404;
    var message = "에러가 발생했습니다.";

    if (error) 
      throw error;
    else {
      resultCode = 200;
      message = "성공"
    }

    for(var index in rows) {
    	var item = rows[index];
    	var board_createdat_origin = item.createdat
    	item.createdat = moment(board_createdat_origin).format('MM.DD')

    	var board_updatedat_origin = item.updatedat
    	item.updatedat = moment(board_updatedat_origin).format('MM.DD')

    	item.like_clicked = true;
    	if(item.board_likes_id == undefined) {
    		item.like_clicked = false;
    	}
    	else {
    		if(item.board_likes_deletedat != undefined)
    		item.like_clicked = false;
    	}

    }

    res.status(200).json(   
      {
        'code': resultCode,
        'message': message,
        'data': rows
      }
    );
    
  });
}

var boardAPI = function(req, res) {
	const user_id = req.query.user_id;
	const board_id = req.query.board_id;

	// 게시글 가져오기
	const promise1 = new Promise(function(resolve, reject){
		var query = 'SELECT b.id, b.user_id, u.account AS user_name, b.category_id, bca.name AS category_name, b.title, b.contents, b.image, b.createdat, (SELECT COUNT(*) FROM board_comments WHERE b.id = board_id AND deletedat IS NULL) AS comment_count, (SELECT COUNT(*) FROM board_likes WHERE b.id = board_id AND deletedat IS NULL) AS like_count FROM boards AS b LEFT JOIN users AS u ON b.user_id = u.id LEFT JOIN board_categories AS bca ON b.category_id = bca.id WHERE ';
		var queryWhere = 'b.id = "' + board_id + '"';

		connection.query(query + queryWhere, (error, rows, fields) => {
			var resultCode = 404;
			var message = "에러가 발생했습니다.";

			if (error){
			  throw error;
			  reject();
			}
			else {
			  resultCode = 200;
			  message = "성공"
			}
			resolve(rows[0]);
		});
	})

	// 댓글 가져오기
	const promise2 = new Promise(function(resolve, reject){
		var query = 'SELECT bcom.id, bcom.user_id, u.account AS user_name, bcom.comment, bcom.createdat, bcom.updatedat, (SELECT COUNT(*) FROM comment_likes WHERE bcom.id = comment_id AND deletedat IS NULL) AS like_count, (SELECT id FROM comment_likes WHERE bcom.id = comment_id AND user_id = "' + user_id + '" AND deletedat IS NULL) AS like_clicked FROM board_comments AS bcom LEFT JOIN users AS u ON bcom.user_id = u.id WHERE ';
		var queryWhere = 'bcom.board_id = "' + board_id + '" AND bcom.deletedat IS NULL ORDER BY bcom.createdat ASC';

		connection.query(query + queryWhere, (error, rows, fields) => {
			var resultCode = 404;
			var message = "에러가 발생했습니다.";

			if (error) {
			  throw error;
			  reject();
			}
			else {
			  resultCode = 200;
			  message = "성공"
			}
			resolve(rows);
		});
	})

	// 게시글 좋아요 가져오기
	const promise3 = new Promise(function(resolve, reject){
		var query = 'SELECT * FROM board_likes WHERE board_id = "' + board_id + '" AND user_id = "' + user_id + '" AND deletedat IS NULL';

		connection.query(query, (error, rows, fields) => {
			var resultCode = 404;
			var message = "에러가 발생했습니다.";

			if (error) {
			  throw error;
			  reject();
			}
			else {
			  resultCode = 200;
			  message = "성공"
			}
			resolve(rows[0]);
		});
	})

	Promise.all([promise1, promise2, promise3]).then(function (values) {
		
		var board = values[0];
		var board_comments = values[1];
		var board_likes = values[2];

		// 게시글 날짜 포맷 변경
		var board_createdat_origin = board.createdat
    	board.createdat = moment(board_createdat_origin).format('MM.DD')

    	if(board.updatedat != null) {
	    	var board_updatedat_origin = board.updatedat
	    	board.updatedat = moment(board_updatedat_origin).format('MM.DD')    		
    	}

		// 게시글 좋아요 누른 경우
		board.like_clicked = true;
		if(board_likes == undefined) {
			board.like_clicked = false;
		}
		else if(board_likes.deletedat != undefined) {
			board.like_clicked = false;
		}

		// 댓글
		for(var i in board_comments) {
			var item = board_comments[i];
			// 댓글 중 좋아요 누른 경우
			if(item.like_clicked != null) {
				item.like_clicked = true
			}
			else {
				item.like_clicked = false
			}

			// 게시글 날짜 포맷 변경
			var comment_createdat_origin = item.createdat
	    	item.createdat = moment(comment_createdat_origin).format('MM.DD')

	    	if(item.updatedat != null) {
	    		var comment_updatedat_origin = item.updatedat
	    		item.updatedat = moment(comment_updatedat_origin).format('MM.DD')
	    	}	    	
		}

		board.comments = board_comments;

		// 조회수 증가
		var query = 'UPDATE boards SET click_count = click_count + 1, createdat = createdat WHERE id = "' + board_id + '"';
		connection.query(query, (error, rows, fields) => {
			var resultCode = 404;
			var message = "에러가 발생했습니다.";

			if (error) {
			  throw error;
			}
			else {
			  resultCode = 200;
			  message = "성공"
			}
		});

		res.status(200).json(
	        {
	          'code': 200,
	          'message': "성공",
	          'data': board
	        }
      	);
	});
}

var likeBoardAPI = function(req, res) { 
	const board_id = req.body.board_id;
	const user_id = req.body.user_id;

	var query = 'SELECT * FROM board_likes WHERE board_id = "' + board_id + '" AND user_id = "' + user_id + '"';

	connection.query(query, (error, rows, fields) => {
	    var resultCode = 404;
	    var message = "에러가 발생했습니다.";

	    if (error) 
	      throw error;
	    else {
	      resultCode = 200;
	      message = "성공"
	    }

	    var data = rows[0];
	    // 좋아요 누른 적 없을 경우 생성
	    if(data == undefined) {
	    	var post = {
			    id : uuid(),
			    board_id : board_id,
			    user_id : user_id, 
			    createdat : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
		  	}

		  	connection.query('INSERT INTO board_likes SET ?', post, (error, rows, fields) => {
			    var resultCode = 404;
			    var message = "에러가 발생했습니다.";

			    if (error) 
				      throw error;
			    else {
			      resultCode = 200;
			      message = "성공"
			    }

			    res.status(200).json(
			      {
			        'code': resultCode,
			        'message': message
			      }
			    );
		  	});
	    }
	    else {
	    	var updatePost = {
	    		deletedat: null
	    	}
	    	if(data.deletedat == null) {
	    		updatePost.deletedat = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
	    	}

	    	connection.query('UPDATE board_likes SET ?, createdat = createdat WHERE id = "' + data.id + '"', updatePost, (error, rows, fields) => {
			    var resultCode = 404;
			    var message = "에러가 발생했습니다.";

			    if (error) 
			      throw error;
			    else {
			      resultCode = 200;
			      message = "성공"
			    }

			    res.status(200).json(
			      {
			        'code': resultCode,
			        'message': message
			      }
			    );    
		  	});
	    }	    
  	});
}

var addBoardAPI = function(req, res) { 
  const user_id = req.body.user_id;
  const category_id = req.body.category_id;
  const title = req.body.title;
  const contents = req.body.contents;
  const image = req.body.image;

  var post = {
    id : uuid(),
    user_id : user_id, 
    category_id : category_id,
    title : title, 
    contents : contents,
    image: null,
    click_count: 0,
    createdat : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
  }

  if(image != null) {
  	post.image = image;
  }

  connection.query('INSERT INTO boards SET ?', post, (error, rows, fields) => {
    var resultCode = 404;
    var message = "에러가 발생했습니다.";

    if (error) 
      throw error;
    else {
      resultCode = 200;
      message = "성공"

      // 공지사항 일 경우 전 직원에게 푸시알람 보내기
      // is_valid = 1
      // is_push = 1
      // device_token IS NOT NULL
      if(category_id == '6797f061-c997-11ea-9982-20cf305809b8') {

	      connection.query('SELECT device_token FROM users WHERE is_valid = 1 AND is_push = 1 AND device_token IS NOT NULL' , (error2, rows2, fields2) => {
		    var resultCode = 404;
		    var message = "에러가 발생했습니다.";

		    if (error) 
		      throw error;
		    else {
		      resultCode = 200;
		      message = "성공";

		      console.log(rows2);

		      var tokenList = [];
		      for(var i in rows2) {
		      	var item = rows2[i];
		      	tokenList.push(item.device_token);
		      }

		      console.log("token list", tokenList);

		      fcmController.fcmMultiSend(tokenList, "공지사항 알림", title);
		    }
		  });
      }

      res.status(200).json(
        {
          'code': resultCode,
          'message': message,
          'data': post
        }
      );       
    }
  });
}

var updateBoardAPI = function(req, res) {
  const board_id = req.body.board_id;
  const category_id = req.body.category_id;
  const title = req.body.title;
  const contents = req.body.contents;
  const image = req.body.image;

  var post = {
    category_id : category_id,
    title : title, 
    contents : contents,
    image: null,
    updatedat : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
  }

  if(image != null) {
  	post.image = image;
  }

  connection.query('UPDATE boards SET ?, createdat = createdat WHERE id = "' + board_id + '"', post, (error, rows, fields) => {
    var resultCode = 404;
    var message = "에러가 발생했습니다.";

    if (error) 
      throw error;
    else {
      resultCode = 200;
      message = "성공"

      res.status(200).json(
        {
          'code': resultCode,
          'message': message,
          'data': board_id
        }
      );       
    }
  });
}

var deleteBoardAPI = function(req, res) {
  const board_id = req.body.board_id;

  var post = {
    deletedat : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
  }

  connection.query('UPDATE boards SET ?, createdat = createdat WHERE id = "' + board_id + '"', post, (error, rows, fields) => {
    var resultCode = 404;
    var message = "에러가 발생했습니다.";

    if (error) 
      throw error;
    else {
      resultCode = 200;
      message = "성공"

      res.status(200).json(
        {
          'code': resultCode,
          'message': message
        }
      );
    }
  });
}

var addCommentAPI = function(req, res) { 
  const board_id = req.body.board_id;
  const user_id = req.body.user_id;
  const comment = req.body.comment;

  var post = {
  	id : uuid(),
    board_id : board_id,
    user_id : user_id, 
    comment : comment,
    createdat : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
  }

  connection.query('INSERT INTO board_comments SET ?', post, (error, rows, fields) => {
    var resultCode = 404;
    var message = "에러가 발생했습니다.";

    if (error) 
      throw error;
    else {
      resultCode = 200;
      message = "성공";

  	  // 게시글 작성자에게 푸시알람 보내기
      const promise1 = new Promise(function(resolve, reject){
	      connection.query('SELECT b.user_id, u.device_token, u.is_push FROM boards AS b LEFT JOIN users AS u ON b.user_id = u.id WHERE b.id = "' + board_id + '"' , (error2, rows2, fields2) => {
		    var resultCode = 404;
		    var message = "에러가 발생했습니다.";

		    if (error) {
		      	throw error;
		    	reject();
		    }

		    else {
		      	resultCode = 200;
		      	message = "성공";

		      	resolve(rows2[0]);
		    }
		  });
      }) 

      // 댓글 쓴 유저 이름
      const promise2 = new Promise(function(resolve, reject){
      		connection.query('SELECT e.name FROM users AS u LEFT JOIN employees AS e ON u.employee_id = e.id WHERE u.id = "' + user_id + '"' , (error2, rows2, fields2) => {
			    var resultCode = 404;
			    var message = "에러가 발생했습니다.";

			    if (error) {
			      	throw error;
			    	reject();
			    }
			    else {
			      resultCode = 200;
			      message = "성공";

			      resolve(rows2[0]);
			    }
			  });
      }) 

      Promise.all([promise1, promise2]).then(function (values) {
		
		var board_writer = values[0];
		var comment_writer = values[1];	

		if(board_writer.user_id != user_id) {
			if( board_writer.is_push == 1 ) {
				fcmController.fcmSend(board_writer.device_token, comment_writer.name + "님이 댓글을 달았습니다.", comment_writer.name + "님이 댓글을 달았습니다.");	
			}
		}
		
		res.status(200).json(
	        {
	          'code': 200,
	          'message': "성공"
	        }
      	);
	  }); 
    }
  });
}

var updateCommentAPI = function(req, res) {
  const comment_id = req.body.comment_id;
  const comment = req.body.comment;

  var post = {
    comment : comment,
    updatedat : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
  }

  connection.query('UPDATE board_comments SET ?, createdat = createdat WHERE id = "' + comment_id + '"', post, (error, rows, fields) => {
    var resultCode = 404;
    var message = "에러가 발생했습니다.";

    if (error) 
      throw error;
    else {
      resultCode = 200;
      message = "성공"

      res.status(200).json(
        {
          'code': resultCode,
          'message': message,
          'data': comment_id
        }
      );       
    }
  });
}

var deleteCommentAPI = function(req, res) {
  const comment_id = req.body.comment_id;

  var post = {
    deletedat : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
  }

  connection.query('UPDATE board_comments SET ?, createdat = createdat WHERE id = "' + comment_id + '"', post, (error, rows, fields) => {
    var resultCode = 404;
    var message = "에러가 발생했습니다.";

    if (error) 
      throw error;
    else {
      resultCode = 200;
      message = "성공"

      res.status(200).json(
        {
          'code': resultCode,
          'message': message
        }
      );
    }
  });
}

var likeCommentAPI = function(req, res) { 
	const comment_id = req.body.comment_id;
	const user_id = req.body.user_id;

	var query = 'SELECT * FROM comment_likes WHERE comment_id = "' + comment_id + '" AND user_id = "' + user_id + '"';

	connection.query(query, (error, rows, fields) => {
	    var resultCode = 404;
	    var message = "에러가 발생했습니다.";

	    if (error) 
	      throw error;
	    else {
	      resultCode = 200;
	      message = "성공"
	    }

	    var data = rows[0];
	    // 좋아요 누른 적 없을 경우 생성
	    if(data == undefined) {
	    	var post = {
			    id : uuid(),
			    comment_id : comment_id,
			    user_id : user_id, 
			    createdat : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
		  	}

		  	connection.query('INSERT INTO comment_likes SET ?', post, (error, rows, fields) => {
			    var resultCode = 404;
			    var message = "에러가 발생했습니다.";

			    if (error) 
				      throw error;
			    else {
			      resultCode = 200;
			      message = "성공"
			    }

			    res.status(200).json(
			      {
			        'code': resultCode,
			        'message': message
			      }
			    );
		  	});
	    }
	    else {
	    	var updatePost = {
	    		deletedat: null
	    	}
	    	if(data.deletedat == null) {
	    		updatePost.deletedat = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
	    	}

	    	connection.query('UPDATE comment_likes SET ?, createdat = createdat WHERE id = "' + data.id + '"', updatePost, (error, rows, fields) => {
			    var resultCode = 404;
			    var message = "에러가 발생했습니다.";

			    if (error) 
			      throw error;
			    else {
			      resultCode = 200;
			      message = "성공"
			    }

			    res.status(200).json(
			      {
			        'code': resultCode,
			        'message': message
			      }
			    );    
		  	});
	    }	    
  	});
}

var boardCategoriesAPI = function(req, res) {
	var query = 'SELECT * FROM board_categories WHERE name LIKE "%자유%"';

	connection.query(query, (error, rows, fields) => {
		var resultCode = 404;
		var message = "에러가 발생했습니다.";

		if (error) 
		  throw error;
		else {
		  resultCode = 200;
		  message = "성공"
		}

		res.status(200).json(   
		  {
		    'code': resultCode,
		    'message': message,
		    'data': rows
		  }
		);

	});
}

module.exports = {
  boardsAPI: boardsAPI,
  boardAPI: boardAPI,
  likeBoardAPI: likeBoardAPI,
  addBoardAPI: addBoardAPI,
  updateBoardAPI: updateBoardAPI,
  deleteBoardAPI: deleteBoardAPI,
  addCommentAPI: addCommentAPI,
  updateCommentAPI: updateCommentAPI,
  deleteCommentAPI: deleteCommentAPI,
  likeCommentAPI: likeCommentAPI,
  boardCategoriesAPI: boardCategoriesAPI
}
