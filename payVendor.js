const {
    exitMenu,
    selectCoin,
    enterphoneNumbe
} = require('./nairaEst.js')

function displayvendorAcct(chatId, choice, bot, menuChoice, db, sessions) { 
   
    if (choice.length === 6)  {
        // Use a parameterized query to prevent SQL injection
        db.query('SELECT * FROM 2settle_vendor WHERE vendor_id = ?', [choice], (err, data) => {
            if (err) {
                console.error('Error querying the database:', err);
                return;
            }

            if (data.length > 0) {
                const result = data[0];
                sessions[chatId]['stringName'] = result.vendor_acctName.toString();
                sessions[chatId]['bankNameString'] = result.vendor_bankName.toString();
                sessions[chatId]['acctNoString'] = result.vendor_acctNum.toString();
                sessions[chatId]['phone_number'] = result.vendor_phoneNumber.toString();
                sessions[chatId]['agent_id'] = result.agent_id.toString();

                const reply = `Name: ${sessions[chatId]['stringName']} \n Bank name: ${sessions[chatId]['bankNameString']}\n Account number: ${sessions[chatId]['acctNoString']}`;
                bot.sendMessage(chatId, reply)
                    .then(() => {
                        const menuOptions = [
                            '1. Continue',
                            '0. Go back',
                            '00. Exit'
                        ];
                        bot.sendMessage(chatId, 'Here is your menu: \n' + menuOptions.join('\n'));
                    });
                menuChoice[chatId] = 'continuePayment';
            } else {
                const message = 'Vendor ID not found.';
                bot.sendMessage(chatId, message)
                    .then(() => {
                        exitMenu(chatId, choice, bot, menuChoice, sessions);
                    });
            }
        });
    } else if (choice === '00') {
        exitMenu(chatId, choice, bot, menuChoice, sessions);
    } else {
        const message = 'Invalid vendor ID';
        bot.sendMessage(chatId, message)
            .then(() => {
                exitMenu(chatId, choice, bot, menuChoice, sessions);
            });
    }
}

function displaycrypto(chatId, choice, bot, menuChoice, db, sessions) {
    if (choice === '1') {
        selectCoin(chatId,bot)
         menuChoice[chatId] = 'selectnetwork'
    } else if(choice === '0') {
     const message = 'Enter the vendor id you are paying' + '\n00. Exit'
     bot.sendMessage(chatId, message)
     sessions[chatId]['verify'] = 'payVendor'
    }else if(choice === '00') {
    exitMenu(chatId, choice, bot, menuChoice, sessions);
    }
}

function handlevendorPhone_number(chatId,  bot, menuChoice,  sessions) {
      enterphoneNumbe(chatId, bot)
        if (sessions[chatId]['estimate'] === 'Naira') {
         menuChoice[chatId] = 'Unavailable'
      }else if (sessions[chatId]['estimate'] === 'Dollar'){
         menuChoice[chatId] = 'dollarUnavailable'
      }else if (sessions[chatId]['estimate'] === 'crypto'){
         menuChoice[chatId] = 'cryptoUnavailable'
      }
}

function displayPhone_number(chatId, choice, bot, menuChoice, db, sessions){
    if (choice === '1') {
        sessions[chatId]['transfer'] = 'minusCharges'
       handlevendorPhone_number(chatId,  bot, menuChoice,  sessions)  
    } else if (choice === '2') {
         sessions[chatId]['transfer'] = 'addCharges'
        handlevendorPhone_number(chatId,  bot, menuChoice,  sessions)
    } else if(choice === '0'){
        estimation(chatId,choice,bot,menuChoice,sessions)
    } else if (choice === '00') {
         exitMenu(chatId, choice, bot, menuChoice, sessions);
    } else {
    const message = 'Enter a valid options provided. Try again\n' + '0. Go back \n' + '00. Exit'
    bot.sendMessage(chatId, message);

    }
}



module.exports = {
    displayvendorAcct,
    displaycrypto,
    displayPhone_number
}