import { Router } from "express";
import {
  changePasswordController,
  getUserList,
  getUsersWithRoles,
  login,
  register,
  updateUserController,
} from "../controllers/auth.controller";
import { authenticateUser } from "../middlewares/auth.middleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get('/users',  getUserList);
router.get("/users-by-roles", getUsersWithRoles);
router.put("/users/:userId", updateUserController);
router.patch("/change-password/:userId", changePasswordController);

export default router;
