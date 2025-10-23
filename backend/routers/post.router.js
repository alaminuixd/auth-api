import { Router } from "express";
import { verifyToken } from "../middlewares/verify.token.js";
import {
  createPost,
  deletePost,
  getPosts,
  getSinglePost,
  updatePost,
} from "../controllers/post.controllers.js";

const postRouter = Router();

postRouter.get("/get-all-posts", getPosts);
postRouter.get("/get-single-post", getSinglePost);
postRouter.post("/create-post", verifyToken, createPost);
postRouter.put("/update-post", updatePost);
postRouter.delete("/delete-post", deletePost);

export default postRouter;
