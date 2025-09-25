import mongoose from "mongoose";

const usersSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      unique: true, // unique index in MongoDB
      minLength: [5, "Email must have at least 5 characters"],
      maxLength: [255, "Email cannot exceed 255 characters"],
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      trim: true,
      select: false,
      minLength: [8, "Password must be at least 8 characters"],
      maxLength: [1024, "Password cannot exceed 1024 characters"], // allow for hashed passwords
    },
    verified: {
      type: Boolean,
      default: false,
    },
    verificationCode: {
      type: String,
      select: false,
    },
    verificationCodeValidation: {
      type: String,
      select: false,
    },
    forgotPasswordCode: {
      type: String,
      select: false,
    },
    forgotPasswordCodeValidation: {
      type: String,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("User", usersSchema);
