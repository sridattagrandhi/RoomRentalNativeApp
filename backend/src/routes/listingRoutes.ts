import express, { Router } from 'express';
import {
  createListing,
  getMyListings,
  getPublicListings, // Import new controller
  getListingById,   // Import new controller
  updateListing,
} from '../controllers/listingController';
import { protect } from '../middleware/authMiddleware';

const router: Router = express.Router();

// --- PROTECTED ROUTES (require user to be logged in) ---
router.post('/', protect, createListing);             // Create a new listing
router.get('/my-listings', protect, getMyListings);    // Get the current user's listings
router.put('/:id', protect, updateListing);            // Update a listing the user owns

// --- PUBLIC ROUTES (anyone can access these) ---
router.get('/', getPublicListings);                    // Get all listings OR filter by city (e.g., /api/listings?city=Mumbai)
router.get('/:id', getListingById);                      // Get a single listing by its ID

export default router;