
const nodemailer = require('nodemailer');

require("dotenv").config();

// Create a transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SENDING_EMAIL, // Your email
      pass: process.env.EMAIL_PASSWORD, // Your email password or app password
    },
  });
  
  // Verify connection
  transporter.verify((error, success) => {
    if (error) {
      console.log('Error:', error);
    } else {
      console.log('Server is ready to send emails');
    }
  });





module.exports = transporter;



