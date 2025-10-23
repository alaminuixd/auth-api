import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { PORT } from "./config/env.js";
import { connectDB } from "./database/mongodb.js";
import authRouter from "./routers/auth.router.js";
import postRouter from "./routers/post.router.js";
import __rootpath from "./utils/root.path.js";

const app = express();

app.use(cors());
app.use(helmet());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// routings
app.use("/api/auth", authRouter);
app.use("/api/posts", postRouter);

app.listen(PORT, async () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  await connectDB();
});
