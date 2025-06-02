import express, { Router } from 'express';
import { syncUser } from '../controllers/authController'; 
import { protect } from '../middleware/authMiddleware'; // Your existing auth middleware

const router: Router = express.Router();

// @route   POST /api/auth/sync-user
// @desc    Syncs Firebase user with local DB (creates if not exists, or gets existing)
// @access  Private (requires Firebase ID token)
router.post('/sync-user', protect, syncUser);

export default router;