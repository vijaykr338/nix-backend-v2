import mongoose, { Schema } from "mongoose";

export interface IEvent {
  title: string;
  allDay: boolean;
  start: Date | null;
  end: Date | null;
  description: string;
}

const eventSchema = new Schema<IEvent>({
  title: {
    type: String,
    required: [true, "Title is required"],
  },
  allDay: {
    type: Boolean,
    required: [true, "Please enter is event is allDay"],
  },
  start: {
    type: Date,
    default: null,
  },
  end: {
    type: Date,
    default: null,
  },
  description: {
    type: String,
    default: null,
  },
});

const Event = mongoose.model<IEvent>("event", eventSchema);

export { Event };
