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
  changePasswordSchema,
  verifyForgetPasswordSchema,
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
        expires: new Date(Date.now() + 8 * 3600000), // 8 hours
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
    console.log(req.user);
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
    // return {  accepted: ['recipient@example.com'], rejected: [], ....}
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
      existingUser.emailVerificationExpires = new Date(
        Date.now() + 5 * 60 * 1000
      );
      existingUser.emailVerificationExpires = Date.now() + 5 * 60 * 1000;
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
    if (Date.now() > existingUser.emailVerificationExpires) {
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

export const changePassword = async (req, res) => {
  const { id } = req.user;
  const { oldPassword, newPassword } = req.body;

  try {
    // Validate input
    const { error } = changePasswordSchema.validate({
      oldPassword,
      newPassword,
    });
    if (error)
      return res.status(400).json({ message: error.details[0].message });

    // Fetch user from DB
    const existingUser = await User.findById(id).select(
      "+password emailVerified"
    );
    if (!existingUser)
      return res.status(404).json({ message: "User not found!" });
    if (!existingUser.emailVerified)
      return res.status(403).json({ message: "Email not verified." });

    // Check old password
    const valid = await doHashValidation(oldPassword, existingUser.password);
    if (!valid)
      return res.status(401).json({ message: "Invalid old password!" });

    // Prevent password reuse
    const isSamePassword = await doHashValidation(
      newPassword,
      existingUser.password
    );
    if (isSamePassword)
      return res
        .status(400)
        .json({ message: "New password cannot be same as old password." });

    // Save new password
    existingUser.password = await doHash(newPassword);
    await existingUser.save();

    res.status(200).json({ message: "Password changed successfully!" });
  } catch (err) {
    console.error(err); // internal logging
    res.status(500).json({ message: "Server Error!" });
  }
};

export const sendForgetPasswordCode = async (req, res) => {
  const { email } = req.body;

  try {
    // Joi validation
    const { error } = sendCodeSchema.validate({ email });
    if (error)
      return res.status(400).json({ message: error.details[0].message });

    const existingUser = await User.findOne({ email });

    // Respond generically to avoid email enumeration
    if (!existingUser) {
      return res
        .status(200)
        .json({ message: "If this email exists, a code has been sent." });
    }

    // Generate 6-digit code
    const codeValue = Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, "0");

    // Send mail return {  accepted: ['recipient@example.com'], rejected: [], ....}
    const mailRes = await transport.sendMail({
      from: EMAIL_USER,
      to: existingUser.email,
      subject: "Forgot password verification code",
      html: `<h1>${codeValue}</h1>`,
    });

    if (!mailRes?.accepted?.includes(existingUser.email)) {
      return res
        .status(500)
        .json({ message: "Failed to send code. Try again later." });
    }

    // Save hashed token + expiry
    existingUser.forgotPasswordToken = processHmac(codeValue, HMAC_SECRET);
    existingUser.forgotPasswordExpires = new Date(Date.now() + 5 * 60 * 1000);
    await existingUser.save();

    return res
      .status(200)
      .json({ message: "If this email exists, a code has been sent." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error!" });
  }
};

export const verifyForgetPasswordCode = async (req, res) => {
  const { email, providedCode, newPassword } = req.body;

  try {
    // Validate input
    const { error } = verifyForgetPasswordSchema.validate({
      email,
      providedCode,
      newPassword,
    });
    if (error)
      return res.status(400).json({ message: error.details[0].message });

    const existingUser = await User.findOne({ email }).select(
      "+forgotPasswordToken +forgotPasswordExpires +password"
    );
    if (!existingUser)
      return res.status(400).json({ message: "Invalid credentials" });

    if (
      !existingUser.forgotPasswordToken ||
      !existingUser.forgotPasswordExpires
    ) {
      return res.status(400).json({ message: "Something went wrong!" });
    }

    if (Date.now() > new Date(existingUser.forgotPasswordExpires).getTime()) {
      return res.status(400).json({ message: "The code is expired!" });
    }

    const hashedCodedValue = processHmac(providedCode, HMAC_SECRET);

    if (hashedCodedValue === existingUser.forgotPasswordToken) {
      const hashNewPassword = await doHash(newPassword);
      existingUser.password = hashNewPassword;
      existingUser.forgotPasswordToken = undefined;
      existingUser.forgotPasswordExpires = undefined;
      await existingUser.save();
      return res.status(200).json({ message: "Password updated!" });
    }

    return res.status(400).json({ message: "Invalid code!" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server Error!" });
  }
};
