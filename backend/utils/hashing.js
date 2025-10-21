import { hash, compare } from "bcryptjs";
import { createHmac } from "crypto";

// Hash a plain value (like a password)
export const doHash = async (value, saltRounds = 10) => {
  try {
    return await hash(value, saltRounds);
  } catch (err) {
    throw new Error("Hashing failed");
  }
};

// Compare a plain value with a hashed value
export const doHashValidation = async (value, hashedValue) => {
  try {
    return await compare(value, hashedValue);
  } catch (err) {
    throw new Error("Hash comparison failed");
  }
};

//
export const processHmac = (value, key) => {
  try {
    return createHmac("sha256", key).update(value).digest("hex");
  } catch (error) {
    throw new Error("Crypto Hmac failed.");
  }
};
