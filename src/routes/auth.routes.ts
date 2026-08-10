import { Router } from "express";
import {
  changePasswordController,
  getRolesController,
  getUserList,
  getUsersWithRoles,
  login,
  register,
  updateUserController,
} from "../controllers/auth.controller";
import { authenticateUser, authLimiter } from "../middlewares/auth.middleware";

const router = Router();

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.get('/users', authenticateUser,  getUserList);
router.get("/users-by-roles", getUsersWithRoles);
router.get("/roles", getRolesController);
router.put("/users/:userId", authenticateUser, updateUserController);
router.patch("/change-password/:userId", authenticateUser, changePasswordController);

export default router;
