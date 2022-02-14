const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);
cronJob = require('cron').CronJob;


async function sendScheduledSms(number, date, smsBody) {

  // send the SMS
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
  const message = await client.messages.create({
    from: messagingServiceSid,
    to: number,  //user phone number here
    body: smsBody,
    scheduleType: 'fixed',
    sendAt: date,
  });

  console.log(message.sid);
}

async function sendReminder(min,hour, medicine, number) {
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
    let textJob = new cronJob( `${min} ${hour} * * *`, function(){
        client.messages.create( {
            to:number,
            from:messagingServiceSid,
            body:'Hello! Its Medication time eat ' + medicine + '!' }, function( err, data ) {});
      },  null, true);
}



module.exports = {
    sendScheduledSms,
    sendReminder
}