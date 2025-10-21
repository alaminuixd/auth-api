import { Router } from "express";
import {
  signup,
  signin,
  signout,
  sendVerificationCode,
  verifyVerificationCode,
  changePassword,
} from "../controllers/auth.controllers.js";
import { identifier } from "../middlewares/identification.js";

const authRouter = Router();

authRouter.post("/signup", signup);
authRouter.post("/signin", signin);
authRouter.post("/signout", identifier, signout);
authRouter.patch("/send-varification-code", identifier, sendVerificationCode);
authRouter.patch(
  "/verify-varification-code",
  identifier,
  verifyVerificationCode
);
authRouter.patch("/change-password", identifier, changePassword);

export default authRouter;
