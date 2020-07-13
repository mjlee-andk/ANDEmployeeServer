const mysql = require('mysql');
const bcrypt = require('bcrypt-nodejs');
const uuid = require('uuid4');
const moment = require('moment');
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  port: 3307,
  password: 'polygon',
  database: 'andkorea'
});

connection.connect();

// var basicAPI = function(req, res) {
  
//   connection.query('SELECT * from users', (error, rows, fields) => {
//     if (error) throw error;
//     console.log(rows);
//     res.status(200).json(
//       rows[0]
//     );
//   });
  
//   // connection.end();
//   // res.status(200).json(
//   //   {
//   //     "success": true
//   //   }
//   // );
// }

// var testAPI = function(req, res) {
//   res.status(200).json(
//     {
//       "message": "hi"
//     }
//   );
// }

// var postTestAPI = function(req, res) {
//   const user_message = req.body.message;
//   res.status(200).json(
//     {
//       "message": user_message
//     }
//   );
// }

var loginAPI = function(req, res) {
  const account = req.body.account;
  const password = req.body.password;

  var resultCode = 404;
  var message = "에러가 발생했습니다.";

  const promise = new Promise(function(resolve, reject){
    connection.query('SELECT * from users where account=?',  [account], (error, rows, fields) => {
      // var resultCode = 404;
      // var message = "에러가 발생했습니다.";

      if (error) {
        throw error;
        reject();
      }

      else if(rows.length) {
        // 첫 로그인 시
        if(rows[0].is_valid == 0) {
          if(password != rows[0].password) {
            resultCode = 204;
            message = "비밀번호가 틀렸습니다.";
          }
          else {
            resultCode = 200;
            message = '로그인 성공! ' + rows[0].account + '님 환영합니다.';
          }
        }
        // 비밀번호 변경 후 로그인 시
        else {
          bcrypt.compare(password, rows[0].password, function(err, res){
            if(res) {
              resultCode = 200;
              message = '로그인 성공! ' + rows[0].account + '님 환영합니다.';
              console.log(resultCode);
              console.log(message);
            }
            else {
              resultCode = 204;
              message = "비밀번호가 틀렸습니다.";
            }
          })
        }
        resolve(rows[0]);
      }
      else {
        resultCode = 204;
        message = "존재하지 않는 계정입니다.";
        resolve(rows);
      }
    });
  })

  promise.then(function(data) {
    res.status(200).json(   
      {
        'code': resultCode,
        'message': message,
        'data': data
      }
    );
  })
}

var changePasswordAPI = function(req, res) {
  const user_id = req.body.user_id;
  const changePassword = req.body.change_password;

  bcrypt.hash(changePassword, null, null, function(err, hash){
    connection.query('UPDATE users SET password = "' + hash + '", is_valid=1  where id = "' +  user_id + '"', (error, rows, fields) => {
      var resultCode = 404;
      var message = "에러가 발생했습니다.";

      if (error) 
        throw error;
      else {      
        resultCode = 200;
        message = '비밀번호가 성공적으로 변경되었습니다.';
      }

      res.status(200).json(   
          {
            'code': resultCode,
            'message': message,
            'data': rows[0]
          }
        );
      
    });
  })
}

var employeesAPI = function(req, res) {
  const division_id = req.query.division_id;
  const department_id = req.query.department_id;
  const search = req.query.search;

  var query = 'SELECT * from employees where ';
  var queryWhere = '';

  queryWhere = queryWhere + 'name LIKE "%' + search + '%" and ';
  queryWhere = queryWhere + 'division_id LIKE "%' + division_id + '%" and ';
  queryWhere = queryWhere + 'department_id LIKE "%' + department_id + '%"';

  connection.query(query + queryWhere, (error, rows, fields) => {
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

var employeeAPI = function(req, res) {
  const employee_id = req.query.employee_id;

  connection.query('SELECT * from employees where id = ?', [employee_id], (error, rows, fields) => {
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
        'data': rows[0]
      }
    );    
  });
}

var memoAPI = function(req, res){
  const user_id = req.query.user_id;
  const employee_id = req.query.employee_id;

  connection.query('SELECT * FROM memo where user_id="' + user_id + '" and employee_id="' + employee_id + '"', (error, rows, fields) => {
    var resultCode = 404;
    var message = "에러가 발생했습니다.";

    if (error) 
      throw error;
    else {
      resultCode = 200;
      message = "성공"
    }

    var data = {};

    if(rows.length > 0) {
      data = rows[0]
    }

    res.status(200).json(   
      {
        'code': resultCode,
        'message': message,
        'data': data
      }
    );    
  });
}

var addMemoAPI = function(req, res) {
  const user_id = req.body.user_id;
  const employee_id = req.body.employee_id;
  const memo = req.body.memo;

  var post = {
    id : uuid(),
    user_id : user_id, 
    employee_id : employee_id,
    memo : memo, 
    date : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
  }

  connection.query('INSERT INTO memo SET ?', post, (error, rows, fields) => {
    var resultCode = 404;
    var message = "에러가 발생했습니다.";

    if (error) 
      throw error;
    else {
      resultCode = 200;
      message = "성공"

      connection.query('SELECT * FROM memo where user_id="' + user_id + '" and employee_id="' + employee_id + '"', (error, rows, fields) =>{
        resultCode = 404;
        message = "에러가 발생했습니다."

        if(error)
          throw error;
        else {
          resultCode = 200;
          message = "성공"

          res.status(200).json(
            {
              'code': resultCode,
              'message': message,
              'data': rows[0]
            }
          ); 
        }        
      })      
    }
  });
}

var updateMemoAPI = function(req, res) {
  const memo_id = req.body.memo_id;
  const memo = req.body.memo;

  var post = {
    memo : memo,
    date : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
  }

  connection.query('UPDATE memo SET ? where id = "' + memo_id + '"', post, (error, rows, fields) => {
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

module.exports = {
  loginAPI: loginAPI,
  changePasswordAPI: changePasswordAPI,
  employeesAPI: employeesAPI,
  employeeAPI: employeeAPI,
  memoAPI: memoAPI,
  addMemoAPI: addMemoAPI,
  updateMemoAPI: updateMemoAPI
}
