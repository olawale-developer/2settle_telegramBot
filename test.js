// const dotenv = require('dotenv');
// dotenv.config();
// const mysql = require('mysql');

// const db = mysql.createConnection({
//     host:  process.env.host,
//     port:  process.env.port,
//     user:  process.env.user,
//     password:  process.env.password,
//     database: process.env.database
// })


// // const results =  db.query(`SELECT * FROM 2settle_transaction_table WHERE transac_id = ?`, ["642083"]);
//  const id = "642083"
// db.query(`SELECT * FROM 2settle_transaction_table WHERE transac_id =  ${id}`, (err, results) => {
//     if (err) {
//         console.error('Error querying the database:', err);
//         return;
//     }
//     console.log(results)
//     if (results.length > 0) {

//      }

// })

const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: '50.6.175.42',
  user: 'settle_admin',
  password: 'Sirfitech1#',
  database: 'settle_database'
});

// Connect to the database
connection.connect((err) => {
  if (err) {
    console.error('Error connecting: ' + err.stack);
    return;
  }
  console.log('Connected as id ' + connection.threadId);
});

// Example query
connection.query('SELECT 1 + 1 AS solution', (error, results, fields) => {
  if (error) throw error;
  console.log('The solution is: ', results[0].solution);
});

// Close the connection
connection.end();


// .then(() => {
//             if (estimation === 'Naira') {
//               if (mode_of_payment === 'transferMoney') {
//                 menuChoice[chatId] = 'transferTransaction';
//               } else if (mode_of_payment === 'Cash') {
//                 menuChoice[chatId] = 'cashTransaction';
//               } else if (mode_of_payment === 'Gift') {
//                 menuChoice[chatId] = 'cashTransaction';
//                 sessions[chatId]['verify'] = 'Gift'
//               }
//             } else if (estimation === 'Dollar') {
//               if (mode_of_payment === 'transferMoney') {
//                 menuChoice[chatId] = 'transferTransaction';
//               } else if (mode_of_payment === 'Cash') {
//                 menuChoice[chatId] = 'dollarcashTransaction';
//               } else if (mode_of_payment === 'Gift') {
//                 menuChoice[chatId] = 'cashTransaction';
//                 sessions[chatId]['verify'] = 'Gift'
//               }
//             } else if (estimation === 'crypto') {
//               if (mode_of_payment === 'transferMoney') {
//                 menuChoice[chatId] = 'transferTransaction';
//               } else if (mode_of_payment === 'Cash') {
//                 menuChoice[chatId] = 'cryptocashTransaction';
//               } else if (mode_of_payment === 'Gift') {
//                 menuChoice[chatId] = 'cashTransaction';
//                 sessions[chatId]['verify'] = 'Gift'
//               }
                
//             }
//               console.log(menuChoice[chatId])
//           });