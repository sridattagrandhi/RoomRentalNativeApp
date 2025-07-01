// backend/src/routes/userRoutes.ts
import express from 'express';
import { addToWishlist, removeFromWishlist, getWishlist } from '../controllers/userController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// All routes are protected by the auth middleware
router.get('/wishlist', protect, getWishlist);
router.post('/wishlist/:listingId', protect, addToWishlist);
router.delete('/wishlist/:listingId', protect, removeFromWishlist);

export default router;
