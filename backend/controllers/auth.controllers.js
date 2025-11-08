import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import {
  ACCESS_TOKEN_SECRET,
  NODE_ENV,
  REFRESH_TOKEN_SECRET,
} from "../config/env.js";
import {
  signupSchema,
  signinSchema,
  acceptCodeSchema,
  changePasswordSchema,
} from "../middlewares/validator.js";
import User from "../models/users.model.js";
import { doHash, doHashValidation, processHmac } from "./../utils/hashing.js";
import { transport } from "../middlewares/send.mail.js";
// Constroller functions
export const signup = async (req, res) => {
  const { email, password, repassword } = req.body;
  const session = await mongoose.startSession();
  try {
    const { error } = signupSchema.validate({ email, password, repassword });
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const normalizedEmail = email.trim().toLowerCase();
    // Start transaction
    session.startTransaction();
    const existingUser = await User.findOne({ email: normalizedEmail }).session(
      session
    );
    // Check for existing user and if verification expired
    if (existingUser) {
      if (existingUser.emailVerified) {
        await session.abortTransaction();
        return res
          .status(409)
          .json({ message: "You are already a verified user!" });
      }
      const codeExpired =
        existingUser.createdAt < new Date(Date.now() - 24 * 60 * 60 * 1000);
      if (!codeExpired) {
        await session.abortTransaction();
        return res.status(400).json({
          message:
            "Please verify your mail using the code we've already sent to your email",
          action: "send_verification_code",
          email: existingUser.email,
        });
      }
      await existingUser.deleteOne({ session });
    }
    const hashedPassword = await doHash(password);
    const newUser = new User({
      email: normalizedEmail,
      password: hashedPassword,
    });
    await newUser.save({ session });
    await session.commitTransaction();
    // Prepare safe response
    const userResponse = newUser.toObject();
    delete userResponse.password;
    delete userResponse.__v;

    return res.status(201).json({ message: "New user created!", userResponse });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ message: "Server error!", error: error.message });
  } finally {
    session.endSession();
  }
};

export const signin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const { error } = signinSchema.validate({ email, password });
    if (error)
      return res.status(400).json({ message: error.details[0].message });
    const existingUser = await User.findOne({ email }).select("+password");
    if (!existingUser)
      return res.status(404).json({ message: "Invalid credentials!" });
    const validPass = await doHashValidation(password, existingUser.password);
    if (!validPass) {
      return res.status(400).json({ message: "Invalid password!" });
    }
    const payload = {
      id: existingUser._id,
      email: existingUser.email,
      emailVerified: existingUser.emailVerified,
    };
    const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET, {
      expiresIn: "15m",
    });
    const refreshToken = jwt.sign(payload, REFRESH_TOKEN_SECRET, {
      expiresIn: "7d",
    });
    // Send refreshToken in httpOnly cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: NODE_ENV === "production" ? true : false,
      secure: NODE_ENV === "production" ? true : false, // false in dev
      sameSite: NODE_ENV === "production" ? "None" : "Lax",
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    // Send accessToken in response
    res.status(200).json({ message: "login Success", accessToken });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const signout = async (req, res) => {
  try {
    res
      .clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
      })
      .status(200)
      .json({ message: "Signout success!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
