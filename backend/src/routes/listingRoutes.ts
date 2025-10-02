// backend/src/routes/listingRoutes.ts
import express, { Router } from 'express';
import {
  createListing,
  getMyListings,
  getPublicListings,
  getListingById,
  updateListing,
  deleteListing,
} from '../controllers/listingController';
import { protect } from '../middleware/authMiddleware';

const router: Router = express.Router();

// protected (requires Firebase token)
router.post('/',      protect, createListing);
router.get('/my-listings', protect, getMyListings);
router.put('/:id',    protect, updateListing);
router.delete('/:id', protect, deleteListing);

// public listing retrieval becomes protected
router.get('/',    protect, getPublicListings);
router.get('/:id', protect, getListingById);

export default router;
