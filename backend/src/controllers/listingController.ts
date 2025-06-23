import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import Listing from '../models/Listing'; // Assuming this is your Mongoose model
import { Types } from 'mongoose';

// Controller to create a new listing (Protected)
export const createListing = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const firebaseUserId = req.user?.uid;
    if (!firebaseUserId) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }
    const user = await User.findOne({ firebaseUID: firebaseUserId });
    if (!user) {
      res.status(404).json({ message: 'User profile not found in database' });
      return;
    }
    const newListing = new Listing({ ...req.body, owner: user._id });
    const savedListing = await newListing.save();
    res.status(201).json(savedListing);
  } catch (error) {
    next(error);
  }
};

// Controller to get listings for the current authenticated user (Protected)
export const getMyListings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const firebaseUserId = req.user?.uid;
    if (!firebaseUserId) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }
    const user = await User.findOne({ firebaseUID: firebaseUserId });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    const listings = await Listing.find({ owner: user._id }).sort({ createdAt: -1 });
    res.status(200).json(listings);
  } catch (error) {
    next(error);
  }
};

// --- NEW/UPDATED PUBLIC CONTROLLERS ---

// GET /api/listings - Get all public listings, can be filtered by city
// This is a public route, no 'protect' middleware needed.
export const getPublicListings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const city = req.query.city; // e.g., /api/listings?city=Mumbai

    let query = {};
    if (city && typeof city === 'string') {
      // Use a case-insensitive regular expression for city matching
      query = { city: { $regex: new RegExp(`^${city}$`, 'i') } };
    }

    const listings = await Listing.find(query).sort({ postedDate: -1 });
    res.status(200).json(listings);
  } catch (error) {
    next(error);
  }
};

// GET /api/listings/:id - Get a single listing by its ID (Public)
export const getListingById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: 'Invalid listing ID format' });
      return;
    }
    // Populate owner info - selects only the 'name' and 'profileImageUrl' fields from the referenced User document
    const listing = await Listing.findById(id).populate('owner', 'name profileImageUrl');

    if (!listing) {
      res.status(404).json({ message: 'Listing not found' });
      return;
    }
    res.status(200).json(listing);
  } catch (error) {
    next(error);
  }
};


// We will implement the update logic later
export const updateListing = async (
  req: Request & { user?: { uid: string } },
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1) Ensure we have a Firebase UID
    const firebaseUid = req.user?.uid;
    if (!firebaseUid) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    // 2) Look up our Mongo user
    const user = await User.findOne({ firebaseUID: firebaseUid });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // 3) Validate the listing ID param
    const listingId = req.params.id;
    if (!Types.ObjectId.isValid(listingId)) {
      res.status(400).json({ message: 'Invalid listing ID' });
      return;
    }

    // 4) Fetch the listing
    const listing = await Listing.findById(listingId);
    if (!listing) {
      res.status(404).json({ message: 'Listing not found' });
      return;
    }

    // 5) Confirm the current user owns this listing
    //    👇 compare the ObjectId on the listing to the string virtual `.id` on the user doc
    if (listing.owner.toString() !== user.id) {
      res.status(403).json({ message: 'You can only edit your own listings.' });
      return;
    }

    // 6) Merge in the allowed updates and save
    //    (you can also whitelist fields here if you prefer)
    Object.assign(listing, req.body);
    const updatedListing = await listing.save();

    // 7) Return the freshly updated document
    res.status(200).json(updatedListing);
  } catch (err) {
    console.error('Failed to update listing:', err);
    next(err);
  }
};