import express from 'express';
import multer from 'multer';
import { uploadImages } from '../controllers/uploadController';
import { protect } from '../middleware/authMiddleware'; // Assuming you have this middleware

const router = express.Router();

// Configure multer to store files in memory as buffers
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Define the upload route. 
// It's protected to ensure only logged-in users can upload.
// 'images' is the field name the frontend will use in its FormData.
// We allow up to 10 images at a time.
router.post('/', protect, upload.array('images', 10), uploadImages);

export default router;