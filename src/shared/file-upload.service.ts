import { extname } from 'path';
import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';

const imageMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

export const generateMulterOptions = () => {
  const uploadPath = `public/uploads`;

  // Ensure the directory exists
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }

  return {
    storage: diskStorage({
      destination: uploadPath,
      filename: (
        req: Express.Request,
        file: Express.Multer.File,
        callback: (error: Error | null, filename: string) => void,
      ) => {
        const fileExt = extname(file.originalname);
        const fileName = `${uuidv4()}${fileExt}`;
        callback(null, fileName);
      },
    }),
    fileFilter: (
      req: Express.Request,
      file: Express.Multer.File,
      callback: (error: Error | null, acceptFile: boolean) => void,
    ) => {
      if (!imageMimeTypes.includes(file.mimetype)) {
        return callback(
          new BadRequestException('Only image files are allowed!'),
          false,
        );
      }
      callback(null, true);
    },
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB max
    },
  };
};
