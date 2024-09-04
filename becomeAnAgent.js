const dotenv = require('dotenv');
const twilio = require('twilio');
const crypto = require('crypto');
dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioClient = twilio(accountSid, authToken);


// this function check if the number is register as 2settle agent if yes it will send otp and if no it will terminate
function handlerPhoneNumber(chatId,choice, bot, menuChoice,db, sessions,firstName){
    const regex = /^\+\d{1,3}\d{4,14}$/;
     if (choice.length === 11) {

        const numberWithoutFirstDigit = choice.slice(1);
        sessions[chatId]['phone_number'] = "+234" + numberWithoutFirstDigit;
      

      const min = 100000; // 6-digit number starting from 100000
      const max = 999999; // 6-digit number up to 999999
      const range = max - min + 1;

     // Generate a random 6-digit number within the specified range
      sessions[chatId]['randomNumber'] = crypto.randomBytes(4).readUInt32LE(0) % range + min

      db.query(`SELECT * FROM 2Settle_agent_table WHERE agent_phoneNumber = ${sessions[chatId]['phone_number'] }`, (err, results) => {
        if (err) {
          console.error('Error querying the database:', err);
          return;
        }
       if (results.length > 0) {
            const message = `Your 2SettleHQ verification code: ${sessions[chatId]['randomNumber']}`
            twilioClient.messages.create({
            body: message,
            from: '2SettleHQ',
            to: sessions[chatId]['phone_number'] 
          })
          .catch(error => console.error(error))
          .then(()=> {
            const message = `Enter the verification code that was sent to this ${sessions[chatId]['phone_number']}.\n` 
            bot.sendMessage(chatId, message);
          })
          menuChoice[chatId] = 'enterotp'; 
        }else {
          const message = 'This phone number is not register on 2settle, you need to register as 2Settle agent to access this plaform. thank you.'

          const menuOptions = [
            [{ text: 'Transact Crypto', callback_data: 'transactCrypto' },
            { text: 'Become an Agent', callback_data: 'becomeanAgent' }],
            [{ text: 'Request for paycard', callback_data: 'Requestforpaycard' },
            { text: 'Customer support', callback_data: 'Customersupport' }],
            [{ text: 'Transaction ID', callback_data: 'transactID' },
            { text: 'Reportly', callback_data: 'report' }]
          ];
           
           
          const menuMarkup = {
              reply_markup: {
                  inline_keyboard: menuOptions,
              },
          };

          bot.sendMessage(chatId, message, menuMarkup);

        }  
      })


    } else {
      const message = 'please enter valid Phone Number, in this format e.g +2348011223344.'
      bot.sendMessage(chatId, message)
      nairapayment.startIdleTimer(chatId,choice,bot,menuChoice,sessions)
    }
    
}

// this function receive the otp and check if is correct it will display the 2settle agent menu for the user
function handleOtp(chatId, choice, bot, db, sessions, firstName){
  if(Number(choice) === sessions[chatId]['randomNumber']){
    const message = 'Phone Number confirmed'
    bot.sendMessage(chatId, message)
      .then(() => {

      const user = {
                chat_id: chatId
              }

              db.query(`UPDATE 2Settle_agent_table SET ? WHERE agent_phoneNumber = ${sessions[chatId]['phone_number']}`, user, (err, result) => {
                if (err) {
                  console.error('Error updating user data:', err);
                  return;
                 }

                  const message = `Today Rate: ₦${sessions[chatId]['mainRate']}/$1 \n\nWelcome to 2SettleHQ ${firstName}, how can I help you today?`;


                  const menuOptions = [
                    [{ text: 'Transact Naira', callback_data: 'transactNaira' },
                    { text: 'Transact Crypto', callback_data: 'transactCryptoAgent' }],
                    [{ text: 'Transact eNaira', callback_data: 'transactENaira' },
                    { text: 'Add a Vendor', callback_data: 'addVendor' }],
                    [{ text: 'Transaction ID', callback_data: 'transactID_agent' },
                        { text: 'Reportly', callback_data: 'report' }
                      ],
                ];

                  const menuMarkup = {
                      reply_markup: {
                          inline_keyboard: menuOptions,
                      },
                  };

                  bot.sendMessage(chatId, message, menuMarkup);
              });

    })
  }else{
   const message = 'Enter valid verification code. try again'
   bot.sendMessage(chatId, message)
  }
}

module.exports ={
  handlerPhoneNumber,
  handleOtp
}