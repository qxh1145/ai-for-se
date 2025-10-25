import jwt from "jsonwebtoken";

export default function authGuard(req, res, next) {
  try {
    const authHeader = req.get("authorization") || req.get("Authorization") || "";
    console.log("Auth Header", authHeader);
    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Verify token
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Gán userId từ payload
    req.userId = payload.sub || payload.userId || payload.id;
    req.userRole = payload.role || null;

    if (!req.userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
}
