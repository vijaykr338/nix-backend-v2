/**
 * Enum representing different permissions.
 */
enum Permission {
  CreateProfile = 0,
  ReadProfile = 1,
  UpdateProfile = 2,
  DeleteProfile = 3,
  CreateRole = 4,
  ReadRole = 5,
  UpdateRole = 6,
  DeleteRole = 7,
  CreateBlog = 8,
  ReadBlog = 9,
  UpdateBlog = 10,
  DeleteBlog = 11,
  PublishBlog = 12,
  AccessLogs = 13,
  UploadImage = 14,
  DeleteImage = 15,
  UpdateImage = 16,
  CreateEdition = 17,
  UpdateEdition = 18,
  DeleteEdition = 19,
  // these perms will be used for management
  ReceiveBlogPublishedMail = 20,
}

export default Permission;
