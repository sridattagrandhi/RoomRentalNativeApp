import mongoose, { Schema, Document, Types } from 'mongoose';

// Define an interface representing a document in MongoDB.
export interface IUser extends Document {
  _id: Types.ObjectId; 
  firebaseUID: string;
  email: string;
  name?: string;
  phone?: string;
  bio?: string;
  profileImageUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
  wishlist: Types.ObjectId[];
  pushToken?: string; 
}

const UserSchema: Schema = new Schema(
  {
    firebaseUID: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      sparse: true,
    },
    bio: {
      type: String,
      trim: true,
    },
    profileImageUrl: {
      type: String,
    },
    pushToken: { type: String },
    wishlist: [{
      type: Schema.Types.ObjectId,
      ref: 'Listing'
    }]
  },
  {
    timestamps: true,
  }
);

// Create and export the User model
const User = mongoose.model<IUser>('User', UserSchema);

export default User;
