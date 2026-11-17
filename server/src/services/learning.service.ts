import type { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma.ts';
import { AppError } from '../utils/appError.ts';
import type {
  CreateLearningMaterialInput,
  LearningListQueryInput,
} from '../validators/learning.validator.ts';

export interface StructuredTutorialContent {
  steps: Array<{ heading: string; explanation: string }>;
  keyTip?: string;
  avoidTip?: string;
}

function parseStructuredContent(content: string): StructuredTutorialContent | null {
  try {
    const parsed = JSON.parse(content) as Partial<StructuredTutorialContent>;
    if (parsed && Array.isArray(parsed.steps)) {
      return {
        steps: parsed.steps,
        ...(typeof parsed.keyTip === 'string' ? { keyTip: parsed.keyTip } : {}),
        ...(typeof parsed.avoidTip === 'string' ? { avoidTip: parsed.avoidTip } : {}),
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function listLearningMaterials(
  query: LearningListQueryInput,
  userId?: string
) {
  const where: Prisma.LearningMaterialWhereInput = {};

  if (query.category && query.category !== 'All') {
    where.category = query.category;
  }
  if (query.difficultyLevel && query.difficultyLevel !== 'All') {
    where.difficultyLevel = query.difficultyLevel;
  }
  if (query.search) {
    const q = query.search;
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
      { category: { contains: q, mode: 'insensitive' } },
      { content: { contains: q, mode: 'insensitive' } },
    ];
  }

  const skip = (query.page - 1) * query.limit;

  const [total, materials, allMaterialsCount] = await Promise.all([
    prisma.learningMaterial.count({ where }),
    prisma.learningMaterial.findMany({
      where,
      orderBy: [{ createdAt: 'asc' }, { title: 'asc' }],
      skip,
      take: query.limit,
    }),
    prisma.learningMaterial.count(),
  ]);

  let progressMap = new Map<
    string,
    { isCompleted: boolean; completedAt: Date | null }
  >();
  let totalCompletedCount = 0;

  if (userId) {
    const userProgress = await prisma.learningProgress.findMany({
      where: { userId },
      select: {
        learningMaterialId: true,
        isCompleted: true,
        completedAt: true,
      },
    });

    for (const entry of userProgress) {
      progressMap.set(entry.learningMaterialId, {
        isCompleted: entry.isCompleted,
        completedAt: entry.completedAt,
      });
      if (entry.isCompleted) {
        totalCompletedCount += 1;
      }
    }
  }

  const enrichedMaterials = materials.map((item) => {
    const progress = progressMap.get(item.id);
    const structuredContent = parseStructuredContent(item.content);
    return {
      ...item,
      ...(structuredContent ? { structuredContent } : {}),
      isCompleted: progress?.isCompleted ?? false,
      completedAt: progress?.completedAt ?? null,
    };
  });

  const completionPercentage =
    allMaterialsCount > 0
      ? Math.round((totalCompletedCount / allMaterialsCount) * 100)
      : 0;

  return {
    tutorials: enrichedMaterials,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
    ...(userId
      ? {
          progressSummary: {
            completedCount: totalCompletedCount,
            totalTutorials: allMaterialsCount,
            completionPercentage,
          },
        }
      : {}),
  };
}

export async function getLearningMaterialByIdOrSlug(
  idOrSlug: string,
  userId?: string
) {
  const material = await prisma.learningMaterial.findFirst({
    where: {
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
    },
  });

  if (!material) {
    throw new AppError(
      'Learning tutorial not found.',
      404,
      'LEARNING_MATERIAL_NOT_FOUND'
    );
  }

  let isCompleted = false;
  let completedAt: Date | null = null;

  if (userId) {
    const progress = await prisma.learningProgress.findUnique({
      where: {
        userId_learningMaterialId: {
          userId,
          learningMaterialId: material.id,
        },
      },
    });
    if (progress) {
      isCompleted = progress.isCompleted;
      completedAt = progress.completedAt;
    }
  }

  const structuredContent = parseStructuredContent(material.content);

  return {
    ...material,
    ...(structuredContent ? { structuredContent } : {}),
    isCompleted,
    completedAt,
  };
}

export async function getMyLearningProgress(userId: string) {
  const [allMaterials, progressRecords] = await Promise.all([
    prisma.learningMaterial.findMany({
      orderBy: [{ createdAt: 'asc' }, { title: 'asc' }],
      select: {
        id: true,
        slug: true,
        title: true,
        category: true,
        difficultyLevel: true,
        estimatedReadingTime: true,
      },
    }),
    prisma.learningProgress.findMany({
      where: { userId },
      orderBy: { completedAt: 'desc' },
      include: {
        learningMaterial: {
          select: {
            id: true,
            slug: true,
            title: true,
            category: true,
            difficultyLevel: true,
            estimatedReadingTime: true,
          },
        },
      },
    }),
  ]);

  const completedSet = new Set(
    progressRecords
      .filter((p) => p.isCompleted)
      .map((p) => p.learningMaterialId)
  );

  const totalTutorials = allMaterials.length;
  const completedCount = completedSet.size;
  const completionPercentage =
    totalTutorials > 0 ? Math.round((completedCount / totalTutorials) * 100) : 0;

  const categoryTotals = new Map<
    string,
    { category: string; total: number; completed: number }
  >();
  for (const mat of allMaterials) {
    const entry = categoryTotals.get(mat.category) || {
      category: mat.category,
      total: 0,
      completed: 0,
    };
    entry.total += 1;
    if (completedSet.has(mat.id)) {
      entry.completed += 1;
    }
    categoryTotals.set(mat.category, entry);
  }

  const categoryBreakdown = Array.from(categoryTotals.values()).map((c) => ({
    ...c,
    percentage: c.total > 0 ? Math.round((c.completed / c.total) * 100) : 0,
  }));

  const completedLessons = progressRecords.filter((p) => p.isCompleted);

  return {
    totalTutorials,
    completedCount,
    completionPercentage,
    completedMaterialIds: completedLessons.map((p) => p.learningMaterialId),
    completedSlugs: completedLessons.map((p) => p.learningMaterial.slug),
    completedLessons,
    categoryBreakdown,
  };
}

export async function setLearningCompletion(
  userId: string,
  idOrSlug: string,
  isCompleted: boolean
) {
  const material = await prisma.learningMaterial.findFirst({
    where: {
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
    },
    select: {
      id: true,
      slug: true,
      title: true,
      category: true,
    },
  });

  if (!material) {
    throw new AppError(
      'Learning tutorial not found.',
      404,
      'LEARNING_MATERIAL_NOT_FOUND'
    );
  }

  const now = isCompleted ? new Date() : null;

  const progress = await prisma.learningProgress.upsert({
    where: {
      userId_learningMaterialId: {
        userId,
        learningMaterialId: material.id,
      },
    },
    update: {
      isCompleted,
      completedAt: now,
    },
    create: {
      userId,
      learningMaterialId: material.id,
      isCompleted,
      completedAt: now,
    },
    include: {
      learningMaterial: {
        select: {
          id: true,
          slug: true,
          title: true,
          category: true,
        },
      },
    },
  });

  const [totalTutorials, completedCount] = await Promise.all([
    prisma.learningMaterial.count(),
    prisma.learningProgress.count({
      where: { userId, isCompleted: true },
    }),
  ]);

  return {
    progress,
    summary: {
      totalTutorials,
      completedCount,
      completionPercentage:
        totalTutorials > 0
          ? Math.round((completedCount / totalTutorials) * 100)
          : 0,
    },
  };
}

export async function createLearningMaterial(input: CreateLearningMaterialInput) {
  const existing = await prisma.learningMaterial.findUnique({
    where: { slug: input.slug },
    select: { id: true },
  });

  if (existing) {
    throw new AppError(
      'A learning tutorial with this slug already exists.',
      409,
      'SLUG_ALREADY_EXISTS'
    );
  }

  return prisma.learningMaterial.create({
    data: {
      slug: input.slug,
      title: input.title,
      description: input.description,
      content: input.content,
      category: input.category,
      difficultyLevel: input.difficultyLevel,
      estimatedReadingTime: input.estimatedReadingTime,
      image: input.image ?? null,
    },
  });
}
