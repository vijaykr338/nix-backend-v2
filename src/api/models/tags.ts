import mongoose from "mongoose";

export enum TagType {
  Author,
  Designer,
  Illustrator,
  Photographer,
  Other,
}

interface BaseTag {
  tag_type: Exclude<TagType, TagType.Other>;
  users: mongoose.Schema.Types.ObjectId[];
}

// TODO: discuss if it is required or we can remove it (by only extending the enum for this stuff)
interface OtherTag {
  tag_type: TagType.Other;
  tag_name: string;
  users: mongoose.Schema.Types.ObjectId[];
}

export type ITag = BaseTag | OtherTag;
