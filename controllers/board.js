const mysql = require('mysql');
const bcrypt = require('bcrypt-nodejs');
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

var boardsAPI = function(req, res) {
  const category_id = req.query.category_id;
  const user_id = req.query.user_id;

  var query = 'SELECT b.id, b.user_id, u.account AS user_name, b.category_id, bca.name AS category_name, b.title, b.contents, b.image, b.createdat, (SELECT COUNT(*) FROM board_comments WHERE b.id = board_id AND deletedat IS NULL) AS comment_count, (SELECT COUNT(*) FROM board_likes WHERE b.id = board_id AND deletedat IS NULL) AS like_count, (SELECT id FROM board_likes WHERE b.id = board_id AND user_id = "' + user_id + '") AS board_likes_id, (SELECT deletedat FROM board_likes WHERE b.id = board_id AND user_id = "' + user_id + '") AS board_likes_deletedat FROM boards AS b LEFT JOIN users AS u ON b.user_id = u.id LEFT JOIN board_categories AS bca ON b.category_id = bca.id WHERE ';
  
  var queryWhere = 'b.category_id = "' + category_id + '" AND b.deletedat IS NULL';

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
    	item.createdat = moment(board_createdat_origin).utc().format('YYYY.MM.DD')

    	var board_updatedat_origin = item.updatedat
    	item.updatedat = moment(board_updatedat_origin).utc().format('YYYY.MM.DD')

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
		var query = 'SELECT bcom.id, bcom.user_id, u.account AS user_name, bcom.comment, bcom.createdat, bcom.updatedat, (SELECT COUNT(*) FROM comment_likes WHERE bcom.id = comment_id) AS like_count, (SELECT id FROM comment_likes WHERE bcom.id = comment_id AND user_id = "' + user_id + '" AND deletedat IS NULL) AS like_clicked FROM board_comments AS bcom LEFT JOIN users AS u ON bcom.user_id = u.id WHERE ';
		var queryWhere = 'bcom.board_id = "' + board_id + '" AND bcom.deletedat IS NULL';

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

	const promise3 = new Promise(function(resolve, reject){
		var query = 'SELECT * FROM board_likes WHERE board_id = "' + board_id + '" AND user_id = "' + user_id + '"';

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
		// console.log("모두 완료됨", values);

		console.log(values[0]);
		console.log(values[1]);
		console.log(values[2]);

		var board = values[0];
		var board_comments = values[1];
		var board_likes = values[2];

		board.like_clicked = true;
		if(board_likes == undefined) {
			board.like_clicked = false;
		}
		else if(board_likes.deletedat != undefined) {
			board.like_clicked = false;
		}

		board.comments = board_comments;

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

	    	connection.query('UPDATE board_likes SET ? WHERE id = "' + data.id + '"', updatePost, (error, rows, fields) => {
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

  connection.query('UPDATE boards SET ? WHERE id = "' + board_id + '"', post, (error, rows, fields) => {
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

  connection.query('UPDATE boards SET ? WHERE id = "' + board_id + '"', post, (error, rows, fields) => {
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
      message = "성공"

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

var updateCommentAPI = function(req, res) {
  const comment_id = req.body.comment_id;
  const comment = req.body.comment;

  var post = {
    comment : comment,
    updatedat : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
  }

  connection.query('UPDATE board_comments SET ? WHERE id = "' + comment_id + '"', post, (error, rows, fields) => {
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

  connection.query('UPDATE board_comments SET ? WHERE id = "' + comment_id + '"', post, (error, rows, fields) => {
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

	    	connection.query('UPDATE comment_likes SET ? WHERE id = "' + data.id + '"', updatePost, (error, rows, fields) => {
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
  likeCommentAPI: likeCommentAPI
}
