// Requires EMAIL_SERVICE_USER and EMAIL_SERVICE_PASS in .env file
import nodemailer from "nodemailer";

const APP_URL = process.env.APP_URL || "https://nix.dtutimes.com";
const COPYRIGHT_YEAR = 2023;
const DEVELOPER_FOOTER = "dvishal485";

/**
    * @description Email class for sending emails
    * Should not be invoked directly but rather
    * through the child classes.
    *
    * Available child classes:
    * - `pendingApprovalMail`
    * - `registerationMail`
*/
class Email {
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
    async sendTo(reciever) {
        console.assert(reciever, "Reciever is required");
        console.assert(this.subject, "Subject is required");
        console.assert(this.html, "Body is required");

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_SERVICE_USER,
                pass: process.env.EMAIL_SERVICE_PASS
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_SERVICE_USER,
            to: reciever,
            subject: this.subject,
            html: this.html
        };

        try {
            const sentMail = await transporter.sendMail(mailOptions);
            console.log(sentMail);
            return true;
        } catch (error) {
            console.error(error);
            return false;
        }
    }
};

/**
    * @description Blog approval mail
    *
    * @example
    * ```javascript
    * const user = "dvishal485@gmail.com"; // can be an array of emails too
    * const mail = new pendingApprovalMail(
    *     "this is the title",
    *     "beautiful description",
    *     "https://nix.dtutimes.com//storage/1200/conversions/Blog-Illustration--%281%29-%281%29-%281%29-compressed-fullscreen.jpg"
    * );
    * await mail.sendTo(user);
    * ```
*/
class pendingApprovalMail extends Email {
    /**
        * @description Generates an email for pending approval of a blog
        * @param {string} story_title - Title of the story
        * @param {string} story_biliner - Biliner of the story
        * @param {string} img_url - Image URL of the story (with domain)
    */
    constructor(story_title, story_biliner, img_url) {
        super();
        super.subject = "Pending Approval";
        super.html = `<html> <head> <link href="https://fonts.googleapis.com/css?family=Montserrat" rel="stylesheet"> <style> * { padding: 0; margin: 0; box-sizing: border-box; } html, body { width: 100%; } body { font-family: 'Montserrat', sans-serif; } .container { width: calc(80%); margin: 0 auto; text-align: center; } .head { padding: 1rem; background: #222222; color: white; } .head .logo { text-align: left; } .head .logo img { width: 15rem; } p { padding: 1rem; margin-top: 1rem; } .heading-1 { margin-top: 1rem; padding-left: 1rem; font-weight: 300; text-align: center; } .btn { padding: 10px 20px; color: white; background: #1ABC9C; border-radius: 5px; text-decoration: none; } .respImg { width: 100%; } .text { float: right; width: 100%; margin: auto; font: 14px 'Lato', sans-serif; color: #555; line-height: 1.5; } .social-icon { width: 40px; height: 40px; border: 2px solid white; border-radius: 40px; color: #FFF; text-align: center; display: inline-block; margin: 20px 20px -10px 0px; font-size: 20px; } .facebook:hover { border-color: #1265A8; } .instagram:hover { border-color: #1693A5; } .mail:hover { border-color: #C02942; } .icon { width: 100%; margin-top: 7px; color: white; } @media (min-width:966px) { .respImg { width: 37%; } .text { width: 60%; } } </style> </head> <body> <div class="head"> <div class="container"> <div class="logo" style="text-align:center;"> <img src="http://dtutimes.me/img/logo-dark.png" alt=""> </div> </div> </div> <div class="container"> <h1 class="heading-1">Blog awaiting Approval</h1><br> <h2 style="font-variant: small-caps;; font-size:30px; text-align:center;">${story_title}</h2> <br><br> <div> <img src="${img_url}" alt="image" class="respImg"> <div class="text" style="margin-bottom:20px; text-align:left;"> <p> ${story_biliner} </p> </div> </div><br><br> <a href="${APP_URL}" class="btn" style="color:white;">Login to Approve the Blog</a> </div><br><br> <footer id="" class="" style="background-color: black; text-align:center; padding: 1rem;">  <div> <div class="col_full center " style="color:lightgrey; font-size: .7rem;"> &copy; DTU Times ${COPYRIGHT_YEAR}. All Rights Reserved. <br> <br> Developed by <br> ${DEVELOPER_FOOTER} </div> </div> </div>  </footer> </body> </html>`;
    }
}

/**
    * @description Mail for new registeration of a user
    *
    * @example
    * ```javascript
    * const user = "dvishal485@gmail.com"; // can be an array of emails too
    * const mail = new registerationMail(user, "12345678");
    * await mail.sendTo(user);
    * ```
*/
class registerationMail extends Email {
    /**
        * @description Generates an email for new user registeration
        * @param {string} username - Username of the user
        * @param {string} password - Password
    */
    constructor(username, password) {
        super();
        super.subject = "Welcome to DTU Times!";
        super.html = `<html> <head> <meta charset="utf-8"> <meta http-equiv="X-UA-Compatible" content="IE=edge"> <meta name="viewport" content="width=device-width, initial-scale=1"> <link href="https://fonts.googleapis.com/css?family=Montserrat" rel="stylesheet"> <style> * { padding: 0; margin: 0; box-sizing: border-box; } html, body { width: 100%; } body { font-family: 'Montserrat', sans-serif; } .container { width: calc(80%); margin: 0 auto; text-align: center; } .head { padding: 1rem; background: #222222; color: white; } .head .logo { text-align: left; } .head .logo img { width: 15rem; } p { padding: 1rem; margin-top: 1rem; } .heading-1 { margin-top: 2rem; padding-left: 1rem; font-size: 2.2rem; font-weight: 300; text-align: left; } .btn { padding: 10px 20px; color: white; background: #1ABC9C; border-radius: 5px; text-decoration: none; } .text { float: right; width: 100%; margin: auto; font: 14px 'Lato', sans-serif; color: #555; line-height: 1.5; } .social-icon { width: 40px; height: 40px; border: 2px solid white; border-radius: 40px; color: #FFF; text-align: center; display: inline-block; margin: 20px 20px -10px 0px; font-size: 20px; } .facebook:hover { border-color: #1265A8; } .instagram:hover { border-color: #1693A5; } .mail:hover { border-color: #C02942; } .icon { width: 100%; margin-top: 7px; color: white; } </style> </head> <body> <div class="head"> <div class="container"> <div class="logo" style="text-align:center;"> <img src="http://dtutimes.dtu.ac.in/images/logo-dark.png" alt=""> </div> </div> </div> <div class="container" style="padding:1rem 0 2rem 0;"> <h1 class="heading-1" style="text-align:center;"> <small>Welcome</small> <small>To DTU Times.</small> </h1> <div> <div style="text-align: center; margin-top: 1rem;"> <img style="max-width: 14rem;" src="http://dtutimes.me/img/mailer-img.png" alt=""> </div> <div class="text" style="margin-bottom:20px; text-align:center;"> <p> <h5>Hey ${username}, Welcome to DTU Times.</h5><br> Happy to have you on board! <br> You can login with <strong>${password}</strong> as your password. </p> </div> </div><br><br> <a href="${APP_URL}" class="btn">Login</a> </div><br><br> <footer id="" class="" style="background-color: black; text-align:center; padding: 1rem;">  <div> <div class="col_full center " style="color:lightgrey; font-size: .7rem;"> &copy; DTU Times ${COPYRIGHT_YEAR}. All Rights Reserved. <br> <br> Developed by <br> ${DEVELOPER_FOOTER} </div> </div> </div>  </footer>  </body> </html>`;
    }
}


/**
    * @description Mail for story publication
    *
    * @example
    * ```javascript
    * // can be a single email string as well
    * const user = ["dvishal485@gmail.com", "dev.dtutimes@dtu.ac.in"];
    * const mail = new storyPublishedMail(
    *    "story title here",
    *    "story biliner here",
    *    "https://nix.dtutimes.com/storage/1203/conversions/Lights-Camera-Action-%281%29-%281%29-compressed-fullscreen.jpg",
    *    "https://dtutimes.dtu.ac.in/blog/blog-lights-camera-beats-why-movie-soundtracks-are-the-sound-of-our-generation-288"
    * );
    *
    * await mail.sendTo(user);
    * ```
*/
class storyPublishedMail extends Email {
    /**
        * @description Generates an email for published story
        * @param {string} story_title - Title of the story
        * @param {string} story_biliner - Biliner of the story
        * @param {string} img_url - Image URL of the story (with domain)
        * @param {string} story_link - Link to the story
    */
    constructor(story_title, story_biliner, img_url, story_link) {
        super();
        super.subject = "Blog published on DTU Times!";
        super.html = `<html> <head> <link href="https://fonts.googleapis.com/css?family=Montserrat" rel="stylesheet"> <style> * { padding: 0; margin: 0; box-sizing: border-box; } html, body { width: 100%; } body { font-family: 'Montserrat', sans-serif; } .container { width: calc(80%); margin: 0 auto; text-align: center; } .head { padding: 1rem; background: #222222; color: white; } .head .logo { text-align: left; } .head .logo img { width: 15rem; } p { padding: 1rem; margin-top: 1rem; } .heading-1 { margin-top: 1rem; padding-left: 1rem; font-weight: 300; text-align: center; } .btn { padding: 10px 20px; color: white; background: #1ABC9C; border-radius: 5px; text-decoration: none; } .respImg { width: 100%; } .text { float: right; width: 100%; margin: auto; font: 14px 'Lato', sans-serif; color: #555; line-height: 1.5; } .social-icon { width: 40px; height: 40px; border: 2px solid white; border-radius: 40px; color: #FFF; text-align: center; display: inline-block; margin: 20px 20px -10px 0px; font-size: 20px; } .facebook:hover { border-color: #1265A8; } .instagram:hover { border-color: #1693A5; } .mail:hover { border-color: #C02942; } .icon { width: 100%; margin-top: 7px; color: white; } @media (min-width:966px) { .respImg { width: 37%; } .text { width: 60%; } } </style> </head> <body> <div class="head"> <div class="container"> <div class="logo" style="text-align:center;"> <img src="http://dtutimes.me/img/logo-dark.png" alt=""> </div> </div> </div> <div class="container"> <h1 class="heading-1">Blog Published</h1><br> <h2 style="font-variant: small-caps;; font-size:30px; text-align:center;">${story_title}</h2> <br><br> <div> <img src="${img_url}" alt="image" class="respImg"> <div class="text" style="margin-bottom:20px; text-align:left;"> <p> ${story_biliner} </p> </div> </div><br><br> <a href="${story_link}" class="btn" style="color:white;">Read Full Article</a> </div><br><br> <footer id="" class="" style="background-color: black; text-align:center; padding: 1rem;">  <div> <div class="col_full center " style="color:lightgrey; font-size: .7rem;"> &copy; DTU Times ${COPYRIGHT_YEAR}. All Rights Reserved. <br> <br> Developed by <br> ${DEVELOPER_FOOTER} </div> </div> </div>  </footer> </body> </html>`
    }
}

export default { pendingApprovalMail, registerationMail, storyPublishedMail };
