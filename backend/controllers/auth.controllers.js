import User from "../models/user.model.js";
import { doHash, doHashValidation } from "../utils/hashing.js";

export const signup = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email.trim() || !password.trim()) {
      return res.status(400).json({ message: "Both fields are requird" });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }
    const hashedPassword = await doHash(password, 10);
    const newUser = new User({
      email,
      password: hashedPassword,
    });
    const result = await newUser.save();
    result.password = undefined;
    res.status(201).json({ message: "New user created.", user: newUser });
  } catch (error) {
    res.status(500).json({ message: "Server Error!", error: error.message });
  }
};

export const signin = async () => {
  const { email, password } = req.body;
  try {
  } catch (error) {
    res.status(500).json({ message: "Server Error!", error: error.message });
  }
};
