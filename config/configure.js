const mysql = require('mysql');
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    port: 3307,
    password: 'polygon',
    database: 'andkorea'
});

var dbConnect = function(database) {
	database.connect(function(err) {            
		if(err) {                            
			console.log('error when connecting to db:', err);
			setTimeout(dbConnect, 2000); 
		}
	});
		                             
	database.on('error', function(err) {
		console.log('db error', err);
		if(err.code === 'PROTOCOL_CONNECTION_LOST') { 
			return dbConnect();
		} else {                                    
			throw err;                              
		}
	});
}


module.exports = {
	db : db,
	dbConnect : dbConnect
}