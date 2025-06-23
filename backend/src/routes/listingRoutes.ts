// backend/src/routes/listingRoutes.ts
import express, { Router } from 'express'
import {
  createListing,
  getMyListings,
  getPublicListings,
  getListingById,
  updateListing,
  deleteListing,      // ← make sure this is imported
} from '../controllers/listingController'
import { protect } from '../middleware/authMiddleware'

const router: Router = express.Router()

// protected
router.post('/',     protect, createListing)
router.get('/my-listings', protect, getMyListings)
router.put('/:id',   protect, updateListing)
router.delete('/:id',protect, deleteListing)  // ← your delete route

// public
router.get('/',       getPublicListings)
router.get('/:id',    getListingById)

export default router
