const nodemailer = require('nodemailer');
require('dotenv').config();  // Load environment variables from .env file

/**
 * Sends an email notification to the user.
 * 
 * @param {string} email - The recipient's email address.
 * @param {string} subject - The subject of the email.
 * @param {string} message - The body of the email.
 */
const sendEmail = (email, subject, message) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail', //  email service
    auth: {
      user: process.env.EMAIL_USER,  // Use email from .env
      pass: process.env.EMAIL_PASS,  // Use email password from .env
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,  // Use email from .env
    to: email,
    subject: subject,
    text: message,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
    } else {
      console.log(`Email sent: ${info.response}`);
    }
  });
};

module.exports = sendEmail;
