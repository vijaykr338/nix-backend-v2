import mongoose, { Schema } from "mongoose";

type Update = "Added" | "Removed" | "Modified" | "Unchanged" | "Inherit";

interface TabUpdate {
  title: string;
  data: DataUpdate[];
  update: Update;
}

interface LinkNodeUpdate {
  title: string;
  link: Link;
  update: Update;
}

interface DataUpdate {
  title: string;
  link?: Link;
  children: LinkNodeUpdate[];
  date?: string;
  update: Update;
}

type InformationUpdate = TabUpdate[];

type Link = string;

interface INotification {
  data: ClientNotification;
  updated_at: Date;
}

export interface ClientNotification {
  title: string;
  description: string;
  actions: ClientNotificationAction[];
  link?: string;
}

export interface ClientNotificationAction {
  action: string;
  link: string;
}

const ActionSchema = new Schema<ClientNotificationAction>(
  {
    action: { type: String, required: true },
    link: { type: String, required: true },
  },
  { _id: false },
);

const NotificationSchema = new Schema<ClientNotification>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    actions: { type: [ActionSchema], default: [] },
    link: { type: String },
  },
  { _id: false },
);

const notificationSchema = new Schema<INotification>(
  {
    updated_at: { type: Date, required: false, default: Date.now },
    data: {
      type: NotificationSchema,
      required: [true, "Notification content not provided"],
    },
  },
  {
    timeseries: {
      timeField: "updated_at",
      granularity: "hours",
    },
    expireAfterSeconds: 7 * 24 * 60 * 60, // 1 week
  },
);

const Notification = mongoose.model<INotification>(
  "notification",
  notificationSchema,
);

export { Notification, InformationUpdate };
