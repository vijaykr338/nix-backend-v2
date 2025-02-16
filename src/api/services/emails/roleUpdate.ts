import { PopulatedUser } from "../../models/userModel";
import Email, { APP_URL, COPYRIGHT_YEAR, DEVELOPER_FOOTER } from "../emailService";
import MainWebsiteRole from "../../helpers/mainWebsiteRole";

class RoleUpdateMail extends Email {
  constructor(user: PopulatedUser, newRole: MainWebsiteRole, updatedBy: string) {
    super();
    const { name } = user;

    this.subject = "Your DTU Times Role Has Been Updated";
    this.html = `
      <html>
      <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link href="https://fonts.googleapis.com/css?family=Montserrat" rel="stylesheet">
      </head>
      <body style="font-family: 'Montserrat', sans-serif; background-color: #f8f9fa; color: #333;">
        <div style="width: calc(80%); margin: 2rem auto; text-align: center; background-color: #fff; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <div style="padding: 1.5rem; background: #222222; color: white;">
            <div style="text-align: center;">
              <img src="http://dtutimes.dtu.ac.in/images/logo-dark.png" alt="DTU Times Logo" style="width: 12rem;">
            </div>
          </div>

          <div style="padding: 2rem;">
            <h1 style="margin-top: 1rem; font-size: 2.2rem; font-weight: 300; text-align: center; color: #333;">
              Role Update
            </h1>

            <div style="margin: 1.5rem auto; font-size: 1rem; line-height: 1.6;">
              <p>Hey ${name},</p>
              <p>Your role on DTU Times has been updated to:</p>
              <div style="display: inline-block; padding: 0.6rem 1.2rem; background: #1ABC9C; color: white; border-radius: 8px; margin: 1rem 0; font-size: 1.1rem; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                <strong>${MainWebsiteRole[newRole]}</strong>
              </div>
              <p>Updated by: ${updatedBy}</p>
            </div>

            <a href="${APP_URL}/member/profile" style="display: inline-block; padding: 0.8rem 1.5rem; background: #1ABC9C; color: white; border-radius: 5px; text-decoration: none; transition: background-color 0.3s ease;">View My Profile</a>
          </div>

          <footer style="background-color: #222222; color: #ddd; text-align: center; padding: 1rem; font-size: 0.7rem;">
            &copy; DTU Times ${COPYRIGHT_YEAR}. All Rights Reserved.
            <br />
            Developed by ${DEVELOPER_FOOTER}
          </footer>
        </div>
      </body>
    </html>
    `;
  }
}

export default RoleUpdateMail;