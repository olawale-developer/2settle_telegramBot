 // this function is exit menu for request for paycard
function exitMenuForPaycard(chatId,bot,sessions) {
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
}


// this function will display vendor link to a user to register 
function handleSubMenu(chatId,choice,bot,menuChoice,sessions){
    if(choice === '1'){
       const link = `click this link: https://vendor.2settle.io`
       bot.sendMessage(chatId, link)
       .then(() => {
           const menuOptions = [
               '1. Completed',
               '2. Exit' 
             ];
         bot.sendMessage(chatId, 'Here is your menu:\n' + menuOptions.join('\n'));
         menuChoice[chatId] = 'exitMenu'
       });
     }else if(choice === '2'){
        bot.sendMessage(chatId, `Will you like to do something else?`)
       .then(() => {
        exitMenuForPaycard(chatId,bot,sessions)
    });
     
     }else{
           const message = 'enter a valid options provided. Try again'
           bot.sendMessage(chatId, message);
         }
     //  nairaPayment.startIdleTimer(chatId,choice,bot,menuChoice,sessions)

}

// this function is last step for completing paycard request
function completingRequestPaycard(chatId,choice,bot,menuChoice,sessions){
  if(choice === '1'){
    bot.sendMessage(chatId, `Thank you for completing the process to your selected menu. will you like to do something else?`)
       .then(() => {
        exitMenuForPaycard(chatId,bot,sessions)
    });
     menuChoice[chatId] = '';
   }else if(choice === '2'){
    bot.sendMessage(chatId, `will you like to do something else?`)
    .then(() => {
      exitMenuForPaycard(chatId,bot,sessions)
 });
  menuChoice[chatId] = '';
}else{
 const message = 'enter a valid options provided. Try again'
 bot.sendMessage(chatId, message);
}
// nairaPayment.startIdleTimer(chatId,choice,bot,menuChoice,sessions)
} 

module.exports = {
    exitMenuForPaycard,
    handleSubMenu,
    completingRequestPaycard
}