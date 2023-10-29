import mongoose from "mongoose";
const { Schema } = mongoose;

const rolesSchema = Schema({
  name: {
    type: String,
    required: [true, "Enter role name"],
  }
});

const Role = mongoose.model("role", rolesSchema);

export { Role };
