import Post from "../models/posts.model.js";
import { createPostSchema } from "../middlewares/post.schemas.js";

export const getPosts = async (req, res) => {
  const { page = 1 } = req.query; // default to page 1
  const postPerPage = 10;
  try {
    //Math.max() ensure the number never goes under 0
    const pageNum = Math.max(parseInt(page) - 1, 0); // pageNum starts from 0

    const result = await Post.find()
      .sort({ createdAt: -1 })
      .skip(pageNum * postPerPage)
      .limit(postPerPage)
      .populate({
        path: "userId",
        select: "email",
      });

    res.status(200).json({ message: "posts", data: result });
  } catch (error) {
    res.status(500).json({ message: "Server error! " + error.message });
  }
};

export const getSinglePost = async (req, res) => {
  try {
    res.status(200).json({ message: "Ok" });
  } catch (error) {
    res.status(500).json({ message: "Server error! " + error.message });
  }
};

export const createPost = async (req, res) => {
  const { title, description } = req.body;
  const { id } = req.user;
  try {
    const { error, value } = createPostSchema.validate({ title, description });
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const result = await Post.create({ title, description, userId: id });
    res.status(201).json({ message: "New post created", result });
  } catch (error) {
    res.status(500).json({ message: "Server error! " + error.message });
  }
};

export const updatePost = async (req, res) => {
  try {
    res.status(200).json({ message: "Ok" });
  } catch (error) {
    res.status(500).json({ message: "Server error! " + error.message });
  }
};

export const deletePost = async (req, res) => {
  try {
    res.status(200).json({ message: "Ok" });
  } catch (error) {
    res.status(500).json({ message: "Server error! " + error.message });
  }
};
