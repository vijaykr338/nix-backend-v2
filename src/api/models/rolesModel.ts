import mongoose, { Schema } from "mongoose";
import Permission from "../helpers/permissions";

export interface IRole {
  name: string;
  permissions: Permission[];
}

const rolesSchema = new Schema<IRole>({
  name: {
    type: String,
    required: [true, "Enter role name"],
  },
  permissions: {
    type: [Number],
    enum: Object.values(Permission).filter(
      (value) => typeof value === "number",
    ),
    required: [true, "Enter permissions"],
  },
});

const Role = mongoose.model<IRole>("role", rolesSchema);

export { Role };
