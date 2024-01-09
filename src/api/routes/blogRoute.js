import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import protected_route from "../middlewares/permsMiddlewareInit.js";
import * as Perm from "../helpers/permissions.js";
import { createBlogController, getAllBlogsController, publishBlogController, updateBlogController } from "../controllers/blogController.js";

const router = express.Router();

//permissions
const createBlogProtect = protected_route([new Perm.CreateStory()]);
const readBlogProtect = protected_route([new Perm.ReadStory()]);
const updateBlogProtect = protected_route([new Perm.UpdateStory()]);
const publishBlogProtect = protected_route([new Perm.PublishStory()]);

//routes
router.route('/').get(protect, readBlogProtect, getAllBlogsController);
router.route('/create-blog').post(protect, createBlogProtect, createBlogController);
router.route('/update-blog/:id').put(protect, updateBlogProtect, updateBlogController);
router.route('/publish-blog/:id').put(protect, publishBlogProtect, publishBlogController);

export default router;