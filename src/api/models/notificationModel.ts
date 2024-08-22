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
  data: InformationUpdate;
  updated_at: Date;
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

const TabUpdateSchema = new Schema<TabUpdate>({
  title: { type: String, required: true },
  data: { type: [DataUpdateSchema], required: true },
  update: { type: String, required: true },
});

const notificationSchema = new Schema<INotification>(
  {
    data: { type: [TabUpdateSchema], required: [true, "Give data"] },
    updated_at: { type: Date, required: false, default: Date.now },
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

export { Notification };
