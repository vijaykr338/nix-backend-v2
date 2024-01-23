import mongoose, { Document, Schema } from 'mongoose';
import Permission from '../helpers/permissions';

export interface IRole extends Document {
  name: string;
  permissions: Permission[];
}

const rolesSchema = new Schema<IRole>({
  name: {
    type: String,
    required: [true, 'Enter role name'],
  },
  permissions: {
    type: [Number],
    enum: [
      Permission.CreateProfile,
      Permission.ReadProfile,
      Permission.UpdateProfile,
      Permission.DeleteProfile,
      Permission.CreateRole,
      Permission.ReadRole,
      Permission.UpdateRole,
      Permission.DeleteRole,
      Permission.CreateBlog,
      Permission.ReadBlog,
      Permission.UpdateBlog,
      Permission.DeleteBlog,
      Permission.PublishBlog,
      Permission.AccessLogs,
    ],
    required: [true, 'Enter permissions'],
  },
});

const Role = mongoose.model<IRole>('role', rolesSchema);

export { Role };