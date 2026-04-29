const mysql = require('mysql2/promise');

// const connection = mysql.createPool({
//     host: 'localhost',
//     user: 'demoprojects',
//     // user:'root',
//     // password:'',
//     // database:'goa',
//     password: '#demoProjects#$4@',
//     database: 'goagamesclub',
//     port: 8000
// });

// module.exports = connection;

// const mysql = require('mysql2/promise');

const connection = mysql.createPool({
  host: '127.0.0.1',  // or '127.0.0.1'
  user: 'avaitorgame',
  password: 'Avatior123',
  database: 'gamedb'
});

// #1D4268

// const connection = mysql.createPool({
//     host: 'localhost',
//     user: 'root',
//     password: '',  // XAMPP's default root password is blank
//     database: 'gameavi',
//     port: 3306
// });

// const connection = mysql.createPool({
//   host: 'localhost',
//   user: 'avaitorgame',        // same as MySQL user created
//   password: 'yourpassword',   // same password as above
//   database: 'gameavatior'
// });

module.exports = connection;
