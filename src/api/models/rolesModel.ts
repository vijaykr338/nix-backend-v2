import mongoose, { Document, Schema } from "mongoose";

export interface IRole extends Document {
  id: number;
  name: string;
  permissions: number[];
}

const rolesSchema = new Schema<IRole>({
  id: {
    type: Number,
    required: [true, "Enter role id"],
  },
  name: {
    type: String,
    required: [true, "Enter role name"],
  },
  permissions: {
    type: [Number],
    required: [true, "Enter permissions"],
  }
});

const Role = mongoose.model<IRole>("Role", rolesSchema);

export { Role };