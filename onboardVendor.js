const dotenv = require('dotenv');
const twilio = require('twilio');
const crypto = require('crypto');
dotenv.config();
const nairapayment = require('./nairapayment.js')
const {exitMenu} = require('./makePayment.js')

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioClient = twilio(accountSid, authToken);


 
function vendorName(chatId,choice,bot,menuChoice, sessions){
    if(choice === '0') {
    exitMenu(chatId,choice,bot,menuChoice,sessions)
   }
  else{
    sessions[chatId]['name'] = choice
    const message = 'Enter vendor Account number \n' + '0. Go back \n' + '00. Exit'
    bot.sendMessage(chatId, message)
      menuChoice[chatId] = 'vendorAcctNum' 
         sessions[chatId]['verifyvendor'] = 'verifyvendor'
  }
  nairapayment.startIdleTimer(chatId,choice,bot,menuChoice,sessions)
}

function vendorAcctNum(chatId,choice,bot,menuChoice, sessions){
    if(choice.length === 10 && Number(choice)){
        sessions[chatId]['acct_no']  = choice
        fetch(`https://app.nuban.com.ng/possible-banks/NUBAN-WBODZCTK1831?acc_no=${sessions[chatId]['acct_no']}`)
        .then(res => res.json())
        .then(data => {
         const banks = data.map((row) => `${row.bank_code}. ${row.name}`)
         const reply = 'select  your bank by using the numbers:\n' + `${banks.join('\n')} \n` + '0. Go back \n' + '00. Exit'
         bot.sendMessage(chatId, reply)
       }).catch(error => console.log(error))
        menuChoice[chatId] = 'vendorAcctName'
       } else if(choice === '0') {
        const menuOptions = [
          'Enter vendor name',
          '0. Go back',
        ];
        bot.sendMessage(chatId, menuOptions.join('\n'));
        menuChoice[chatId] = 'vendorName'
      }else if(choice === '00') {
        exitMenu(chatId,choice,bot,menuChoice,sessions)
       }
       else{
        const message = 'Enter a valid account number. Try again \n'+ '0. Go back \n' + '00. Exit'
        bot.sendMessage(chatId, message)
      }
      nairapayment.startIdleTimer(chatId,choice,bot,menuChoice,sessions)

}


function vendorAcctName(chatId,choice,bot,menuChoice, sessions){
    if(choice.length === 3 && Number(choice)){
        fetch(`https://app.nuban.com.ng/api/NUBAN-WBODZCTK1831?bank_code=${choice}&acc_no=${sessions[chatId]['acct_no']}`)
        .then(res => res.json())
        .then(data => {
          if(data.error !== true){
          const name = data.map((row) => `${row.account_name}`)
          const bankName= data.map((row) => `${row.bank_name}`)
          const acctNo = data.map((row) => `${row.account_number}`)
          
          sessions[chatId]['stringName'] = name.toString()
          sessions[chatId]['bankNameString'] = bankName.toString()
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
        menuChoice[chatId] = 'vendorjob'
      }else{
         const message = data.message
         bot.sendMessage(chatId, message)
         .then(() => {
          const message = 'Enter vendor Account number\n' + '0. Go back \n' + '00. Exit'
          bot.sendMessage(chatId, message)
          menuChoice[chatId] = 'vendorAcctNum' 
           
         })
      }
        })
      }else if(choice === '0') {
        const message = 'Enter vendor Account number\n' + '0. Go back \n' + '00. Exit'
    bot.sendMessage(chatId, message)
    menuChoice[chatId] = 'vendorAcctNum' 
      }else if(choice === '00') {
        exitMenu(chatId,choice,bot,menuChoice,sessions)
       }else{
        const message = 'Enter a valid options provided. Try again \n' + '0. Go back \n' + '00. Exit'
        bot.sendMessage(chatId, message);
      }
      nairapayment.startIdleTimer(chatId,choice,bot,menuChoice,sessions)

}

function vendorJob(chatId,choice,bot,menuChoice, sessions){
    if(choice === '1'){
        const message = 'Enter vendor job \n' + '0. Go back \n' + '00. Exit'
        bot.sendMessage(chatId, message)
        menuChoice[chatId] = 'entervendorjob'
    }else if(choice === '0') {
      const message = 'Enter vendor Account number\n' + '0. Go back \n' + '00. Exit'
  bot.sendMessage(chatId, message)
  menuChoice[chatId] = 'vendorAcctNum' 
    }else if(choice === '00') {
      exitMenu(chatId,choice,bot,menuChoice,sessions)
     }else{
      const message = 'Enter a valid options provided. Try again \n' + '0. Go back \n' + '00. Exit'
      bot.sendMessage(chatId, message);
    }
    nairapayment.startIdleTimer(chatId,choice,bot,menuChoice,sessions)

}



  
  
  
  
  
  function enterVendorJob(chatId,choice,bot,menuChoice, sessions){
     if(choice === '0') {
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
     menuChoice[chatId] = 'vendorjob'
    }else if(choice === '00') {
      exitMenu(chatId,choice,bot,menuChoice,sessions)
     }else{
      sessions[chatId]['vendorJob'] = choice
      const message = 'Please share Customer phone number in this format e.g +2348011223344.\n' + '0. Go back \n' + '00. Exit'
      bot.sendMessage(chatId, message)
      menuChoice[chatId] = 'enterphoneNumber' 
    }
    nairapayment.startIdleTimer(chatId,choice,bot,menuChoice,sessions)
  }     
  


function VendorPhoneNumber(chatId,choice,bot,menuChoice,db,sessions){
 
  const regex = /^\+\d{1,3}\d{4,14}$/;


  const min = 100000; // 6-digit number starting from 100000
 const max = 999999; // 6-digit number up to 999999
 const range = max - min + 1;

 // Generate a random 6-digit number within the specified range
  sessions[chatId]['randomNumber'] = crypto.randomBytes(4).readUInt32LE(0) % range + min
  console.log(sessions[chatId]['randomNumber'])
  if (regex.test(choice)) {
    sessions[chatId]['phone_number'] = choice.replace(/\+2340(\d+)/, '+234$1');
        const message = `Your 2SettleHQ verification code: ${sessions[chatId]['randomNumber']}`
          twilioClient.messages.create({
            body: message,
            from: '2SettleHQ',
            to: sessions[chatId]['phone_number'] 
          })
          .catch(error => console.error(error))
          .then(()=> {
            const message = `Enter the verification code that was sent to this ${sessions[chatId]['phone_number']}.\n` + '0. Go back \n' + '00. Exit'
            bot.sendMessage(chatId, message);
          })
          menuChoice[chatId] = 'vendorEnterotp';  
      
  } else if(choice === '0') {
    const message = 'Enter vendor job \n' + '0. Go back \n' + '00. Exit'
    bot.sendMessage(chatId, message)
    menuChoice[chatId] = 'entervendorjob'
  }else if(choice === '00') {
    exitMenu(chatId,choice,bot,menuChoice,sessions)
   }else {
    const message = 'please enter valid Phone Number, in this format e.g +2348011223344.\n' + '0. Go back \n' + '00. Exit'
    bot.sendMessage(chatId, message)
  }
  nairapayment.startIdleTimer(chatId,choice,bot,menuChoice,sessions)

}

function handleOtp(chatId,choice,bot,menuChoice,db,sessions){
  if(choice == sessions[chatId]['randomNumber']){
    const message = 'Phone Number confirmed'
    bot.sendMessage(chatId, message)
    .then(() => {
      const message = 'Enter the first three letters of your country. \n'  + '0. Go back \n' + '00. Exit'
      bot.sendMessage(chatId, message);
      menuChoice[chatId] = 'usercountrylocation';
    })
  }else if(choice === '0'){
    const message = 'Please share Customer phone number in this format e.g +2348011223344.\n' + '0. Go back \n' + '00. Exit'
    bot.sendMessage(chatId, message)
    menuChoice[chatId] = 'enterphoneNumber' 
  }else if(choice === '00'){
   exitMenu(chatId,choice,bot,menuChoice,sessions)
  }else{
   const message = 'Enter valid verification code. try again \n' + '0. Go back \n' + '00. Exit'
   bot.sendMessage(chatId, message)
  }
  nairapayment.startIdleTimer(chatId,choice,bot,menuChoice,sessions)

}


  
  function handleCountryLocations(chatId,choice,bot,menuChoice,db,sessions){
    const regex = /^.{1,3}/; // Matches the characters from position 1 to 3
  
    if(choice === '0'){
      const message = 'Please share Customer phone number in this format e.g +2348011223344.\n' + '0. Go back \n' + '00. Exit'
      bot.sendMessage(chatId, message)
      menuChoice[chatId] = 'enterphoneNumber' 
    }else if(choice === '00'){
     exitMenu(chatId,choice,bot,menuChoice,sessions)
    }else{
    const matches = choice.match(regex);
    const extracted = matches[0];
      db.query(`SELECT * FROM country WHERE name LIKE '${extracted}%'`, (err, results) => {
        if (err) {
          console.error('Error querying the database:', err);
          return;
        }
      
        const countries = results.map((row) =>  `${row.country_id}. ${row.name}`);
          
        // Check if any countries were found
        if (countries.length > 0) {
          const reply = 'Select the number of your country from options below:\n' + `${countries.join('\n')} \n` + '0. Go back' ;
           bot.sendMessage(chatId, reply);
          menuChoice[chatId] = "userselectedCountry"
        } else {
          bot.sendMessage(chatId, 'No countries found. \n' + '0. Go back \n' + '00. Exit')
          menuChoice[chatId] = 'userstatelocation'
        }
      })
    }
    nairapayment.startIdleTimer(chatId,choice,bot,menuChoice,sessions)

    
      }
    
  
      function handleSelectCountry(chatId,choice,bot,menuChoice,db,sessions){
        if(choice === '0'){
           const message = 'Enter the first three letters of your country. \n'  + '0. Go back \n' + '00. Exit'
          bot.sendMessage(chatId, message);
          menuChoice[chatId] = 'usercountrylocation';  
     
        } else if(Number(choice)){
              sessions[chatId]['selectedCountry']  = choice
    
              db.query(`SELECT * FROM country WHERE country_id = ${sessions[chatId]['selectedCountry']}`, (err, results) => {
                if (err) {
                  console.error('Error querying the database:', err);
                  return;
                }
                const country = results.map((row) =>  `${row.name}`);
                
           
                 if (country.length > 0) {
                  sessions[chatId]['country'] = country.toString();
  
                const message = `which state in ${sessions[chatId]['country']}, Enter the first three letters of the state. \n` + '0. Go back \n' + '00. Exit'
                 bot.sendMessage(chatId, message);
                 menuChoice[chatId] = 'userstatelocation'
                } else {
                  bot.sendMessage(chatId, 'No countries found. \n' + '0. Go back \n' + '00. Exit')
                  menuChoice[chatId] = 'userstatelocation'; 
                }
                 
                  })
                
  
          }else if(!Number(choice)){
            const message = 'please choose a valid Number'
             bot.sendMessage(chatId, message);
          }
          nairapayment.startIdleTimer(chatId,choice,bot,menuChoice,sessions)

      }
    
    
    function handleStateLocation(chatId,choice,bot,menuChoice,db,sessions){
      const regex = /^.{1,3}/; // Matches the characters from position 1 to 3
  
      if(choice === '0'){
      const message = 'Enter the first three letters of your country. \n'  + '0. Go back \n' + '00. Exit'
     bot.sendMessage(chatId, message);
     menuChoice[chatId] = 'usercountrylocation';  
      }else if(choice === '00'){
       exitMenu(chatId,choice,bot,menuChoice,sessions)
      }else{
     const matches = choice.match(regex);
      const extracted = matches[0];
      db.query(`SELECT * FROM states WHERE country_id = ${sessions[chatId]['selectedCountry']} AND name LIKE '${extracted}%'`, (err, results) => {
        if (err) {
          console.error('Error querying the database:', err);
          return;
        }
        const states = results.map((row) =>  `${row.states_id}. ${row.name}`);
    
            // Check if any states were found
            if (states.length > 0) {
            
              const reply = 'Select the number of your state from the options below:\n' + `${states.join('\n')} \n`  + '0. Go back \n' + '00. Exit'
               bot.sendMessage(chatId, reply);
              menuChoice[chatId]= 'userselectedstate'
            } else {
              bot.sendMessage(chatId, 'No states found.\n' + '0. Go back \n' + '00. Exit')
              menuChoice[chatId] = 'usercitylocation'
            }
    
      })
    }
    nairapayment.startIdleTimer(chatId,choice,bot,menuChoice,sessions)

    }
      
    function handleSelectState(chatId,choice,bot,menuChoice,db,sessions){
      if(choice === '0'){
        const message = `which state in ${sessions[chatId]['country']}, Enter the first three letters of the state. \n` + '0. Go back \n' + '00. Exit'
        bot.sendMessage(chatId, message);
        menuChoice[chatId] = 'userstatelocation'
      }else if(choice === '00'){
        exitMenu(chatId,choice,bot,menuChoice,sessions)
       }else if(Number(choice)){
          sessions[chatId]['selectedstate']   = choice
          
           db.query(`SELECT * FROM states WHERE states_id = ${sessions[chatId]['selectedstate']}`, (err, results) => {
            if (err) {
              console.error('Error querying the database:', err);
              return;
            }
            const state = results.map((row) =>  `${row.name}`);
      
            if (state.length > 0) {
              sessions[chatId]['state']= state.toString();
             
              const message = `which area in ${sessions[chatId]['state']}, Enter the first three letter of the area. \n` + '0. Go back \n' + '00. Exit'
              bot.sendMessage(chatId, message);
              menuChoice[chatId] = 'usercitylocation'
            } else {
              bot.sendMessage(chatId, 'No state found.\n' + '0. Go back \n' + '00. Exit');
              menuChoice[chatId] = 'usercitylocation'
            }
  
  
          })
       
    
           
        }else if(!Number(choice)){
          const message = 'please choose a valid Number'
           bot.sendMessage(chatId, message);
        }
        nairapayment.startIdleTimer(chatId,choice,bot,menuChoice,sessions)

    }
    
    
    function handleCityLocation(chatId,choice,bot,menuChoice,db,sessions){
      const regex = /^.{1,3}/; // Matches the characters from position 1 to 3
      if(choice === '0'){
        const message = `which state in ${sessions[chatId]['country']}, Enter the first three letters of the state. \n` + '0. Go back \n' + '00. Exit'
        bot.sendMessage(chatId, message);
        menuChoice[chatId] = 'userstatelocation'
      }else if(choice === '00'){
        exitMenu(chatId,choice,bot,menuChoice,sessions)
      }else{
      const matches = choice.match(regex);
      const extracted = matches[0];
      db.query(`SELECT * FROM cities WHERE state_id = ${sessions[chatId]['selectedstate']} AND name LIKE '${extracted}%'`, (err, results) => {
        if (err) {
          console.error('Error querying the database:', err);
          return;
        }
       
        const cities = results.map((row) =>  `${row.cities_id}. ${row.name}` );
    
            // Check if any states were found
            if (cities.length > 0) {
              const reply = 'Select the number of your area from the options below:\n' + `${cities.join('\n')} \n` + '0. Others' + '00. Exit';
               bot.sendMessage(chatId, reply);
              menuChoice[chatId] = 'userselectedcity'
            } else {
              bot.sendMessage(chatId, 'No Area found. But you can insert your Area.');
            menuChoice[chatId] = 'inputArea'
            }
    
      })
      }
      nairapayment.startIdleTimer(chatId,choice,bot,menuChoice,sessions)

    }
  
    
  
  function handleSelectCity(chatId,choice,bot,menuChoice,db,sessions){
    if(choice === '0'){
      const message = `Enter your area in ${sessions[chatId]['state']}`
      bot.sendMessage(chatId, message);
      menuChoice[chatId] = 'inputArea'
    }else if(choice === '00'){
      exitMenu(chatId,choice,bot,menuChoice,sessions)
     } else if(Number(choice)){
        db.query(`SELECT * FROM cities WHERE cities_id = ${choice}`, (err, results) => {
          if (err) {
            console.error('Error querying the database:', err);
            return;
          }
          const city = results.map((row) =>  `${row.name}`);
          
          if (city.length > 0) {
            sessions[chatId]['city'] = city.toString();
            const message = `Which area in ${sessions[chatId]['city']} ? \n`+ '0. Go back \n' + '00. Exit';
           bot.sendMessage(chatId, message);
           menuChoice[chatId] = 'userlandmark'
          } else {
            bot.sendMessage(chatId, 'No Area found. But you can insert your Area.');
            menuChoice[chatId] = 'inputArea'
          }
  
        });
      
    }else if(!Number(choice)){
      const message = 'please choose a valid Number'
       bot.sendMessage(chatId, message);
    }
    nairapayment.startIdleTimer(chatId,choice,bot,menuChoice,sessions)

  }
  
  function inputArea(chatId,choice,bot,menuChoice,db,sessions){
    sessions[chatId]['city'] = choice;
    const message = `Which area in ${sessions[chatId]['city']} ? \n`+ '0. Go back \n' + '00. Exit';
    bot.sendMessage(chatId, message);
    menuChoice[chatId] = 'userlandmark'
  }
  
  


function handleLandmark(chatId, choice, bot, menuChoice, db, sessions) {
    if (choice === '0') {
        const message = `Which area in ${sessions[chatId]['state']}? Enter the first three letters of the area.\n0. Go back\n00. Exit`;
        bot.sendMessage(chatId, message);
        menuChoice[chatId] = 'usercitylocation';
    } else if (choice === '00') {
        exitMenu(chatId, choice, bot, menuChoice, sessions);
    } else {
      // Fetch wallet addresses and store them in sessions
        sessions[chatId]['landmark'] = choice
         const message = 'Enter the vendor ID'
        bot.sendMessage(chatId, message)
        menuChoice[chatId] = 'enterVendorId'
        nairapayment.startIdleTimer(chatId, choice, bot, menuChoice, sessions);
    }
}


function enterVendorId(chatId, choice, bot, menuChoice, db, sessions) {
  db.query("SELECT * FROM 2settle_vendor WHERE vendor_id = ?", [choice], (err, results) => { 
      if (err) {
        console.error('Error querying the database:', err);
        return;
      }
    if (results.length > 0) { 
      sessions[chatId]['vendorID'] = choice
      fetchAgent_id(chatId, db, sessions)
        .then(() => {
          vendordata(chatId, choice, bot, menuChoice, db, sessions)
        })
    }
  })  
}

function vendordata(chatId, choice, bot, menuChoice, db, sessions) {

const user = {
vendor_name: sessions[chatId]['name'],
vendor_job: sessions[chatId]['vendorJob'],
vendor_acctNum: sessions[chatId]['acctNoString'],
vendor_acctName: sessions[chatId]['stringName'],
vendor_country: sessions[chatId]['country'],
vendor_state: sessions[chatId]['state'],
vendor_city: sessions[chatId]['city'],
vendor_landmark:  sessions[chatId]['landmark'],
vendor_bankName: sessions[chatId]['bankNameString'],
agent_id:  sessions[chatId]['agent_id'],
vendor_phoneNumber: sessions[chatId]['phone_number']
};
                // Insert user into the database
db.query('UPDATE 2settle_vendor SET ? WHERE series_id = ?', [user,  sessions[chatId]['vendorID']], (err, result) => {
  if (err) {
  console.error('Error storing user data in the database:', err);
    return;
  }
    const message = 'Thank you for onboarding a vendor';
    bot.sendMessage(chatId, message).then(() => {
     exitMenu(chatId, choice, bot, menuChoice, sessions);
});
});
}

async function fetchAgent_id(chatId, db, sessions)  {
    try {
        db.query("SELECT * FROM 2Settle_agent_table WHERE chat_id = ?", [chatId], (err, results) => { 
      if (err) {
        console.error('Error querying the database:', err);
        return;
      }
          if (results.length > 0) { 
        const result = results[0];
       sessions[chatId]['agent_id'] = result.agent_id.toString();
    }
  }) 
    } catch (err) {
        console.error('Error fetching agent_id:', err);
        throw err;
    }
}




module.exports = {
    vendorName,
    vendorAcctNum,
    vendorAcctName,
    vendorJob,
    enterVendorJob,
    handleCountryLocations,
    handleSelectCountry,
    handleStateLocation,
    handleSelectState,
    handleCityLocation,
    handleSelectCity,
    inputArea,
    handleLandmark,
    VendorPhoneNumber,
     handleOtp,
    enterVendorId
}



