import express from "express";

import {
    deleteEdition,
    getAllEditions,
    getPublishedEditions,
    upsertEdition,
} from "../controllers/editionController";
import Permission from "../helpers/permissions";
import { protect } from "../middlewares/authMiddleware";
import protected_route from "../middlewares/permsMiddlewareInit";

const router = express.Router();

const createProtect = protected_route([Permission.CreateEdition]);
const updateProtect = protected_route([Permission.UpdateEdition]);
const deleteProtect = protected_route([Permission.DeleteEdition]);

router.route("/").get(protect, getAllEditions);

// for the main dtutimes frontend
router.route("/published-editions").get(getPublishedEditions);

router.route("/create-edition").post(protect, createProtect, upsertEdition);
router.route("/update-edition/:id").put(protect, updateProtect, upsertEdition);

router
  .route("/delete-edition/:id")
  .delete(protect, deleteProtect, deleteEdition);

export default router;
