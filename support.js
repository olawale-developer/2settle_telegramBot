
const axios = require('axios')
const crypto = require('crypto'); 


const nairaPayment = require('./nairaEst.js')

// this is the consumer_support phone number
const support_phoneNumber = '+2347033573784'


function handleCustomerSupport(chatId, choice, bot, menuChoice, sessions) {
  if (choice === '1') {
    const message = `Dear ${sessions[chatId]['firstName']}, for any inquiries, please reach out to our customer support team. ${support_phoneNumber}`
    bot.sendMessage(chatId, message)
      .then(() => {
        nairaPayment.exitMenu(chatId, choice, bot, menuChoice, sessions);
      })
    menuChoice[chatId] = ''
  } else if (choice === '2') {
    const message = 'Please enter your transaction_id'
    bot.sendMessage(chatId, message)
    menuChoice[chatId] = 'complain'
  } else if (choice === '0') { 
    nairaPayment.exitMenu(chatId, choice, bot, menuChoice, sessions);
    menuChoice[chatId] = ''
  }
}

function handleComplain(chatId,choice,bot,menuChoice,db, sessions) {
  db.query(`SELECT * FROM 2settle_transaction_table WHERE transac_id = ${choice}`, (err, results) => {
    if (err) {
      console.error('Error querying the database:', err);
      return;
    }
    if (results.length > 0) { 
    sessions[chatId]['customer_phoneNumber'] = results[0].customer_phoneNumber
     sessions[chatId]['transact_id'] =  choice
       const message =[
      'what is your complain in less than 100 words',
      '0. Go back',
      '00. Exit'
    ];
      bot.sendMessage(chatId, message.join('\n'));
     menuChoice[chatId]  = 'explanation'
    } else {
      const message = 'Invalid transaction_id. Try again'
      bot.sendMessage(chatId, message)
       .then(() => {
           nairaPayment.exitMenu(chatId, choice, bot, menuChoice, sessions);
         })
         menuChoice[chatId] = ''
    }
  })
}

function handleExplanation(chatId,choice,bot,menuChoice,db, sessions) {
  const words = choice.trim().split(/\s+/);
  // Count the number of words
  const wordCount = words.length;
  if (wordCount < 100) { 
    sessions[chatId]['explanation'] = choice
     handleconfirmPhone_number(chatId,choice,bot,menuChoice,db, sessions)
  }else{
    const message = 'Your explanation should not be greater than 100 words. Try again'
    bot.sendMessage(chatId, message);
  }
  
}

function handleconfirmPhone_number(chatId,choice,bot,menuChoice,db, sessions) {

        const messages = `Dear ${sessions[chatId]['firstName']}, your complain is noted. \nYou can also reach out to our customer care. ${support_phoneNumber}`
        bot.sendMessage(chatId, messages)
          .then(() => {
           nairaPayment.exitMenu(chatId, choice, bot, menuChoice, sessions);
          })
         menuChoice[chatId] = ''


   const min = 100000; // 6-digit number starting from 100000
    const max = 999999; // 6-digit number up to 999999
   const range = max - min + 1;

 // Generate a random 6-digit number within the specified range
 sessions[chatId]['complain_id'] = crypto.randomBytes(4).readUInt32LE(0) % range + min

      console.log(sessions[chatId]['transact_id'])
      console.log(sessions[chatId]['customer_phoneNumber'])

     const messageDetails = [
      `wallet_address_hash: ${sessions[chatId]['wallet/hash'] ?? null}` ,
      `complain: ${sessions[chatId]['explanation']}` ,
      `transaction_id: ${sessions[chatId]['transact_id']}`,
      `Customer_phone: ${sessions[chatId]['customer_phoneNumber']}`,
      `Complain_id: ${sessions[chatId]['complain_id']}`
    ];
     
      const menuOptions = [
        [{ text: 'Attend to complain', callback_data: `complain_id: ${sessions[chatId]['transact_id']} processing`}]
          ];
            
             const message = `${messageDetails.join('\n')}` 


  axios.post('http://13.51.194.198:3000/message', {
       message: message,
       menuOptions: menuOptions
    })
      
    //  axios.post('http://127.0.0.1:3000/message', {
    //    message: message,
    //    menuOptions: menuOptions
    // })
    

     user = {
    wallet_address_hash: sessions[chatId]['wallet/hash'],
    complain: sessions[chatId]['explanation'] ,
    transaction_id: sessions[chatId]['transact_id'],
    status: 'pending',
    Customer_phoneNumber: sessions[chatId]['customer_phoneNumber'],
    complain_id: sessions[chatId]['complain_id']
   }
   

     db.query('INSERT INTO 2settle_complain_table SET ?', user, (err, result) => {
      if (err) {
        console.error('Error storing user data in the database:', err);
        return;
      }
    })

}


module.exports = {
    handleCustomerSupport,
    handleComplain,
    handleExplanation
}