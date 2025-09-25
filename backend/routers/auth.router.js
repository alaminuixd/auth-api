import { Router } from "express";
import { createSignup, getSignin } from "../controllers/auth.controller.js";

const authRouter = Router();

authRouter.post("/signup", createSignup);
authRouter.post("/signin", getSignin);

export default authRouter;
