import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
// custom modules imports
import { SERVER_PORT } from "./config/env.js";
import connectToDatabase from "./database/mongodb.js";
import authRouter from "./routers/auth.router.js";

const app = express();
const PORT = SERVER_PORT || 3009;

app.use(
  cors({
    origin: "http://localhost:5173", // your React app URL
    credentials: true, // 👈 Allow cookies to be sent
  })
);
app.use(helmet());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
console.log("Node is running on ", process.env.NODE_ENV, " mode.");
// CRUD ROUTES
app.use("/api/auth", authRouter);

app.listen(PORT, async () => {
  console.log(`App is running on http://localhost:${PORT}`);
  await connectToDatabase();
});
