/* 
📝 Middleware Purpose:
1) This middleware checks if the incoming request has a valid JWT token.
2) If valid, it decodes the token, attaches the user data to "req.user",
3) and allows the request to continue to the next handler.
4) If not valid or missing, it stops the request and returns "Unauthorized". 
*/
import jwt from "jsonwebtoken";
import { TOKEN_SECRET } from "../config/env.js";

export const verifyToken = async (req, res, next) => {
  let token =
    req.headers.client === "not-browser"
      ? req.headers.authorization
      : req.cookies["Authorization"];
  if (!token) {
    return res.status(401).json({ message: "Unauthorized!" });
  }
  try {
    const userToken = token.split(" ")[1];
    // "jwt.verify()" returns the decoded "payload" of the "token"
    const jwtVerified = jwt.verify(userToken, TOKEN_SECRET);
    // here we added that "payload" to a new "req" property "user"
    req.user = jwtVerified;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};
