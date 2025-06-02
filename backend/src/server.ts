import express, { Express, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import admin from 'firebase-admin';

// Load environment variables from .env file
dotenv.config();

const app: Express = express();
const PORT: string | number = process.env.PORT || 5001;

// --- Firebase Admin SDK Initialization ---
// Ensure your GOOGLE_APPLICATION_CREDENTIALS environment variable points to your service account key JSON file
// or provide the path directly if you prefer (though env var is better for security/flexibility)
try {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp({
      credential: admin.credential.cert(process.env.GOOGLE_APPLICATION_CREDENTIALS),
      // Optionally, you can specify your databaseURL if using Firebase Realtime Database too:
      // databaseURL: process.env.FIREBASE_DATABASE_URL
    });
    console.log('Firebase Admin SDK initialized successfully.');
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH) { // Alternative: path in env var
     // eslint-disable-next-line @typescript-eslint/no-var-requires
     const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH);
     admin.initializeApp({
       credential: admin.credential.cert(serviceAccount),
     });
     console.log('Firebase Admin SDK initialized successfully via path.');
  }
  else {
    console.warn(
      'Firebase Admin SDK not initialized. Missing GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT_KEY_PATH environment variable.'
    );
  }
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error);
}


// --- Core Middleware ---
app.use(cors()); // Enable CORS for all origins (configure properly for production)
app.use(express.json()); // Middleware to parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Middleware to parse URL-encoded request bodies

// --- Basic Routes for Testing ---
app.get('/api', (req: Request, res: Response) => {
  res.status(200).json({ message: 'Welcome to Room Rental App Backend API!' });
});

// --- Placeholder for your API Routes ---
// Example:
// import listingRoutes from './routes/listingRoutes';
// app.use('/api/listings', listingRoutes);
// import authRoutes from './routes/authRoutes';
// app.use('/api/auth', authRoutes);


// --- Global Error Handler (Basic Example) ---
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong on the server!' });
});


// --- MongoDB Connection & Server Start ---
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('FATAL ERROR: MONGO_URI is not defined in the .env file.');
  process.exit(1); // Critical error, exit
}

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Successfully connected to MongoDB Atlas!');
    app.listen(PORT, () => {
      console.log(`Backend server is running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1); // Critical error, exit
  });

export default app; // Optional: export app for testing or other purposes