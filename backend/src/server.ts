import express, { Express, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import admin from 'firebase-admin';

// --- IMPORT YOUR ROUTE FILES ---
import authRoutes from './routes/authRoutes'; // Make sure this line is present and path is correct
import listingRoutes from './routes/listingRoutes';

// Load environment variables from .env file
dotenv.config();

const app: Express = express();
const PORT: string | number = process.env.PORT || 5001;

// --- Firebase Admin SDK Initialization ---
try {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp({
      credential: admin.credential.cert(process.env.GOOGLE_APPLICATION_CREDENTIALS),
    });
    console.log('Firebase Admin SDK initialized successfully.');
  } else {
    console.warn('Firebase Admin SDK not initialized. GOOGLE_APPLICATION_CREDENTIALS path not found in .env');
  }
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error);
}

// --- Core Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- API Routes ---
app.get('/api', (req: Request, res: Response) => {
  res.status(200).json({ message: 'Welcome to Room Rental App Backend API!' });
});

// --- THIS IS THE CRITICAL LINE TO USE YOUR AUTH ROUTES ---
// This tells Express: "For any request that starts with /api/auth,
// use the routes defined in the authRoutes file."
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
// --- END OF CRITICAL LINE ---


// --- Global Error Handler (Example) ---
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// --- MongoDB Connection & Server Start ---
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('FATAL ERROR: MONGO_URI is not defined in the .env file.');
  process.exit(1);
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
    process.exit(1);
  });

export default app;