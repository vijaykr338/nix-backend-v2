import { ImageType } from "../middlewares/imageMiddleware";

export interface GenerateThumbnailOptions {
  image_type?: ImageType;
  image_dimensions: number;
}

export interface ThumbnailOptions {
  og_filename: string;
  image_type: ImageType;
  thumbnail_type?: string;
}

export interface DeleteImageOptions {
  only_thumbnail?: boolean;
}

export const dimension_map = (image_type: ImageType | undefined) => {
  switch (image_type) {
    case ImageType.Avatar:
      // interesting, what is observed is 128x128 is taking more storage than 256x256 :/
      return 256;
    case ImageType.Edition:
      return 256;
    case ImageType.General:
      return 512;
    default:
      return 256;
  }
};
