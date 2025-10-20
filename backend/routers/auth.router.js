import { Router } from "express";
import {
  signup,
  signin,
  signout,
  readCookie,
  sendVerificationCode,
} from "../controllers/auth.controllers.js";

const authRouter = Router();

authRouter.post("/signup", signup);
authRouter.post("/signin", signin);
authRouter.post("/signout", signout);
authRouter.patch("/send-verification-code", sendVerificationCode);
authRouter.get("/redcookie", readCookie);

export default authRouter;
