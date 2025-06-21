// backend/src/controllers/authController.ts
import { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';
import User, { IUser } from '../models/User';

export const syncUser = async (
  req: Request,
  res: Response<{ message: string; user: IUser }>,
  next: NextFunction
) => {
  try {
    // verify Firebase ID token
    const token = req.headers.authorization?.split(' ')[1]!;
    const decoded = await admin.auth().verifyIdToken(token);
    const firebaseUID = decoded.uid;
    const email = decoded.email || '';
    const name = decoded.name || '';

    // upsert into the **users** collection
    const user = await User.findOneAndUpdate(
      { firebaseUID },
      { firebaseUID, email, name },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({ message: 'User synced', user });
  } catch (err) {
    next(err);
  }
};
