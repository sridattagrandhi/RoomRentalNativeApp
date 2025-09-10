// backend/src/controllers/userController.ts
import { Request, Response, NextFunction } from 'express';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import User from '../models/User';
import mongoose from 'mongoose';

const expo = new Expo()
// Add a listing to the user's wishlist
export const addToWishlist = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { listingId } = req.params;
    const firebaseUserId = req.user?.uid;

    if (!firebaseUserId) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(listingId)) {
      res.status(400).json({ message: 'Invalid listing ID' });
      return;
    }

    const user = await User.findOne({ firebaseUID: firebaseUserId });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const listingObjectId = new mongoose.Types.ObjectId(listingId);
    const isAlreadyInWishlist = user.wishlist.some(id => id.equals(listingObjectId));

    if (isAlreadyInWishlist) {
      res.status(400).json({ message: 'Listing already in wishlist' });
      return;
    }

    user.wishlist.push(listingObjectId);
    await user.save();

    res.status(200).json({ message: 'Added to wishlist', wishlist: user.wishlist });
  } catch (error) {
    console.error('Error in addToWishlist:', error);
    next(error); // Pass errors to the Express error handler
  }
};

// Remove a listing from the user's wishlist
export const removeFromWishlist = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { listingId } = req.params;
    const firebaseUserId = req.user?.uid;

    if (!firebaseUserId) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(listingId)) {
      res.status(400).json({ message: 'Invalid listing ID' });
      return;
    }

    const user = await User.findOneAndUpdate(
      { firebaseUID: firebaseUserId },
      { $pull: { wishlist: new mongoose.Types.ObjectId(listingId) } },
      { new: true }
    );

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.status(200).json({ message: 'Removed from wishlist', wishlist: user.wishlist });
  } catch (error) {
    console.error('Error in removeFromWishlist:', error);
    next(error);
  }
};

// Get all listings in the user's wishlist
export const getWishlist = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const firebaseUserId = req.user?.uid;

    if (!firebaseUserId) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    const user = await User.findOne({ firebaseUID: firebaseUserId }).populate('wishlist');

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.status(200).json(user.wishlist);
  } catch (error) {
    console.error('Error in getWishlist:', error);
    next(error);
  }
};

export const updateUserPushToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token } = req.body;
    const firebaseUserId = req.user?.uid;
    if (!firebaseUserId || !token) {
      res.status(400).json({ message: 'Missing user ID or token' });
      return;
    }
    const user = await User.findOne({ firebaseUID: firebaseUserId });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    // Only update if the token has changed
    if (user.pushToken !== token) {
      user.pushToken = token;
      await user.save();
    }
    res.status(200).json({ message: 'Push token updated successfully' });
  } catch (error) {
    next(error);
  }
};
