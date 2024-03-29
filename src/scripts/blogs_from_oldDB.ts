import stories from "./stories.json";
import media from "./media.json";
import users from "./users.json";
import { Blog, BlogStatus, IBlog } from "../api/models/blogModel";
import { User } from "../api/models/userModel";
import connectDB from "../config/DatabaseConfig";
import "colors";
import mongoose from "mongoose";

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

let no_user_story = 0;

const merged = old_stories.map((story) => {
  const media = old_media.find((m) => m.model_id === story.id);
  const user = users.find((u) => u.id === story.user_id);
  if (!user) {
    console.error("No user for story id " + story.id);
    no_user_story += 1;
  }
  if (!media) {
    throw "No cover for story id " + story.id;
  }
  return {
    story,
    media,
    user: user || null,
  };
});

console.log("Total published stories:", old_stories.length);
console.log("No user stories:", no_user_story);

console.log(merged.length, "stories to be added");

const set_of_categories = new Set(merged.map((m) => m.story.category_id));
console.log("Categories:", set_of_categories);

enum Category {
  Editorial = 0,
  Blog = 1,
  Inteviews = 2,
  Announcements = 3,
}

const category_map = {
  10: Category.Announcements,
  11: Category.Inteviews,
  13: Category.Blog,
  14: Category.Editorial,
};

merged
  .filter((m) => category_map[m.story.category_id] === undefined)
  .forEach((m) => console.log(m.story.title));

async function merge() {
  await connectDB();
  const users_db = await User.find({});

  const new_blogs = merged.map((m) => {
    const story = {
      user:
        users_db.find((u) => u.email === m.user?.email)?._id ||
        "6606be13b226c3e5db8e6639",
      title: m.story.title,
      byliner: m.story.biliner,
      slug: m.story.slug,
      body: m.story.body,
      status: BlogStatus.Published,
      category_id: category_map[m.story.category_id],
      cover: `${m.media.id}-${m.media.file_name}`,
      views: 0,
      likes: 0,
      meta_title: m.story.meta_title,
      meta_description: m.story.meta_description,
      published_at: new Date(m.story.published_at),
      createdAt: new Date(m.story.created_at),
      updatedAt: new Date(m.story.updated_at),
    } as IBlog;
    return story;
  });

  await Blog.insertMany(new_blogs);
  process.exit(0);
}

merge();
