// middleware/Auth.js
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export default function Auth(req, res, next) {
  try {
    // Read authorization header
    const authHeader = req.header("authorization");

    if (!authHeader)
      return res.status(401).json({ message: "Token missing" });

    // Extract token after "Bearer"
    const token = authHeader.split(" ")[1];

    if (!token)
      return res.status(401).json({ message: "Invalid token format" });

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_TOKEN);

    // Attach userId to request
    req.userId = decoded.userId;

    next();
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(401).json({ message: "Unauthorized user" });
  }
}
