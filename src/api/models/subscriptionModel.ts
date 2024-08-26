import mongoose, { Schema } from "mongoose";

const susbcriberSchema = new Schema<
  Omit<PushSubscriptionJSON, "expirationTime">
>({
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

const Subscription = mongoose.model<
  Omit<PushSubscriptionJSON, "expirationTime">
>("subscriber", susbcriberSchema);

export { Subscription };
