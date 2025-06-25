// backend/src/routes/chatRoutes.ts
import express from 'express'
import { protect } from '../middleware/authMiddleware'
import { getThreads, getMessages, postMessage } from '../controllers/chatController'

const router = express.Router()

router.get('/threads', protect, getThreads)
router.get('/:chatId/messages', protect, getMessages)
router.post('/messages', protect, postMessage) // updated route

export default router
