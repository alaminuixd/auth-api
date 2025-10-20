import { Router } from "express";
import {
  signup,
  signin,
  signout,
  readCookie,
  sendVerificationCode,
  verifyVerificationCode,
} from "../controllers/auth.controllers.js";
import { verifyToken } from "../middlewares/verify.token.js";

const authRouter = Router();

authRouter.post("/signup", signup);
authRouter.post("/signin", signin);
authRouter.post("/signout", verifyToken, signout);
authRouter.patch("/send-verification-code", verifyToken, sendVerificationCode);
authRouter.patch(
  "/verify-verification-code",
  verifyToken,
  verifyVerificationCode
);
authRouter.get("/redcookie", verifyToken, readCookie);

export default authRouter;
