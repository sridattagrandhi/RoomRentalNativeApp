// src/controllers/authController.ts
import { Request, Response, NextFunction } from 'express';
import User, { IUser } from '../models/User';

export const syncUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Because we have a global augmentation, TypeScript knows “req.user” exists.
  if (!req.user || !req.user.uid) {
    res.status(401).json({ message: 'Not authorized, user data missing from token' });
    return;
  }

  const { uid, email, name } = req.user; // NO TYPE ERROR anymore

  try {
    let user: IUser | null = await User.findOne({ firebaseUID: uid });
    if (user) {
      res.status(200).json({ user });
      return;
    } else {
      const newUser = new User({ firebaseUID: uid, email: email, name: name || '' });
      await newUser.save();
      res.status(201).json({ user: newUser });
      return;
    }
  } catch (error) {
    console.error('Error in syncUser controller:', error);
    next(error);
    return;
  }
};
