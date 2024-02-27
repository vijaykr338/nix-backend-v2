import mongoose, { Document, Schema } from "mongoose";

/** Hardcoded values so relative orders are in sync with db */
export enum EditionStatus {
  // hidden till restored
  Draft = 0,
  // published to main website
  Published = 1,
  // auto publish at a given time
  Approved = 2,
}

export interface IEdition extends Document {
  name: string;
  edition_id: number;
  status: EditionStatus;
  edition_link: string;
  published_at?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const editionSchema = new Schema<IEdition>(
  {
    name: {
      type: String,
      required: [true, "Please enter title"],
    },
    edition_id: {
      type: Number,
      required: [true, "Please enter edition_id"],
    },
    status: {
      type: Number,
      enum: EditionStatus,
      default: EditionStatus.Draft,
    },
    edition_link: {
      type: String,
      required: [true, "Please enter edition_link"],
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

editionSchema.index({ edition_id: 1 }, { unique: true });

const Edition = mongoose.model<IEdition>("edition", editionSchema);

export { Edition };
