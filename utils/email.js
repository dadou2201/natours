// eslint-disable-next-line import/no-extraneous-dependencies
const nodemailer = require('nodemailer');
const pug = require('pug');
// eslint-disable-next-line import/no-extraneous-dependencies
const htmlToText = require('html-to-text');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `David Bourak <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      //Sendgrid:
      return nodemailer.createTransport({
        service: 'SendinBlue',
        auth: {
          user: 'davidbourak22@gmail.com',
          pass: 'xsmtpsib-e7decd33abc50fe6cbecbde07e12bb8623770c1501beee1b27a1259e07777168-UsCfn4DaFxgNOvjJ',
        },
      });
    }
    //1. Create a transporter:
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  //Send the actual email
  async send(template, subject) {
    //1. render html based on a pug template:
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject,
    });

    //2. Define the email options:
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText.convert(html),
    };

    //Create a transport and send email:
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Natours Family!');
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token (valid for only 10 minutes',
    );
  }
};
