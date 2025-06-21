// backend/src/routes/authRoutes.ts
import express from 'express';
import { protect } from '../middleware/authMiddleware';
import { syncUser } from '../controllers/authController';

const router = express.Router();

// POST /api/auth/sync-user  →  upsert the Firebase user into MongoDB
router.post('/sync-user', protect, syncUser);

export default router;
