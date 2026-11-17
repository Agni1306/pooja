import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { AppError } from '../utils/appError.ts';

const uploadDir = path.resolve(process.cwd(), process.env.UPLOAD_DIR || 'uploads');

function ensureUploadDirExists() {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
}

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    ensureUploadDirExists();
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const safeBase = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 40);
    cb(null, `${Date.now()}-${safeBase}${ext}`);
  },
});

export const uploadImage = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max
  },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype.toLowerCase())) {
      cb(
        new AppError(
          'Unsupported image file type. Allowed types: JPEG, PNG, WEBP, GIF.',
          400,
          'INVALID_FILE_TYPE'
        )
      );
      return;
    }
    cb(null, true);
  },
});

export const uploadDirectoryPath = uploadDir;
