import { Listing, Message } from './Types'; // Ensure Types.ts has all necessary fields

export let mockListings: Listing[] = [
  {
    id: '1', // This is a clean ID
    title: 'Spacious 2 BHK in Andheri East',
    city: 'Mumbai',
    locality: 'Andheri East',
    rent: 12000,
    type: 'Apartment',
    bedrooms: 2,
    bathrooms: 2,
    areaSqFt: 950,
    furnishingStatus: 'semi-furnished',
    preferredTenants: ['family', 'bachelors'],
    amenities: ['Parking', 'Elevator'],
    description: 'A well-ventilated 2 BHK apartment with ample sunlight. Close to metro and market.',
    additionalInfo: 'Society has 24/7 security.',
    image: 'https://placehold.co/600x400/EFEFEF/AAAAAA&text=Modern+2BHK',
    imageUris: [
        'https://placehold.co/600x400/EFEFEF/AAAAAA&text=Modern+2BHK',
        'https://placehold.co/600x400/EFEFEF/AAAAAA&text=Living+Room',
        'https://placehold.co/600x400/EFEFEF/AAAAAA&text=Bedroom+1'
    ],
    ownerId: 'owner_alice_001',
    isAvailable: true,
    postedDate: '2024-05-20',
  },
  // Ensure other mock listings also have clean IDs and valid image/imageUris
];

export const findListingById = (id: string | undefined): Listing | undefined => {
  if (!id) return undefined;
  return mockListings.find(listing => listing.id === id);
};

export const addMockListing = (newListingData: Omit<Listing, 'id'>): Listing => {
  // --- CORRECTED newId GENERATION ---
  const newId = `mock-${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 7)}`;
  // --- END OF CORRECTION ---

  // Ensure newListingData from post-room.tsx contains 'image' and 'imageUris'
  const listingWithId: Listing = {
    ...newListingData, // newListingData should already have image and imageUris from post-room.tsx
    id: newId,
  };
  mockListings.push(listingWithId); // Or mockListings.unshift(listingWithId) to see it at the top
  console.log('Added new listing to mockData:', listingWithId);
  console.log('Current mockListings count:', mockListings.length);
  return listingWithId;
};


export const MOCK_CURRENT_USER_ID = 'appUser123'; // ID for the person using the app

// Store messages in an object where keys are chat IDs (e.g., ownerId)
export let mockChatMessages: { [chatId: string]: Message[] } = {
  'owner_alice_001': [ // Example chat with owner_alice_001
    { id: 'msg1', text: 'Hi Alice, is your Andheri East flat still available?', senderId: MOCK_CURRENT_USER_ID, timestamp: new Date(Date.now() - 1000 * 60 * 10) },
    { id: 'msg2', text: 'Hello! Yes, it is. Are you interested in a viewing?', senderId: 'owner_alice_001', timestamp: new Date(Date.now() - 1000 * 60 * 9) },
    { id: 'msg3', text: 'Great! When would be a good time?', senderId: MOCK_CURRENT_USER_ID, timestamp: new Date(Date.now() - 1000 * 60 * 8) },
  ],
  'owner_bob_002': [ // Example chat with owner_bob_002
    { id: 'msg4', text: 'Hey Bob, that Bandra West place looks good.', senderId: MOCK_CURRENT_USER_ID, timestamp: new Date(Date.now() - 1000 * 60 * 5) },
  ],
  // Add more mock chats as needed
};

// Function to add a new message to a specific chat
export const addChatMessage = (chatId: string, messageText: string, senderId: string): Message => {
  if (!mockChatMessages[chatId]) {
    mockChatMessages[chatId] = []; // Initialize chat if it doesn't exist
  }
  const newMessage: Message = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    text: messageText,
    senderId: senderId,
    timestamp: new Date(),
  };
  mockChatMessages[chatId].push(newMessage);
  return newMessage;
};