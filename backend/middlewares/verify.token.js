/* 
📝 Middleware Purpose:
1) This middleware checks if the incoming request has a valid JWT token.
2) If valid, it decodes the token, attaches the user data to "req.user",
3) and allows the request to continue to the next handler.
4) If not valid or missing, it stops the request and returns "Unauthorized". 
*/
/*
JWT Token Handling Rules

Authorization Header:
- Format: Authorization: Bearer <token>
- Server access: req.headers.authorization.split(" ")[1]
- Use for APIs, mobile apps, or non-browser clients.

Cookie:
- Format: <cookieName>=<token> (no Bearer)
- Server access: req.cookies.<cookieName> (with cookie-parser)
- Use for browser sessions; browser sends automatically.

✅ Rule of Thumb:
- Header → Bearer <token>
- Cookie → raw token
*/
import jwt from "jsonwebtoken";
import { TOKEN_SECRET } from "../config/env.js";

// Logic flow: Get token → Validate presence → Check format → Verify JWT → Attach payload → Call next() → Handle errors
const verifyToken = (req, res, next) => {
  const rawToken =
    req.headers.client === "not-browser"
      ? req.headers.authorization
      : req.cookies["Authorization"]; // match cookie name

  if (!rawToken) {
    return res.status(401).json({ message: "Unauthorized!" });
  }

  try {
    const tokenParts = rawToken.split(" ");
    if (tokenParts.length !== 2) {
      return res.status(401).json({ message: "Invalid token format!" });
    }
    // tokenPayload = { id: existingUser._id, email: existingUser.email, emailVerified: existingUser.emailVerified}
    const tokenPayload = jwt.verify(tokenParts[1], TOKEN_SECRET);
    req.user = tokenPayload;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token!" });
  }
};

export const verifyToken2 = (req, res, next) => {
  const rawToken =
    req.headers.client === "not-browser"
      ? req.headers.authoriztion
      : req.cookies["authorization"];
  if (!rawToken) {
    return res.status(401).json({ message: "Unauthorized!" });
  }
  try {
    const tokenParts = rawToken.split(" ");
    if (tokenParts.length !== 2) {
      return res.status(401).json({ message: "Invalid token format" });
    }
    const tokenPayload = jwt.verify(tokenParts[1], TOKEN_SECRET);
    req.user = tokenPayload;
    next();
  } catch (error) {
    return res.status(401).json({ message: "invalid token" });
  }
};
