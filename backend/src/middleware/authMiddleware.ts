// src/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const idToken = authHeader.split('Bearer ')[1];
    if (idToken) {
      try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        // req.user no longer causes a TS error
        req.user = {
          uid: decodedToken.uid,
          email: decodedToken.email,
          name: decodedToken.name,
        };
        next();
        return;
      } catch (error) {
        console.error('Error verifying Firebase ID token:', error);
        res.status(401).json({ message: 'Not authorized, token failed' });
        return;
      }
    }
  }

  res.status(401).json({ message: 'Not authorized, no token or malformed header' });
  return;
};
