const dotenv = require('dotenv');
dotenv.config();
const TelegramBot = require('node-telegram-bot-api');
const telegramToken = process.env.TelegramToken
const bot = new TelegramBot(telegramToken, { polling: true });
const mysql = require('mysql2');
const nairaEst = require('./nairaEst.js')
const paycard = require('./requestforpaycard.js')
const { startIdleTimer, exitMenu, estimation, selectCoin} = require('./nairaEst.js')
const dollarPayment = require('./dollarEst.js')
const cryptoPayment = require('./cryptoEst.js')
const payVendor = require('./payVendor.js')
const report = require('./reportly.js')
const support =  require('./support.js')
const becomeAnAgent = require('./becomeAnAgent.js')
const transactionId = require('./transactionId.js')
 
// const transactNaira = require('./transactNaira.js')
// const addVendor = require('./addVendor.js')
// const makePayment = require('./makePayment.js')
// const phone_number = require('./verifyphoneNumber.js')


// this menuChoice  is an object that help to know the state on a user on the bot 
let menuChoice = {}

 //this sessions is a sessions management object which allow user to have their own data without overwriting anyone else data
let sessions = {}


// setting up mysql database 
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
});



// this function send this message when a user press the /start button on telegram.
bot.onText(/\/start/, (msg) => {
    // chatID is a telegram unique id for users and is unique to telegram user
    const chatId = msg.chat.id;
    //this bot.sendMessage is used to send message to user with their chatID and the message as a parameter.
    bot.sendMessage(chatId, `Welcome to 2SettleHQ!, my name is Wálé, i am 2settle virtual assistance, chat me up with 'hello Wálé'`);
})
  
// this function will be trigger when user send hi/hello/hey to the telegram bot it will display the main menu for the user.
bot.onText(/hello|hi|hey/i, (msg) => {

     //get the user chatid 
    const chatId = msg.chat.id;
   //get user firstname 
    firstName = msg.chat.first_name
    
     //this sessions is an object an we are storing each chatid of every user and assigning an object to it 
       sessions[chatId] = {}
 
    //query from the database to get the  exchange rate price and display it for the user.
    db.query(`SELECT * FROM 2Settle_ExchangeRate`, (err, results) => {
      if (err) {
        console.error('Error querying the database:', err);
        return;
      }
        
        
      const raw = results.map((row) =>  `${row.rate}`);
      const merchant = results.map((row) => row.merchant_rate.toString())
        const profit_rate = results.map((row) => row.profit_rate.toString())

     // storing the profit and merchant rate from db to a sessions management object 
      sessions[chatId]['profit_rate'] =  `₦${profit_rate.toLocaleString()}`
      sessions[chatId]['merchant_rate'] = `₦${merchant.toLocaleString()}`
    
    // the calculation of the 0.8 %  minus the rate 
      const  array_rate = raw.toString()
      const   numRate =  Number(array_rate)
      const percentage = 0.8;
      const increase = (percentage / 100) * numRate;
        const rate = numRate - increase

     // storing the rate and firstName to a sessions management object 
       sessions[chatId]['mainRate'] =  rate.toLocaleString()
       sessions[chatId]['firstName'] = firstName
  
    // query from the database to check maybe user is an agent or an ordinary user.
    db.query('SELECT * FROM 2Settle_agent_table WHERE chat_id = ?', chatId, (err, result) => {
      if (err) {
        console.error('Error querying the database:', err);
        return;
      }
    // if the user is an agent it will display an agent menu  else it will just display user menu
      if (result.length > 0) {
     //   this is an agent menu when the user hi/hello/hey
        const message = `Today Rate: ₦${sessions[chatId]['mainRate']}/$1 \n\nWelcome to 2SettleHQ ${firstName}, how can I help you today?`;
        const menuOptions = [
            [{ text: 'Transact Naira', callback_data: 'transactNaira' },
            { text: 'Transact Crypto', callback_data: 'transactCryptoAgent' }],
            [{ text: 'Transact eNaira', callback_data: 'transactENaira' },
            { text: 'Add a Vendor', callback_data: 'addVendor' }],
            [{ text: 'Transaction ID', callback_data: 'transactID_agent' },
            { text: 'Reportly', callback_data: 'agentreport' }
          ],
        ];
  
        const menuMarkup = {
            reply_markup: {
                inline_keyboard: menuOptions,
            },
        };
  
        bot.sendMessage(chatId, message, menuMarkup);
      }
      else {
          //   this is an user menu when the user hi/hello/hey
        const message = `Today Rate: ₦${sessions[chatId]['mainRate']}/$1 \n\nWelcome to 2SettleHQ ${firstName}, how can I help you today?`;
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
   
});

})
  
// this  is a callback function when a user click the user menu button this function will be trigger
 bot.on('callback_query', (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;
   
  
    // Handle different menu options
    switch (data) {
        case 'transactCrypto':
           const menuOptions = [
            '1. Transfer money',
            '2. Receive cash',
            '3. Pay Vendor',
            '4. Send Gift',
            '5. request for payment',
            '0. Go back',
          ];
          bot.sendMessage(chatId, 'Here is your menu:\n' + menuOptions.join('\n'));
          menuChoice[chatId] = 'cryptoMenu'
         sessions[chatId]['exit'] = '2settleHQ'
            break;
  
            case 'Requestforpaycard':
              const MenuOption = [
             'Bank details',
             'Phone Number',
             'Address'
            ];
           bot.sendMessage(chatId, 'You will be directed to a KYC link, this details are required:\n' + MenuOption.join('\n')) 
           .then(() => {
            const menuOptions = [
                '1. Continue',
                '2. Cancel',
                
              ];
          bot.sendMessage(chatId,  menuOptions.join('\n'));
        })
          menuChoice[chatId] = 'subMenu';    
        
            break 
            case 'Customersupport':
              bot.sendMessage(chatId, `Welcome to Customer Support ${sessions[chatId]['firstName']}`)
                .then(() => {
                  const option = [
                 '1. Make Enquiry',
                 '2. Make Complain',
                 '0. Go back'
                  ]
                   menuChoice[chatId] = 'supportMenu'
                  bot.sendMessage(chatId, 'Here is your menu:\n' + option.join('\n'));
                  sessions[chatId]['exit'] = '2settleHQ'
              });
                break;
                case 'becomeanAgent':
                  bot.sendMessage(chatId, 'Please enter the phone number you use to register on 2settle');        
                  menuChoice[chatId] = 'userphonenumber'     
                  break;

                  case 'transactID':
                    const messages = [
                      '1. Complete your transaction',
                      '2. Claim Gift',
                      '3. Complete payment',
                      '0. Go back',
                    ];
                    bot.sendMessage(chatId, 'Here is your menu:\n' + messages.join('\n'));
                    menuChoice[chatId] = 'general_id'
              sessions[chatId]['exit'] = '2settleHQ'
                break;
                case 'report':
                  const reply = [
                    '1. Track Transaction',
                    '2. Stolen funds | disappear funds',
                    '3. Fraud',
                    '0. Go back',
                  ];
                  bot.sendMessage(chatId, 'Here is your menu:\n' + reply.join('\n'));
                  menuChoice[chatId] = 'report'
                  sessions[chatId]['exit'] = '2settleHQ'
    }
   
 });
  
// this is a callback function when a user click the 2SettleHQ_agent menu button this function will be trigger 
  bot.on('callback_query', (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;
  
    // Handle different menu options
    switch (data) {
        case 'transactNaira':
          const menuOption = [
            '1. Transfer/ Make deposit',
            '2. Withdraw cash with transfer',
            '0. Go back',
          ];
          bot.sendMessage(chatId, 'MENU: Enter option number:\n' + menuOption.join('\n'));
          menuChoice[chatId] = 'nairaMenu'
          sessions[chatId]['exit'] = '2settleHQ_agent'
            break;
        case 'transactCryptoAgent':
          const menuOptions = [
            '1. Transfer money',
            '2. Receive cash',
            '3. Pay Vendor',
            '4. Send Gift',
            '5. request for payment',
            '0. Go back',
          ];
          bot.sendMessage(chatId, 'MENU: Enter option number:\n' + menuOptions.join('\n'));
          menuChoice[chatId] = 'cryptoMenu'
          sessions[chatId]['exit'] = '2settleHQ_agent'
            break;
  
            case 'transactENaira':
             
                const message = `Coming soon!!!`;
                const Option = [
                    [{ text: 'Transact Naira', callback_data: 'transactNaira' },
                    { text: 'Transact Crypto', callback_data: 'transactCrypto' }],
                    [{ text: 'Transact eNaira', callback_data: 'transactENaira' },
                    { text: 'Add a Vendor', callback_data: 'addVendor' }],
                ];
        
                const menuMarkup = {
                    reply_markup: {
                        inline_keyboard: Option,
                    },
                };
        
                bot.sendMessage(chatId, message,menuMarkup);
              
            break;
        // Add more cases for additional options
        case 'addVendor':
          const Options = [
            'Enter vendor name',
            '0. Go back',
          ];
          bot.sendMessage(chatId,  Options.join('\n'));
          menuChoice[chatId] = 'vendorName'
            break;
            case 'transactID_agent':
              const messages = [
                '1. Complete your transaction',
                '2. Claim Gift',
                '3. Carry out payment request',
                '0. Go back',
              ];
              bot.sendMessage(chatId, 'Here is your menu:\n' + messages.join('\n'));
              menuChoice[chatId] = 'general_id'
              sessions[chatId]['exit'] = '2settleHQ_agent'
                break;
                case 'agentreport':
                  const reply =[
                    '1. Track Transaction',
                    '2. Stolen funds | disappear funds',
                    '3. Fraud',
                    '0. Go back',
                  ];
                  bot.sendMessage(chatId, 'Here is your menu:\n' + reply.join('\n'));
                  menuChoice[chatId] = 'report'
                  sessions[chatId]['exit'] = '2settleHQ_agent'
    }
    
  });

// this is a callback function when a user click on the bank name button this function will be trigger
  bot.on('callback_query', (query) => {
      const chatId = query.message.chat.id;
      let data;
      if (sessions[chatId]['verify_bank']) {
          data = query.data;
      }
   
    switch (data) {
      case data: 
        if (data) {
          db.query(`SELECT * FROM 2settle_bank_details WHERE bank_name LIKE '${data}%'`, (err, results) => {
          if (err) {
            console.error('Error querying the database:', err);
            return;
          }

            sessions[chatId]['bankNameString'] = data
          const bank_code = results.map((row) => `${row.bank_code}`);
          sessions[chatId]['bank_code'] = bank_code.toString()
          
          const message =`Enter the account number, you'd like to receive the payment \n` + '0. Go back \n' + '00. Exit'
            bot.sendMessage(chatId, message);
            
              menuChoice[chatId] = 'acctname'
            
           console.log(sessions[chatId]['estimate'])
            
            
             sessions[chatId]['verify_bank'] = false
        })
        }
        break;

    }
  })
  



//this display the  crypto assest user want to pay with,this is second step after user click on transact crypto 
 function handleCrytoMenu(chatId,choice) {
  if(choice === '1' ) {
    sessions[chatId]['verify'] = 'transferMoney'
    selectCoin(chatId, bot)
    menuChoice[chatId] = 'selectnetwork'
   }else if(choice === '2'){
    sessions[chatId]['verify'] = 'cash'
    selectCoin(chatId, bot)
    menuChoice[chatId] = 'selectnetwork'
   } else if(choice === '3'){
    const message = 'Enter the vendor id you are paying' + '\n00. Exit'
    bot.sendMessage(chatId, message)
     sessions[chatId]['verify'] = 'payVendor'
    menuChoice[chatId] = 'vendor_id'
   }else if(choice === '4'){ 
    sessions[chatId]['verify'] = 'Gift'
    selectCoin(chatId, bot)
    menuChoice[chatId] = 'selectnetwork'
   }else if(choice === '5'){
    sessions[chatId]['verify'] = 'request'
    selectCoin(chatId, bot)
    menuChoice[chatId] = 'selectnetwork'
   }
   else if(choice === '0'){ 
    exitMenu (chatId,choice,bot,menuChoice,sessions)
   }else{
    const message = 'Enter a valid options provided. Try again\n' + '0. Go back \n' + '00. Exit'
    bot.sendMessage(chatId, message);
}
startIdleTimer(chatId,choice,bot,menuChoice,sessions) 
} 



// this function handle usdt network  
 function usdtNetwork(chatId,choice) {
  const menuOptions = [
    '1. ERC20',
    '2. TRC20',
    '3. BEP20',
    '0. Go back',
    '00. Exit'
  ];
  bot.sendMessage(chatId, 'select Network:\n' + menuOptions.join('\n'));
  menuChoice[chatId] = 'usdtpayment'
  startIdleTimer(chatId,choice,bot,menuChoice,sessions) 
 }

// this display the options of how user will like to estimate their payment, this is the third step after user click on transact crypto
 function handleSelectNetwork(chatId,choice){
  if(choice === '1'){
    sessions[chatId]['cryptoNetwork'] = 'BTCUSDT'
    sessions[chatId]['cryptoasset']  = 'BTC'
    sessions[chatId]['network'] =  'BTC'
    estimation(chatId,choice,bot,menuChoice,sessions)
  }else if(choice === '2'){
   sessions[chatId]['cryptoNetwork'] = 'ETHUSDT'
   sessions[chatId]['cryptoasset'] = 'ETH'
  sessions[chatId]['network'] =  'ERC20'
    estimation(chatId,choice,bot,menuChoice,sessions)  
  }else if(choice === '3'){
   sessions[chatId]['cryptoNetwork'] = 'BNBUSDT'
    sessions[chatId]['cryptoasset'] = 'BNB'
    sessions[chatId]['network'] = 'BEP20'
    estimation(chatId,choice,bot,menuChoice,sessions)
  }else if(choice === '4'){
     sessions[chatId]['cryptoNetwork'] = 'TRXUSDT'
     sessions[chatId]['cryptoasset'] = 'TRX'
    sessions[chatId]['network'] = 'TRC20'
    estimation(chatId,choice,bot,menuChoice,sessions)
  }else if(choice === '5'){
      sessions[chatId]['cryptoNetwork'] = 'USDT'
    sessions[chatId]['cryptoasset'] = 'USDT'
       usdtNetwork(chatId,choice)
  }else if(choice === '00') {
   exitMenu(chatId,choice,bot,menuChoice,sessions)
   }
  else{
    const message = 'Enter a valid options provided. Try again \n' + '00. Exit'
    bot.sendMessage(chatId, message);
  }
  startIdleTimer(chatId,choice,bot,menuChoice,sessions) 
 }

 

 // this function display the options of how user will like to estimate their payment in usdt,this is the fourth step when user choose usdt after user click on transact crypto 
function handleUsdtCryptos(chatId,choice) { 
  if(choice === '1'){
    sessions[chatId]['network'] =  'ERC20'
    estimation(chatId,choice,bot,menuChoice,sessions)
  }  else if (choice === '2'){
    sessions[chatId]['network'] = 'TRC20'
    estimation(chatId,choice,bot,menuChoice,sessions)
  }else if(choice ==='3'){
    sessions[chatId]['network'] = 'BEP20'
    estimation(chatId,choice,bot,menuChoice,sessions)
  } else if (choice === '0'){
    selectCoin(chatId, bot)
   menuChoice[chatId] = 'selectnetwork'
  }else if (choice === '00'){
  exitMenu (chatId,choice,bot,menuChoice,sessions)
  }
  else{
    const message = 'Enter a valid options provided. Try again \n' + '0. Go back \n' + '00. Exit'
    bot.sendMessage(chatId, message);
    
  }
  startIdleTimer(chatId,choice,bot,menuChoice,sessions) 
}

// this function handle the naira amount user to use to estimate
function naira_currency(chatId) { 
   const message = `Enter the amount you want to send in Naira value \n\n \
NOTE: Maximum payment is 2 million naira and minium payment is 20,000 naira .\
    \n 0. Go back \
    \n 00. Exit`
     bot.sendMessage(chatId, message);
     sessions[chatId]['estimate'] = 'Naira'
      menuChoice[chatId] = 'nairamount'
}

// this function handle the dollar amount user to use to estimate
function dollar_currency(chatId) { 
   db.query(`SELECT * FROM 2Settle_ExchangeRate`, (err, results) => {
        if (err) {
          console.error('Error querying the database:', err);
          return;
        }

        const raw = results.map((row) => `${row.rate}`);
        const array_rate = raw.toString()
        const numRate = Number(array_rate)
        const percentage = 0.8;
        const increase = (percentage / 100) * numRate;
        rate = numRate - increase

        const maximum = 2000000 / rate
        const minium = 20000 / rate
   
        sessions[chatId]['numMax'] = Number.parseInt(maximum)
        sessions[chatId]['numMin'] = Number.parseInt(minium)
        sessions[chatId]['max'] = sessions[chatId]['numMax'].toLocaleString()
        sessions[chatId]['min'] = sessions[chatId]['numMin'].toLocaleString()

        const message = `Enter the amount you want to send in Dollar value  \n\n \
NOTE: Maximum payment is $${sessions[chatId]['max']} and minium payment is $${sessions[chatId]['min']}. \
      \n 0. Go back \
     \n 00. Exit`
        bot.sendMessage(chatId, message);
        sessions[chatId]['estimate'] = 'Dollar'
        menuChoice[chatId] = 'dollaramount'
    
      })
}

// this function handle the crypto amount user to use to estimate
function crypto_currency(chatId) { 
 db.query(`SELECT * FROM 2Settle_ExchangeRate`, (err, results) => {
        if (err) {
          console.error('Error querying the database:', err);
          return;
        }

          
      const raw = results.map((row) =>  `${row.rate}`);
      const  array_rate = raw.toString()
      const   numRate =  Number(array_rate)
      const percentage = 0.8;
      const increase = (percentage / 100) * numRate;
      sessions[chatId]['rate'] =  numRate - increase

      const maximum = 2000000 / sessions[chatId]['rate']
      const minium = 20000 / sessions[chatId]['rate']
       
        if (sessions[chatId]['cryptoNetwork'] !== 'USDT') {
          fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${sessions[chatId]['cryptoNetwork']}`)
          
            .then(res => res.json())
            .then(data => {
              sessions[chatId]['cryptoPrice'] = data.price
                console.log(data.price)
              const maxs = maximum / sessions[chatId]['cryptoPrice']
              const mins = minium / sessions[chatId]['cryptoPrice']

              const numberMax = maxs.toFixed(4)
              const numberMin = mins.toFixed(4)
              sessions[chatId]['max'] = Number(numberMax)
              sessions[chatId]['min'] = Number(numberMin)
              

              const message = `Enter the amount you want to send in crypto value \n\n \
NOTE: maximum payment is ${sessions[chatId]['max']} ${sessions[chatId]['cryptoasset']} and minium payment is ${sessions[chatId]['min']} ${sessions[chatId]['cryptoasset']}.\
     \n 0. Go back \
     \n 00. Exit`
              bot.sendMessage(chatId, message);
              sessions[chatId]['estimate'] = 'crypto'
              menuChoice[chatId] = 'cryptoamount'
            })
        } else {
           sessions[chatId]['numMax'] = Number.parseInt(maximum)
           sessions[chatId]['numMin'] = Number.parseInt(minium)
          sessions[chatId]['max'] = sessions[chatId]['numMax'].toLocaleString()
          sessions[chatId]['min'] = sessions[chatId]['numMin'].toLocaleString()

          const message = `Enter the amount you want to send in crypto value \n\n \
NOTE: maximum payment is $${sessions[chatId]['max']} ${sessions[chatId]['cryptoasset']} and minium payment is $${sessions[chatId]['min']} ${sessions[chatId]['cryptoasset']}.\
     \n 0. Go back \
     \n 00. Exit`
              bot.sendMessage(chatId, message);
              sessions[chatId]['estimate'] = 'crypto'
              menuChoice[chatId] = 'cryptoamount'
        }
          })

}

// This function tell user to input the amount they want to use for estimation.
function handleSelectCurrency(chatId, choice) { 
  
  sessions[chatId]['minusCharges'] = 'Charge from the amount'
  sessions[chatId]['addCharges'] = 'Add charges to the amount'

    if(choice === '1'){
    naira_currency(chatId)
    } else if (choice === '2') {   
   dollar_currency(chatId)
    } else if (choice === '3') {
     crypto_currency(chatId)
    }else if(choice === '00'){
      exitMenu (chatId,choice,bot,menuChoice,sessions)
    }
    else{
      const message = 'Enter a valid options provided. Try again \n' + '00. Exit'
      bot.sendMessage(chatId, message);
    }
    startIdleTimer(chatId,choice,bot,menuChoice,sessions) 
}


// this is function trigger everytime someone chat 2settle bot, which use menuchoice to know the state of the user and trigger a function 
bot.onText(/^(?!\/start\b)(?!hi$)(?!hey$)(?!hello$)(?!wale$)[a-z0-9\s!@#$%^&*()-_=+[\]{}|;:'",.<>/?]+$/i, (msg) => {
    const chatId = msg.chat.id;
    const messageText = msg.text;
    const firstName = msg.chat.first_name
  sessions[chatId]['firstName'] = firstName

     if (menuChoice[chatId] === 'subMenu') {
      paycard.handleSubMenu(chatId, messageText,bot,menuChoice,sessions);
    }else if (menuChoice[chatId] === 'exitMenu') {
      paycard.completingRequestPaycard(chatId, messageText,bot,menuChoice,sessions);
     }else if (menuChoice[chatId] === 'cryptoMenu') {
      handleCrytoMenu(chatId, messageText);
    }else if (menuChoice[chatId] === 'selectnetwork') {
      handleSelectNetwork(chatId, messageText);
    }else if (menuChoice[chatId] === 'usdtpayment') {
      handleUsdtCryptos(chatId, messageText);
    }else if (menuChoice[chatId] === 'Selectcurrency') {
      handleSelectCurrency(chatId, messageText);
    }
      else if (menuChoice[chatId] === 'general_id') {
      transactionId.handleId(chatId, messageText,bot,menuChoice,sessions);
     } else if (menuChoice[chatId] === 'TransactID') {
      transactionId.transact_id(chatId, messageText,bot,menuChoice,db,sessions);
     }

     else if (menuChoice[chatId] === 'TransactID') {
      transact_id(chatId, messageText);
    } else if (menuChoice[chatId] === 'general_id') {
        handleId(chatId, messageText)
    }else if (menuChoice[chatId] === 'GiftID') {
      gift_id(chatId, messageText)
  } else if (menuChoice[chatId] === 'RequestID') {
    request_id(chatId, messageText)
  } else if (menuChoice[chatId] === 'requestConfirmation') {
    requestConfirmation(chatId, messageText)
  } else if (menuChoice[chatId] === 'settleMenu') {
    settleMenu(chatId, messageText)
  } else if (menuChoice[chatId] === 'supportMenu') {
   support.handleCustomerSupport(chatId, messageText,bot,menuChoice,sessions)
  } else if (menuChoice[chatId] === 'complain') {
    support.handleComplain(chatId, messageText,bot,menuChoice,db,sessions,firstName);
  }  else if (menuChoice[chatId] === 'explanation') {
     support.handleExplanation(chatId, messageText,bot,menuChoice,db,sessions,firstName);
  }   
  
  else if (menuChoice[chatId] === 'userphonenumber') {
      becomeAnAgent.handlerPhoneNumber(chatId, messageText,bot,menuChoice,db,sessions,firstName);
    }else  if (menuChoice[chatId] === 'enterotp') {
        becomeAnAgent.handleOtp(chatId, messageText,bot,db,sessions,firstName);
     }
       
       
     else if (menuChoice[chatId] === 'nairamount') {
      nairaEst.handleNairaAmount (chatId, messageText,bot,menuChoice,db,sessions);
    }else if (menuChoice[chatId] === 'selectnetwork') {
      nairaEst.handleSelectNetwork (chatId, messageText,bot,menuChoice,db,sessions);
    }else if (menuChoice[chatId] === 'cryptopayment') {
      nairaEst.handleCryptos(chatId, messageText,bot,menuChoice,sessions);
     }else if (menuChoice[chatId] === 'AcctNo') {
      nairaEst.handleAcctNo(chatId, messageText,bot,menuChoice,db,sessions);;
     }else if (menuChoice[chatId] === 'acctname') {
      nairaEst.handleAcctName(chatId, messageText,bot,menuChoice,sessions);
    }else if (menuChoice[chatId] === 'Unavailable') {
      nairaEst.handleDisplayWalletAddressTransferNaira(chatId, messageText,bot,menuChoice,db,sessions);
    }else if (menuChoice[chatId] === 'cashPayment') {
      nairaEst.cashPayment(chatId, messageText,bot,menuChoice,sessions);
    }else if (menuChoice[chatId] === 'transferPayment') {
      nairaEst.transferPayment(chatId, messageText,bot,menuChoice,db,sessions);
    }else if (menuChoice[chatId] === 'minusCharges') {
      nairaEst.minusCharges(chatId, messageText,bot,menuChoice,db,sessions);
    }else if (menuChoice[chatId] === 'addCharges') {
      nairaEst.addCharges(chatId, messageText,bot,menuChoice,db,sessions);
    }else if (menuChoice[chatId] === 'phoneNumber_Transfer') {
      nairaEst.handlePhoneNumber_transferpayment(chatId, messageText,bot,menuChoice,db,sessions);
    }else if (menuChoice[chatId] === 'cashTransaction') {
      nairaEst.handleCashConfirmation(chatId, messageText,bot,menuChoice,db,sessions);
    }else if (menuChoice[chatId] === 'transferTransaction') {
      nairaEst.handleTransferConfirmation(chatId, messageText,bot,menuChoice,db,sessions);
    }else if (menuChoice[chatId] === 'GiftUnavailable') {
      nairaEst.GiftUnavailable(chatId, messageText,bot,menuChoice,db,sessions);
    }else if (menuChoice[chatId] === 'requestUnavailable') {
      nairaEst.requestUnavailable(chatId, messageText,bot,menuChoice,db,sessions);
    }else if (menuChoice[chatId] === 'EvidenceOfTransfer') {
      nairaEst.handleEvidenceOfTransfer(chatId, messageText,bot,menuChoice,db,sessions);
    }else if (menuChoice[chatId] === 'enterexchanges') {
      nairaEst.enterExchanges(chatId, messageText,bot,menuChoice,db,sessions);
    }else if (menuChoice[chatId] === 'enterAddress') {
      nairaEst.enterAddress(chatId, messageText,bot,menuChoice,db,sessions);
    }else if (menuChoice[chatId] === 'handleImageExit') {
      nairaEst.handleImageExit(chatId, messageText,bot,menuChoice,db,sessions);
    }
    
    
    
    else if (menuChoice[chatId] === 'dollaramount') {
      dollarPayment.handleDollarAmount(chatId, messageText,bot,menuChoice,db,sessions);
    }else if (menuChoice[chatId] === 'dollarAcctNo') {
      dollarPayment.handleDollarAcctNo(chatId, messageText,bot,menuChoice,db,sessions);
    }else if (menuChoice[chatId] === 'dollaracctname') {
      dollarPayment.handlDollareAcctName(chatId, messageText,bot,menuChoice,sessions);
    }else if (menuChoice[chatId] === 'dollarUnavailable') {
      dollarPayment.handleDisplayWalletAddressTransferDollar(chatId, messageText,bot,menuChoice,db,sessions);
    }else if (menuChoice[chatId] === 'dollarcashPayment') {
      dollarPayment.dollarcashPayment(chatId, messageText,bot,menuChoice,db,sessions);
    }else if (menuChoice[chatId] === 'dollarAddCharges') {
      dollarPayment.dollarAddCharges(chatId, messageText,bot,menuChoice,db,sessions);
    }else if (menuChoice[chatId] === 'dollarMinusCharges') {
      dollarPayment.dollarMinusCharges(chatId, messageText,bot,menuChoice,db,sessions);
    }else if (menuChoice[chatId] === 'dollartransferPayment') {
      dollarPayment.dollartransferPayment(chatId, messageText,bot,menuChoice,db,sessions);
    }else if (menuChoice[chatId] === 'handleDollarPhoneNumber') {
      dollarPayment.handleDollarPhoneNumber(chatId, messageText,bot,menuChoice,sessions);
    }else if (menuChoice[chatId] === 'dollarcashTransaction') {
      dollarPayment.handleDollarCashConfirmation(chatId, messageText,bot,menuChoice,db,sessions);
    }else if (menuChoice[chatId] === 'dollartransferTransaction') {
      dollarPayment.handleDollarTransferConfirmation(chatId, messageText,bot,menuChoice,db,sessions);
    }else if (menuChoice[chatId] === 'dollarRequestUnavailable') {
      dollarPayment.dollarRequestUnavailable(chatId, messageText,bot,menuChoice,db,sessions);
    }
    

    else if (menuChoice[chatId] === 'cryptoamount') {
      cryptoPayment.handleCryptoAmount(chatId, messageText,bot,menuChoice,db,sessions);
    }else if (menuChoice[chatId] === 'cryptoAcctNo') {
      cryptoPayment.handleCryptoAcctNo(chatId, messageText,bot,menuChoice,db,sessions);
    }else if (menuChoice[chatId] === 'cryptoacctname') {
      cryptoPayment.handleCryptoAcctName(chatId, messageText,bot,menuChoice,sessions);
    }else if (menuChoice[chatId] === 'cryptoUnavailable') {
      cryptoPayment.handleDisplayWalletAddressTransferCrypto(chatId, messageText,bot,menuChoice,db,sessions);
    }else if (menuChoice[chatId] === 'cryptocashPayment') {
      cryptoPayment.cryptocashPayment(chatId, messageText,bot,menuChoice,db,sessions);
    }else if (menuChoice[chatId] === 'cryptoMinusCharges') {
      cryptoPayment.cryptoMinusCharges(chatId, messageText,bot,menuChoice,db,sessions);
    }else if (menuChoice[chatId] === 'cryptoAddCharges') {
      cryptoPayment.cryptoAddCharges(chatId, messageText,bot,menuChoice,db,sessions);
    }else if (menuChoice[chatId] === 'cryptotransferPayment') {
      cryptoPayment.cryptotransferPayment(chatId, messageText,bot,menuChoice,db,sessions);
    }else if (menuChoice[chatId] === 'handleCryptoPhoneNumber') {
      cryptoPayment.handleCryptoPhoneNumber(chatId, messageText,bot,menuChoice,sessions);
    }else if (menuChoice[chatId] === 'cryptocashTransaction') {
      cryptoPayment.handleCryptoCashConfirmation(chatId, messageText,bot,menuChoice,db,sessions);
    }else if (menuChoice[chatId] === 'cryptoransferTransaction') {
      cryptoPayment.handleCryptoTransferConfirmation(chatId, messageText,bot,menuChoice,db,sessions);
    }else if (menuChoice[chatId] === 'handleCryptoRequestUnavailable') {
      cryptoPayment.handleCryptoRequestUnavailable(chatId, messageText,bot,menuChoice,db,sessions);
    }


    
    else if (menuChoice[chatId] === 'nairaMenu') {
      transactNaira.handleNairaMenu(chatId, messageText,bot,menuChoice,db,sessions);
    }else if (menuChoice[chatId] === 'amount') {
      transactNaira.handleAmount(chatId, messageText,bot,menuChoice,sessions);
    }else if (menuChoice[chatId] === 'nairaAcctNo') {
      transactNaira.handleNairaAcctNo(chatId, messageText,bot,menuChoice,sessions);
    }else if (menuChoice[chatId] === 'nairaAcctName') {
      transactNaira.handleNairaAcctName(chatId, messageText,bot,menuChoice,sessions);
    }else if (menuChoice[chatId] === 'handlephoneNumber') {
      transactNaira.handlePhoneNumber(chatId, messageText,bot,menuChoice,sessions);
    }else if (menuChoice[chatId] === 'verifyPhoneNumber') {
      transactNaira.handleUserPhoneNumber(chatId, messageText,bot,menuChoice,db,sessions);
    }else if (menuChoice[chatId] === 'transferAmount') {
      transactNaira.hanleTransferAmount(chatId, messageText,bot,menuChoice,db,sessions);
    }else if (menuChoice[chatId] === 'continueTransfer') {
      transactNaira.transactNaira_phoneNumber(chatId, messageText,bot,menuChoice,db,sessions);
    }else if (menuChoice[chatId] === 'NairaMinusCharges') {
      transactNaira.handleNairaMinusCharges(chatId, messageText,bot,menuChoice,db,sessions);
    }else if (menuChoice[chatId] === 'NairaAddCharges') {
      transactNaira.handleNairaAddCharges(chatId, messageText,bot,menuChoice,db,sessions);
    }else if (menuChoice[chatId] === 'AddChargesConfirmation') {
      transactNaira.handleAddChargesConfirmation(chatId, messageText,bot,menuChoice,db,sessions);
    }else if (menuChoice[chatId] === 'MinusChargesConfirmation') {
      transactNaira.handleMinusChargesConfirmation(chatId, messageText,bot,menuChoice,db,sessions);
    }
    
    else if (menuChoice[chatId] === 'vendorName') {
      addVendor.vendorName(chatId, messageText,bot,menuChoice,sessions);
    } else if (menuChoice[chatId] === 'vendorAcctNum') {
      addVendor.vendorAcctNum(chatId, messageText,bot,menuChoice,sessions);
    }else if (menuChoice[chatId] === 'vendorAcctName') {
      addVendor.vendorAcctName(chatId, messageText,bot,menuChoice,sessions);
    }else if (menuChoice[chatId] === 'vendorjob') {
      addVendor.vendorJob(chatId, messageText,bot,menuChoice,sessions);
    }else if (menuChoice[chatId] === 'entervendorjob') {
      addVendor.enterVendorJob(chatId, messageText,bot,menuChoice,sessions);
    }else if (menuChoice[chatId] === 'enterphoneNumber') {
      addVendor.VendorPhoneNumber(chatId, messageText,bot,menuChoice,db,sessions);
    }else if (menuChoice[chatId] === 'vendorEnterotp') {
      addVendor.handleOtp(chatId, messageText,bot,menuChoice,db,sessions);
    } else if (menuChoice[chatId] === 'usercountrylocation') {
      addVendor.handleCountryLocations(chatId, messageText,bot,menuChoice,db,sessions);
    }else if (menuChoice[chatId] === 'userselectedCountry') {
      addVendor.handleSelectCountry(chatId, messageText,bot,menuChoice,db,sessions);
    } else if (menuChoice[chatId] === 'userstatelocation') {
      addVendor.handleStateLocation(chatId, messageText,bot,menuChoice,db,sessions);
    } else if (menuChoice[chatId] === 'userselectedstate') {
      addVendor.handleSelectState(chatId, messageText,bot,menuChoice,db,sessions);
    } else if (menuChoice[chatId] === 'usercitylocation') {
      addVendor.handleCityLocation(chatId, messageText,bot,menuChoice,db,sessions);
    } else if (menuChoice[chatId] === 'userselectedcity') {
      addVendor.handleSelectCity(chatId, messageText,bot,menuChoice,db,sessions);
    } else if (menuChoice[chatId] === 'inputArea') {
      addVendor.inputArea(chatId, messageText,bot,menuChoice,db,sessions);
    } else if (menuChoice[chatId] === 'userlandmark') {
      addVendor.handleLandmark(chatId, messageText,bot,menuChoice,db,sessions);
    }else if (menuChoice[chatId] === 'enterVendorId') {
      addVendor.enterVendorId(chatId, messageText,bot,menuChoice,db,sessions);
    }
   
    else if (menuChoice[chatId] === 'vendor_id') {
      payVendor.displayvendorAcct(chatId, messageText,bot,menuChoice,db,sessions);
     }  else if (menuChoice[chatId] === 'continuePayment') {
      payVendor.displaycrypto(chatId, messageText,bot,menuChoice,db,sessions);
     }  else if (menuChoice[chatId] === 'payVendor') {
      payVendor.displayPhone_number(chatId, messageText,bot,menuChoice,db,sessions);
     } 
       
    else if (menuChoice[chatId] === 'report') {
      report.report(chatId, messageText,bot,menuChoice,sessions);
    } else if (menuChoice[chatId] === 'report_name') {
      report.report_phoneNumber(chatId, messageText,bot,menuChoice,sessions);
    } else if (menuChoice[chatId] === 'report_phoneNumber') {
      report.report_walletAddress(chatId, messageText,bot,menuChoice,sessions);
    }else if (menuChoice[chatId] === 'report_address') {
      report.report_fraudster_walletAddress(chatId, messageText,bot,menuChoice,sessions);
    }else if (menuChoice[chatId] === 'report_fraudster') {
      report.report_note(chatId, messageText,bot,menuChoice,sessions);
    }else if (menuChoice[chatId] === 'enter_note') {
      report.report_enterNote(chatId, messageText,bot,menuChoice,db,sessions);
     }
     
    
});

