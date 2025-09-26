import { Router } from "express";
import {
  createSignup,
  getSignin,
  getSignout,
  sendVerificationCode,
} from "../controllers/auth.controller.js";

const authRouter = Router();

authRouter.post("/signup", createSignup);
authRouter.post("/signin", getSignin);
authRouter.post("/signout", getSignout);
authRouter.patch("/send-verification-code", sendVerificationCode);

export default authRouter;
