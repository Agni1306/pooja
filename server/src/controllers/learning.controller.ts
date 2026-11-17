import type { NextFunction, Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.ts';
import * as learningService from '../services/learning.service.ts';
import {
  createLearningMaterialSchema,
  learningListQuerySchema,
  updateLearningProgressSchema,
} from '../validators/learning.validator.ts';

export async function listLearningMaterialsController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const query = learningListQuerySchema.parse(req.query);
    const result = await learningService.listLearningMaterials(
      query,
      req.user?.userId
    );
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getLearningMaterialByIdOrSlugController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const idOrSlug = String(req.params.idOrSlug || '');
    const tutorial = await learningService.getLearningMaterialByIdOrSlug(
      idOrSlug,
      req.user?.userId
    );
    res.status(200).json({
      success: true,
      data: { tutorial },
    });
  } catch (error) {
    next(error);
  }
}

export async function getMyLearningProgressController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const progress = await learningService.getMyLearningProgress(
      req.user!.userId
    );
    res.status(200).json({
      success: true,
      data: progress,
    });
  } catch (error) {
    next(error);
  }
}

export async function completeLearningMaterialController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const idOrSlug = String(req.params.idOrSlug || '');
    const result = await learningService.setLearningCompletion(
      req.user!.userId,
      idOrSlug,
      true
    );
    res.status(200).json({
      success: true,
      message: 'Learning tutorial marked as completed.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function uncompleteLearningMaterialController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const idOrSlug = String(req.params.idOrSlug || '');
    const result = await learningService.setLearningCompletion(
      req.user!.userId,
      idOrSlug,
      false
    );
    res.status(200).json({
      success: true,
      message: 'Learning tutorial completion removed.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateLearningProgressController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const idOrSlug = String(req.params.idOrSlug || '');
    const validated = updateLearningProgressSchema.parse(req.body);
    const result = await learningService.setLearningCompletion(
      req.user!.userId,
      idOrSlug,
      validated.isCompleted
    );
    res.status(200).json({
      success: true,
      message: validated.isCompleted
        ? 'Learning tutorial marked as completed.'
        : 'Learning tutorial marked as incomplete.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function createLearningMaterialController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const validated = createLearningMaterialSchema.parse(req.body);
    const tutorial = await learningService.createLearningMaterial(validated);
    res.status(201).json({
      success: true,
      message: 'Learning material created successfully.',
      data: { tutorial },
    });
  } catch (error) {
    next(error);
  }
}
