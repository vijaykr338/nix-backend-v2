/**
 * Enum representing different permissions.
 */
enum Permission {
  /// Allows user x to create a new Account and assign it a role
  CreateProfile = 0,
  /// This permission is a placeholder fake permission, ignore it; it does nothing
  // reading profile (opening user y profile page from user x account doesn't require any permission)
  ReadProfile = 1,
  /// Allows user x to update user y's Role, give extra permissions, or remove some permissions,
  /// and also allows to update the display role (main website team page role)
  UpdateProfile = 2,
  // Delete Profile funcationality doesn't exists, profile can be deleted by manipulating monogodb database for now be devs
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
  /// Allows user X to upload an image on new blog or edit blog page
  // future plan: maybe a page for uploading images by photographers/illustrators/designers and then
  // allow the columnist to use those uploaded image when writing blogs, so work can be done in parallel?
  UploadImage = 14,
  /// Allows user X to delete an image but this is not used anywhere right now and exists for future usecase
  DeleteImage = 15,
  /// Allows user X to update/overwrite an existing image (Example: Update existing blog image with a new one)
  UpdateImage = 16,
  /// Allows user X to create a new edition
  CreateEdition = 17,
  /// Allows user X to update or  an existing edition
  UpdateEdition = 18,
  /// Allows user X to delete an existing edition
  DeleteEdition = 19,
  /// Will send an email to user X when a blog is published
  ReceiveBlogPublishedMail = 20,
}

export default Permission;
