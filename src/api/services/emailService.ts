// Requires EMAIL_SERVICE_USER and EMAIL_SERVICE_PASS in .env file

import nodemailer from "nodemailer";
import { IBlog } from "../models/blogModel";
import { IUser, PopulatedUser } from "../models/userModel";

const APP_URL = process.env.HOST || "https://team.dtutimes.com";
const COPYRIGHT_YEAR = new Date().getFullYear();
const DEVELOPER_FOOTER = "Batch 2025";

/**
* @description Email class for sending emails
* Should not be invoked directly but rather
* through the child classes.
*
* Available child classes:
* - `pendingApprovalMail`
* - `registerationMail`
* - `storyPublishedMail`
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

/** Blog approval mail */
class PendingApprovalMail extends Email {
  /** Generates an email for pending approval of a blog */
  constructor(blog: IBlog) {
    super();

    const { title, byliner, cover, id } = blog;
    const story_link = `${APP_URL}/story/${id}`;
    const img_url = `${APP_URL}/api/v1/images/get/${cover}`;

    this.subject = "Pending Approval";
    this.html = `<html> <head> <link href="https://fonts.googleapis.com/css?family=Montserrat" rel="stylesheet"> <style> * { padding: 0; margin: 0; box-sizing: border-box; } html, body { width: 100%; } body { font-family: 'Montserrat', sans-serif; } .container { width: calc(80%); margin: 0 auto; text-align: center; } .head { padding: 1rem; background: #222222; color: white; } .head .logo { text-align: left; } .head .logo img { width: 15rem; } p { padding: 1rem; margin-top: 1rem; } .heading-1 { margin-top: 1rem; padding-left: 1rem; font-weight: 300; text-align: center; } .btn { padding: 10px 20px; color: white; background: #1ABC9C; border-radius: 5px; text-decoration: none; } .respImg { width: 100%; } .text { float: right; width: 100%; margin: auto; font: 14px 'Lato', sans-serif; color: #555; line-height: 1.5; } .social-icon { width: 40px; height: 40px; border: 2px solid white; border-radius: 40px; color: #FFF; text-align: center; display: inline-block; margin: 20px 20px -10px 0px; font-size: 20px; } .facebook:hover { border-color: #1265A8; } .instagram:hover { border-color: #1693A5; } .mail:hover { border-color: #C02942; } .icon { width: 100%; margin-top: 7px; color: white; } @media (min-width:966px) { .respImg { width: 37%; } .text { width: 60%; } } </style> </head> <body> <div class="head"> <div class="container"> <div class="logo" style="text-align:center;"> <img src="http://dtutimes.me/img/logo-dark.png" alt=""> </div> </div> </div> <div class="container"> <h1 class="heading-1">Blog awaiting Approval</h1><br> <h2 style="font-variant: small-caps;; font-size:30px; text-align:center;">${title}</h2> <br><br> <div> <img src="${img_url}" alt="image" class="respImg"> <div class="text" style="margin-bottom:20px; text-align:left;"> <p> ${byliner} </p> </div> </div><br><br> <a href="${story_link}" class="btn" style="color:white;">Login to Approve the Blog</a> </div><br><br> <footer id="" class="" style="background-color: black; text-align:center; padding: 1rem;">  <div> <div class="col_full center " style="color:lightgrey; font-size: .7rem;"> &copy; DTU Times ${COPYRIGHT_YEAR}. All Rights Reserved. <br> <br> Developed by <br> ${DEVELOPER_FOOTER} </div> </div> </div>  </footer> </body> </html>`;
  }
}

/** Mail for new registeration of a user */
class RegisterationMail extends Email {
  /**
    * @description Generates an email for new user registeration
    * @param {IUser} user - User object
    * @param {string} password - Unhashed Password
    */
  constructor(user: IUser, password: string) {
    super();
    const { name } = user;

    this.subject = "Welcome to DTU Times!";
    this.html = `<html> <head> <meta charset="utf-8"> <meta http-equiv="X-UA-Compatible" content="IE=edge"> <meta name="viewport" content="width=device-width, initial-scale=1"> <link href="https://fonts.googleapis.com/css?family=Montserrat" rel="stylesheet"> <style> * { padding: 0; margin: 0; box-sizing: border-box; } html, body { width: 100%; } body { font-family: 'Montserrat', sans-serif; } .container { width: calc(80%); margin: 0 auto; text-align: center; } .head { padding: 1rem; background: #222222; color: white; } .head .logo { text-align: left; } .head .logo img { width: 15rem; } p { padding: 1rem; margin-top: 1rem; } .heading-1 { margin-top: 2rem; padding-left: 1rem; font-size: 2.2rem; font-weight: 300; text-align: left; } .btn { padding: 10px 20px; color: white; background: #1ABC9C; border-radius: 5px; text-decoration: none; } .text { float: right; width: 100%; margin: auto; font: 14px 'Lato', sans-serif; color: #555; line-height: 1.5; } .social-icon { width: 40px; height: 40px; border: 2px solid white; border-radius: 40px; color: #FFF; text-align: center; display: inline-block; margin: 20px 20px -10px 0px; font-size: 20px; } .facebook:hover { border-color: #1265A8; } .instagram:hover { border-color: #1693A5; } .mail:hover { border-color: #C02942; } .icon { width: 100%; margin-top: 7px; color: white; } </style> </head> <body> <div class="head"> <div class="container"> <div class="logo" style="text-align:center;"> <img src="http://dtutimes.dtu.ac.in/images/logo-dark.png" alt=""> </div> </div> </div> <div class="container" style="padding:1rem 0 2rem 0;"> <h1 class="heading-1" style="text-align:center;"> <small>Welcome</small> <small>To DTU Times.</small> </h1> <div> <div style="text-align: center; margin-top: 1rem;"> <img style="max-width: 14rem;" src="http://dtutimes.me/img/mailer-img.png" alt=""> </div> <div class="text" style="margin-bottom:20px; text-align:center;"> <p> <h5>Hey ${name}, Welcome to DTU Times.</h5><br> Happy to have you on board! <br> You can login with <strong>${password}</strong> as your password. </p> </div> </div><br><br> <a href="${APP_URL}" class="btn">Login</a> </div><br><br> <footer id="" class="" style="background-color: black; text-align:center; padding: 1rem;">  <div> <div class="col_full center " style="color:lightgrey; font-size: .7rem;"> &copy; DTU Times ${COPYRIGHT_YEAR}. All Rights Reserved. <br> <br> Developed by <br> ${DEVELOPER_FOOTER} </div> </div> </div>  </footer>  </body> </html>`;
  }
}

/** Mail for password reset link */
class PasswordResetMail extends Email {
  /** Generates an email for password reset */

  constructor(user: PopulatedUser) {
    const { name, passwordResetToken } = user;
    const resetUrl = `${APP_URL}/reset-password?token=${passwordResetToken}`;

    super();
    this.subject = "Password Reset";
    this.html = `<html> <head> <meta charset="utf-8"> <meta http-equiv="X-UA-Compatible" content="IE=edge"> <meta name="viewport" content="width=device-width, initial-scale=1"> <link href="https://fonts.googleapis.com/css?family=Montserrat" rel="stylesheet"> <style> * { padding: 0; margin: 0; box-sizing: border-box; } html, body { width: 100%; } body { font-family: 'Montserrat', sans-serif; } .container { width: calc(80%); margin: 0 auto; text-align: center; } .head { padding: 1rem; background: #222222; color: white; } .head .logo { text-align: left; } .head .logo img { width: 15rem; } p { padding: 1rem; margin-top: 1rem; } .heading-1 { margin-top: 2rem; padding-left: 1rem; font-size: 2.2rem; font-weight: 300; text-align: left; } .btn { padding: 10px 20px; color: white; background: #1ABC9C; border-radius: 5px; text-decoration: none; } .text { float: right; width: 100%; margin: auto; font: 14px 'Lato', sans-serif; color: #555; line-height: 1.5; } .social-icon { width: 40px; height: 40px; border: 2px solid white; border-radius: 40px; color: #FFF; text-align: center; display: inline-block; margin: 20px 20px -10px 0px; font-size: 20px; } .facebook:hover { border-color: #1265A8; } .instagram:hover { border-color: #1693A5; } .mail:hover { border-color: #C02942; } .icon { width: 100%; margin-top: 7px; color: white; } </style> </head> <body> <div class="head"> <div class="container"> <div class="logo" style="text-align:center;"> <img src="http://dtutimes.dtu.ac.in/images/logo-dark.png" alt=""> </div> </div> </div> <div class="container" style="padding:1rem 0 2rem 0;">  <div> <div style="text-align: center; margin-top: 1rem;"> <img style="max-width: 14rem;" src="http://dtutimes.me/img/mailer-img.png" alt=""> </div> <div class="text" style="margin-bottom:20px; text-align:center;"> <p> <h5>Hey ${name}</h5><br> We have received a password reset request. Please use the link below to reset your password. The link expires in 10 minutes. </p> </div> </div><br><br> <a href="${resetUrl}" class="btn">Reset Password</a> </div><br><br> <footer id="" class="" style="background-color: black; text-align:center; padding: 1rem;">  <div> <div class="col_full center " style="color:lightgrey; font-size: .7rem;"> &copy; DTU Times ${COPYRIGHT_YEAR}. All Rights Reserved. <br> <br> Developed by <br> ${DEVELOPER_FOOTER} </div> </div> </div>  </footer>  </body> </html>`;
  }
}


/** Mail for story publication */
class StoryPublishedMail extends Email {
  /** Generates an email for published story */
  constructor(blog: IBlog) {
    super();
    const { title: story_title, byliner: story_byliner, cover, id } = blog;
    const img_url = `${APP_URL}/api/v1/images/get/${cover}`;
    const story_link = `${APP_URL}/story/${id}`;

    this.subject = "Blog published on DTU Times!";
    this.html = `<html> <head> <link href="https://fonts.googleapis.com/css?family=Montserrat" rel="stylesheet"> <style> * { padding: 0; margin: 0; box-sizing: border-box; } html, body { width: 100%; } body { font-family: 'Montserrat', sans-serif; } .container { width: calc(80%); margin: 0 auto; text-align: center; } .head { padding: 1rem; background: #222222; color: white; } .head .logo { text-align: left; } .head .logo img { width: 15rem; } p { padding: 1rem; margin-top: 1rem; } .heading-1 { margin-top: 1rem; padding-left: 1rem; font-weight: 300; text-align: center; } .btn { padding: 10px 20px; color: white; background: #1ABC9C; border-radius: 5px; text-decoration: none; } .respImg { width: 100%; } .text { float: right; width: 100%; margin: auto; font: 14px 'Lato', sans-serif; color: #555; line-height: 1.5; } .social-icon { width: 40px; height: 40px; border: 2px solid white; border-radius: 40px; color: #FFF; text-align: center; display: inline-block; margin: 20px 20px -10px 0px; font-size: 20px; } .facebook:hover { border-color: #1265A8; } .instagram:hover { border-color: #1693A5; } .mail:hover { border-color: #C02942; } .icon { width: 100%; margin-top: 7px; color: white; } @media (min-width:966px) { .respImg { width: 37%; } .text { width: 60%; } } </style> </head> <body> <div class="head"> <div class="container"> <div class="logo" style="text-align:center;"> <img src="http://dtutimes.me/img/logo-dark.png" alt=""> </div> </div> </div> <div class="container"> <h1 class="heading-1">Blog Published</h1><br> <h2 style="font-variant: small-caps;; font-size:30px; text-align:center;">${story_title}</h2> <br><br> <div> <img src="${img_url}" alt="image" class="respImg"> <div class="text" style="margin-bottom:20px; text-align:left;"> <p> ${story_byliner} </p> </div> </div><br><br> <a href="${story_link}" class="btn" style="color:white;">Read Full Article</a> </div><br><br> <footer id="" class="" style="background-color: black; text-align:center; padding: 1rem;">  <div> <div class="col_full center " style="color:lightgrey; font-size: .7rem;"> &copy; DTU Times ${COPYRIGHT_YEAR}. All Rights Reserved. <br> <br> Developed by <br> ${DEVELOPER_FOOTER} </div> </div> </div>  </footer> </body> </html>`;
  }
}


class StorySubmittedForApproval extends Email {
  /** Generates an email for published story */
  constructor(blog: IBlog) {
    super();
    const story_link = `${APP_URL}/story/${blog.id}`;
    const image_url = `${APP_URL}/api/v1/images/get/${blog.cover}`;

    this.subject = "Blog submitted for approval!";
    // todo: fix this email
    this.html = `<html> <head> <link href="https://fonts.googleapis.com/css?family=Montserrat" rel="stylesheet"> <style> * { padding: 0; margin: 0; box-sizing: border-box; } html, body { width: 100%; } body { font-family: 'Montserrat', sans-serif; } .container { width: calc(80%); margin: 0 auto; text-align: center; } .head { padding: 1rem; background: #222222; color: white; } .head .logo { text-align: left; } .head .logo img { width: 15rem; } p { padding: 1rem; margin-top: 1rem; } .heading-1 { margin-top: 1rem; padding-left: 1rem; font-weight: 300; text-align: center; } .btn { padding: 10px 20px; color: white; background: #1ABC9C; border-radius: 5px; text-decoration: none; } .respImg { width: 100%; } .text { float: right; width: 100%; margin: auto; font: 14px 'Lato', sans-serif; color: #555; line-height: 1.5; } .social-icon { width: 40px; height: 40px; border: 2px solid white; border-radius: 40px; color: #FFF; text-align: center; display: inline-block; margin: 20px 20px -10px 0px; font-size: 20px; } .facebook:hover { border-color: #1265A8; } .instagram:hover { border-color: #1693A5; } .mail:hover { border-color: #C02942; } .icon { width: 100%; margin-top: 7px; color: white; } @media (min-width:966px) { .respImg { width: 37%; } .text { width: 60%; } } </style> </head> <body> <div class="head"> <div class="container"> <div class="logo" style="text-align:center;"> <img src="http://dtutimes.me/img/logo-dark.png" alt=""> </div> </div> </div> <div class="container"> <h1 class="heading-1">Blog Published</h1><br> <h2 style="font-variant: small-caps;; font-size:30px; text-align:center;">${blog.title}</h2> <br><br> <div> <img src="${image_url}" alt="image" class="respImg"> <div class="text" style="margin-bottom:20px; text-align:left;"> <p> ${blog.byliner} </p> </div> </div><br><br> <a href="${story_link}" class="btn" style="color:white;">Read Full Article</a> </div><br><br> <footer id="" class="" style="background-color: black; text-align:center; padding: 1rem;">  <div> <div class="col_full center " style="color:lightgrey; font-size: .7rem;"> &copy; DTU Times ${COPYRIGHT_YEAR}. All Rights Reserved. <br> <br> Developed by <br> ${DEVELOPER_FOOTER} </div> </div> </div>  </footer> </body> </html>`;
  }
}

export default { PendingApprovalMail, RegisterationMail, StoryPublishedMail, PasswordResetMail, StorySubmittedForApproval };
