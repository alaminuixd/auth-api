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
  // Determine source: browser or API client
  const rawToken =
    req.headers.client === "not-browser"
      ? req.headers.authorization
      : req.cookies["Authorization"];

  if (!rawToken) {
    return res.status(401).json({ message: "Unauthorized!" });
  }

  try {
    // Remove "Bearer " prefix if present
    const token = rawToken.split(" ")[1];

    // Verify and decode token
    const decodedToken = jwt.verify(token, TOKEN_SECRET);

    // Attach decoded payload to request
    req.user = decodedToken;

    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};
