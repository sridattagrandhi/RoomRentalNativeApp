// backend/src/controllers/uploadController.ts
import { Request, Response, NextFunction } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';

// Note: The configuration is no longer here! It's loaded from server.ts

const uploadToCloudinary = (fileBuffer: Buffer): Promise<any> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "room-rental-app" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};

export const uploadImages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      res.status(400).json({ message: 'No files were uploaded.' });
      return;
    }

    const files = req.files as Express.Multer.File[];
    const uploadPromises = files.map(file => uploadToCloudinary(file.buffer));
    
    const results = await Promise.all(uploadPromises);
    const imageUrls = results.map(result => result.secure_url);

    res.status(200).json({ imageUrls });

  } catch (error) {
    console.error('Image upload failed:', error);
    next(error);
  }
};
