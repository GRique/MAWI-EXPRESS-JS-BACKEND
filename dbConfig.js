// dbConfig.js

const mysql = require('mysql');
const fs = require('fs');

// Create a MySQL connection pool
// const pool = mysql.createPool({
//     connectionLimit: 10, // Example limit, adjust as necessary
//     host: 'rampslogistics-mysqldbserver.mysql.database.azure.com',
//     user: 'mysqladmin@rampslogistics-mysqldbserver',
//     password: 'Ramps101*',
//     database: 'mawi'
// });

const dbConfig = {
    connectionLimit: 15, // The maximum number of connections to create at once
    host: 'mawidbupdated.mysql.database.azure.com',
    user: 'mawadmin',
    password: 'Logistics101*',
    database: 'mawi',
    acquireTimeout: 30000, // 30 seconds for acquiring a connection from the pool
    timeout: 60000, // 60 seconds for a query to complete
    idleTimeoutMillis: 300000 // Idle connections will be closed after 5 minutes
  };
  
// Create the MySQL connection pool
const pool = mysql.createPool(dbConfig);

pool.on('acquire', (connection) => {
  console.log(`Connection ${connection.threadId} acquired`);
});

pool.on('release', (connection) => {
  console.log(`Connection ${connection.threadId} released`);
});

pool.on('enqueue', () => {
  console.log('Waiting for available connection slot');
});

pool.on('error', (err) => {
  console.error('Database pool error:', err);
});

module.exports = pool;
