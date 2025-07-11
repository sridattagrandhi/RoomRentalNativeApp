import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import Listing from '../models/Listing'; // Assuming this is your Mongoose model
import { Types } from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';


const getPublicIdFromUrl = (url: string): string | null => {
  const match = url.match(/upload\/(?:v\d+\/)?([^\.]+)/);
  return match ? match[1] : null;
};

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
    const { 
        city, search, minRent, maxRent, bedrooms, bathrooms,
        furnishingStatus, type, 
        // --- NEW: Destructure new query params ---
        minArea, maxArea, amenities, preferredTenants 
    } = req.query;

    let query: any = { isAvailable: true };

    if (city && typeof city === 'string') {
      query['address.city'] = { $regex: new RegExp(`^${city}$`, 'i') };
    }
    if (search && typeof search === 'string') {
      query.$text = { $search: search };
    }
    if (minRent || maxRent) {
      query.rent = {};
      if (minRent) query.rent.$gte = Number(minRent);
      if (maxRent) query.rent.$lte = Number(maxRent);
    }
    if (bedrooms) {
      query.bedrooms = { $gte: Number(bedrooms) };
    }
    if (bathrooms) {
      query.bathrooms = { $gte: Number(bathrooms) };
    }
    if (type && typeof type === 'string') {
        query.type = { $regex: new RegExp(`^${type}$`, 'i') };
    }
    if (furnishingStatus && typeof furnishingStatus === 'string') {
        query.furnishingStatus = furnishingStatus;
    }

    // --- NEW: Add logic for new filters ---

    // Area Range (in sq ft)
    if (minArea || maxArea) {
      query.areaSqFt = {};
      if (minArea) query.areaSqFt.$gte = Number(minArea);
      if (maxArea) query.areaSqFt.$lte = Number(maxArea);
    }
    
    // Amenities (must have ALL selected amenities)
    // Expects amenities to be a comma-separated string: "WiFi,AC"
    if (amenities && typeof amenities === 'string' && amenities.length > 0) {
        const amenitiesList = amenities.split(',');
        query.amenities = { $all: amenitiesList };
    }

    // Preferred Tenants (must match at least ONE of the selected tenants)
    // Expects tenants to be a comma-separated string: "Bachelors,Family"
    if (preferredTenants && typeof preferredTenants === 'string' && preferredTenants.length > 0) {
        const tenantsList = preferredTenants.split(',');
        query.preferredTenants = { $in: tenantsList };
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

export const deleteListing = async (
  req: Request & { user?: { uid:string }},
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1 & 2. Authentication & User lookup
    const firebaseUid = req.user?.uid;
    const user = await User.findOne({ firebaseUID: firebaseUid });
    if (!user) {
      res.status(401).json({ message: 'User not found or not authorized' });
      return;
    }

    // 3 & 4. Validate ID and fetch the listing
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: 'Invalid listing ID' });
      return;
    }
    const listing = await Listing.findById(id);
    if (!listing) {
      res.status(404).json({ message: 'Listing not found' });
      return;
    }

    // 5. Ownership check
    if (listing.owner.toString() !== user.id) {
      res.status(403).json({ message: 'You can only delete your own listings.' });
      return;
    }

    // --- 3. NEW: Delete images from Cloudinary BEFORE deleting the DB record ---
    try {
      // a. Gather all image public IDs associated with the listing
      const publicIds: string[] = [];
      if (listing.image) {
        const publicId = getPublicIdFromUrl(listing.image);
        if (publicId) publicIds.push(publicId);
      }
      if (listing.imageUris && listing.imageUris.length > 0) {
        listing.imageUris.forEach(uri => {
          const publicId = getPublicIdFromUrl(uri);
          if (publicId) publicIds.push(publicId);
        });
      }

      // b. If there are any IDs, tell Cloudinary to delete them
      if (publicIds.length > 0) {
        console.log(`Deleting ${publicIds.length} images from Cloudinary...`);
        // Use `api.delete_resources` for bulk deletion
        await cloudinary.api.delete_resources(publicIds);
      }
    } catch (cloudinaryError) {
      // Log the error, but don't block the listing deletion from our DB
      console.error('Cloudinary deletion failed, but proceeding with DB deletion:', cloudinaryError);
    }
    
    // 6. Delete the listing from MongoDB
    await listing.deleteOne();

    // 7. Return success
    res.status(204).end();
  } catch (err) {
    console.error('Failed to delete listing:', err);
    next(err);
  }
};
