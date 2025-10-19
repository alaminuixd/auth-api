import { hash, compare } from "bcryptjs";

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
