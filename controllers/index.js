const mysql = require('mysql');
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  port: 3307,
  password: 'polygon',
  database: 'andkorea'
});

connection.connect();

var basicAPI = function(req, res) {
  
  connection.query('SELECT * from users', (error, rows, fields) => {
    if (error) throw error;
    console.log(rows);
    res.status(200).json(
      rows[0]
    );
  });
  
  // connection.end();
  // res.status(200).json(
  //   {
  //     "success": true
  //   }
  // );
}

var testAPI = function(req, res) {
  res.status(200).json(
    {
      "message": "hi"
    }
  );
}

var postTestAPI = function(req, res) {
  const user_message = req.body.message;
  res.status(200).json(
    {
      "message": user_message
    }
  );
}

var loginAPI = function(req, res) {
  const account = req.body.account;
  const password = req.body.password;

  connection.query('SELECT * from users where account = "' +  account + '"', (error, rows, fields) => {
    var resultCode = 404;
    var message = "에러가 발생했습니다.";

    if (error) 
      throw error;
    else {
      if(rows.length == 0) {
          resultCode = 204;
          message = "존재하지 않는 계정입니다.";
      }
      else if (password !== rows[0].password) {
          resultCode = 204;
          message = "비밀번호가 틀렸습니다.";
      }
      else {
          resultCode = 200;
          message = '로그인 성공! ' + rows[0].account + '님 환영합니다.';
      }
      
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

var changePasswordAPI = function(req, res) {
  const user_id = req.body.user_id;
  const changePassword = req.body.change_password;

  connection.query('UPDATE users SET password = "' + changePassword + '", is_valid=1  where id = "' +  user_id + '"', (error, rows, fields) => {
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
}

var getEmployeesAPI = function(req, res) {
  const division_id = req.query.division_id;
  const department_id = req.query.department_id;
  const search = req.query.search;

  var query = 'SELECT * from employees where ';
  var queryWhere = '';

  if(search != '' && search != undefined) {
    queryWhere = queryWhere + 'name LIKE "%' + search + '%"';
  }

  if(division_id != '' && division_id != undefined) {
    queryWhere = queryWhere + 'division_id LIKE "%' + division_id + '%"';
  }
  if(department_id != '' && department_id != undefined) {
    queryWhere = queryWhere + 'department_id LIKE "%' + department_id + '%"';
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
  basicAPI: basicAPI,
  testAPI: testAPI,
  postTestAPI: postTestAPI,
  loginAPI: loginAPI,
  changePasswordAPI: changePasswordAPI,
  getEmployeesAPI: getEmployeesAPI
}
