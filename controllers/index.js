const mysql = require('mysql');
const bcrypt = require('bcrypt-nodejs');
const uuid = require('uuid4');
const moment = require('moment');
const _ = require('underscore');
const config = require('../config/configure');

const connection = config.db;
config.dbConnect(config.db);

var loginAPI = function(req, res) {
  const account = req.body.account;
  const password = req.body.password;
  const device_token = req.body.device_token;

  var resultCode = 404;
  var message = "에러가 발생했습니다.";

  const promise = new Promise(function(resolve, reject){
    connection.query('SELECT * from users where account=?',  [account], (error, rows, fields) => {
      if (error) {
        throw error;
        reject();
      }

      else if(rows.length) {
        // 첫 로그인 시
        if(rows[0].is_valid == 0) {
          if(password != rows[0].password) {
            resultCode = 204;
            message = "비밀번호가 일치하지 않습니다.";
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
            }
            else {
              resultCode = 204;
              message = "비밀번호가 일치하지 않습니다.";
            }
          })
        }
        resolve(rows[0]);
      }
      else {
        resultCode = 204;
        message = "존재하지 않는 계정입니다.";
        resolve({});
      }
    });
  })

  promise.then(function(data) {
    if(resultCode == 200) {
      connection.query('UPDATE users SET device_token = "' + device_token + '"where id = "' +  data.id + '"', (error, rows, fields) => {
        var resultCode = 404;
        var message = "에러가 발생했습니다.";

        if (error) 
          throw error;
        else {      
          resultCode = 200;
          message = '비밀번호가 성공적으로 변경되었습니다.';
        }
      });
    }

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
    connection.query('UPDATE users SET password = "' + hash + '", is_valid=1 where id = "' +  user_id + '"', (error, rows, fields) => {
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

  var query = 'SELECT e.id, e.name, e.gender, e.profile_img, e.extension_number, e.phone, e.birth, e.join_date, e.leave_date, dv.name AS division_name, dp.name AS department_name, p.name AS position_name FROM employees AS e LEFT JOIN divisions AS dv ON e.division_id = dv.id LEFT JOIN departments AS dp ON e.department_id = dp.id LEFT JOIN positions AS p ON e.position_id = p.id WHERE '
  var queryWhere = '';
  queryWhere = queryWhere + 'e.name LIKE "%' + search + '%" AND ';
  queryWhere = queryWhere + 'e.division_id LIKE "%' + division_id + '%" AND ';
  queryWhere = queryWhere + 'e.department_id LIKE "%' + department_id + '%" AND ';
  queryWhere = queryWhere + 'e.leave_date IS NULL';

  var queryOrder = ' ORDER BY p.priority ASC';

  connection.query(query + queryWhere + queryOrder, (error, rows, fields) => {
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

  var query = 'SELECT e.id, e.name, e.gender, e.profile_img, e.extension_number, e.phone, e.birth, e.join_date, e.leave_date, dv.name AS division_name, dp.name AS department_name, p.name AS position_name FROM employees AS e LEFT JOIN divisions AS dv ON e.division_id = dv.id LEFT JOIN departments AS dp ON e.department_id = dp.id LEFT JOIN positions AS p ON e.position_id = p.id WHERE e.id = ?'

  connection.query(query, [employee_id], (error, rows, fields) => {
    var resultCode = 404;
    var message = "에러가 발생했습니다.";

    if (error) 
      throw error;
    else {
      resultCode = 200;
      message = "성공"
    }

    var birth_origin = rows[0].birth
    rows[0].birth = moment(birth_origin).format('MM.DD')

    var join_date_origin = rows[0].join_date
    rows[0].join_date = moment(join_date_origin).format('YYYY.MM.DD')

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

  connection.query('SELECT * FROM memo WHERE user_id="' + user_id + '" AND employee_id="' + employee_id + '"', (error, rows, fields) => {
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
    createdat : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
  }

  connection.query('INSERT INTO memo SET ?', post, (error, rows, fields) => {
    var resultCode = 404;
    var message = "에러가 발생했습니다.";

    if (error) 
      throw error;
    else {
      resultCode = 200;
      message = "성공"

      connection.query('SELECT * FROM memo where user_id="' + user_id + '" AND employee_id="' + employee_id + '"', (error, rows, fields) =>{
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
    updatedat : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
  }

  connection.query('UPDATE memo SET ?, createdat = createdat where id = "' + memo_id + '"', post, (error, rows, fields) => {
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

var departmentsAPI = function(req, res) {
  // const division_id = req.query.division_id;

  var query = 'SELECT de.id, de.name, de.telephone, de.division_id, dv.name AS division_name, dv.address, dv.telephone AS devision_telephone FROM departments AS de LEFT JOIN divisions AS dv ON de.division_id = dv.id WHERE de.is_active = 1 ORDER BY de.order_seq ASC, de.name ASC';

  connection.query(query, (error, rows, fields) => {
    var resultCode = 404;
    var message = "에러가 발생했습니다.";

    if (error) 
      throw error;
    else {
      resultCode = 200;
      message = "성공"
    }

    var adkList = _.filter(rows, function(dep){
      return dep.division_name == "ADK";
    });

    var adksList = _.filter(rows, function(dep){
      return dep.division_name == "ADKS";
    });    

    var adk = {
      'id': adkList[0].division_id,
      'name': adkList[0].division_name,
      'address': adkList[0].address,
      'phone': adkList[0].division_telephone,
      'departments': adkList
    }

    var adks = {
      'id': adksList[0].division_id,
      'name': adksList[0].division_name,
      'address': adksList[0].address,
      'phone': adksList[0].division_telephone,
      'departments': adksList
    }

    var result = [adk, adks]

    res.status(200).json(     
      {
        'code': resultCode,
        'message': message,
        'data': result
      }
    );    
  });
}

var confirmMemoPasswordAPI = function(req, res) {
  const user_id = req.body.user_id;
  const password = req.body.password;

  var resultCode = 404;
  var message = "에러가 발생했습니다.";

  const promise = new Promise(function(resolve, reject){
    connection.query('SELECT * from users where id="' + user_id + '"', (error, rows, fields) => {
      if (error) {
        throw error;
        reject();
      }

      else if(rows.length) {
        bcrypt.compare(password, rows[0].password, function(err, result){
          if(result) {            
            resultCode = 200;
            message = '로그인 성공! ' + rows[0].account + '님 환영합니다.';
          }
          else {
            resultCode = 204;
            message = "비밀번호가 틀렸습니다.";
          }
        })
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
        'message': message
      }
    );
  })
}

module.exports = {
  loginAPI: loginAPI,
  changePasswordAPI: changePasswordAPI,
  employeesAPI: employeesAPI,
  employeeAPI: employeeAPI,
  memoAPI: memoAPI,
  addMemoAPI: addMemoAPI,
  updateMemoAPI: updateMemoAPI,
  departmentsAPI: departmentsAPI,
  confirmMemoPasswordAPI: confirmMemoPasswordAPI
}
