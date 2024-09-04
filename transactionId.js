const nairaPayment = require('./nairaEst.js')


// this function uses chatID, transactioID or giftID to complete transaction
function handleId(chatId, choice, bot, menuChoice, sessions) {
  if(choice === '1'){
    const messages = [
    'Enter your Transaction ID.',
    '0. Go back',
    '00. Exit'
  ];
  bot.sendMessage(chatId,  messages.join('\n'));
  menuChoice[chatId] = 'TransactID'
  }else if(choice === '2'){
    const messages = [
      'Enter your Gift ID.',
      '0. Go back',
      '00. Exit'
    ];
    bot.sendMessage(chatId,  messages.join('\n'));
    menuChoice[chatId] = 'GiftID'
  }else if(choice === '3'){
    const messages = [
      'Enter your Request ID.',
      '0. Go back',
      '00. Exit'
    ];
    bot.sendMessage(chatId,  messages.join('\n'));
    menuChoice[chatId] = 'RequestID'
  }else if(choice === '0'){
    nairaPayment.exitMenu(chatId, choice, bot, menuChoice, sessions);
  }
 // nairaPayment.startIdleTimer(chatId,choice,bot,menuChoice,sessions)
}

// this function uses transaction id to complete a transaction.
function transact_id(chatId, choice, bot, menuChoice, db, sessions) {
  if(Number(choice)){
  db.query('SELECT * FROM 2settle_transaction_table WHERE transac_id = ?', [choice], (err, results) => {
    if (err) {
      console.error('Error querying the database:', err);
      return;
    }

    if (results.length > 0) {
      const status = results[0].status.toString();
      const estimation = results[0].estimation.toString();
      const mode_of_payment = results[0].mode_of_payment.toString();
      sessions[chatId]['send_from'] = results.map((row) => row.send_from)

  
      sessions[chatId]['status'] = status;
      sessions[chatId]['estimation'] = estimation;
      sessions[chatId]['mode_of_payment'] = mode_of_payment;
      if (status === 'Uncompleted' && mode_of_payment !== 'request') {
        sessions[chatId]['transac_id'] = choice
        const menuOption = [
          '1. Confirm Transaction',
          '2. Cancel Transaction',
          '00. Exit'
        ];
        bot.sendMessage(chatId, `Here is your menu: \n` + menuOption.join('\n'))
          menuChoice[chatId] = 'transferTransaction';
          nairaPayment.startIdleTimer(chatId,choice,bot,menuChoice,sessions)
      } else if ((status === 'Processing' || status === 'Cancel' || status === 'Successful' || status === 'UnSuccessful') && mode_of_payment !== 'request')  {
        const message = `This transaction is ${status}`;
        bot.sendMessage(chatId, message)
          .then(() => {
            nairaPayment.exitMenu(chatId, choice, bot, menuChoice, sessions);
          });
      }else {
      const message = 'This Transaction ID is for Complete payment';
      bot.sendMessage(chatId, message)
        .then(() => {
          nairaPayment.exitMenu(chatId, choice, bot, menuChoice, sessions);
        });
    }
    } else {
      const message = 'Transaction ID is not valid';
      bot.sendMessage(chatId, message)
        .then(() => {
          nairaPayment.exitMenu(chatId, choice, bot, menuChoice, sessions);
        });
    }
  });
}else if(choice === '0'){
  const messages = [
    '1. Complete your transaction',
    '2. Claim Gift',
    '3. Complete payment',
    '0. Go back',
  ];
  bot.sendMessage(chatId, 'Here is your menu:\n' + messages.join('\n'));
  menuChoice[chatId] = 'general_id'
}else if(choice === '00'){
  nairaPayment.exitMenu(chatId, choice, bot, menuChoice, sessions);
}else {
  const message = 'Your input is not correct. Try again';
  bot.sendMessage(chatId, message)
    .then(() => {
      nairaPayment.exitMenu(chatId, choice, bot, menuChoice, sessions);
    });
}
}


module.exports = {
    handleId,
    transact_id
}