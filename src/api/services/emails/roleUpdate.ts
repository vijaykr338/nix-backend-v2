import { PopulatedUser } from "../../models/userModel";
import Email, { APP_URL, COPYRIGHT_YEAR, DEVELOPER_FOOTER } from "../emailService";
import MainWebsiteRole from "../../helpers/mainWebsiteRole";

class RoleUpdateMail extends Email {
  constructor(user: PopulatedUser, newRole: MainWebsiteRole) {
    super();
    const { name } = user;

    this.subject = "Your DTU Times Role Has Been Updated";
    this.html = `<html>
        <head>
            <meta charset="utf-8">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <link href="https://fonts.googleapis.com/css?family=Montserrat" rel="stylesheet">
            <style>
                * { padding: 0; margin: 0; box-sizing: border-box; }
                html, body { width: 100%; }
                body { font-family: 'Montserrat', sans-serif; }
                .container { width: calc(80%); margin: 0 auto; text-align: center; }
                .head { padding: 1rem; background: #222222; color: white; }
                .head .logo { text-align: center; }
                .head .logo img { width: 15rem; }
                .content { padding: 2rem; background: #ffffff; }
                .role-badge {
                    display: inline-block;
                    padding: 0.5rem 1rem;
                    background: #1ABC9C;
                    color: white;
                    border-radius: 5px;
                    margin: 1rem 0;
                }
                .profile-link {
                    display: inline-block;
                    margin-top: 1.5rem;
                    padding: 10px 20px;
                    color: white;
                    background: #1ABC9C;
                    border-radius: 5px;
                    text-decoration: none;
                }
                .heading-1 {
                    margin-top: 1rem;
                    font-size: 2.2rem;
                    font-weight: 300;
                    color: #333;
                }
                p { padding: 0.5rem; color: #555; line-height: 1.5; }
            </style>
        </head>
        <body>
            <div class="head">
                <div class="container">
                    <div class="logo">
                        <img src="http://dtutimes.dtu.ac.in/images/logo-dark.png" alt="DTU Times Logo">
                    </div>
                </div>
            </div>
            
            <div class="container content">
                <h1 class="heading-1">Role Update</h1>
                <div style="margin: 2rem 0;">
                    <p>Dear ${name},</p>
                    <p>Your role on DTU Times has been updated to:</p>
                    <div class="role-badge">
                        <strong>${MainWebsiteRole[newRole]}</strong>
                    </div>
                    <p>You can view your updated profile and permissions at:</p>
                    <a href="${APP_URL}/member/profile" class="profile-link">View My Profile</a>
                </div>
            </div>

            <footer style="background-color: black; text-align:center; padding: 1rem;">
                <div style="color:lightgrey; font-size: .7rem;">
                    &copy; DTU Times ${COPYRIGHT_YEAR}. All Rights Reserved.<br><br>
                    Developed by<br>${DEVELOPER_FOOTER}
                </div>
            </footer>
        </body>
    </html>`;
  }
}

export default RoleUpdateMail;