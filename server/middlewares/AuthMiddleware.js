import jwt from "jsonwebtoken";

export function verifyAccessToken(req, res, next) {
  try {
    const auth = req.headers?.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.substring(7) : null;
    if (!token) return res.status(401).json({ message: "Unauthorized" });
    const secret = process.env.JWT_ACCESS_SECRET || "dev_access_secret";
    const payload = jwt.verify(token, secret);
    req.user = payload;
    return next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized" });
  }
}
