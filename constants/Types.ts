// constants/Types.ts
export interface Listing {
  id: string;
  title: string;
  city: string;
  locality: string;
  rent: number;
  type: string; // e.g., "Apartment", "House", "PG"
  bedrooms: number;
  bathrooms: number;
  areaSqFt?: number;
  furnishingStatus: 'furnished' | 'semi-furnished' | 'unfurnished';
  preferredTenants?: string[];
  amenities?: string[];
  description: string;
  additionalInfo?: string;
  image: string;           // Primary image for cards/thumbnails
  imageUris?: string[];     // Array of all image URIs for the detail page
  ownerId: string;
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