// backend/src/controllers/notificationController.ts
import { Request, Response, NextFunction } from 'express';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import User, { IUser } from '../models/User';
import Listing, { IListing } from '../models/Listing';

const expo = new Expo();

export const sendPersonalizedNotifications = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // 1. Get all users who have a push token and a viewed characteristics profile
    const users = await User.find({
      pushToken: { $exists: true, $ne: [null, ''] },
      'viewedCharacteristicsProfile.city': { $exists: true, $ne: null },
    });

    const messages: ExpoPushMessage[] = [];

    for (const user of users) {
      const { viewedCharacteristicsProfile } = user;
      
      // Helper function to find the top-viewed preference from a map of counts
      const getTopPreference = (profile?: { [key: string]: number }) => {
        if (!profile || Object.keys(profile).length === 0) return null;
        return Object.keys(profile).reduce((a, b) => (profile[a] || 0) > (profile[b] || 0) ? a : b);
      };

      // 2. Find the user's top preferences from their comprehensive profile
      const preferredCity = getTopPreference(viewedCharacteristicsProfile?.city);
      const preferredType = getTopPreference(viewedCharacteristicsProfile?.type);
      const preferredBedrooms = getTopPreference(viewedCharacteristicsProfile?.bedrooms);
      const preferredBathrooms = getTopPreference(viewedCharacteristicsProfile?.bathrooms);
      const preferredFurnishing = getTopPreference(viewedCharacteristicsProfile?.furnishingStatus);
      const preferredTenants = getTopPreference(viewedCharacteristicsProfile?.preferredTenants);
      
      // 3. Find new listings that match the user's top characteristics
      const query: any = {
        isAvailable: true,
        postedDate: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      };

      if (preferredCity) {
        query['address.city'] = preferredCity;
      }
      if (preferredType) {
        query.type = preferredType;
      }
      if (preferredBedrooms) {
        query.bedrooms = Number(preferredBedrooms);
      }
      if (preferredBathrooms) {
        query.bathrooms = Number(preferredBathrooms);
      }
      if (preferredFurnishing) {
        query.furnishingStatus = preferredFurnishing;
      }
      if (preferredTenants) {
        // You would need to refine this to handle arrays
      }

      const newMatchingListings = await Listing.find(query);

      if (newMatchingListings.length > 0) {
        // 4. Create and send a notification
        const body = newMatchingListings.length > 1
          ? `We found ${newMatchingListings.length} new listings in ${preferredCity} that you might like!`
          : `A new listing matching your preferences was posted in ${preferredCity}!`;

        if (user.pushToken && Expo.isExpoPushToken(user.pushToken)) {
          messages.push({
            to: user.pushToken,
            sound: 'default',
            title: `New Listing Alert!`,
            body: body,
            data: { screen: 'Listings', query: query },
          });
        }
      }
    }

    // Only send notifications if there are messages to send
    if (messages.length > 0) {
      const chunks = expo.chunkPushNotifications(messages);
      for (const chunk of chunks) {
        try {
          await expo.sendPushNotificationsAsync(chunk);
        } catch (error) {
          console.error('Error sending a notification chunk:', error);
        }
      }
    }

    res.status(200).json({ message: 'Notifications sent successfully' });
  } catch (error) {
    next(error);
  }
};