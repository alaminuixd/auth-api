import User from "../models/users.model.js";
import { signupSchema, signinSchema } from "../middlewares/validator.js";
import { doHash, doHashValidation } from "../utils/hashing.js";
import jwt from "jsonwebtoken";
import { TOKEN_SECRET } from "../config/env.js";

export const createSignup = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { error, value } = signupSchema.validate({ email, password });
    if (error) {
      // error = { "details": [{"message": "\"email\" is required", "others"}]}
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(409)
        .json({ success: false, message: "User already exists" });
    }
    const hashedPassword = await doHash(password, 12);
    const newUser = new User({
      email,
      password: hashedPassword,
    });
    const result = await newUser.save();
    result.password = undefined;
    res.status(201).json({
      success: true,
      message: "Account Created Successfully.",
      result,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error!" });
  }
};

export const getSignin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { error, value } = signinSchema.validate({ email, password });
    if (error) {
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    }
    const existingUser = await User.findOne({ email }).select("+password");
    if (!existingUser) {
      return res
        .status(404)
        .json({ success: false, message: "User doesn't exist" });
    }
    const result = await doHashValidation(password, existingUser.password);
    if (!result) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }
    const token = jwt.sign(
      {
        userId: existingUser._id,
        email: existingUser.email,
        verified: existingUser.verified,
      },
      process.env.TOKEN_SECRET,
      { expiresIn: "7d" }
    );
    console.log(token);
    res
      .cookie("Authorization", "Bearer " + token, {
        expires: new Date(Date.now() + 8 * 3600000),
        httpOnly: process.env.NODE_ENV === "production",
        secure: process.env.NODE_ENV === "production",
      })
      .json({
        success: true,
        token,
        message: "Login success!",
      });
    res.cookie("Authorization", "Bearer " + token, {
      expires: new Date(Date.now() + 8 * 3600000),
      httpOnly: process.env.NODE_ENV === "production",
      secure: process.env.NODE_ENV === "production",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error!" });
  }
};
