import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      unique: true,
      minLength: [6, "Email must have at least 6 characters"],
      maxLength: [255, "Email can't exceed 255 characters"],
      lowercase: true,
      validate: {
        validator: (v) => /^\S+@\S+\.\S+$/.test(v),
        message: (props) => `${props.value} is not a valid email address!`,
      },
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      trim: true,
      select: false,
      minLength: [8, "Password must be at least 8 characters long"],
      maxLength: [1024, "Password can't exceed 1024 characters"],
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      select: false, // Hide this field in queries by default for security
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
    },
    forgotPasswordToken: {
      type: String,
      select: false,
    },
    forgotPasswordExpires: {
      type: Date,
      select: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
