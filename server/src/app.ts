import express, { type Express } from 'express';
import cors from 'cors';
import { env } from './config/env.ts';
import authRoutes from './routes/auth.routes.ts';
import vendorRoutes from './routes/vendor.routes.ts';
import productRoutes from './routes/product.routes.ts';
import learningRoutes from './routes/learning.routes.ts';
import favoritesRoutes from './routes/favorites.routes.ts';
import dashboardRoutes from './routes/dashboard.routes.ts';
import { uploadDirectoryPath, uploadImage } from './middleware/upload.middleware.ts';
import { AppError } from './utils/appError.ts';
import {
  apiNotFoundHandler,
  globalErrorHandler,
} from './middleware/error.middleware.ts';

export function createApp(registerExtraRoutes?: (app: Express) => void): Express {
  const app = express();

  app.use(
    cors({
      origin: env.corsOrigin === '*' ? true : env.corsOrigin.split(',').map((o) => o.trim()),
      credentials: true,
    })
  );

  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use('/uploads', express.static(uploadDirectoryPath));

  app.get('/api/health', (_req, res) => {
    res.status(200).json({
      success: true,
      service: 'digithela-api',
      databaseConfigured: Boolean(env.databaseUrl),
      timestamp: new Date().toISOString(),
    });
  });

  app.post('/api/uploads/image', uploadImage.single('image'), (req, res, next) => {
    if (!req.file) {
      next(new AppError('Please select an image file to upload.', 400, 'VALIDATION_ERROR'));
      return;
    }
    res.status(201).json({
      success: true,
      message: 'Image uploaded successfully.',
      data: {
        imageUrl: `/uploads/${req.file.filename}`,
        filename: req.file.filename,
      },
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/vendors', vendorRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/learning', learningRoutes);
  app.use('/api/favorites', favoritesRoutes);
  app.use('/api/dashboard', dashboardRoutes);

  if (registerExtraRoutes) {
    registerExtraRoutes(app);
  }

  // Return JSON 404 for unknown /api/* routes before SPA fallback
  app.use('/api', apiNotFoundHandler);

  app.use(globalErrorHandler);

  return app;
}
