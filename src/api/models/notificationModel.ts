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

const LinkNodeUpdateSchema = new Schema<LinkNodeUpdate>({
  title: { type: String, required: true },
  link: { type: String },
  update: { type: String, required: true },
});

const DataUpdateSchema = new Schema<DataUpdate>({
  title: { type: String, required: true },
  link: { type: String },
  children: { type: [LinkNodeUpdateSchema], required: true },
  date: { type: String },
  update: { type: String, required: true },
});

const ActionSchema = new Schema<ClientNotificationAction>({
  action: { type: String, required: true },
  link: { type: String, required: true },
});

const NotificationSchema = new Schema<ClientNotification>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  actions: { type: [ActionSchema], default: [] },
  link: { type: String },
});

const notificationSchema = new Schema<INotification>(
  {
    updated_at: { type: Date, required: false, default: Date.now },
    data: { type: NotificationSchema, required: [true, "Give data"] },
  },
  {
    timeseries: {
      timeField: "updated_at",
      granularity: "hours",
    },
    expireAfterSeconds: 60 * 24 * 7 * 4, // 4 weeks,
  },
);

const Notification = mongoose.model<INotification>(
  "notification",
  notificationSchema,
);

export { Notification, InformationUpdate };
