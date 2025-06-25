import mongoose, { Schema, Document, Types } from 'mongoose';

// Define an interface representing a document in MongoDB.
// This should align with your UserProfile type on the frontend,
// plus any backend-specific fields like firebaseUID.
export interface IUser extends Document {
  _id: Types.ObjectId; 
  firebaseUID: string; // From Firebase Authentication, used as a primary key/link
  email: string;
  name?: string; // Corresponds to 'Full Name' from signup
  phone?: string;
  bio?: string;
  profileImageUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
  // Add any other fields relevant to your application's user profile
  // e.g., savedListings: [{ type: Schema.Types.ObjectId, ref: 'Listing' }],
  //      notificationsEnabled: boolean,
}

const UserSchema: Schema = new Schema(
  {
    firebaseUID: {
      type: String,
      required: true,
      unique: true, // Each Firebase UID should be unique
      index: true,    // Good for query performance
    },
    email: {
      type: String,
      required: true,
      unique: true, // Assuming emails should be unique in your system
      trim: true,   // Removes whitespace from both ends
      lowercase: true, // Store emails in lowercase
    },
    name: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      sparse: true, // Allows multiple null/undefined values if phone is not unique or not always present
    },
    bio: {
      type: String,
      trim: true,
    },
    profileImageUrl: {
      type: String,
    },
    // Timestamps will be automatically managed by Mongoose
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields automatically
  }
);

// Create and export the User model
const User = mongoose.model<IUser>('User', UserSchema);

export default User;