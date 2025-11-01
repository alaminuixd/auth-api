import bcrypt, { hash, compare } from "bcryptjs";
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

export const processHmac = (codeValue, secret) => {
  try {
    //* createHmac first value is "secret" and update with any code
    return crypto.createHmac("sha256", secret).update(codeValue).digest("hex");
  } catch (error) {
    throw new Error({ message: "crypto hmac failed", error });
  }
};
