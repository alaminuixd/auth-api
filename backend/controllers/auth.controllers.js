import jwt from "jsonwebtoken";
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
  const { email, password } = req.body;
  try {
    const { error, value } = signupSchema.validate({ email, password });
    if (error) {
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(409)
        .json({ success: false, message: "User already exitsts!" });
    }
    const hashedPassword = await doHash(password, 12);
    const newUser = new User({
      email,
      password: hashedPassword,
    });
    // save() writes to DB and returns a new document/object (not the same reference) ** check in bin
    const result = await newUser.save();
    result.password = undefined;
    res
      .status(201)
      .json({ success: true, message: "New user created!", newUser });
  } catch (error) {
    console.log(error);
    res.status(201).json({ message: error.message });
  }
};

export const signin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const { error, value } = signinSchema.validate({ email, password });
    if (error) {
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    }
    const existingUser = await User.findOne({ email }).select("+password");
    if (!existingUser) {
      return res
        .status(401)
        .json({ success: false, message: "User doesn't exist!" });
    }
    const validation = await doHashValidation(password, existingUser.password);
    if (!validation) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid Cradentials" });
    }
    const payload = {
      userId: existingUser._id,
      email: existingUser.email,
      verified: existingUser.verified,
    };
    const token = jwt.sign(payload, process.env.TOKEN_SECRET, {
      expiresIn: "8h",
    });
    // response
    res
      .cookie("Authorization", `Bearer ${token}`, {
        expires: new Date(Date.now() + 8 * 3600000), // 8 hours
        // on production mode request with http will fail. But postman has exception
        httpOnly: process.env.NODE_ENV === "production",
        // on production mode request with http will fail. But postman has exception
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict", // optional, improves security
      })
      .json({ success: true, token, message: "Logged in success!" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error!" });
  }
};

export const signout = async (req, res) => {
  try {
    console.log({ context: "req.user: ", user: req?.user });
    res
      .clearCookie("Authorization", {
        httpOnly: process.env.NODE_ENV === "production",
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
      })
      .status(200)
      .json({ success: true, message: "Logged out success" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error in logged out" });
  }
};

export const sendVerificationCode = async (req, res) => {
  const { email } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res
        .status(401)
        .json({ success: false, message: "User does not exist!" });
    }
    // if true
    if (existingUser.verified) {
      return res
        .status(403)
        .json({ success: false, message: "You are already verified!" });
    }

    const codeValue = Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, "0");

    const info = await transport.sendMail({
      from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
      to: existingUser.email,
      subject: "Verification Code",
      html: `<h1>${codeValue}</h1>`,
    });

    if (info.accepted && info.accepted.includes(existingUser.email)) {
      const hashedCodeValue = processHmac(
        codeValue,
        process.env.HMAC_VERIFICATION_CODE_SECRET
      );

      existingUser.verificationCode = hashedCodeValue;
      existingUser.verificationCodeValidation = Date.now();

      await existingUser.save();

      return res
        .status(200)
        .json({ success: true, message: "Code sent successfully!" });
    }

    res.status(400).json({ success: false, message: "Code sending failed." });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error: " + error.message });
  }
};

export const verifyVerificationCode = async (req, res) => {
  const { email, providedCode } = req.body;
  try {
    const { error, value } = acceptCodeSchema.validate({
      email,
      providedCode,
    });
    if (error) {
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    }
    const codeValue = providedCode.toString();
    const existingUser = await User.findOne({ email }).select(
      "+verificationCode + verificationCodeValidation"
    );
    if (!existingUser) {
      return res
        .status(404)
        .json({ success: false, message: "User does not exist!" });
    }
    if (existingUser.verified) {
      return res
        .status(403)
        .json({ success: false, message: "You are already verified" });
    }
    if (
      !existingUser.verificationCode ||
      !existingUser.verificationCodeValidation
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Something is wrong with the code" });
    }
    if (Date.now() - existingUser.verificationCodeValidation > 5 * 60 * 1000) {
      return res
        .status(400)
        .json({ success: false, message: "The code is expired" });
    }
    const hashedCodeValue = processHmac(
      codeValue,
      process.env.HMAC_VERIFICATION_CODE_SECRET
    );
    if (hashedCodeValue === existingUser.verificationCode) {
      existingUser.verified = true;
      existingUser.verificationCode = undefined;
      existingUser.verificationCodeValidation = undefined;
      await existingUser.save();
      return res
        .status(200)
        .json({ success: true, message: "Your account has been verified" });
    }
    res
      .status(400)
      .json({ success: false, message: "Invalid verification code" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error: " + error.message });
  }
};

export const changePassword = async (req, res) => {
  const { userId, verified } = req.user;
  const { oldPassword, newPassword } = req.body;
  try {
    const { error, value } = changePasswordSchema.validate({
      newPassword,
      oldPassword,
    });
    if (error) {
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    }
    if (!verified) {
      return res
        .status(401)
        .json({ success: false, message: "Sorry! you are not verified user!" });
    }
    const existingUser = await User.findOne({ _id: userId }).select(
      "+password"
    );
    if (!existingUser) {
      return res
        .status(401)
        .json({ success: false, message: "User not found!" });
    }
    const result = await doHashValidation(oldPassword, existingUser.password);
    if (!result) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid cradentials" });
    }
    const hashedPassword = await doHash(newPassword, 12);
    existingUser.password = hashedPassword;
    await existingUser.save();
    res.status(200).json({
      success: true,
      message: "Password changed successfully!",
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error: " + error.message });
  }
};

export const sendForgotPasswordCode = async (req, res) => {
  const { email } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res
        .status(401)
        .json({ success: false, message: "User does not exist!" });
    }
    const codeValue = Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, "0");

    const info = await transport.sendMail({
      from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
      to: existingUser.email,
      subject: "Forgot password Code",
      html: `<h1>${codeValue}</h1>`,
    });

    if (info.accepted && info.accepted.includes(existingUser.email)) {
      const hashedCodeValue = processHmac(
        codeValue,
        process.env.HMAC_VERIFICATION_CODE_SECRET
      );

      existingUser.forgotPasswordCode = hashedCodeValue;
      existingUser.forgotPasswordCodeValidation = Date.now();

      await existingUser.save();

      return res
        .status(200)
        .json({ success: true, message: "Code sent successfully!" });
    }

    return res
      .status(400)
      .json({ success: false, message: "Code sending failed." });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error: " + error.message });
  }
};

export const verifyForgotPasswordCode = async (req, res) => {
  const { email, providedCode, newPassword } = req.body;
  try {
    const { error, value, newPassword } = acceptCodeSchema.validate({
      email,
      providedCode,
    });
    if (error) {
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    }
    const codeValue = providedCode.toString();
    const existingUser = await User.findOne({ email }).select(
      "+verificationCode + verificationCodeValidation"
    );
    if (!existingUser) {
      return res
        .status(404)
        .json({ success: false, message: "User does not exist!" });
    }
    if (existingUser.verified) {
      return res
        .status(403)
        .json({ success: false, message: "You are already verified" });
    }
    if (
      !existingUser.verificationCode ||
      !existingUser.verificationCodeValidation
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Something is wrong with the code" });
    }
    if (Date.now() - existingUser.verificationCodeValidation > 5 * 60 * 1000) {
      return res
        .status(400)
        .json({ success: false, message: "The code is expired" });
    }
    const hashedCodeValue = processHmac(
      codeValue,
      process.env.HMAC_VERIFICATION_CODE_SECRET
    );
    if (hashedCodeValue === existingUser.verificationCode) {
      existingUser.verified = true;
      existingUser.verificationCode = undefined;
      existingUser.verificationCodeValidation = undefined;
      await existingUser.save();
      return res
        .status(200)
        .json({ success: true, message: "Your account has been verified" });
    }
    res
      .status(400)
      .json({ success: false, message: "Invalid verification code" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error: " + error.message });
  }
};
