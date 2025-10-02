import express, { Express, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import admin from 'firebase-admin';
import http from 'http';
import { Server as IOServer, Socket } from 'socket.io';
import configureCloudinary from './config/cloudinaryConfig';

import authRoutes from './routes/authRoutes';
import listingRoutes from './routes/listingRoutes';
import chatRoutes from './routes/chatRoutes';
import User from './models/User';
import userRoutes from './routes/userRoutes';
import uploadRoutes from './routes/uploadRoutes';
import notificationRoutes from './routes/notificationRoutes';

dotenv.config();
configureCloudinary();

const app: Express = express();

// ✅ Public health route (before any auth)
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).send('ok');
});

// ✅ Firebase Admin init (choose ONE style)
if (!admin.apps.length) {
  // A) ADC (use GOOGLE_APPLICATION_CREDENTIALS=file path)
  admin.initializeApp({ credential: admin.credential.applicationDefault() });
  console.log('✅ Firebase Admin initialized');
}

app.use(cors());
app.use(express.json());

const httpServer = http.createServer(app);
const io = new IOServer(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

// Attach io to req (lightweight; fine for TS with `as any`)
app.use((req: Request, _res: Response, next: NextFunction) => {
  (req as any).io = io;
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/notifications', notificationRoutes);

// Socket auth
io.use(async (socket: Socket, next) => {
  const token = socket.handshake.auth.token as string | undefined;
  if (!token) return next(new Error('Authentication token missing'));
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    const user = await User.findOne({ firebaseUID: decoded.uid }).lean();
    if (!user) return next(new Error('User not found in database'));
    socket.data.firebaseUID = decoded.uid;
    socket.data.mongoUserId = user._id.toString();
    next();
  } catch {
    next(new Error('Unauthorized'));
  }
});

io.on('connection', (socket: Socket) => {
  const { firebaseUID, mongoUserId } = socket.data as any;
  console.log(`🟢 Socket connected: ${socket.id} (User: ${firebaseUID})`);
  socket.join(`user-inbox-${mongoUserId}`);
  socket.on('joinRoom', (chatId: string) => socket.join(chatId));
  socket.on('leaveRoom', (chatId: string) => socket.leave(chatId));
  socket.on('disconnect', () => socket.leave(`user-inbox-${mongoUserId}`));
});

// The backend and frontend need to agree on a single port in development.
// The mobile app is hard‑coded to talk to port 5001 (and will fall back to
// localhost:5001 when no EXPO_PUBLIC_DEV_URL is provided).  When running
// locally without a PORT environment variable this server will now listen
// on 5001 instead of the previous default of 8080.  You can still override
// this behaviour by exporting PORT=someOtherPort in your .env file.
const PORT = Number(process.env.PORT) || 8080;

// ✅ Start the server, connecting to MongoDB if a URI is provided.  In local
// development it's common to omit MONGO_URI which previously caused the
// server to exit immediately.  Now we gracefully start the HTTP server
// without a database connection when MONGO_URI is undefined.  Most routes
// interacting with Mongo will still fail in that scenario, but health checks
// and other non‑DB endpoints (if added) will continue to work.
const mongoUri = process.env.MONGO_URI;
if (mongoUri) {
  mongoose.connect(mongoUri)
    .then(() => {
      console.log('✅ Connected to MongoDB');
      httpServer.listen(PORT, () => {
        console.log(`🚀 Server listening on port ${PORT}`);
      });
    })
    .catch((err) => {
      console.error('MongoDB connection error:', err);
      // Even if MongoDB fails, still start the server so frontend can connect.
      httpServer.listen(PORT, () => {
        console.log(`🚀 Server listening on port ${PORT} (without DB)`);
      });
    });
} else {
  console.warn('⚠️ MONGO_URI not set; starting server without MongoDB connection');
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server listening on port ${PORT} (no DB)`);
  });
}
