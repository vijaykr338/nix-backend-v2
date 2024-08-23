import CustomError from "../../config/CustomError";
import asyncErrorHandler from "../helpers/asyncErrorHandler";
import StatusCode from "../helpers/httpStatusCode";
import {
  ClientNotification,
  InformationUpdate,
  Notification,
} from "../models/notificationModel";

export const save_notif = asyncErrorHandler(async (req, res, _next) => {
  if (req.body.secret != process.env.NOTIF_SECRET) {
    throw new CustomError("Invalid secret", StatusCode.BAD_REQUEST);
  }
  const data: InformationUpdate = req.body.data;

  const notifications = data.flatMap((tab) => {
    if (tab.update == "Unchanged") {
      const update = tab.data.flatMap((data) => {
        if (data.update == "Unchanged") {
          const update = data.children.flatMap((child) => {
            if (child.update == "Unchanged") {
              return [];
            } else if (child.update == "Modified") {
              const notif = {
                title: `Updated action link for "${child.title}"${data.date ? ` dated ${data.date}` : ""}`,
                description: data.title,
                actions: data.children.map((child) => {
                  return {
                    link: child.link,
                    action: child.title,
                  };
                }),
                link: data.link,
              };

              return notif;
            } else if (child.update == "Added") {
              const notif = {
                title: `Added a new link for "${child.title}"${data.date ? ` dated ${data.date}` : ""}`,
                description: data.title,
                actions: data.children.map((child) => {
                  return {
                    link: child.link,
                    action: child.title,
                  };
                }),
                link: data.link,
              };

              return notif;
            } else if (child.update == "Removed") {
              const notif = {
                title: `Removed a link for "${child.title}"${data.date ? ` dated ${data.date}` : ""}`,
                description: data.title,
                actions: data.children.map((child) => {
                  return {
                    link: child.link,
                    action: child.title,
                  };
                }),
                link: data.link,
              };

              return notif;
            } else {
              throw new CustomError(
                "Unexpected child update status",
                StatusCode.BAD_REQUEST,
              );
            }
          });

          return update;
        } else if (data.update == "Added") {
          const notif: ClientNotification = {
            title: `New update in "${tab.title}"${data.date ? ` dated ${data.date}` : ""}`,
            description: data.title,
            actions: data.children.map((child) => {
              return {
                link: child.link,
                action: child.title,
              };
            }),
            link: data.link,
          };

          return [notif];
        } else if (data.update == "Removed") {
          const notif: ClientNotification = {
            title: `Update removed in "${tab.title}"${data.date ? ` dated ${data.date}` : ""}`,
            description: data.title,
            actions: data.children.map((child) => {
              return {
                link: child.link,
                action: child.title,
              };
            }),
            link: data.link,
          };

          return [notif];
        } else if (data.update == "Modified") {
          const notif: ClientNotification = {
            title: `Link updated in "${tab.title}"${data.date ? ` dated ${data.date}` : ""}`,
            description: data.title,
            actions: data.children.map((child) => {
              return {
                link: child.link,
                action: child.title,
              };
            }),
            link: data.link,
          };

          return [notif];
        } else {
          throw new CustomError(
            "Unexpected data update status",
            StatusCode.BAD_REQUEST,
          );
        }
      });
      return update;
    } else if (tab.update == "Added") {
      const notif: ClientNotification = {
        title: "A new section has been added",
        description: `A new section titled "${tab.title}" has been added to the website`,
        actions: [],
        link: "https://dtu.ac.in/",
      };

      return [notif];
    } else if (tab.update == "Removed") {
      const notif: ClientNotification = {
        title: "A section has been removed",
        description: `A section titled "${tab.title}" has been removed from the website`,
        actions: [],
        link: "https://dtu.ac.in/",
      };

      return [notif];
    } else {
      throw new CustomError(
        "Unexpected tab update status",
        StatusCode.BAD_REQUEST,
      );
    }
  });

  console.log(notifications);

  // console.log(
  //   await Notification.insertMany(
  //     notifications.map((notif) => {
  //       return { data: notif };
  //     }),
  //     { throwOnValidationError: true },
  //   ),
  // );

  console.log(
    await Notification.create(
      notifications.map((notif) => {
        return { data: notif };
      }),
    ),
  );

  res.json({
    status: "success",
    message: "Notification saved successfully",
  });
});

export const get_notif = asyncErrorHandler(async (req, res, _next) => {
  const notifications = await Notification.find().sort({ updated_at: -1 });

  res.json({
    status: "success",
    message: "Notifications fetched successfully",
    data: notifications,
  });
});
