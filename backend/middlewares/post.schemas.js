import Joi from "joi";

// Define the schema
export const createPostSchema = Joi.object({
  title: Joi.string().min(3).max(100).required().messages({
    "string.base": "Title must be a string",
    "string.empty": "Title cannot be empty",
    "string.min": "Title must be at least 3 characters",
    "string.max": "Title cannot exceed 100 characters",
    "any.required": "Title is required",
  }),

  description: Joi.string().min(10).max(600).required().messages({
    "string.base": "Description must be a string",
    "string.empty": "Description cannot be empty",
    "string.min": "Description must be at least 10 characters",
    "string.max": "Description cannot exceed 500 characters",
    "any.required": "Description is required",
  }),
});
