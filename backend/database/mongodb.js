import mongoose from "mongoose";
import { MONGO_URI, NODE_ENV } from "../config/env.js";
if (!MONGO_URI) {
  throw new Error("Please provide MONGO_URI environment variable");
}
if (!NODE_ENV) {
  throw new Error("Please provide NODE_ENV");
}

const connectToDatabase = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log(`Connected to the Database ${NODE_ENV} mode`);
  } catch (error) {
    console.error("Error connecting to Database", error);
    process.exit(1);
  }
};

export default connectToDatabase;
