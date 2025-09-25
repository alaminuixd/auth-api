import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import connectToDatabase from "./database/mongodb.js";
import authRouter from "./routers/auth.router.js";

const app = express();

const PORT = process.env.PORT || 3006;
app.use(cors());
app.use(helmet());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// add router
app.use("/api/auth", authRouter);

app.get("/", (req, res) => {
  res.status(200).json({ message: "success" });
});

app.listen(PORT, async () => {
  console.log(`App is listening to the PORT: ${PORT}`);
  await connectToDatabase();
});
