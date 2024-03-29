import stories from "./stories.json";
import media from "./media.json";
import "colors";
import fs from "fs";

interface OldBlog {
  id: number;
  uuid: string;
  user_id: number;
  title: string;
  biliner: string;
  slug: string;
  body: string;
  status: string;
  category_id: number;
  views: number;
  likes: number;
  meta_title: string;
  meta_description: string;
  deleted_at: string;
  created_at: string;
  updated_at: string;
  published_at: string;
}

interface OldMedia {
  id: number;
  model_type: string;
  model_id: number;
  collection_name: string;
  name: string;
  file_name: string;
  mime_type: string;
  disk: string;
  size: number;
  manipulations: string;
  custom_properties: string;
  responsive_images: string;
  order_column: number;
  created_at: string;
  updated_at: string;
}

const all_stories = (stories as OldBlog[]).map((s) => {
  if (!s.category_id || s.category_id === 12) {
    const title = s.title.toLowerCase();
    if (title.includes("interview")) {
      s.category_id = 11;
    } else if (title.includes("edition")) {
      s.category_id = 13;
    } else {
      s.category_id = 13;
    }
  }
  return s;
});
const old_stories = all_stories.filter(
  (s) => !s.deleted_at && s.status === "published",
);

const old_media = media.map((m) => ({
  ...m,
  model_id: Number(m.model_id),
})) as OldMedia[];

const merged = old_stories.map((story) => {
  const media = old_media.find(
    (m) =>
      (m.model_id === story.id && m.model_type === "App\\Models\\Story") ||
      m.model_type === "App\\Models\\Image",
  );

  if (!media) {
    throw "No cover for story id " + story.id;
  }
  return {
    story,
    media,
  };
});

Promise.all(
  merged.map(async (m) => {
    fs.rename(
      `db/${m.media.id}/${m.media.file_name}`,
      `db/images/${m.media.id}-${m.media.file_name}`,
      (err) => {
        if (err) {
          console.error(err);
        }
      },
    );
  }),
).then(() => {
  console.log("Done".green);
});
