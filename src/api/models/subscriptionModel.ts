import mongoose, { Schema } from "mongoose";
import { type PushSubscription } from "web-push";

const susbcriberSchema = new Schema<PushSubscription>({
  endpoint: {
    type: String,
    required: true,
  },
  keys: {
    p256dh: {
      type: String,
      required: true,
    },
    auth: {
      type: String,
      required: true,
    },
  },
});

const Subscription = mongoose.model<PushSubscription>(
  "subscriber",
  susbcriberSchema,
);

export { Subscription };
