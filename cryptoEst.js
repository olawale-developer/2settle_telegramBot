const crypto = require('crypto');
const {
exitMenu,
userData,
firstThreeLetterOfBank,
phoneNumberError,
confirmTransaction,
savewalletAddress,
startIdleTimer,
estimation,
checkWallet
} = require('./nairaEst.js')

// this function calculate the amount in dollar and display the charges
function handleCryptoAmount(chatId, choice, bot, menuChoice, db, sessions) {
  sessions[chatId]['numbersOnly'] = choice.replace(/[^0-9.]/g, '');
  const parsedValue = parseFloat(sessions[chatId]['numbersOnly']);
  if (!isNaN(parsedValue)) {

       if(sessions[chatId]['cryptoNetwork']  !== 'USDT'){
           if(sessions[chatId]['numbersOnly'] <= sessions[chatId]['max'] && sessions[chatId]['numbersOnly'] >= sessions[chatId]['min']){
            sessions[chatId]['amount'] = sessions[chatId]['numbersOnly'];
            const nairaValues   =  Number(sessions[chatId]['amount'])
            sessions[chatId]['amountString']   =   sessions[chatId]['amount']
            
            const dollarValue =   sessions[chatId]['amount'] * sessions[chatId]['cryptoPrice']
            const naira =  dollarValue * sessions[chatId]['rate']
             if(naira <= 100000){
             sessions[chatId]['transactionFee'] = 500
            }else if(naira <= 1000000){
           sessions[chatId]['transactionFee'] = 1000
           }else if(naira <= 2000000){
            sessions[chatId]['transactionFee'] = 1500
            }
             
                const dollarTrasacFee = sessions[chatId]['transactionFee'] / sessions[chatId]['rate']
                const dollarAmount = sessions[chatId]['amount'] * sessions[chatId]['cryptoPrice']
                
                 sessions[chatId]['charges'] = dollarTrasacFee 
                  const nairaValue = sessions[chatId]['charges']  * sessions[chatId]['rate'];
                  const assets = nairaValue.toFixed(2)
                 const asset = sessions[chatId]['charges']  / sessions[chatId]['cryptoPrice'];
                  sessions[chatId]['totalcrypto'] = asset.toFixed(5)
                  sessions[chatId]['totalCharges'] =`${sessions[chatId]['totalcrypto']} ${sessions[chatId]['cryptoasset']} = ₦${assets}`

                       const menuOptions = [
                         `Charge:  ${sessions[chatId]['totalcrypto']} ${sessions[chatId]['cryptoasset']} = ₦${assets} \n`,
                          `1. ${sessions[chatId]['minusCharges']}`,
                          `2. ${sessions[chatId]['addCharges']}`,
                          '0. Go back',
                          '00. Exit',
                       ];
                       bot.sendMessage(chatId, 'Here is your menu:\n' + menuOptions.join('\n'))
                   
                       if(sessions[chatId]['verify'] === 'payVendor'){
                       menuChoice[chatId] = 'payVendor'
                      }else if(sessions[chatId]['verify'] === 'transferMoney'){
                        menuChoice[chatId] = 'transferPayment'
                      } else if(sessions[chatId]['verify'] === 'cash'){
                        menuChoice[chatId] = 'cryptocashPayment'
                      }else if(sessions[chatId]['verify'] === 'Gift'){
                        menuChoice[chatId] = 'cryptocashPayment'
                      }else if(sessions[chatId]['verify'] === 'request'){
                        menuChoice[chatId] = 'transferPayment'
                      }
              
            }else if (choice === '0'){
              estimation(chatId,choice,bot,menuChoice,sessions)
             }else if (choice === '00'){
             exitMenu (chatId,choice,bot,menuChoice,sessions)
             }else{

              const message = `maximum payment is ${sessions[chatId]['max']} ${sessions[chatId]['cryptoasset']} and minium payment is ${sessions[chatId]['min']} ${sessions[chatId]['cryptoasset']}\
              \n 0. Go back \
              \n 00. Exit'`
              bot.sendMessage(chatId, message);
            }
  
      

       } else {
        if(sessions[chatId]['numbersOnly'] <= sessions[chatId]['numMax']  && sessions[chatId]['numbersOnly'] >= sessions[chatId]['numMin']){
          sessions[chatId]['amount'] = sessions[chatId]['numbersOnly'];
          const nairaValue   =  Number(sessions[chatId]['amount'])
        sessions[chatId]['amountString']   =  nairaValue.toLocaleString()
          const naira =  sessions[chatId]['amount'] * sessions[chatId]['rate']
            
          if(naira <= 100000){
            sessions[chatId]['transactionFee'] = 500
          }else if(naira <= 1000000){
            sessions[chatId]['transactionFee'] = 1000
          }else if(naira <= 2000000){
            sessions[chatId]['transactionFee'] = 1500
          }
          sessions[chatId]['charges']  = sessions[chatId]['transactionFee'] / sessions[chatId]['rate']
          const assets = sessions[chatId]['charges']  * sessions[chatId]['rate'];
           sessions[chatId]['nairaValues']  = assets.toFixed(2)
           const asset = sessions[chatId]['charges']
          sessions[chatId]['totalcrypto'] = asset.toFixed(5)
          sessions[chatId]['totalCharges'] =`${sessions[chatId]['totalcrypto']} ${sessions[chatId]['cryptoasset']} = ₦${sessions[chatId]['nairaValues'] }`
            
            const menuOptions = [
              `Charges:  ${sessions[chatId]['totalcrypto']} ${sessions[chatId]['cryptoasset']} = ₦${sessions[chatId]['nairaValues'] } \n`,
              `1. ${sessions[chatId]['minusCharges']}`,
              `2. ${sessions[chatId]['addCharges']}`,
              '0. Go back',
              '00. Exit',
            ];
            bot.sendMessage(chatId, 'Here is your menu:\n' + menuOptions.join('\n'))
         
               

            if(sessions[chatId]['verify'] === 'makePayment'){
              menuChoice[chatId] = 'cryptomakePayment'
            }else if(sessions[chatId]['verify'] === 'transferMoney'){
              menuChoice[chatId] = 'transferPayment'
            } else if(sessions[chatId]['verify'] === 'cash'){
              menuChoice[chatId] = 'cryptocashPayment'
            }else if(sessions[chatId]['verify'] === 'request'){
              menuChoice[chatId] = 'transferPayment'
            }else if(sessions[chatId]['verify'] === 'Gift'){
              menuChoice[chatId] = 'cryptocashPayment'
            }
            
          }else if (choice === '0'){
            estimation(chatId,choice,bot,menuChoice,sessions)
          
           }else if (choice === '00'){
           exitMenu (chatId,choice,bot,menuChoice,sessions)
           } else{
            const message = `maximum payment is $${sessions[chatId]['max']} ${sessions[chatId]['cryptoasset']} and minium payment is $${sessions[chatId]['min']} ${sessions[chatId]['cryptoasset']}\
            \n 0. Go back \
            \n 00. Exit'`
            bot.sendMessage(chatId, message);
          }
      }     
  }
  else{
    const message = 'please simply input the numeric amount you wish to transfer. \
    \n 0. Go back \
    \n 00. Exit'
  bot.sendMessage(chatId, message);
  }
 startIdleTimer(chatId,choice,bot,menuChoice,sessions)
}

// this function handle amount in naira and the transaction id for crypto estimation
function displayAmountAndTrxId(chatId,bot,sessions) {
    const message = "You are receiving ₦" + sessions[chatId]['naira'] + "\nTap to copy Transaction ID 👉 :` " + sessions[chatId]['transac_id'] + "`";
  bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
}
  
// this function handle crypto estimation wallet address and the qrcode 
function cryptoWallet_address(chatId, choice, bot, menuChoice, db, sessions) { 
   const message = `Send ${sessions[chatId]['totalcrypto']} ${sessions[chatId]['cryptoasset']} to our walllet address. \
      \n\nNote: The amount estimated (${sessions[chatId]['totalcrypto']} ${sessions[chatId]['cryptoasset']}) does not include the ${sessions[chatId]['cryptoasset']} \
transaction fee so we expect to receive not less than ${sessions[chatId]['totalcrypto']} ${sessions[chatId]['cryptoasset']}. \
\nScan the wallet address below 👇🏾`
            bot.sendMessage(chatId, message)
        .then(()=> {
          const message = "Tap to copy 👉: `" + sessions[chatId]['walletAddress'] + "`";
          bot.sendMessage(chatId, message, { parse_mode: "MarkdownV2" });
            const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${sessions[chatId]['walletAddress']}`
            bot.sendPhoto(chatId, qrCodeUrl)
          .then(()=> {
          confirmTransaction(chatId,bot,menuChoice, sessions)
          userData(chatId, choice, bot, menuChoice, db, sessions)
          savewalletAddress(chatId, db, sessions) 
        })
        })
}

// this function display wallet address for crypto transfer payment
function handleDisplayWalletAddressTransferCrypto(chatId,choice,bot,menuChoice,db, sessions){
    const min = 100000; // 6-digit number starting from 100000
    const max = 999999; // 6-digit number up to 999999
   const range = max - min + 1;

 // Generate a random 6-digit number within the specified range
 sessions[chatId]['transac_id'] = crypto.randomBytes(4).readUInt32LE(0) % range + min

       if (choice.length === 11) {
    const numberWithoutFirstDigit = choice.slice(1);
         sessions[chatId]['phone_number'] = "+234" + numberWithoutFirstDigit;
         

         checkWallet(chatId, db, sessions).then(() => {
           if (sessions[chatId]['transfer'] === 'minusCharges') {
             if (sessions[chatId]['cryptoNetwork'] !== 'USDT') {
               const dollarAmount = sessions[chatId]['amount'] * sessions[chatId]['cryptoPrice']
               const result = dollarAmount - sessions[chatId]['charges']
               const nairaValue = result * sessions[chatId]['rate']
               sessions[chatId]['naira'] = nairaValue.toLocaleString()
               bot.sendMessage(chatId, 'Phone Number confirmed').then(() => {
                 displayAmountAndTrxId(chatId, bot, sessions)
               })
                 .then(() => {
                   const asset = dollarAmount / sessions[chatId]['cryptoPrice']
                   sessions[chatId]['totalcrypto'] = asset.toFixed(8)
                   cryptoWallet_address(chatId, choice, bot, menuChoice, db, sessions)
                 })
             } else {
               const naira = sessions[chatId]['amount'] * sessions[chatId]['rate']
               if (naira <= 100000) {
                 sessions[chatId]['transactionFee'] = 500
               } else if (naira <= 1000000) {
                 sessions[chatId]['transactionFee'] = 1000
               } else if (naira <= 2000000) {
                 sessions[chatId]['transactionFee'] = 1500
               }

               const dollarTrasacFee = sessions[chatId]['transactionFee'] / sessions[chatId]['rate']
               const dollarAmount = sessions[chatId]['amount']
               const percentage = 0.8
               const increase = (percentage / 100) * dollarAmount
               const charges = dollarTrasacFee + increase
               const result = dollarAmount - charges
               const nairaValue = result * sessions[chatId]['rate']
               sessions[chatId]['naira'] = nairaValue.toLocaleString()
               bot.sendMessage(chatId, 'Phone Number confirmed').then(() => {
                 displayAmountAndTrxId(chatId, bot, sessions)

               })
                 .then(() => {
                   sessions[chatId]['totalcrypto'] = dollarAmount
                   cryptoWallet_address(chatId, choice, bot, menuChoice, db, sessions)
                 })
             }

           } else if (sessions[chatId]['transfer'] === 'addCharges') {
             if (sessions[chatId]['cryptoNetwork'] !== 'USDT') {
    
               const dollarAmount = sessions[chatId]['amount'] * sessions[chatId]['cryptoPrice']
               const result = dollarAmount + sessions[chatId]['charges']
               const nairaValue = dollarAmount * sessions[chatId]['rate']
               sessions[chatId]['naira'] = nairaValue.toLocaleString()
  
               bot.sendMessage(chatId, 'Phone Number confirmed').then(() => {
                 displayAmountAndTrxId(chatId, bot, sessions)
               })
                 .then(() => {
                   const asset = result / sessions[chatId]['cryptoPrice']
                   sessions[chatId]['totalcrypto'] = asset.toFixed(8)
                   cryptoWallet_address(chatId, choice, bot, menuChoice, db, sessions)
                 })
             } else {
               const naira = sessions[chatId]['amount'] * sessions[chatId]['rate']
  
               if (naira <= 100000) {
                 sessions[chatId]['transactionFee'] = 500
               } else if (naira <= 1000000) {
                 sessions[chatId]['transactionFee'] = 1000
               } else if (naira <= 2000000) {
                 sessions[chatId]['transactionFee'] = 1500
               }
               const dollarTrasacFee = sessions[chatId]['transactionFee'] / sessions[chatId]['rate']
               const dollarAmount = Number(sessions[chatId]['amount'])
               const percentage = 0.8
               let increase = (percentage / 100) * dollarAmount
               const charges = dollarTrasacFee + increase
               const result = dollarAmount + charges
               const nairaValue = dollarAmount * sessions[chatId]['rate']
               sessions[chatId]['naira'] = nairaValue.toLocaleString()
  
               bot.sendMessage(chatId, 'Phone Number confirmed').then(() => {
                 displayAmountAndTrxId(chatId, bot, sessions)
               })
                 .then(() => {
  
                   const asset = result
                   sessions[chatId]['totalcrypto'] = asset.toFixed(3)
                   cryptoWallet_address(chatId, choice, bot, menuChoice, db, sessions)
  
                 })
             }
           }
         })
    }else if(choice === '0'){
      firstThreeLetterOfBank(chatId,  bot)
      menuChoice[chatId] = 'cryptoAcctNo'
    }else if(choice === '00'){
      exitMenu (chatId,choice,bot,menuChoice,sessions)
    }else{
      phoneNumberError(chatId, bot)
    }
    nairapayment.startIdleTimer(chatId,choice,bot,menuChoice,sessions)

  
  }



module.exports = {
    handleCryptoAmount,
    handleDisplayWalletAddressTransferCrypto
}