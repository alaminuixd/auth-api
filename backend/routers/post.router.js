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

postRouter.get("/all-posts", getPosts);
postRouter.get("/single-post/:id", getSinglePost);
// postRouter.get("/get-single-post", getSinglePost);
postRouter.post("/create-post", verifyToken, createPost);
postRouter.patch("/update-post/:id", verifyToken, updatePost);
postRouter.delete("/delete-post/:id", verifyToken, deletePost);

export default postRouter;
