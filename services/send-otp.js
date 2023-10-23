var nodemailer = require("nodemailer");
var handlebars = require("handlebars");
var fs = require("fs");
const { UUIDV4 } = require("sequelize");
const { v4: uuidv4 } = require("uuid");
const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  auth: {
    user: "info.infomerics@gmail.com",
    pass: "sfaagramzgctgsir",
  },
});
const sender = "info.infomerics@gmail.com";

async function SEND_EMAIL(
  email_recipient,
  email_subject,
  email_body,
  body_replacements
) {
  try {
    let htmlTemplate = email_body;
    const template = handlebars.compile(htmlTemplate);

    const replacements = body_replacements;
    const body = template(replacements);

    const mailOptions = {
      from: sender,
      to: email_recipient,
      subject: email_subject,
      html: body,
    };
    let emailObj = await new Promise((resolve, reject) => {
      transporter.sendMail(mailOptions, async function (error, info) {
        if (error) {
          resolve({
            sender: sender,
            recipient: email_recipient,
            subject: email_subject,
            uuid: uuidv4(),
            body: body,
            status: info?.response,
            error: JSON.stringify(error),
          });
        } else {
          resolve({
            sender: sender,
            recipient: email_recipient,
            subject: email_subject,
            uuid: uuidv4(),
            body: body,
            status: info.response,
            error: JSON.stringify(error),
          });
        }
      });
    });

    return emailObj;
  } catch (err) {
    console.log(err);
  }
}

module.exports = {
  SEND_EMAIL,
};
