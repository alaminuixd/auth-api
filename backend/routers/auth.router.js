import { Router } from "express";
import { signup } from "../controllers/auth.controllers.js";

const authRouter = Router();

authRouter.post("/signup", signup);

export default authRouter;
