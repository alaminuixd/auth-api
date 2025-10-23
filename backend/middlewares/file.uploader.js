import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { v4 as uuidv4 } from "uuid";

export default function fileUploader({
  IMG_DIR,
  maxFileSize = 5,
  allowedFileTypes = ["jpg", "jpeg", "png", "gif", "webp"],
} = {}) {
  const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
      try {
        await fs.mkdir(IMG_DIR, { recursive: true });
        cb(null, IMG_DIR);
      } catch (error) {
        cb(error);
      }
      cb(null, IMG_DIR);
    },
    filename: (req, file, cb) => {
      console.log(file.mimetype);
      const baseName = (req.body.name || "unknown")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/[^a-zA-Z0-9\-]/g, "")
        .replace(/^-+|-+$/g, "");
      const fieldName = file.fieldname;
      const idName = uuidv4().split("-").pop();
      const dateName = new Date().toISOString().split("T")[0];
      const extName = path.extname(file.originalname).toLowerCase();
      const fullName = `${baseName}-${fieldName}-${idName}-${dateName}${extName}`;
      cb(null, fullName);
    },
  });
  const fileTypesRegx = new RegExp(`\\.${allowedFileTypes.join("|")}$`, "i");
  return multer({
    storage,
    limits: { fileSize: maxFileSize * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (
        !fileTypesRegx.test(path.extname(file.originalname).toLowerCase()) ||
        !allowedFileTypes.includes(file.mimetype.split("/")[1].toLowerCase())
      ) {
        const fileTypeError =
          allowedFileTypes.length < 2
            ? `Only ${allowedFileTypes[0]} is allowed`
            : `Only ${allowedFileTypes
                .slice(0, -1)
                .join(", ")} and ${allowedFileTypes
                .slice(-1)
                .join("")} are allowed`;
        return cb(new Error(fileTypeError));
      }
      cb(null, true);
    },
  });
}
