import express from "express";
import cors from "cors";
import { PORT } from "./config/env.js";
import { connectDB } from "./database/mongodb.js";
import authRouter from "./routers/auth.router.js";

const app = express();

app.use(express.json());
app.use(cors());

// routings
app.use("/api/auth", authRouter);

app.listen(PORT, async () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  await connectDB();
});
