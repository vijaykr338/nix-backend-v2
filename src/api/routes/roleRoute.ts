import express from "express";
import { protect } from "../middlewares/authMiddleware";
import {
  add_or_update_role,
  delete_role,
  get_all_roles,
} from "../controllers/roleController";
import protected_route from "../middlewares/permsMiddlewareInit";
import Permission from "../helpers/permissions";
import never_modify_these_roles from "../middlewares/roleMiddleware";

const router = express.Router();

// permission protected middlewares
const updation_protect = protected_route([
  Permission.CreateRole,
  Permission.UpdateRole,
]);
const deletion_protect = protected_route([Permission.DeleteRole]);
// i don't think we need the overhead to protect read operation via perms
const read_protect = protected_route([Permission.ReadRole]);

// routes
router.route("/").get(protect, read_protect, get_all_roles);
router
  .route("/update")
  .post(
    protect,
    updation_protect,
    never_modify_these_roles,
    add_or_update_role,
  );
router
  .route("/delete/:id")
  .delete(protect, deletion_protect, never_modify_these_roles, delete_role);

export default router;
