// dbConfig.js

const mysql = require('mysql');

// Create a MySQL connection pool
const pool = mysql.createPool({
    connectionLimit: 10, // Example limit, adjust as necessary
    host: 'rampslogistics-mysqldbserver.mysql.database.azure.com',
    user: 'mysqladmin@rampslogistics-mysqldbserver',
    password: 'Ramps101*',
    database: 'mawi'
});

module.exports = pool;
