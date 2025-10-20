import { hash, compare } from "bcryptjs";
import crypto from "crypto";

export const doHash = async (value, salt = 10) => {
  try {
    return await hash(value, salt);
  } catch (error) {
    throw new Error(`Hashing failed. Error: ${error}`);
  }
};

export const doHashValidation = async (value, hashedValue) => {
  try {
    return await compare(value, hashedValue);
  } catch (error) {
    throw new Error(`Hashing comparison failed. Error: ${error}`);
  }
};

export const processHmac = (key, value) => {
  try {
    return crypto.createHmac("sha256", key).update(value).digest("hex");
  } catch (error) {
    throw new Error({ message: "crypto hmac failed", error });
  }
};
