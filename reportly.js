
const axios = require('axios')

const  nairaPayment = require('./nairaEst.js')

// this funciton tell a reporter to enter their name
function name(chatId,choice,bot,menuChoice,sessions,db){
  const message = [
    'Please enter your Full name',
    '00. Exit'
  ];
  bot.sendMessage(chatId, message.join('\n'));
  menuChoice[chatId] = 'report_name'
}

// this function display the name function 
function report(chatId,choice,bot,menuChoice,sessions){
     if(choice === '1' ){
      name(chatId,choice,bot,menuChoice,sessions)
        sessions[chatId]['complain'] = 'Track Transaction'
     }else if (choice === '2'){
      name(chatId,choice,bot,menuChoice,sessions)
    menuChoice[chatId] = 'report_name'
    sessions[chatId]['complain'] = 'Stolen funds | disappear funds'
     }else if (choice === '3'){
      name(chatId,choice,bot,menuChoice,sessions)
     menuChoice[chatId] = 'report_name'
     sessions[chatId]['complain'] = 'Fraud'
     }else if(choice === '0'){
      nairaPayment.exitMenu(chatId, choice, bot, menuChoice, sessions);
     }
     else{
        const message = 'enter a valid options provided. Try again'
        bot.sendMessage(chatId, message);
     }
  
   
}


// this function tell a reporter to enter their phone number
function report_phoneNumber(chatId,choice,bot,menuChoice,sessions){
  if(choice === "00"){
    nairaPayment.exitMenu(chatId, choice, bot, menuChoice, sessions);
  }else{
    sessions[chatId]['report_name'] = choice
    bot.sendMessage(chatId, 'Please enter phone number.\
      \n 0. Go back \
      \n 00. Exit`')
    menuChoice[chatId] = 'report_phoneNumber'
  }
}



// this function tell a reporter to enter their wallet address
function report_walletAddress(chatId,choice,bot,menuChoice,sessions){
  if (choice.length === 11) {
    const numberWithoutFirstDigit = choice.slice(1);
   sessions[chatId]['phone_number'] = "+234" + numberWithoutFirstDigit;
      const message =[
        'Please enter your wallet address',
        '0. Go back',
        '00. Exit'
      ];
      bot.sendMessage(chatId, message.join('\n'));
    menuChoice[chatId] = 'report_address'
  }else if(choice === '0'){
    name(chatId,choice,bot,menuChoice,sessions)
  }else if(choice === '00'){
    nairaPayment.exitMenu(chatId, choice, bot, menuChoice, sessions);
  }
  else{
    const message = 'please enter valid customer Phone Number, in this format e.g +2348011223344.'
    bot.sendMessage(chatId, message)
  }
}


// this function tell the reporter to enter the fraudster_walletadddress
function report_fraudster_walletAddress(chatId,choice,bot,menuChoice,sessions){

    sessions[chatId]['report_walletAddres'] = choice
    const message =[
     'Please enter fraudster wallet address \n',
     '1. Skip',
     '0. Go back',
     '00. Exit'
   ];
  bot.sendMessage(chatId, message.join('\n'));
 menuChoice[chatId] = 'report_fraudster'
if(choice === '0'){
    bot.sendMessage(chatId, 'Please enter Customer phone number in this format e.g +2348011223344.\
    \n 0. Go back \
    \n 00. Exit`')
  menuChoice[chatId] = 'report_phoneNumber'
  }else if(choice === '00'){
    nairaPayment.exitMenu(chatId, choice, bot, menuChoice, sessions);
  }
    
}

// this function tell the reporter to explain what happen in 100 words
function report_note(chatId,choice,bot,menuChoice,sessions){
    const message =[
      'Explain what happened in less than 100 words',
      '0. Go back',
      '00. Exit'
    ];
      bot.sendMessage(chatId, message.join('\n'));
     menuChoice[chatId]  = 'enter_note'
     sessions[chatId]['fraudester_wallet'] = choice
    if( choice === '1'){
      const message =[
        'Explain what happened in less than 100 words',
        '0. Go back',
        '00. Exit'
      ];
        bot.sendMessage(chatId, message.join('\n'));
       menuChoice[chatId] =  'enter_note'
       sessions[chatId]['fraudester_wallet'] = ''
    } else if(choice === '0'){
    const message =[
      'Please enter your wallet address',
      '0. Go back',
      '00. Exit'
    ];
   bot.sendMessage(chatId, message.join('\n'));
  menuChoice[chatId] = 'report_address'
  }else if(choice === '00'){
    nairaPayment.exitMenu(chatId, choice, bot, menuChoice, sessions);
  }
}


// this function save the reporter details to the database
function reportlySaveData(chatId, choice, db, sessions) {
  
  const messageDetails = [
      `Name: ${sessions[chatId]['report_name']}` ,
      `phone_number:  ${sessions[chatId]['phone_number']}`,
      `wallet_address: ${sessions[chatId]['report_walletAddres']}`,
      `fraudster_wallet_address: ${sessions[chatId]['fraudester_wallet']}`,
      `description:  ${choice}`,
      `complaint: ${sessions[chatId]['complain']}`,
      `Report_id: ${sessions[chatId]['report_id']}`
      
     
    ];
     
            const menuOptions = [
               [{ text: 'Attend to', callback_data: `Report_id: ${sessions[chatId]['report_id']} processing` }]
               ];
            
             const message = `${messageDetails.join('\n')}` 
  
  
    //    axios.post('http://127.0.0.1:3000/message', {
    //    message: message,
    //    menuOptions: menuOptions
    // })

  axios.post('http://13.51.194.198:3000/message', {
       message: message,
       menuOptions: menuOptions
    })
      
   user = {
    name: sessions[chatId]['report_name'] ,
    phone_number:  sessions[chatId]['phone_number'],
    wallet_address: sessions[chatId]['report_walletAddres'],
    fraudster_wallet_address: sessions[chatId]['fraudester_wallet'],
    description:  choice,
    complaint: sessions[chatId]['complain'],
    report_id: sessions[chatId]['report_id'],
    status: 'pending'
   }
   

     db.query('INSERT INTO 2settle_report_table SET ?', user, (err, result) => {
      if (err) {
        console.error('Error storing user data in the database:', err);
        return;
      }
    })
}


// this function display the thank you message and exit menu  and also check maybe the words are not greater than 100
function report_enterNote(chatId,choice,bot,menuChoice,db, sessions){
  const words = choice.trim().split(/\s+/);
  // Count the number of words
  const wordCount = words.length;
  if(wordCount < 100){
   bot.sendMessage(chatId, 'Thank you for submitting the report, We get back to you shortly')
     .then(() => {
    nairaPayment.exitMenu(chatId, choice, bot, menuChoice, sessions)
   })  
    db.query(`SELECT * FROM 2settle_report_table`, (err, results) => {
         if (err) {
          console.error('Error querying the database:', err);
          return;
         }
       let report_prefix = 'Report_'
      if (results.length > 0) { 
        const report_id = results[results.length - 1].report_id;
        if (report_id === null) {
          const number = 1
          report_prefix = 'Report_00'
          sessions[chatId]['report_id'] = report_prefix + number
          reportlySaveData(chatId,choice,db, sessions)
        } else {
          const numbersOnly = report_id.replace(/[^0-9.]/g, '');
          const number = Number(numbersOnly) + 1 
          const numberStr = number.toString(); 
          if (numberStr.length > 1) {
            sessions[chatId]['report_id'] = report_prefix + '0' + number
            reportlySaveData(chatId,choice,db, sessions)
          } else {
             sessions[chatId]['report_id'] = report_prefix + '00' + number
            reportlySaveData(chatId,choice,db, sessions)
          }
        }
      } else {
        const number = 1
          report_prefix = 'Report_00'
          sessions[chatId]['report_id'] = report_prefix + number
          reportlySaveData(chatId,choice,db, sessions)
      }

    })
  }else if(choice === '0'){
    const message =[
      'Please enter fraudster wallet address \n',
      '1. Skip',
      '0. Go back',
      '00. Exit'
    ];
    bot.sendMessage(chatId, message.join('\n'));
  menuChoice[chatId] = 'report_fraudster'
  }else if(choice === '00'){
    nairaPayment.exitMenu(chatId, choice, bot, menuChoice, sessions);
  }else{
    const message = 'Your explanation should not be greater than 100 words. Try again'
    bot.sendMessage(chatId, message);
 }

}


module.exports = { 
  report,
  report_phoneNumber,
  report_walletAddress,
  report_fraudster_walletAddress,
  report_note,
  report_enterNote
}