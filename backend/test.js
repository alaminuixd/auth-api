import crypto from "crypto";
function generateHMAC(key, value) {
  return crypto.createHmac("sha256", key).update(value).digest("hex");
}

const secretKey =
  "1096b21aabd8c5697e0edf9c3dd8bc67331abec09538c882ab79de0895ccc952";
const codeValue = "020071";

console.log(generateHMAC(secretKey, codeValue));

const buff = Buffer.from([
  0x7c, 0x78, 0x74, 0xd7, 0xb8, 0x20, 0x7e, 0xeb, 0x82, 0x58, 0x49, 0x04, 0xd8,
  0x4f, 0xf6, 0x7d, 0xf9, 0xe5, 0x54, 0xdb, 0xfd, 0x6a, 0x73, 0x95, 0x3c, 0xb2,
  0x49, 0xd6, 0x27, 0xf5, 0x94, 0x27,
]);

console.log("-----------------------------------");
console.log(buff.toString("hex"));
console.log(buff.toString("base64"));
console.log(buff.toString("utf8"));
