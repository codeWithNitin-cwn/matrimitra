import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "./auth.types";

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Missing or invalid token format" } });
    return;
  }

  const token = authHeader.split(" ")[1];
  
  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      // This will be caught by the try-catch and result in a 500 error if not handled,
      // which is appropriate for a server configuration issue.
      // For a cleaner exit, you could log this and send a generic 500.
      res.status(500).json({
  success: false,
  error: {
    code: "SYSTEM_ERROR",
    message: "JWT configuration error"
  }
});
return;
    }

    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    req.user = decoded; // Attach payload globally
    next();
  }  catch (error) {
  console.log("JWT ERROR:", error);

  res.status(401).json({
    success: false,
    error: {
      code: "UNAUTHORIZED",
      message: String(error)
    }
  });
}
};
