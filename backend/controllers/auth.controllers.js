import jwt from "jsonwebtoken";
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
} from "../middlewares/auth.schemas.js";

// ************************ ROUTES ************************************
export const signup = async (req, res) => {
  const { email, password } = req.body;
  try {
    const { error, value } = signupSchema.validate({ email, password });
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
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
    const { error, value } = signinSchema.validate({ email, password });
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
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
      emailVerified: existingUser.emailVerified,
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

export const sendVerificationCode = async (req, res) => {
  const { email } = req.body;
  try {
    const { error, value } = sendCodeSchema.validate({ email });
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res.status(401).json({ message: "Invalid user!" });
    }
    if (existingUser.emailVerified) {
      return res.status(403).json({ message: "You are already verified!" });
    }
    // prepare code to be sent to the mail
    const codeValue = Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, "0");
    // return {  accepted: ['recipient@example.com'], rejected: [],  envelopeTime: 123, ....}
    const mailRes = await transport.sendMail({
      from: EMAIL_USER,
      to: email,
      subject: "Mail verification code!",
      html: `<h1>${codeValue}</h1>`,
    });

    console.log(mailRes);
    if (mailRes.accepted && mailRes.accepted.includes(existingUser.email)) {
      const hashedCodeValue = processHmac(codeValue, HMAC_SECRET);
      existingUser.emailVerificationToken = hashedCodeValue;
      existingUser.emailVerificationExpires = new Date();
      await existingUser.save();
      return res.status(200).json({ message: "Code sent!" });
    }
    res.status(400).json({ message: "Code sent failed!" });
  } catch (error) {
    res.status(500).json({ message: "Server Error!", error: error.message });
  }
};

export const verifyVerificationCode = async (req, res) => {
  const { email, code } = req.body;
  try {
    const { error, value } = acceptCodeSchema.validate({ email, code });
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const codeValue = code.toString();
    const existingUser = await User.findOne({ email }).select(
      "+emailVerificationToken +emailVerificationExpires"
    );
    if (!existingUser) {
      return res.status(404).json({ message: "User not found!" });
    }
    if (existingUser.emailVerified) {
      return res.status(403).json({ message: "You are already verified!" });
    }
    if (
      !existingUser.emailVerificationToken ||
      !existingUser.emailVerificationExpires
    ) {
      return res
        .status(400)
        .json({ message: "something wrong with the code." });
    }
    if (Date.now() - existingUser.emailVerificationExpires > 5 * 600 * 1000) {
      return res.status(400).json({ message: "The code is expired!" });
    }
    const hashedCode = processHmac(codeValue, HMAC_SECRET);
    if (hashedCode === existingUser.emailVerificationToken) {
      existingUser.emailVerified = true;
      existingUser.emailVerificationToken = undefined;
      existingUser.emailVerificationExpires = undefined;
      await existingUser.save();
      return res
        .status(200)
        .json({ message: "Your account has been verified" });
    }
    res.status(400).json({ message: "Invalid code!" });
  } catch (error) {
    res.status(500).json({ message: "Server error: " + error.message });
  }
};

export const vvc = async () => {
  const { email, code } = req.body;
  try {
    const { error, value } = acceptCodeSchema.validate({ email, code });
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const codeValue = code.toString();
    const existingUser = await User.findOne({ email });
  } catch (error) {}
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
