/* 
📝 Middleware Purpose:
1) This middleware checks if the incoming request has a valid JWT token.
2) If valid, it decodes the token, attaches the user data to req.user,
3) and allows the request to continue to the next handler.
4) If not valid or missing, it stops the request and returns "Unauthorized". 
*/

import jwt from "jsonwebtoken";

export const identifier = (req, res, next) => {
  let token =
    req.headers.client === "not-browser"
      ? req.headers.authorization
      : req.cookies["Authorization"];

  if (!token)
    return res.status(401).json({ success: false, message: "Unauthorized!" });

  try {
    const userToken = token.split(" ")[1];
    // "jwt.verify()" returns the decoded "payload" of the "token"
    const jwtVerified = jwt.verify(userToken, process.env.TOKEN_SECRET);
    // here we added that "payload" to a new "req" property "user"
    req.user = jwtVerified;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: "Invalid Token!" });
  }
};

// this one is the old one. Just kept for research
export const identifier2 = (req, res, next) => {
  let token;
  if (req.headers.client === "not-brower") {
    token = req.headers.authorization;
  } else {
    token = req.cookies["Authorization"];
  }
  if (!token) {
    return res.status(403).json({ success: false, message: "Unauthorized!" });
  }
  try {
    const userToken = token.split(" ")[1];
    const jwtVerified = jwt.verify(userToken, process.env.TOKEN_SECRET);
    if (jwtVerified) {
      req.user = jwtVerified;
      next();
    } else {
      throw new Error("Error in the token!");
    }
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server Error " + error.message });
  }
};
