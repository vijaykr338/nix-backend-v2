/**
 * Enum representing different permissions.
 */
enum Permission {
  CreateProfile = 0,
  ReadProfile = 1,
  UpdateProfile = 2,
  DeleteProfile = 3,
  /// Allows user X to create a new role or update an existing role
  UpsertRole = 4,
  /// Allows user X to read all roles and their permissions
  ReadRole = 5,
  /// Allows user X to edit a blog before it is published
  EditBeforeBlogPublish = 6,
  /// Allows user X to delete a role except the default roles which are not alloted to any user
  DeleteRole = 7,
  /// Allows user X to create a new blog
  CreateBlog = 8,
  /// Allows user X to read all blogs except drafts
  ReadBlog = 9,
  /// Allows user X to update all drafts
  // security flaw : can edit other users' drafts as well, but cannot do so without ID
  UpdateBlog = 10,
  /// Allows user X to Delete a blog or archive a blog
  DeleteBlog = 11,
  /// Allows user X to Publish or Approve a blog
  PublishBlog = 12,
  /// Allows user X to access Backend logs
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
