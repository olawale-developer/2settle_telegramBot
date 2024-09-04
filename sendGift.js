function GiftUnavailable(chatId,choice,bot,menuChoice,db, sessions){
  if (choice.length === 11) {
    const numberWithoutFirstDigit = choice.slice(1);
    sessions[chatId]['phone_number'] = "+234" + numberWithoutFirstDigit;
    
    bot.sendMessage(chatId, 'Phone Number confirmed').then(() => {
      const message = `You are receiving ${sessions[chatId]['naira']}.`
      bot.sendMessage(chatId, message).then(()=> {
        bot.sendMessage(chatId, 'We are processing your payment. Thank you')
        exitMenu (chatId,choice,bot,menuChoice,sessions)
      })
    })
        sessions[chatId]['verify'] = ''
    const menuOption = [
      `Name: ${sessions[chatId]['stringName']}`,
      `Bank name: ${sessions[chatId]['bankNameString']}`,
      `Account number: ${sessions[chatId]['acctNoString']}`,
      `Receiver Amount: ${sessions[chatId]['naira']}`,
      `Status: ${processing}`,
    ];
   
   
    const reply = `You are receiving ${sessions[chatId]['naira']}\n` + menuOption.join('\n')
    twilioClient.messages.create({
      body: reply,
      from: '2SettleHQ',
      to:  sessions[chatId]['phone_number'] 
    })


    const user = {
      acct_number:  sessions[chatId]['acctNoString'],
     bank_name:  sessions[chatId]['bankNameString'],
     receiver_name:  sessions[chatId]['stringName'],
     receiver_phoneNumber: sessions[chatId]['phone_number'],
     gift_status: processing

    }
      // User doesn't exist, store the data in the database
      db.query(`UPDATE 2settle_transaction_table SET ? WHERE gift_chatID  = ${sessions[chatId]['gift_id']}`, user, (err, result) => {
        if (err) {
          console.error('Error updating user data:', err);
          return;
         }
        })  
  }else{
    phoneNumberError(chatId, bot)
  }
}