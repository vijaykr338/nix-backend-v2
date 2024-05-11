declare namespace Express {
  export interface Locals {
    email?: string;
    user_id?: import("mongoose").Types.ObjectId;
    user?: import("./api/models/userModel").PopulatedUser;
    blog?: import("mongoose").HydratedDocument<
      import("./api/models/blogModel").IBlog
    >;
  }
}
