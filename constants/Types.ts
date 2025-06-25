// constants/Types.ts
export interface Listing {
  id: string; // This will map to MongoDB's _id
  _id?: string; // Mongoose might return _id, good to have both
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
  // CORRECTED: The owner field can be a simple string (the ID) or a populated UserProfile object
  owner: string | UserProfile;
  ownerId?: string; // Keep ownerId as it might be used elsewhere before population
  isAvailable?: boolean;
  postedDate?: string;
}

export interface UserProfile {
  _id?: string; // MongoDB's document ID
  id?: string; // Mongoose might also provide 'id' as a virtual
  firebaseUID?: string; // The user's unique ID from Firebase Authentication
  name: string;
  email: string;
  profileImageUrl?: string;
}

// Corrected Message Type to match backend payload
export interface Message {
  _id: string;
  chatId: string;
  text: string;
  sender: {
    _id: string; // This will be the Firebase UID
    name?: string;
    profileImageUrl?: string;
  };
  timestamp: string;
}

// Corrected ChatListItem to include recipient's Firebase UID
export interface ChatListItem {
  chatId: string;
  recipientId: string; // MongoDB ID
  recipientFirebaseUID: string; // Firebase UID
  recipientName: string;
  recipientAvatar?: string;
  lastMessageText: string;
  lastMessageTimestamp: string;
  unreadCount: number;
}