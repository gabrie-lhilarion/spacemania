const twilio = require('twilio');
require('dotenv').config();  // Load environment variables from .env file

// Initialize Twilio client with credentials from .env
const client = new twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

/**
 * Sends an SMS notification to the user.
 * 
 * @param {string} phoneNumber - The recipient's phone number.
 * @param {string} message - The SMS message.
 */
const sendSMS = (phoneNumber, message) => {
  client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER,  // Use Twilio phone number from .env
    to: phoneNumber,
  })
  .then((message) => {
    console.log('SMS sent: ', message.sid);
  })
  .catch((error) => {
    console.error('Error sending SMS:', error);
  });
};

module.exports = sendSMS;
