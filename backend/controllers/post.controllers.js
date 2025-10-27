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
  // const { _id } = req.query;
  const { id } = req.params;
  try {
    const singlePost = await Post.findOne({ _id: id }).populate({
      path: "userId",
      select: "email",
    });
    if (!singlePost) {
      return res.status(404).json({ message: "Not found!" });
    }
    res.status(200).json({ message: "singlePost", singlePost });
  } catch (error) {
    res.status(500).json({ message: "Server error! " + error.message });
  }
};

export const createPost = async (req, res) => {
  const { title, description } = req.body;
  // req.user is comming from jwt "verifyToken" middleware
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

export const updatePostXX = async (req, res) => {
  const { queryId } = req.query;
  const { title, description } = req.body;
  const { id } = req.user;

  try {
    const { error } = createPostSchema.validate({ title, description });
    if (error)
      return res.status(400).json({ message: error.details[0].message });

    const existingPost = await Post.findOne({ queryId });
    if (!existingPost)
      return res.status(404).json({ message: "Post not found!" });

    if (existingPost.userId.toString() !== id)
      return res.status(403).json({ message: "Unauthorized" });

    existingPost.title = title;
    existingPost.description = description;

    const result = await existingPost.save();
    res.status(200).json({ message: "Post Updated", result });
  } catch (error) {
    res.status(500).json({ message: "Server error! " + error.message });
  }
};

export const updatePost = async (req, res) => {
  const { id } = req.params; // post ID from URL
  const { title, description } = req.body; // new post data
  const { id: userId } = req.user; // logged-in user's ID (from JWT)

  try {
    // ✅ Validate input fields using Joi schema
    const { error, value } = createPostSchema.validate({ title, description });
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    // 🔍 Find the post in the database by its ID
    const existingPost = await Post.findOne({ _id: id });

    // ⚠️ If post doesn't exist, return 404
    if (!existingPost) {
      return res.status(404).json({ message: "Post not found!" });
    }

    // 🔐 Ensure the logged-in user owns this post
    // match loggedin user's userId, from jwt token payload, to existingPost userId
    if (userId !== existingPost.userId.toString()) {
      return res.status(403).json({ message: "Unauthorized!" });
    }

    // 📝 Update post fields
    existingPost.title = title;
    existingPost.description = description;

    // 💾 Save updated post to database
    const result = await existingPost.save();

    res.status(200).json({ message: "Post updated", result });
  } catch (error) {
    // ❌ Handle unexpected server errors
    res.status(500).json({ message: "Server error! " + error.message });
  }
};

export const deletePost = async (req, res) => {
  const { id } = req.params;
  const { id: userId } = req.user; // optional: to check ownership

  try {
    // 🔍 Find post by ID
    const existingPost = await Post.findById(id);
    if (!existingPost) {
      return res.status(404).json({ message: "Post doesn't exist!" });
    }

    // 🔐 Optional: verify that the logged-in user owns the post
    if (userId !== existingPost.userId.toString()) {
      return res.status(403).json({ message: "Unauthorized!" });
    }

    // 🗑️ Delete the post
    await Post.deleteOne({ _id: id });

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error! " + error.message });
  }
};
