import Joi from "joi";
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
export const signupSchema = Joi.object({
  email: emailField,
  password: passwordField,
  repassword: Joi.string()
    .required()
    .empty("")
    .valid(Joi.ref("password"))
    .messages({
      "any.only": "Passwords do not match",
      "any.required": "Confirm password is required",
      "string.empty": "Confirm password cannot be empty",
    }),
});

export const signinSchema = Joi.object({
  email: emailField,

  password: passwordField,
});

export const acceptCodeSchema = Joi.object({
  email: Joi.string()
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
    }),
  providedCode: Joi.number().required(),
});

export const changePasswordSchema = Joi.object({
  newPassword: Joi.string()
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
    }),
  oldPassword: Joi.string()
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
    }),
});
