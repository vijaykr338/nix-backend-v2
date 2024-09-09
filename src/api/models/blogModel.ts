import mongoose, { HydratedDocument, Schema } from "mongoose";
import { ITag, TagType } from "./tags";
import { IUser } from "./userModel";

/** Hardcoded values so relative orders are in sync with db */
export enum BlogStatus {
  Pending = 0,
  Published = 1,
  // auto publish at a given time
  Approved = 2,
  Draft = 3,
}

export interface IBlog {
  user: mongoose.Schema.Types.ObjectId;
  title: string;
  byliner: string;
  slug: string;
  body: string;
  status: BlogStatus;
  category_id: number;
  cover: string | null;
  tags: ITag[];
  views: number;
  likes: number;
  meta_title: string;
  meta_description: string;
  published_at: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const blogSchema = new Schema<IBlog>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: [true, "User_id is required"],
    },
    title: {
      type: String,
      required: [true, "Please enter title"],
    },
    byliner: {
      type: String,
      required: [true, "Please enter bilinger"],
    },
    slug: {
      type: String,
      required: [true, "Please enter slug"],
    },
    body: {
      type: String,
      required: [true, "Please enter body"],
    },
    status: {
      type: Number,
      enum: BlogStatus,
      default: BlogStatus.Pending,
    },
    category_id: {
      type: Number,
      required: [true, "Please enter category_id"],
    },
    cover: {
      type: String,
      default: null,
    },
    tags: {
      type: [
        {
          tag_type: { type: Number, enum: TagType },
          users: [
            {
              type: mongoose.Schema.Types.ObjectId,
              ref: "user",
            },
          ],
          tag_name: {
            type: String,
          },
        },
      ],
    },
    views: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
    meta_title: {
      type: String,
      required: [true, "Please enter meta_title"],
    },
    meta_description: {
      type: String,
      required: [true, "Please enter meta_description"],
    },
    published_at: {
      type: Date,
      default: null,
    },
    createdAt: {
      type: Date,
    },
    updatedAt: {
      type: Date,
    },
  },
  {
    timestamps: {
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    },
  },
);

// Middleware to auto-populate tags on find queries
function find_prehook(
  this: mongoose.Query<IBlog[], IBlog>,
  next: mongoose.CallbackWithoutResultAndOptionalError,
) {
  this.populate<{ tags: { users: HydratedDocument<IUser> } }>(
    "tags.users",
    "_id name email bio",
  );
  next();
}

blogSchema.pre(/^find/, find_prehook);

const Blog = mongoose.model<IBlog>("blog", blogSchema);

export { Blog };
