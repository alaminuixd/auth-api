import path from "path";
import { fileURLToPath } from "url";

export default function __rootpath(...args) {
  const filepath = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(filepath);
  if (args.length === 0) {
    return path.join(__dirname, "../");
  }
  return path.join(__dirname, "../", ...args);
}
