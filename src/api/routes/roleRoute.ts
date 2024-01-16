import express from "express";
import { protect } from "../middlewares/authMiddleware";
import { add_or_update_role, get_all_roles } from "../controllers/roleController";
import protected_route from "../middlewares/permsMiddlewareInit";
import Permission from "../helpers/permissions";

const router = express.Router();

// permission protected middlewares
const updation_protect = protected_route([Permission.CreateRole, Permission.UpdateRole]);
const deletion_protect = protected_route([Permission.DeleteRole]);
// i don't think we need the overhead to protect read operation via perms
const read_protect = protected_route([Permission.ReadRole]);

// routes
router.route("/")
  .get(protect, read_protect, get_all_roles);
router.route("/update")
  .post(protect, updation_protect, add_or_update_role);

// todo: impl delete route
router.route("/delete")
  .delete(protect, deletion_protect);


export default router;
