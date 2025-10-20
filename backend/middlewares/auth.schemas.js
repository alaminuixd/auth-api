import Joi from "joi";

// 📌 Reusable field validators
const emailField = Joi.string()
  .min(6)
  .max(60)
  .required()
  .email({ tlds: { allow: ["com", "net", "org", "io"] } })
  .messages({
    "string.base": "Email must be a string",
    "string.empty": "Email is required",
    "string.email": "Email must be a valid email address",
    "string.min": "Email must be at least 6 characters long",
    "string.max": "Email cannot exceed 60 characters",
  });

const passwordField = Joi.string()
  .min(8)
  .max(128)
  .required()
  .pattern(new RegExp("(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])"))
  .messages({
    "string.pattern.base":
      "Password must include uppercase, lowercase, number, and special character",
    "string.empty": "Password is required",
    "string.min": "Password must be at least 8 characters long",
    "string.max": "Password cannot exceed 128 characters",
  });

// 📌 Auth Schemas
export const signupSchema = Joi.object({
  email: emailField,
  password: passwordField,
});

export const signinSchema = Joi.object({
  email: emailField,
  password: passwordField,
});

export const sendCodeSchema = Joi.object({
  email: emailField,
});

export const acceptCodeSchema = Joi.object({
  email: emailField,
  code: Joi.number().required().messages({
    "number.base": "Code must be a number",
    "any.required": "Code is required",
  }),
});

export const changePasswordSchema = Joi.object({
  oldPassword: passwordField,
  newPassword: passwordField,
});
