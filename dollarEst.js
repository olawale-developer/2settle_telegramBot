const crypto = require('crypto');
const {
exitMenu,
wallet_address,
firstThreeLetterOfBank,
checkWallet,
phoneNumberError,
startIdleTimer,
estimation
} = require('./nairaEst.js')



// this function calculate the amount in dollar and display the charges
function handleDollarAmount(chatId, choice, bot, menuChoice, db, sessions) {
  sessions[chatId]['numbersOnly'] = choice.replace(/[^0-9.]/g, '');
  const parsedValue = parseFloat(sessions[chatId]['numbersOnly']);
  if (!isNaN(parsedValue)) {

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
      
   
        
      if(sessions[chatId]['numbersOnly'] <= sessions[chatId]['numMax'] && sessions[chatId]['numbersOnly'] >= sessions[chatId]['numMin']){
        sessions[chatId]['amount'] = sessions[chatId]['numbersOnly'];
        const nairaValue   =  Number(sessions[chatId]['amount'])
        sessions[chatId]['amountString']   =  nairaValue.toLocaleString()
        const less100 = 100000 /    sessions[chatId]['rate']
      const less1million = 1000000 /    sessions[chatId]['rate']
      const less2million = 2000000 /  sessions[chatId]['rate']
    
       if(sessions[chatId]['amount'] <= less100){
        sessions[chatId]['transactionFee']  = 500
       }else if(sessions[chatId]['amount'] <= less1million){
       sessions[chatId]['transactionFee']  = 1000
      }else if(sessions[chatId]['amount'] <= less2million){
       sessions[chatId]['transactionFee']  = 1500
      }
  
          sessions[chatId]['charges'] = sessions[chatId]['transactionFee'] / sessions[chatId]['rate'];
          const dollarAmount = sessions[chatId]['amount'];
         
          
          sessions[chatId]['assets']  = sessions[chatId]['charges'].toFixed(2);
          
          if(sessions[chatId]['cryptoNetwork'] !== 'USDT' ){
         fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${sessions[chatId]['cryptoNetwork']}`)
            .then((res) => res.json())
            .then((data) => {
              sessions[chatId]['cryptoPrice'] = data.price;
              const asset = sessions[chatId]['charges']  / sessions[chatId]['cryptoPrice'];
              sessions[chatId]['totalcrypto'] = asset.toFixed(5);
              
              sessions[chatId]['totalCharges'] =`${sessions[chatId]['totalcrypto']} ${sessions[chatId]['cryptoasset']} = $${sessions[chatId]['assets']}`
              // Fix this section to display the menu
              const menuOptions = [
                `Charge:  ${sessions[chatId]['totalcrypto']} ${sessions[chatId]['cryptoasset']} = $${sessions[chatId]['assets']} \n`,
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
            sessions[chatId]['totalcrypto'] = asset.toFixed(2);

            sessions[chatId]['totalCharges'] =`${sessions[chatId]['totalcrypto']} ${sessions[chatId]['cryptoasset']} = $${sessions[chatId]['assets']}`

            const menuOptions = [
              `Charges:  ${sessions[chatId]['totalcrypto']} ${sessions[chatId]['cryptoasset']} = $${sessions[chatId]['assets']} \n`,
              `1. ${sessions[chatId]['minusCharges']}`,
              `2. ${sessions[chatId]['addCharges']}`,
              '0. Go back',
              '00. Exit',
            ];
            bot.sendMessage(chatId, 'Here is your menu:\n' + menuOptions.join('\n'));
          }
        
  

    
        if(sessions[chatId]['verify'] === 'makePayment'){
          menuChoice[chatId] = 'dollarmakePayment'
        }
        else if (sessions[chatId]['verify'] === 'transferMoney') {
          menuChoice[chatId] = 'transferPayment'
        }else if(sessions[chatId]['verify'] === 'cash'){
          menuChoice[chatId] = 'dollarcashPayment'
        }else if(sessions[chatId]['verify'] === 'Gift'){
          menuChoice[chatId] = 'dollarcashPayment'
        }else if(sessions[chatId]['verify'] === 'request'){
          menuChoice[chatId] = 'transferPayment'
        }else if(sessions[chatId]['verify'] === 'payVendor'){
          menuChoice[chatId] = 'payVendor'
        }
      
        }else if (choice === '0'){
          estimation(chatId,choice,bot,menuChoice,sessions)
         }else if (choice === '00'){
          exitMenu(chatId,choice,bot,menuChoice,sessions)
         } else{
          const message = `maximum payment is $${sessions[chatId]['max']} and minium payment is $${sessions[chatId]['min']}. Re-enter your amount \
          \n 0. Go back \
          \n 00. Exit `
          bot.sendMessage(chatId, message);
        }
  }) 
}
startIdleTimer(chatId,choice,bot,menuChoice,sessions)
}



// this function display wallet address for dollar transfer payment
function handleDisplayWalletAddressTransferDollar(chatId,choice,bot,menuChoice,db,sessions){
 if (choice.length === 11) {
    const numberWithoutFirstDigit = choice.slice(1);
   sessions[chatId]['phone_number'] = "+234" + numberWithoutFirstDigit; 

     console.log('this is working fine............')

     
   
    const min = 100000; // 6-digit number starting from 100000
    const max = 999999; // 6-digit number up to 999999
    const range = max - min + 1;

    sessions[chatId]['dollarConfirm'] = 'dollar'
 // Generate a random 6-digit number within the specified range
   sessions[chatId]['transac_id'] = crypto.randomBytes(4).readUInt32LE(0) % range + min
   

       checkWallet(chatId, db, sessions).then(() => {
    if (sessions[chatId]['transfer'] === 'minusCharges') {    
      sessions[chatId]['result'] =  Number(sessions[chatId]['amount'])
      const dollarAmount =  sessions[chatId]['result'] -  sessions[chatId]['charges']
     const nairaValue = dollarAmount * sessions[chatId]['rate']
      sessions[chatId]['naira'] = nairaValue.toLocaleString()
     wallet_address(chatId,choice,bot,menuChoice,db, sessions)
    }else{
      const dollarAmount = Number(sessions[chatId]['amount'])
      sessions[chatId]['result'] = dollarAmount +  sessions[chatId]['charges']
      const nairaValue = dollarAmount * sessions[chatId]['rate']
     sessions[chatId]['naira']  =  nairaValue.toLocaleString()
     wallet_address(chatId,choice,bot,menuChoice,db, sessions)
    }
 }).catch((error) => {
    console.error('Error checking wallet:', error);
         // Handle error if needed
 });
     
  }else if(choice === '0'){
  firstThreeLetterOfBank(chatId,  bot)
   menuChoice[chatId] = 'dollarAcctNo'
  }else if(choice === '00'){
    exitMenu (chatId,choice,bot,menuChoice,sessions)
  } else{
    phoneNumberError(chatId, bot)
  }
 startIdleTimer(chatId,choice,bot,menuChoice,sessions)
}

module.exports = {
    handleDollarAmount,
    handleDisplayWalletAddressTransferDollar
}