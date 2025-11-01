import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/user.model.js";
import { doHash, doHashValidation, processHmac } from "../utils/hashing.js";
import {
  TOKEN_SECRET,
  NODE_ENV,
  EMAIL_USER,
  HMAC_SECRET,
} from "../config/env.js";
import { transport } from "../middlewares/send.mail.js";
import {
  sendCodeSchema,
  signinSchema,
  signupSchema,
  acceptCodeSchema,
  changePasswordSchema,
  verifyForgetPasswordSchema,
} from "../middlewares/auth.schemas.js";

/* 
Logic follow:
1. Validate input (email & password) using signupSchema
2. Start a MongoDB session & transaction
3. Check if a user with the email already exists
    a. If user exists and is verified → abortTransiction & return conflict
    b. If user exists but verification code is not expired → abortTransiction & ask to verify
    c. If user exists but code expired → delete the user
4. Hash the password
5. Create a new user document in the database (within the transaction)
6. Remove password from the response object
7. Commit the transaction
8. Return success response with new user
9. Handle errors → abort transaction & return server error
10. End the session
 */
export const signup = async (req, res) => {
  const { email, password } = req.body;
  const session = await mongoose.startSession();
  try {
    const { error } = signupSchema.validate({ email, password });
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    session.startTransaction();
    const existingUser = await User.findOne({ email }, { session });
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
            "Please verify using the code we've already sent to your email",
          action: "send_verification_code",
          email: existingUser.email,
        });
      }
      await existingUser.deleteOne({ session });
    }
    const hashedPassword = await doHash(password);
    const newUser = await User.create(
      { email, password: hashedPassword },
      {
        session,
      }
    );
    newUser.password = undefined;
    await session.commitTransaction();
    return res.status(201).json({ message: "New user created!", newUser });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ message: "Server error!", error: error.message });
  } finally {
    session.endSession();
  }
};

// Logic flow:
// 1. Validate input → 2. Find user → 3. Verify password →
// 4. Generate JWT → 5. Set cookie → 6. Send response
export const signin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const { error } = signinSchema.validate({ email, password });
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const existingUser = await User.findOne({ email }).select("+password");
    if (!existingUser) {
      return res.status(404).json({ message: "Invalid cradentials!" });
    }
    const validPassword = await doHashValidation(
      password,
      existingUser.password
    );
    if (!validPassword) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const payload = {
      id: existingUser._id,
      email: existingUser.email,
      emailVerified: existingUser.emailVerified,
    };
    const EXPIRY_DURATION = 5;
    const token = jwt.sign(payload, TOKEN_SECRET, {
      expiresIn: `${EXPIRY_DURATION}h`,
    });
    existingUser.password = undefined;
    res
      .cookie("Authorization", `Bearer ${token}`, {
        expires: new Date(Date.now() + EXPIRY_DURATION * 3600000),
        httpOnly: NODE_ENV === "production",
        secure: NODE_ENV === "production",
        sameSite: "Strict",
      })
      .status(200)
      .json({ message: "Login Success!", existingUser, token });
  } catch (error) {
    res.status(500).json({ message: "Server error!", error: error.message });
  }
};
// Logic flow: Clear JWT cookie → Send success response → Handle errors
export const signout = async (req, res) => {
  try {
    res
      .clearCookie("Authorization", {
        httpOnly: NODE_ENV === "production",
        secure: NODE_ENV === "production",
        sameSite: "Strict",
      })
      .status(200)
      .json({ message: "Logout Success" });
  } catch (error) {
    res.status(500).json({ message: "Server error!", error: error.message });
  }
};
// Logic flow: Validate email → Find user → Generate 6-digit code → Send email → Hash code & save to user → Respond with success/failure
export const sendVerificationCode = async (req, res) => {
  const { email } = req.body;
  try {
    const { error } = sendCodeSchema.validate({ email });
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const existingUser = await User.findOne({ email }).select(
      "+emailVerificationToken +emailVerificationExpires"
    );
    if (!existingUser) {
      return res.status(404).json({ message: "Invalid credentials!" });
    }
    const codeValue = Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, "0");
    const mailRes = await transport.sendMail({
      from: EMAIL_USER,
      to: existingUser.email,
      subject: "Email Velidatin Code",
      html: `<h1>${codeValue}</h1>`,
    });
    if (mailRes?.accepted?.includes(existingUser.email)) {
      const hashCode = processHmac(codeValue, HMAC_SECRET);
      existingUser.emailVerificationToken = hashCode;
      existingUser.emailVerificationExpires = new Date(
        Date.now() + 5 * 60 * 1000
      );
      await existingUser.save();
      return res
        .status(200)
        .json({ message: "Code sent! Please check your mail." });
    }
    return res.status(400).json({ message: "Failed sending mail!" });
  } catch (error) {
    res.status(500).json({ message: "Server Error!", error: error.message });
  }
};
// Logic flow: Validate input → Find user → Check if already verified → Check token & expiry → Check code validity → Update user verification → Respond success/failure
export const verifyVerificationCode = async (req, res) => {
  const { email, code } = req.body;
  try {
    const { error } = acceptCodeSchema.validate({ email, code });
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const existingUser = await User.findOne({ email }).select(
      "+emailVerificationToken +emailVerificationExpires"
    );
    if (!existingUser) {
      return res.status(404).json({ message: "Invalid credentials!" });
    }
    if (existingUser.emailVerified) {
      return res.status(409).json({ message: "You are already verified!" });
    }
    if (
      !existingUser.emailVerificationToken ||
      !existingUser.emailVerificationExpires
    ) {
      return res.status(400).json({ message: "Something is wrong with code!" });
    }
    if (Date.now() > existingUser.emailVerificationExpires.getTime()) {
      return res.status(400).json({ message: "Verification code expired!" });
    }
    const hashedCode = processHmac(code.toString(), HMAC_SECRET);
    if (hashedCode === existingUser.emailVerificationToken) {
      existingUser.emailVerified = true;
      existingUser.emailVerificationToken = undefined;
      existingUser.emailVerificationExpires = undefined;
      await existingUser.save();
      return res.status(200).json({ message: "Email verified successfully!" });
    }
    return res.status(400).json({ message: "Invalid code!" });
  } catch (error) {
    res.status(500).json({ message: "Server error: " + error.message });
  }
};
