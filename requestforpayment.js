
function displayRequestAmountAndTrxId(chatId,bot,sessions) {
  const message = "You would receive the equvilent of " + sessions[chatId]['totalcrypto'] + " " + sessions[chatId]['cryptoasset'] + " in Naira which is ₦" + sessions[chatId]['naira'] + " \
\n\nTap to copy this Request ID 👉 :` " + sessions[chatId]['transac_id'] + "` " + " and send it to the person sending you \
" + sessions[chatId]['totalcrypto'] + " " + sessions[chatId]['cryptoasset']
         bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
}


