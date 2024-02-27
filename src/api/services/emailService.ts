// Requires EMAIL_SERVICE_USER and EMAIL_SERVICE_PASS in .env file

import nodemailer from "nodemailer";
import html_minfy from "html-minifier";

export const APP_URL = process.env.HOST || "https://team.dtutimes.com";
export const COPYRIGHT_YEAR = new Date().getFullYear();
export const DEVELOPER_FOOTER = "Batch 2025";

const minification_options: html_minfy.Options = {
  collapseBooleanAttributes: true,
  collapseWhitespace: true,
  decodeEntities: true,
  minifyJS: true,
  processConditionalComments: true,
  processScripts: ["text/html"],
  removeComments: true,
  removeOptionalTags: true,
  html5: true,
  removeScriptTypeAttributes: true,
  removeStyleLinkTypeAttributes: true,
  useShortDoctype: true,
  removeTagWhitespace: true,
  trimCustomFragments: true,
  conservativeCollapse: true,
};

/**
* @description Email class for sending emails
* Should not be invoked directly but rather
* through the child classes.
*
* Available child classes are in the folder /emails
*/
class Email {
  subject: null | string;
  html: null | string;

  constructor() {
    /** @type {string} */
    this.subject = null;
    /** @type {string} */
    this.html = null;
  }

  processHTML() {
    if (!this.html) return;
    this.html = html_minfy.minify(this.html, minification_options);
  }

  /**
    * @description Sends an email from the email service
    * @param {string|string[]} reciever - Reciever's email address (or array of email addresses)
    * @returns {Promise<boolean>} After awaiting, returns true if email is sent successfully
    */
  async sendTo(reciever: string | string[]): Promise<boolean> {
    console.assert(reciever, "Reciever is required");
    console.assert(this.subject, "Subject is required");
    console.assert(this.html, "Body is required");
    if (!this.subject || !this.html || !reciever) {
      return false;
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_SERVICE_USER,
        pass: process.env.EMAIL_SERVICE_PASS
      }
    });
    const multiple_recievers = reciever instanceof Array;

    this.processHTML();

    const mailOptions: nodemailer.SendMailOptions = {
      from: process.env.EMAIL_SERVICE_USER,
      to: !multiple_recievers ? reciever : process.env.EMAIL_SERVICE_USER,
      bcc: multiple_recievers ? reciever : undefined,
      subject: this.subject,
      html: this.html
    };

    try {
      const mail = await transporter.sendMail(mailOptions);
      console.log(mail);
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }
}


export default Email;
