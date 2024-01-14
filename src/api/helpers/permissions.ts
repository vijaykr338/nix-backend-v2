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
  ReadGallery = 14,
  UpdateGallery = 15,
  DeleteGallery = 16,
  CreateAlbum = 17,
  ReadAlbum = 18,
  UpdateAlbum = 19,
  DeleteAlbum = 20,
  PublishAlbum = 21,
  CreateCategory = 22,
  ReadCategory = 23,
  UpdateCategory = 24,
  DeleteCategory = 25,
  PublishImage = 26,
  CreateCampaign = 27,
  ReadCampaign = 28,
  UpdateCampaign = 29,
  DeleteCampaign = 30,
  SendCampaign = 31,
}

export default Permission;