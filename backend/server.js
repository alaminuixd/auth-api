import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { PORT } from "./config/env.js";
import { connectDB } from "./database/mongodb.js";
import fileUploader from "./middlewares/file.uploader.js";
import __rootpath from "./utils/root.path.js";

const app = express();

app.use(cors());
app.use(helmet());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// veriables
const IMG_DIR = __rootpath("public", "upload", "images");
const upload = fileUploader({ IMG_DIR });

app.post(
  "/api/test",
  upload.fields([{ name: "avatar", maxCount: 1 }]),
  (req, res) => {
    const { name } = req.body;
    try {
      if (!name.trim()) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      res.status(201).json({ message: "Success" });
    } catch (error) {
      res.status(500).json({ message: "Server error! " + error.message });
    }
  }
);

app.listen(PORT, async () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  await connectDB();
});
