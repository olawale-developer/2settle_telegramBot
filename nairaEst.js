const crypto = require('crypto'); 



// this is exitmenu that will user back to the main menu either user menu or agent menu 
 function exitMenu (chatId,choice,bot,menuChoice,sessions){
  if( sessions[chatId]['exit'] === '2settleHQ'){
    const message = `Today Rate: ₦${sessions[chatId]['mainRate']}/$1`
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

  }else{
    const message = `Today Rate: ₦${sessions[chatId]['mainRate']}/$1`
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
  }
  
 }

let timers = {}; // Object to store timers

 // this function hanldle crypto assets
function selectCoin(chatId,bot) {
  const menuOptions = [
    '1. Bitcoin (BTC)',
    '2. Ethereum (ETH)',
    '3. BINANCE (BNB)',
    '4. TRON (TRX)',
    '5. USDT',
    '00. Exit'

  ];
  bot.sendMessage(chatId, 'Pay with:\n' + menuOptions.join('\n'));
}   

// Function to start the timer for a user
function startIdleTimer(chatId,choice,bot,menuChoice,sessions) {
    if (timers[chatId]) {
        clearTimeout(timers[chatId]);
    }
    timers[chatId] = setTimeout(() => {
        terminationMessage(chatId,choice,bot,menuChoice,sessions);
    }, 300000); // 5 minutes in milliseconds
}

// Function that notifies user when they are inactive for a while before terminating the chat, user can continue their transaction later when they provide transaction_id
function terminationMessage(chatId,choice,bot,menuChoice,sessions) {
  const message = `Hey ${sessions[chatId]['firstName']}! \ \n
It seems like you haven't been active for a bit. \
  I'll go ahead and close down the transaction you started. Just give me a shout with "hi wale" whenever you need me again.`;
  menuChoice[chatId] = '';
  bot.sendMessage(chatId, message);
}

// this function handle how a user like to estimate their payment
function estimation(chatId,choice,bot,menuChoice,sessions) {
  bot.sendMessage(chatId,  `How would you like to estimate your ${sessions[chatId]['cryptoasset']} (${sessions[chatId]['network']}) ?`)
  .then(()=> {
    const menuOptions = [
      '1. Naira',
      '2. Dollar ',
      '3. Crypto',
      '00. Exit'
    ];
    bot.sendMessage(chatId, 'Here is your menu:\n' + menuOptions.join('\n'))
    menuChoice[chatId] = 'Selectcurrency'
  })
  startIdleTimer(chatId,choice,bot,menuChoice,sessions) 
}

// this function calculate the amount in naira and display the charges
function handleNairaAmount(chatId, choice, bot, menuChoice, db, sessions) {
    sessions[chatId]['numbersOnly'] = choice.replace(/[^0-9.]/g, '');
    const parsedValue = parseFloat(sessions[chatId]['numbersOnly']);
    if (!isNaN(parsedValue)) {
    if (sessions[chatId]['numbersOnly'] <= 2000000 &&  sessions[chatId]['numbersOnly']  >= 20000) {
      sessions[chatId]['amount'] =   sessions[chatId]['numbersOnly'] ;
      const nairaValue   =  Number(sessions[chatId]['amount'])
      sessions[chatId]['amountString']   =  nairaValue.toLocaleString()
      if (sessions[chatId]['amount'] <= 100000) {
        sessions[chatId]['transactionFee'] = 500;
      } else if (sessions[chatId]['amount'] <= 1000000) {
        sessions[chatId]['transactionFee'] = 1000;
      } else if (sessions[chatId]['amount'] <= 2000000) {
        sessions[chatId]['transactionFee'] = 1500;
      } else if (sessions[chatId]['amount'] >= 2100000) {
        sessions[chatId]['transactionFee'] = 2000;
      }
  
      db.query(`SELECT * FROM 2Settle_ExchangeRate`, (err, results) => {
        if (err) {
          console.error('Error querying the database:', err);
          return;
        }

        const raw = results.map((row)  =>  `${row.rate}`);
        const  array_rate = raw.toString()
        const   numRate =  Number(array_rate)
        const percentage = 0.8;
        const increase = (percentage / 100) * numRate;
        sessions[chatId]['rate'] =  numRate - increase
        

        const dollarTrasacFee = sessions[chatId]['transactionFee'] / sessions[chatId]['rate'];
        const dollarAmount = sessions[chatId]['amount'] / sessions[chatId]['rate'];
        sessions[chatId]['charges'] = dollarTrasacFee 
        const assets = sessions[chatId]['charges']  * sessions[chatId]['rate'];
        sessions[chatId]['nairaValues']  = assets.toFixed(2)
        if(sessions[chatId]['cryptoNetwork'] !== 'USDT' ){
       fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${sessions[chatId]['cryptoNetwork']}`)
          .then((res) => res.json())
          .then((data) => {
            sessions[chatId]['cryptoPrice'] = data.price;
            const asset = sessions[chatId]['charges']  / sessions[chatId]['cryptoPrice'];
            sessions[chatId]['totalcrypto'] = asset.toFixed(5);

            sessions[chatId]['totalCharges'] =`${sessions[chatId]['totalcrypto']} ${sessions[chatId]['cryptoasset']} = ₦${sessions[chatId]['nairaValues']}`
            // Fix this section to display the menu
            const menuOptions = [
              `Charge:  ${sessions[chatId]['totalcrypto']} ${sessions[chatId]['cryptoasset']} = ₦${sessions[chatId]['nairaValues']} \n`,
              `1. ${sessions[chatId]['minusCharges']}`,
              `2. ${sessions[chatId]['addCharges']}`,
              '0. Go back',
              '00. Exit',
            ];
            bot.sendMessage(chatId, 'Here is your menu:\n' + menuOptions.join('\n'));
           
          })
          .catch((error) => {
            console.error('Error fetching Binance data:', error);
          });
        }else{
          const asset = sessions[chatId]['charges']  
          sessions[chatId]['totalcrypto'] = asset.toFixed(5);

          sessions[chatId]['totalCharges'] =`${sessions[chatId]['totalcrypto']} ${sessions[chatId]['cryptoasset']} = ₦${sessions[chatId]['nairaValues']}`
          const menuOptions = [
            `Charges:  ${sessions[chatId]['totalcrypto']} ${sessions[chatId]['cryptoasset']} = ₦${sessions[chatId]['nairaValues']} \n`,
            `1. ${sessions[chatId]['minusCharges']}`,
            `2. ${sessions[chatId]['addCharges']}`,
            '0. Go back',
            '00. Exit',
          ];
          bot.sendMessage(chatId, 'Here is your menu:\n' + menuOptions.join('\n'));
         
        }
      });
  
       if(sessions[chatId]['verify'] === 'payVendor'){
          menuChoice[chatId] = 'payVendor'
        }else if(sessions[chatId]['verify'] === 'transferMoney'){
        menuChoice[chatId] = 'transferPayment'
      }else if(sessions[chatId]['verify'] === 'cash'){
        menuChoice[chatId] = 'phoneNumber_Transfer'
      }else if(sessions[chatId]['verify'] === 'Gift'){
        menuChoice[chatId] = 'phoneNumber_Transfer'
      }else if(sessions[chatId]['verify'] === 'request'){
        menuChoice[chatId] = 'transferPayment'
      }


    }else if (choice === '0'){
      estimation(chatId,choice,bot,menuChoice,sessions)
     }else if (choice === '00'){
     exitMenu (chatId,choice,bot,menuChoice,sessions)
     }
     else{
       const message = 'maximum payment is 2 million naira and minium payment is 20,000 naira. Re-enter your amount \
         \n 0. Go back \
         \n 00. Exit'
       bot.sendMessage(chatId, message);
      
     }
    }else{
      const message = 'please simply input the numeric amount you wish to transfer. \
      \n 0. Go back \
      \n 00. Exit'
    bot.sendMessage(chatId, message);
   
    }
    startIdleTimer(chatId,choice,bot,menuChoice,sessions) 
}

// this function tell user to input their their bank name 
function firstThreeLetterOfBank(chatId,  bot) {
  const message = 'Enter the first three letters of your Bank name. \n'  + '0. Go back \n' + '00. Exit'
   bot.sendMessage(chatId, message);
}

// this function display the menu  for user to input their bank name
function transferPayment(chatId, choice, bot, menuChoice, db, sessions){
  if(choice === '1'){
    firstThreeLetterOfBank(chatId,  bot)
    menuChoice[chatId] = 'AcctNo'
    sessions[chatId]['transfer'] = 'minusCharges'
  }else if(choice === '2'){;
       firstThreeLetterOfBank(chatId,  bot)
     menuChoice[chatId] = 'AcctNo'
    sessions[chatId]['transfer'] = 'addCharges'
  }else if(choice === '0'){
     estimation(chatId,choice,bot,menuChoice,sessions)
  }else if(choice === '00'){
    exitMenu (chatId,choice,bot,menuChoice,sessions)
  }else{
    const message = 'Enter a valid options provided. Try again \n' + '0. Go back \n' + '00. Exit'
    bot.sendMessage(chatId, message);
  }
  startIdleTimer(chatId,choice,bot,menuChoice,sessions) 
}


function handleAcctNo(chatId, choice, bot, menuChoice, db, sessions) {
  if (choice === '0') {
    naira_currency(chatId, choice, bot, menuChoice, db, sessions)
  } else if (choice === '00') {
    exitMenu(chatId, choice, bot, menuChoice, sessions)
  }else {
   handleBankDetails(chatId, choice, bot, db, sessions)
 }
     startIdleTimer(chatId,choice,bot,menuChoice,sessions) 
}

// this function display bank names in button for user to click their bank name
function handleBankDetails(chatId, choice, bot, db, sessions) {
  const regex = /^.{1,3}/; // Matches the characters from position 1 to 3
    const matches = choice.match(regex);
    const extracted = matches[0];
      db.query(`SELECT * FROM 2settle_bank_details WHERE bank_name LIKE '${extracted}%'`, (err, results) => {
        if (err) {
          console.error('Error querying the database:', err);
          return;
        }
        sessions[chatId]['verify_bank'] = true
        // Check if any countries were found
        if (results.length > 0) {
         const bank_name = results.map((row) => `${row.bank_name}`);
          const message = 'Select your bank name from options below'
          let menuOptions = []
          for (let i = 0; i < bank_name.length; i++){
            menuOptions.push([{ text: `${bank_name[i]}`, callback_data: `${bank_name[i]}`}],)
          }
            
           const menuMarkup = {
            reply_markup: {
                inline_keyboard: menuOptions,
            },
        };
  
            bot.sendMessage(chatId, message, menuMarkup);
            
        } else {
          bot.sendMessage(chatId, 'Bank not found. Try again\n' + '0. Go back \n' + '00. Exit')
        }
      })
}


// this function display user bank account details
function handleAcctName(chatId,choice,bot,menuChoice,sessions){
     if(choice.length === 10 && Number(choice)){
       fetch(`https://app.nuban.com.ng/api/NUBAN-WBODZCTK1831?bank_code=${sessions[chatId]['bank_code']}&acc_no=${choice}`)
       .then(res => res.json())
       .then(data => {
         if(data.error !== true){
         const name = data.map((row) => `${row.account_name}`)
         const acctNo = data.map((row) => `${row.account_number}`)
         
         sessions[chatId]['stringName'] = name.toString()
         sessions[chatId]['acctNoString']  = acctNo.toString()

        const reply = `Name: ${sessions[chatId]['stringName']} \n Bank name: ${sessions[chatId]['bankNameString']}\n Account number: ${sessions[chatId]['acctNoString']}`
        bot.sendMessage(chatId, reply)
         
        .then(() => {
         const menuOptions = [
           '1. Continue',
           '0. Go back',
           '00. Exit'
         ];
         bot.sendMessage(chatId, 'Here is your menu: \n' + menuOptions.join('\n'));
        })
           if (sessions[chatId]['verifyvendor'] === 'verifyvendor') {
             menuChoice[chatId] = 'vendorjob'
             sessions[chatId]['verifyvendor'] = ""
           } else {
              menuChoice[chatId] = 'phoneNumber_Transfer'
           }
          
           
       
     }else{
        const message = data.message
        bot.sendMessage(chatId, message)
       
        .then(() => {
        firstThreeLetterOfBank(chatId,  bot)
         menuChoice[chatId] = 'AcctNo'
        })
     }
       })
     }else if(choice === '0'){
           firstThreeLetterOfBank(chatId,  bot)
            menuChoice[chatId] = 'AcctNo'
    }else if(choice === '00'){
      exitMenu (chatId,choice,bot,menuChoice,sessions)
    } else{
      const message = 'Enter a valid options provided. Try again \n' + '0. Go back \n' + '00. Exit'
      bot.sendMessage(chatId, message);
    }
    startIdleTimer(chatId,choice,bot,menuChoice,sessions) 
}

// this function tell user to input their phone number
function enterphoneNumbe(chatId, bot){
    bot.sendMessage(chatId, 'Please enter Phone Number.\
      \n 0. Go back \
      \n 00. Exit`');
}
// this is phone number error  if user enter a wrong phone number this function will trigger
function phoneNumberError(chatId, bot) {
    const message = 'please enter valid Phone Number.'
  bot.sendMessage(chatId, message)
}

// this function display phone number for user 
function handlePhoneNumber_transferpayment(chatId,choice,bot,menuChoice,db, sessions){
    if(choice === '1'){
      enterphoneNumbe(chatId, bot)
      if (sessions[chatId]['estimate'] === 'Naira') {
         menuChoice[chatId] = 'Unavailable'
      }else if (sessions[chatId]['estimate'] === 'Dollar'){
         menuChoice[chatId] = 'dollarUnavailable'
      }else if (sessions[chatId]['estimate'] === 'crypto'){
         menuChoice[chatId] = 'cryptoUnavailable'
      }
      if (sessions[chatId]['verify'] === 'Gift') {
         
       }
    }else if(choice === '0'){
     firstThreeLetterOfBank(chatId,  bot)
        menuChoice[chatId] = 'AcctNo'
    }else if(choice === '00'){
      exitMenu (chatId,choice,bot,menuChoice,sessions)
    }else{
      const message = 'Enter a valid options provided. Try again \n' + '0. Go back \n' + '00. Exit'
      bot.sendMessage(chatId, message);
    }
    startIdleTimer(chatId,choice,bot,menuChoice,sessions) 
}

// this function saves user data to the database
function userData(chatId,choice,bot,menuChoice,db, sessions) {
  const currentDate = new Date();
  const day = currentDate.getDate();
  const month = currentDate.getMonth() + 1; // Month is zero-based, so we add 1
  const year = currentDate.getFullYear();// Ensure leading zeros for single-digit days and months
  const formattedDay = day < 10 ? '0' + day : day;
  const formattedMonth = month < 10 ? '0' + month : month;
  const formattedDate = `${formattedDay}/${formattedMonth}/${year}`;
  const hours = currentDate.getHours();
  const minutes = currentDate.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const formattedHours = hours % 12 === 0 ? 12 : hours % 12;
  const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
  const formattedTime = `${formattedHours}:${formattedMinutes}${ampm}`;
  sessions[chatId]['date']  = formattedTime + " " + formattedDate
 
  
  const user = {
    crypto: sessions[chatId]['cryptoasset'],
    network:  sessions[chatId]['network'] ,
   estimation: sessions[chatId]['estimate'],
   Amount: `${sessions[chatId]['amountString']}`,
  charges: sessions[chatId]['totalCharges'],
  mode_of_payment: sessions[chatId]['verify'],
  acct_number:  sessions[chatId]['acctNoString'],
  bank_name:  sessions[chatId]['bankNameString'],
  receiver_name:  sessions[chatId]['stringName'],
  receiver_amount: `₦${sessions[chatId]['naira']}`,
  crypto_sent: ` ${sessions[chatId]['totalcrypto']} ${sessions[chatId]['cryptoasset']}`,
  wallet_address: sessions[chatId]['walletAddress'], 
  Date: sessions[chatId]['date'],
 status: 'Uncompleted',
 customer_phoneNumber: sessions[chatId]['phone_number'],
 transac_id:  sessions[chatId]['transac_id'],
 settle_walletLink:  sessions[chatId]['cryptoLinks'],
 chat_id: chatId,
 current_rate: `₦${sessions[chatId]['mainRate']}`,
 merchant_rate: sessions[chatId]['merchant_rate'],
 profit_rate:  sessions[chatId]['profit_rate'],
 name: sessions[chatId]['firstName'],
  };
                    // User doesn't exist, store the data in the database
                    db.query('INSERT INTO 2settle_transaction_table SET ?', user, (err, result) => {
                      if (err) {
                        console.error('Error storing user data in the database:', err);
                        return;
                      }
                    })

}

// this function saves wallet_address and private key of the user
function savewalletAddress(chatId, db, sessions) {
  db.query(`SELECT * FROM 2Settle_walletAddress WHERE phone_number = ${sessions[chatId]['phone_number']}`, (err, results) => {
    if (err) {
      console.error('Error querying the database:', err);
      return;
    }
    if (results.length <= 0) {
      if (sessions[chatId]['network'] === 'BTC') {
           const user = {
          bitcoin_privateKey: sessions[chatId]['private_key'],
          bitcoin_wallet: sessions[chatId]['walletAddress'],
          phone_number: sessions[chatId]['phone_number'],
  };
                    // User doesn't exist, store the data in the database
                    db.query('INSERT INTO 2Settle_walletAddress SET ?', user, (err, result) => {
                      if (err) {
                        console.error('Error storing user data in the database:', err);
                        return;
                      }
                    })
      } else if (sessions[chatId]['network'] === 'ERC20' || sessions[chatId]['network'] === 'BEP20') {
           const user = {
          eth_bnb_privateKey: sessions[chatId]['private_key'],
          eth_bnb_wallet: sessions[chatId]['walletAddress'],
          phone_number: sessions[chatId]['phone_number'],
  };
                    // User doesn't exist, store the data in the database
                    db.query('INSERT INTO 2Settle_walletAddress SET ?', user, (err, result) => {
                      if (err) {
                        console.error('Error storing user data in the database:', err);
                        return;
                      }
                    })
      } else if (sessions[chatId]['network'] === 'TRC20') {
           const user = {
          tron_privateKey: sessions[chatId]['private_key'],
          tron_wallet: sessions[chatId]['walletAddress'],
          phone_number: sessions[chatId]['phone_number'],
       };
                    // User doesn't exist, store the data in the database
                    db.query('INSERT INTO 2Settle_walletAddress SET ?', user, (err, result) => {
                      if (err) {
                        console.error('Error storing user data in the database:', err);
                        return;
                      }
                    })
      }
     

    }
  })
 }

//this function  handle wallet address and transaction_id
function wallet_address(chatId,choice,bot,menuChoice,db, sessions){
  if(sessions[chatId]['cryptoNetwork'] !== 'USDT' ){
    bot.sendMessage(chatId, 'Phone Number confirmed').then(() => {
      const message = "You are receiving " + "₦" + sessions[chatId]['naira'] + "" + "\nTap to copy Transaction ID 👉 :` " + sessions[chatId]['transac_id'] + "`";
      bot.sendMessage(chatId, message, { parse_mode: "Markdown" })
    })
   .then(()=> {
    fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${sessions[chatId]['cryptoNetwork'] }`)
  .then(res => res.json())
  .then(data =>  {
    sessions[chatId]['cryptoPrice']  = data.price
    const asset = sessions[chatId]['result'] / sessions[chatId]['cryptoPrice']
    sessions[chatId]['totalcrypto']  = asset.toFixed(8)
    const message = `Send ${sessions[chatId]['totalcrypto']} ${sessions[chatId]['cryptoasset']} to our walllet address. \
    \n\nNote: The amount estimated (${sessions[chatId]['totalcrypto']} ${sessions[chatId]['cryptoasset']}) does not include the ${sessions[chatId]['cryptoasset']} \
transaction fee so we expect to receive not less than ${sessions[chatId]['totalcrypto']} ${sessions[chatId]['cryptoasset']}. \
\nTap to copy or Scan the wallet address below 👇🏾`
          bot.sendMessage(chatId, message)
      .then(()=> {
        const message = "Tap to copy 👉: `" + sessions[chatId]['walletAddress'] + "`";
      bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${sessions[chatId]['walletAddress']}`
        bot.sendPhoto(chatId, qrCodeUrl)
        .then(()=> {
          // displayExchanges(chatId,bot, menuChoice)
          confirmTransaction(chatId,bot,menuChoice, sessions)
          userData(chatId, choice, bot, menuChoice, db, sessions)
          savewalletAddress(chatId, db, sessions)
      })
      })

  })
   })
   }else{
    bot.sendMessage(chatId, 'Phone Number confirmed').then(() => {
      const message = "You are receiving " + "₦" + sessions[chatId]['naira'] + "" + "\nTap to copy Transaction ID 👉 :` " + sessions[chatId]['transac_id'] + "`";
      bot.sendMessage(chatId, message, { parse_mode: "Markdown" })
    })
      .then(()=> { 
       const asset = sessions[chatId]['result'] 
       sessions[chatId]['totalcrypto']  = asset.toFixed(3)
       const message = `Send ${sessions[chatId]['totalcrypto']} ${sessions[chatId]['cryptoasset']} to our walllet address. \
       \n\nNote: The amount estimated (${sessions[chatId]['totalcrypto']} ${sessions[chatId]['cryptoasset']}) does not include the ${sessions[chatId]['cryptoasset']} \
transaction fee so we expect to receive not less than ${sessions[chatId]['totalcrypto']} ${sessions[chatId]['cryptoasset']}. \
\nTap to copy or Scan the wallet address below 👇🏾`
             bot.sendMessage(chatId, message)
      .then(()=> {
        const message = "Tap to copy 👉: `" + sessions[chatId]['walletAddress'] + "`";
        bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
          const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${sessions[chatId]['walletAddress']}`
          bot.sendPhoto(chatId, qrCodeUrl)
            .then(() => {
              //    displayExchanges(chatId,bot, menuChoice)
              confirmTransaction(chatId,bot,menuChoice, sessions)
              userData(chatId, choice, bot, menuChoice, db, sessions)
              savewalletAddress(chatId, db, sessions)
      })
      })
      })
   }
}
// this functuion display the confirm and cancel transaction menu
function confirmTransaction(chatId,bot,menuChoice, sessions) {
  const menuOption = [
            '1. Confirm Transaction',
            '2. Cancel Transaction',
            '00. Exit'
          ]
        bot.sendMessage(chatId, `Here is your menu: \n` + menuOption.join('\n'))
    menuChoice[chatId] = 'transferTransaction'  
}

// this function check maybe user already have ethereum and binance  wallet address if no it will be create a new wallet address else get the existing wallet address
function ethereumAndBinanceWallet(chatId, db, sessions) {
   console.log(sessions[chatId]['phone_number'])
        db.query(`SELECT * FROM 2Settle_walletAddress WHERE phone_number = ${sessions[chatId]['phone_number']}`, (err, results) => {
      if (err) {
        console.error('Error querying the database:', err);
        return;
      }
         if (results.length > 0) {
          const raw = results.map((row) => `${row.eth_bnb_wallet}`);
           const stringWallet = raw.toString();
           if (stringWallet !== "null") {
             sessions[chatId]['walletAddress'] = stringWallet
             console.log(sessions[chatId]['walletAddress'])
           } else {
             fetch(`https://hd-wallet-api.vercel.app/ethereumWallet`)
          .then(res => res.json())
         .then(data => {
           if (data) {
        sessions[chatId]['walletAddress']  =  data.address
        sessions[chatId]['private_key'] = data.private_key
            const user = {
              eth_bnb_privateKey: sessions[chatId]['private_key'],
              eth_bnb_wallet: sessions[chatId]['walletAddress']
           };
         db.query(`UPDATE 2Settle_walletAddress SET ? WHERE phone_number = ?`, [user, sessions[chatId]['phone_number']]);
        }else {
                console.log('something is wrong');
          }
           
          }) 
           }
         } else {
           fetch(`https://hd-wallet-api.vercel.app/ethereumWallet`)
          .then(res => res.json())
         .then(data => {
          if (data) {
        sessions[chatId]['walletAddress']  =  data.address
            sessions[chatId]['private_key'] = data.private_key
            console.log(sessions[chatId]['walletAddress'])
        }else {
                console.log('something is wrong');
            }
      }) 
      }
    
    })
}

// this function check maybe user already have tron wallet address if no it will be create a new wallet address else get the existing wallet address
function tronWallet(chatId,db,sessions) {
       db.query(`SELECT * FROM 2Settle_walletAddress WHERE phone_number = ${sessions[chatId]['phone_number']}`, (err, results) => {
      if (err) {
        console.error('Error querying the database:', err);
        return;
      }
         if (results.length > 0) {
           const raw = results.map((row) => `${row.tron_wallet}`);
             const stringWallet = raw.toString();
           if (stringWallet !== "null" ) {
              sessions[chatId]['walletAddress']  = stringWallet
           } else {
              fetch(`https://hd-wallet-api.vercel.app/tronWallet`)
          .then(res => res.json())
         .then(data => {
          if (data) {
        sessions[chatId]['walletAddress']  =  data.address
            sessions[chatId]['private_key'] = data.private_key
             const user = {
              tron_privateKey: sessions[chatId]['private_key'],
              tron_wallet: sessions[chatId]['walletAddress']
           };
         db.query(`UPDATE 2Settle_walletAddress SET ? WHERE phone_number = ?`, [user, sessions[chatId]['phone_number']]);
        }else {
                console.log('something is wrong');
            }
          }) 
           }
         } else {
           fetch(`https://hd-wallet-api.vercel.app/tronWallet`)
          .then(res => res.json())
         .then(data => {
          if (data) {
        sessions[chatId]['walletAddress']  =  data.address
        sessions[chatId]['private_key']  =  data.private_key
        }else {
                console.log('something is wrong');
            }
      }) 
      }
    })
}
// this function check maybe user already have bitcoin wallet address if no it will be create a new wallet address else get the existing wallet address
function bitcoinWallet(chatId,db,sessions) {
        db.query(`SELECT * FROM 2Settle_walletAddress WHERE phone_number = ${sessions[chatId]['phone_number']}`, (err, results) => {
      if (err) {
        console.error('Error querying the database:', err);
        return;
      }
      if (results.length > 0) {
           
           const raw = results.map((row) => `${row.bitcoin_wallet}`);
            const stringWallet = raw.toString();
        if (stringWallet !== "null" && stringWallet !== "") {
              sessions[chatId]['walletAddress']  = stringWallet
           } else {
             fetch(`https://hd-wallet-api.vercel.app/bitcoinWallet`)
          .then(res => res.json())
         .then(data => {
          if (data) {
          sessions[chatId]['walletAddress']  =  data.address
          sessions[chatId]['private_key'] = data.private_key
                const user = {
              bitcoin_privateKey: sessions[chatId]['private_key'],
              bitcoin_wallet: sessions[chatId]['walletAddress']
           };
          db.query(`UPDATE 2Settle_walletAddress SET ? WHERE phone_number = ?`, [user, sessions[chatId]['phone_number']]);
        }else {
                console.log('something is wrong');
            }
         }) 
           }
           sessions[chatId]['cryptoLinks'] = `https://www.blockchain.com/explorer/search?search=${sessions[chatId]['walletAddress']}`
         } else {
           fetch(`https://hd-wallet-api.vercel.app/bitcoinWallet`)
          .then(res => res.json())
         .then(data => {
          if (data) {
        sessions[chatId]['walletAddress']  =  data.address
        sessions[chatId]['private_key']  =  data.private_key
        }else {
                console.log('something is wrong');
            }
         }) 
         sessions[chatId]['cryptoLinks'] = `https://www.blockchain.com/explorer/search?search=${sessions[chatId]['walletAddress']}`
      }
    
    })
}

// this function check what kind of wallet address to display for user
function checkWallet(chatId, db, sessions) {
    console.log(sessions[chatId]['network']);
    if (sessions[chatId]['network'] === 'BTC') {
        console.log('BTC');
        return new Promise((resolve, reject) => {
            try {
                // Perform wallet checking logic here
                bitcoinWallet(chatId, db, sessions);
                
                // If everything is okay, resolve the Promise
                resolve();
            } catch (error) {
                // If there's an error, reject the Promise
                reject(error);
            }
        });
    } else if (sessions[chatId]['network'] === 'ERC20' || sessions[chatId]['network'] === 'BEP20') {
        console.log('Ethereum/Binance');
        return new Promise((resolve, reject) => {
            try {
                // Perform wallet checking logic here
                ethereumAndBinanceWallet(chatId, db, sessions);
                
                // If everything is okay, resolve the Promise
                resolve();
            } catch (error) {
                // If there's an error, reject the Promise
                reject(error);
            }
        });
    } else if (sessions[chatId]['network'] === 'TRC20') {
        console.log('TRON');
        return new Promise((resolve, reject) => {
            try {
                // Perform wallet checking logic here
                tronWallet(chatId, db, sessions);
                
                // If everything is okay, resolve the Promise
                resolve();
            } catch (error) {
                // If there's an error, reject the Promise
                reject(error);
            }
        });
    } else {
        // Handle unsupported networks or cases where the network is not recognized
        console.log('Unsupported network');
        return Promise.reject(new Error('Unsupported network'));
    }
}

// this function display wallet address for naira transfer payment
 function handleDisplayWalletAddressTransferNaira(chatId,choice,bot,menuChoice,db, sessions){
    if (choice.length === 11) {
    const numberWithoutFirstDigit = choice.slice(1);
   sessions[chatId]['phone_number'] = "+234" + numberWithoutFirstDigit;
      const min = 100000; // 6-digit number starting from 100000
      const max = 999999; // 6-digit number up to 999999
      const range = max - min + 1;
     
      sessions[chatId]['dollarConfirm'] = 'naira'
      // Generate a random 6-digit number within the specified range
      sessions[chatId]['transac_id'] = crypto.randomBytes(4).readUInt32LE(0) % range + min

         // Run checkWallet and use .then() to continue processing
        checkWallet(chatId, db, sessions).then(() => {
            // Check if user is not adding charge to estimate
            if (sessions[chatId]['transfer'] === 'minusCharges') {
                // If customer is paying for charges from their estimate
                sessions[chatId]['result'] = sessions[chatId]['amount'] / sessions[chatId]['rate'];
                const dollarAmount = sessions[chatId]['result'] - sessions[chatId]['charges'];
                const nairaValue = dollarAmount * sessions[chatId]['rate'];
                
                sessions[chatId]['naira'] = nairaValue.toLocaleString();
                wallet_address(chatId, choice, bot, menuChoice, db, sessions);
            } else {
                // If customer is not paying charges from their estimate
                const dollarAmount = sessions[chatId]['amount'] / sessions[chatId]['rate'];
                
                sessions[chatId]['result'] = dollarAmount + sessions[chatId]['charges'];
                const nairaValue = Number.parseInt(sessions[chatId]['amount']);
                sessions[chatId]['naira'] = nairaValue.toLocaleString();
                wallet_address(chatId, choice, bot, menuChoice, db, sessions);
            }
        }).catch((error) => {
            console.error('Error checking wallet:', error);
            // Handle error if needed
        });


      }else if(choice === '0'){
       firstThreeLetterOfBank(chatId,  bot)
        menuChoice[chatId] = 'AcctNo'
      }else if(choice === '00'){
        exitMenu (chatId,choice,bot,menuChoice,sessions)
      } else{
        phoneNumberError(chatId, bot)
      }
  startIdleTimer(chatId, choice, bot, menuChoice, sessions)
}

//this function trigger when user choose to confirm or cancel a transaction
async function handleTransferConfirmation(chatId, choice, bot, menuChoice, db, sessions) {
  try {
      if (choice === '1') {
       
        db.query(`SELECT * FROM 2settle_transaction_table WHERE transac_id =  ${sessions[chatId]['transac_id']}`, (err, results) => {
          if (err) {
            console.error('Error querying the database:', err);
            return;
          }
      
          if (results.length > 0) {
            const session = sessions[chatId];
            const result = results[0];
         
            if (result.estimation === 'crypto') {
              session['asset'] = result.crypto
            } else {
              session['asset'] = result.estimation
            }
        
        
                if(sessions[chatId]['verify'] === 'Gift'){
                 const min = 100000; // 6-digit number starting from 100000
                 const max = 999999; // 6-digit number up to 999999
                const range = max - min + 1;
             
              // Generate a random 6-digit number within the specified range
              sessions[chatId]['gift_id'] = crypto.randomBytes(4).readUInt32LE(0) % range + min
  

                  const messagess = "\nTap to copy Gift ID 👉 :` " + sessions[chatId]['gift_id'] + "`";
                  bot.sendMessage(chatId, messagess, { parse_mode: "Markdown" });
                  
                  bot.sendMessage(chatId, 'We are processing your payment. Thank you').then(() => {
                  exitMenu(chatId, choice, bot, menuChoice, sessions);
                 })
  
              
              const user = {
                gift_chatID: sessions[chatId]['gift_id'],
                gift_status: 'Pending'
              }
  
              db.query(`UPDATE 2settle_transaction_table SET ? WHERE transac_id  = ${sessions[chatId]['transac_id']}`, user, (err, result) => {
                if (err) {
                  console.error('Error updating user data:', err);
                  return;
                 }
                })  
                } else {
            session['stringName'] = result.receiver_name.toString();
            session['stringName'] = result.receiver_name.toString() ?? null;
            session['bankNameString'] = result.bank_name.toString() ?? null;
            session['acctNoString'] = result.acct_number.toString() ?? null;
            session['amountString'] = result.Amount.toString() ?? null;
            session['naira'] = result.receiver_amount.toString() ?? null;
            session['totalCharges'] = result.charges.toString() ?? null;
            session['phone_number'] = result.customer_phoneNumber.toString() ?? null;
            session['mode_of_payment'] = result.mode_of_payment.toString() ?? null;
                  

            // const menuOption = [
            //   `Name: ${session['stringName']}`,
            //   `Bank name: ${session['bankNameString']}`,
            //   `Account number: ${session['acctNoString']}`,
            //   `Total Amount: ${session['amountString']} ${session['asset']}`,
            //   `Receiver Amount: ${session['naira']}`,
            //   `Crypto Amount: ${session['totalcrypto']}`,
            //   `Charges: ${session['totalCharges']}`,
            //   `Status: Processing`,
            // ];

            // const reply = `You are receiving ₦${session['naira']}\n` + menuOption.join('\n');
            //  twilioClient.messages.create({
            //   body: reply,
            //   from: '2SettleHQ',
            //   to: session['phone_number']
                  // });
                  
                   bot.sendMessage(chatId, 'We are processing your payment. Thank you').then(() => {
               exitMenu(chatId, choice, bot, menuChoice, sessions);
             })
            }
           
            const user = { status: 'Processing' };
            db.query(`UPDATE 2settle_transaction_table SET ? WHERE transac_id = ?`, [user, session['transac_id']]);
     
          } else {
            
            const message = 'Transaction ID is not valid';
             bot.sendMessage(chatId, message);
            exitMenu(chatId, choice, bot, menuChoice, sessions);
          }
       })
    } else if (choice === '2') {
      await bot.sendMessage(chatId, 'This transaction has been canceled. Thank you.');
       exitMenu(chatId, choice, bot, menuChoice, sessions);

      const user = { status: 'Cancel' };
      await db.query(`UPDATE 2settle_transaction_table SET ? WHERE transac_id = ?`, [user, sessions[chatId]['transac_id']]);

    }else if (choice === '00') {
       exitMenu(chatId, choice, bot, menuChoice, sessions);

    } else {
      const message = 'Enter a valid option provided. Try again \n0. Go back \n00. Exit';
      await bot.sendMessage(chatId, message);
    }
  } catch (error) {
    console.error('Error handling transfer confirmation:', error);
  }
}

module.exports = {
handleNairaAmount,
transferPayment,
handleAcctNo,
handleAcctName,
handlePhoneNumber_transferpayment,
handleDisplayWalletAddressTransferNaira,
handleTransferConfirmation,
startIdleTimer,
exitMenu,
checkWallet,
wallet_address,
phoneNumberError,
firstThreeLetterOfBank,
confirmTransaction,
userData,
savewalletAddress,
estimation,
selectCoin,
enterphoneNumbe
}