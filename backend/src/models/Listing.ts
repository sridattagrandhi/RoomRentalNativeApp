// backend/src/models/Listing.ts
import mongoose, { Schema, Document, Types } from 'mongoose';
import { IUser } from './User'; // We'll link to the User model

export interface IListing extends Document {
  title: string;
  city: string;
  locality: string;
  rent: number;
  type: string;
  bedrooms: number;
  bathrooms: number;
  areaSqFt?: number;
  furnishingStatus: 'furnished' | 'semi-furnished' | 'unfurnished';
  preferredTenants?: string[];
  amenities?: string[];
  description: string;
  additionalInfo?: string;
  image: string;
  imageUris?: string[];
  owner: Types.ObjectId | IUser; // Link to the User document
  isAvailable?: boolean;
  postedDate?: Date;
}

const ListingSchema: Schema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true, index: true },
    locality: { type: String, required: true, trim: true },
    rent: { type: Number, required: true },
    type: { type: String, required: true },
    bedrooms: { type: Number, required: true },
    bathrooms: { type: Number, required: true },
    areaSqFt: { type: Number },
    furnishingStatus: {
      type: String,
      required: true,
      enum: ['furnished', 'semi-furnished', 'unfurnished'],
    },
    preferredTenants: [{ type: String }],
    amenities: [{ type: String }],
    description: { type: String, required: true },
    additionalInfo: { type: String },
    image: { type: String, required: true }, // Main thumbnail image URL
    imageUris: [{ type: String }], // Array of all image URLs
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User', // Creates a reference to a document in the 'User' collection
      required: true,
      index: true,
    },
    isAvailable: { type: Boolean, default: true },
    postedDate: { type: Date, default: Date.now },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

const Listing = mongoose.model<IListing>('Listing', ListingSchema);

export default Listing;