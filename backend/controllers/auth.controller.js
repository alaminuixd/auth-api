import User from "../models/users.model.js";
import {
  signupSchema,
  signinSchema,
  acceptCodeSchema,
} from "../middlewares/validator.js";
import { doHash, doHashValidation, hmacProcess } from "../utils/hashing.js";
import jwt from "jsonwebtoken";
import { TOKEN_SECRET } from "../config/env.js";
import { transport } from "../middlewares/send.mail.js";

export const createSignup = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { error, value } = signupSchema.validate({ email, password });
    if (error) {
      // error = { "details": [{"message": "\"email\" is required", "others"}, ]}
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
    console.log(process.env.NODE_ENV);
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error!" });
  }
};

export const getSignout = async (req, res) => {
  try {
    res
      .clearCookie("Authorization")
      .status(200)
      .json({ success: true, message: "Logout Success!" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error!" });
  }
};

export const sendVerificationCode = async (req, res) => {
  const { email } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    // user doesn't exist as it did not register.
    if (!existingUser) {
      return res
        .status(404)
        .json({ success: false, message: "User doesn't exist" });
    }
    if (existingUser.verified) {
      return res
        .status(404)
        .json({ success: false, message: "You are already verified" });
    }
    const codeValue = Math.floor(Math.random() * 1000000).toString();
    let info = await transport.sendMail({
      from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
      to: existingUser.email,
      subject: "Verification code",
      html: "<h1>" + codeValue + "</h1> <p>Please do not share this code</p>",
    });
    if (info.accepted[0] === existingUser.email) {
      const hashedCodeValue = hmacProcess(
        codeValue,
        process.env.HMAC_VERIFICATION_CODE_SECRET
      );
      existingUser.verificationCode = hashedCodeValue;
      existingUser.verificationCodeValidation = Date.now();
      await existingUser.save();
      return res.status(200).json({ success: true, message: "Code sent!" });
    }
    res.status(400).json({ success: false, message: "Code send failed!" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error!" });
  }
};

export const verifyVerificationCode = async (req, res) => {
  const { email, providedCode } = req.body;
  const { error, value } = acceptCodeSchema.validate({ email, providedCode });
  if (error) {
    return res
      .status(400)
      .json({ success: false, message: error.details[0].message });
  }
  const codeValue = providedCode.toString();
  const existingUser = User.findOne({ email });
  if (!existingUser) {
    return res.status(404).json({ success: false, message: "User not found!" });
  }
  if (existingUser.verified) {
    return res
      .status(403)
      .json({ success: false, message: "You are alreday verified" });
  }
  if (
    !existingUser.verificationCode ||
    !existingUser.verificationCodeValidation
  ) {
    return res.status(400).json({ success: false, message: "Something wrong" });
  }
  try {
  } catch (error) {}
};
