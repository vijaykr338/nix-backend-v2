Refer to .env.local file and create your own .env file as required

# Backup Overview

1. **Backup Existence**: The project has a robust backup system in place to ensure data integrity and availability.
2. **MongoDB Backup**: 
    - **Scope**: All user accounts, passwords, blogs, and other data (excluding images) are backed up.
    - **Frequency**: Backups are performed daily.
    - **Storage**: The backups are stored on the server and uploaded to the Telegram channel.
3. **Image Backup**:
    - **Scope**: All image data is backed up.
    - **Frequency**: Backups are performed twice a month (every 15 days).
    - **Storage**: Image backups are stored on the server.
    - **Notifications**: Notifications are delivered on the same Telegram channel whenever an image backup is completed.

## Accessing Server Backups

To access server backups, log in using the following credentials:

- **Username**: dvishal485
- Managed via cron jobs
```bash
crontab -e
```

Ensure you follow appropriate security protocols when accessing and handling backup data.

## Notifications

Backup notifications are delivered to the Telegram channel to notify about the status of the image backups.

---

# Accessing Terminal

- Through teams portal, navigate to the terminal page, use credentials provided to login in the Nginx UI (different than user's credential).
- Through digital ocean, guides available online to get access to droplet's terminal.
- (If you already have terminal access) Through `sshx` you can access terminal using a web interface via a temporary link. (This should only be required if the TUI is not rendered properly)
- After this you can login as `root` or `dvishal485`. Note: `root` doesn't have any password (and can be accessed via verified ssh keys and sudo commands in user's profile), `dvishal485` can be accessed like any other account with a password.
