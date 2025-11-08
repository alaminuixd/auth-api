import { Router } from "express";
import multer from "multer";
import {
  signup,
  signin,
  signout,
  // sendVerificationCode,
  // verifyVerificationCode,
  // changePassword,
} from "../controllers/auth.controllers.js";
import { verifyToken } from "../middlewares/verify.token.js";

const authRouter = Router();
const upload = multer();

authRouter.post("/signup", upload.none(), signup);
authRouter.post("/signin", upload.none(), signin);
authRouter.post("/signout", verifyToken, signout);
// authRouter.patch("/send-varification-code", verifyToken, sendVerificationCode);
// authRouter.patch(
//   "/verify-varification-code",
//   verifyToken,
//   verifyVerificationCode
// );
// authRouter.patch("/change-password", verifyToken, changePassword);

export default authRouter;
