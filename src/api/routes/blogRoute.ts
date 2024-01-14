import express from "express";
import { protect } from "../middlewares/authMiddleware";
import protected_route from "../middlewares/permsMiddlewareInit";
import * as Perm from "../helpers/permissions";
import { approveBlogController, createBlogController, getAllBlogsController, publishBlogController, updateBlogController } from "../controllers/blogController";

const router = express.Router();

//permissions
const createBlogProtect = protected_route([new Perm.CreateBlog()]);
const readBlogProtect = protected_route([new Perm.ReadBlog()]);
const updateBlogProtect = protected_route([new Perm.UpdateBlog()]);
const publishBlogProtect = protected_route([new Perm.PublishBlog()]);

//routes
router.route("/").get(protect, readBlogProtect, getAllBlogsController);
router.route("/create-blog").post(protect, createBlogProtect, createBlogController);
router.route("/update-blog/:id").put(protect, updateBlogProtect, updateBlogController);
router.route("/publish-blog/:id").put(protect, publishBlogProtect, publishBlogController);
router.route("/approve-blog/:id").put(protect, publishBlogProtect, approveBlogController);
// todo: delete blog


export default router;