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

/* app.post("/api/auth/signin", (req, res) => {
  try {
    res.status(200).json({ message: "Login success" });
  } catch (error) {
    res.status(500).json({ message: "Server Error!", error: error.message });
  }
}); */

app.listen(PORT, async () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  await connectDB();
});
