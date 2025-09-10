// backend/src/controllers/notificationController.ts
import { Request, Response, NextFunction } from 'express';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import User, { IUser } from '../models/User';
import Listing, { IListing } from '../models/Listing';

const expo = new Expo();

export const sendPersonalizedNotifications = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // 1. Get all users who have a push token and preferences set
    const users = await User.find({
      pushToken: { $exists: true, $ne: null },
      mostViewedCity: { $exists: true, $ne: null },
    });

    const messages: ExpoPushMessage[] = [];

    for (const user of users) {
      const { mostViewedCity, mostViewedCharacteristics } = user;
      
      // 2. Find new listings in the user's city that match their characteristics
      const query: any = {
        'address.city': mostViewedCity,
        isAvailable: true,
        // Find listings posted in the last 24 hours
        postedDate: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      };

      if (mostViewedCharacteristics?.bedrooms) {
        query.bedrooms = mostViewedCharacteristics.bedrooms;
      }
      if (mostViewedCharacteristics?.bathrooms) {
        query.bathrooms = mostViewedCharacteristics.bathrooms;
      }
      if (mostViewedCharacteristics?.furnishingStatus) {
        query.furnishingStatus = mostViewedCharacteristics.furnishingStatus;
      }

      const newMatchingListings = await Listing.find(query);

      if (newMatchingListings.length > 0) {
        // 3. Create and send a notification
        const listingTitle = newMatchingListings[0].title;
        const body = newMatchingListings.length > 1
          ? `We found ${newMatchingListings.length} new listings in ${mostViewedCity} that you might like!`
          : `A new listing matching your preferences was posted in ${mostViewedCity}!`;

        if (Expo.isExpoPushToken(user.pushToken!)) {
          messages.push({
            to: user.pushToken!,
            sound: 'default',
            title: `New Listing Alert!`,
            body: body,
            data: { screen: 'Listings', query: query },
          });
        }
      }
    }

    const chunks = expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      try {
        await expo.sendPushNotificationsAsync(chunk);
      } catch (error) {
        console.error('Error sending a notification chunk:', error);
      }
    }

    res.status(200).json({ message: 'Notifications sent successfully' });
  } catch (error) {
    next(error);
  }
};