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

export interface Message {
  id: string;
  text: string;
  senderId: string; // To identify if the message was sent by the current user or the other person
  timestamp: Date;    // Or use string if you prefer, then parse
  // Optional: add recipientId if you store all messages globally and filter
}

export interface UserProfile {
  _id?: string; // MongoDB's document ID
  id?: string; // Mongoose might also provide 'id' as a virtual
  firebaseUID?: string; // The user's unique ID from Firebase Authentication
  name: string;
  email: string;
  profileImageUrl?: string;
}

export interface ChatListItem {
  chatId: string; // This will be the ID of the other user/owner
  recipientName: string; // Name of the person or context of the chat (e.g., Listing Title)
  recipientAvatar?: string; // URL for their avatar (optional)
  lastMessageText: string;
  lastMessageTimestamp: Date; // Or string
  unreadCount?: number; // Optional for now
}