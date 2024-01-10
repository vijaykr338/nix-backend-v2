import mongoose, { Document, Schema } from "mongoose";

/** Hardcoded values so relative orders are in sync with db */
export enum BlogStatus {
  Pending = 0,
  Published = 1,
  // auto publish at a given time
  Approved = 2,
}

export interface IBlog extends Document {
  user_id: mongoose.Schema.Types.ObjectId;
  title: string;
  biliner: string;
  slug: string;
  body: string;
  status: BlogStatus;
  category_id: number;
  cover: string | null;
  views: number;
  likes: number;
  meta_title: string;
  meta_description: string;
  published_at: Date | null;
}

const blogSchema = new Schema<IBlog>({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    // required: [true, "User_id is required"],
  },
  title: {
    type: String,
    required: [true, "Please enter title"],
  },
  biliner: {
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
}, { timestamps: true });

const Blog = mongoose.model<IBlog>("blog", blogSchema);

export { Blog };
