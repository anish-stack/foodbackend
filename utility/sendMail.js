const nodemailer = require("nodemailer");

const sendEmail = async (options) => { // Remove the 'message' parameter as it's not needed
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      auth: {
        user:"eightxinida@gmail.com",
        pass: "anek xuxa jule pihd",
      },
    });

    const mailOptions = {
      from: "eightxinida@gmail.com",
      to: options.email, // Use 'options.email' as the recipient
      subject: options.subject,
      text: options.message, // Use 'options.message' to define the email message
    };

    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

module.exports = sendEmail;
