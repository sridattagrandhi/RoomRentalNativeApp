// backend/src/server.ts
import express, { Express, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import admin from 'firebase-admin';
import http from 'http';
import { Server as IOServer, Socket } from 'socket.io';

import authRoutes from './routes/authRoutes';
import listingRoutes from './routes/listingRoutes';
import chatRoutes from './routes/chatRoutes';
import User from './models/User';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5001;

// Firebase Admin initialization... (no changes here)
try {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp({
      credential: admin.credential.cert(process.env.GOOGLE_APPLICATION_CREDENTIALS),
    });
    console.log('✅ Firebase Admin initialized');
  }
} catch (e) {
  console.error('🔥 Admin init error:', e);
}


app.use(cors());
app.use(express.json());

const httpServer = http.createServer(app);
const io = new IOServer(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

// Middleware to attach io to each request
app.use((req: Request, _res: Response, next: NextFunction) => {
  (req as any).io = io;
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/chat', chatRoutes);


io.use(async (socket: Socket, next) => {
  const token = socket.handshake.auth.token as string | undefined;
  if (!token) {
    return next(new Error('Authentication token missing'));
  }
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    const user = await User.findOne({ firebaseUID: decoded.uid }).lean();
    if (!user) {
      return next(new Error('User not found in database'));
    }
    
    socket.data.firebaseUID = decoded.uid;
    socket.data.mongoUserId = user._id.toString();
    next();
  } catch (err) {
    next(new Error('Unauthorized'));
  }
});

io.on('connection', (socket: Socket) => {
  const { firebaseUID, mongoUserId } = socket.data;
  console.log(`🟢 Socket connected: ${socket.id} (User: ${firebaseUID})`);

  // Each user joins a room for their own inbox updates
  socket.join(`user-inbox-${mongoUserId}`);

  socket.on('joinRoom', (chatId: string) => {
    console.log(`User ${firebaseUID} joining chat room: ${chatId}`);
    socket.join(chatId);
  });

  socket.on('leaveRoom', (chatId: string) => {
    console.log(`User ${firebaseUID} leaving chat room: ${chatId}`);
    socket.leave(chatId);
  });

  socket.on('disconnect', () => {
    console.log(`🔴 Socket disconnected: ${socket.id}`);
    socket.leave(`user-inbox-${mongoUserId}`);
  });
});


httpServer.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});

mongoose
  .connect(process.env.MONGO_URI!)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));
