import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { doHash, doHashValidation } from "../utils/hashing.js";
import { TOKEN_SECRET, NODE_ENV } from "../config/env.js";
import { transport } from "../middlewares/send.mail.js";

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

export const signin = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email.trim() || !password.trim()) {
      return res.status(400).json({ message: "Both fields are requird" });
    }

    const existingUser = await User.findOne({ email }).select("+password");

    if (!existingUser) {
      return res.status(404).json({ message: "User not found!" });
    }

    const isValidPassword = await doHashValidation(
      password,
      existingUser.password
    );

    if (!isValidPassword) {
      return res.status(400).json({ message: "Invalid password!" });
    }

    const payload = {
      id: existingUser._id,
      email: existingUser.email,
      isEmailVerified: existingUser.isEmailVerified,
    };

    const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: "5h" });

    res
      .cookie("Authorization", `Bearer ${token}`, {
        expiresIn: new Date(Date.now() + 8 * 3600000),
        httpOnly: NODE_ENV === "production",
        secure: NODE_ENV === "production",
        sameSite: "Strict",
      })
      .json({ message: "Login Success!" });
  } catch (error) {
    res.status(500).json({ message: "Server Error!", error: error.message });
  }
};

export const sendVerificationCode = async (req, res) => {
  const { email } = req.body;
  try {
  } catch (error) {}
};

export const signout = async (req, res) => {
  try {
    res
      .clearCookie("Authorization", {
        httpOnly: NODE_ENV === "production",
        secure: NODE_ENV === "production",
        sameSite: "Strict",
      })
      .status(200)
      .json({ message: "Logout success!" });
  } catch (error) {
    res.status(500).json({ message: "Server Error!", error: error.message });
  }
};

export const readCookie = async (req, res) => {
  try {
    const headersCookie = req.headers.cookie;
    if (!headersCookie) {
      return res.status(200).json({ cookie: null });
    }
    // convert cookie strings to an object
    console.log(headersCookie);
    const cookies = {};
    headersCookie.split(";").forEach((cookie) => {
      const [name, value] = cookie.trim().split("=");
      cookies[name] = value;
    });

    res.status(200).json({ headersCookie, cookies });
  } catch (error) {
    res.status(500).json({ message: "Server Error!", error: error.message });
  }
};
