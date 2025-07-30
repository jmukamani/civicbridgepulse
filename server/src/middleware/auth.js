import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const authenticate = (roles = []) => {
  // roles param can be a single role string ("admin") or an array
  if (typeof roles === "string") {
    roles = [roles];
  }

  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    let token;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.query && req.query.token) {
      // allow token via query string for direct file links / iframe embeds
      token = req.query.token;
    }

    console.log('Auth middleware:', {
      path: req.path,
      method: req.method,
      hasAuthHeader: !!authHeader,
      tokenLength: token ? token.length : 0,
      roles: roles,
      jwtSecret: process.env.JWT_SECRET ? 'exists' : 'missing'
    });

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token decoded successfully:', { role: decoded.role, id: decoded.id });
      req.user = decoded;
      if (roles.length && !roles.includes(decoded.role)) {
        console.log('Role mismatch:', { required: roles, actual: decoded.role });
        return res.status(403).json({ message: "Forbidden" });
      }
      return next();
    } catch (err) {
      console.log('Token verification failed:', err.message);
      return res.status(401).json({ message: "Invalid token" });
    }
  };
}; 