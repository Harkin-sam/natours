//Nodemailer package is used to send email using nodejs
//npm i nodemailer
const nodemailer = require('nodemailer');
const pug = require('pug');

// npm i html-to-text: this package converts html to text
const { htmlToText } = require('html-to-text');

//CLASS
//new Email(user, url )

module.exports = class Email {
  // constructor function is a function OR settings that always run when a new object is created from a class
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Haykinz <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      //Sendgrid
      return 1;
    }

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  // SEND THE ACTUAL MAIL
  async send(template, subject) {

    // 1) RENDER THE HTML BASED ON A PUG TEMPLATE 
    const html = pug.renderFile(
      `${__dirname}/../views/emails/${template}.pug`,
      {
        firstName: this.firstName,
        url: this.url,
        subject,
      }
    );
    // this will take in file & render the pug code into real hmtl, __dirname is the location of the currently running script

    //2) DEFINE THE EMAIL OPTIONS
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject: subject,
      html: html,
      text: htmlToText(html)
    };

    //3) CREATE A TRANSPORT & SEND EMAIL
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Natours Family!');
  }

  async sendPasswordReset(){
    await this.send('passwordReset', 'Your password reset token (valid for only 10 minutes)');
    
  }
};

//options consists of receiver email, subject line, email content etc
// const sendEmail = async (options) => {
//   // 1) CREATE A TRANSPORTER : Sending service
//   const transporter = nodemailer.createTransport({
//     // service: 'Gmail',
//     host: process.env.EMAIL_HOST,
//     port: process.env.EMAIL_PORT,
//     auth: {
//       user: process.env.EMAIL_USERNAME,
//       pass: process.env.EMAIL_PASSWORD,
//     },
//   });

//   //gmail is not suitable for app development bcoz wen you send multiple mail you will simply e tagged a spammer so we use MAILTRAP, So register a free account on mailtrap.io and open a new inbox, set the username, password, host and port in the config.env file

//   //2) DEFINE THE EMAIL OPTIONS
//   const mailOptions = {
//     from: 'Admin Haykinz <hello@haykinz.io>',
//     to: options.email,
//     subject: options.subject,
//     text: options.message,
//     // html:
//   };

//   //3) ACTUALLY SEND THE EMAIL

//   await transporter.sendMail(mailOptions); // this is an async function it returns a promise
// };

// module.exports = sendEmail;
