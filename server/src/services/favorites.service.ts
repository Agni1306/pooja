import { prisma } from '../config/prisma.ts';
import { AppError } from '../utils/appError.ts';
import type { FavoritesListQueryInput } from '../validators/favorites.validator.ts';

const favoriteVendorInclude = {
  vendor: {
    select: {
      id: true,
      businessName: true,
      category: true,
      description: true,
      area: true,
      city: true,
      address: true,
      openingTime: true,
      closingTime: true,
      contactNumber: true,
      upiId: true,
      profileImage: true,
      coverImage: true,
      verificationStatus: true,
      user: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          products: true,
          favoritedBy: true,
          views: true,
        },
      },
    },
  },
} as const;

export async function listMyFavorites(
  userId: string,
  query: FavoritesListQueryInput
) {
  const skip = (query.page - 1) * query.limit;

  const [total, favorites, allFavoriteVendorIds] = await Promise.all([
    prisma.vendorFavorite.count({ where: { customerId: userId } }),
    prisma.vendorFavorite.findMany({
      where: { customerId: userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: query.limit,
      include: favoriteVendorInclude,
    }),
    prisma.vendorFavorite.findMany({
      where: { customerId: userId },
      select: { vendorId: true },
    }),
  ]);

  return {
    favorites,
    vendorIds: allFavoriteVendorIds.map((f) => f.vendorId),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
  };
}

export async function addVendorFavorite(userId: string, vendorId: string) {
  const vendor = await prisma.vendorProfile.findUnique({
    where: { id: vendorId },
    select: { id: true, businessName: true },
  });

  if (!vendor) {
    throw new AppError('Vendor not found.', 404, 'VENDOR_NOT_FOUND');
  }

  const existing = await prisma.vendorFavorite.findUnique({
    where: {
      customerId_vendorId: {
        customerId: userId,
        vendorId,
      },
    },
    include: favoriteVendorInclude,
  });

  if (existing) {
    return {
      favorite: existing,
      alreadyFavorited: true,
    };
  }

  const favorite = await prisma.vendorFavorite.create({
    data: {
      customerId: userId,
      vendorId,
    },
    include: favoriteVendorInclude,
  });

  return {
    favorite,
    alreadyFavorited: false,
  };
}

export async function removeVendorFavorite(userId: string, vendorId: string) {
  const existing = await prisma.vendorFavorite.findUnique({
    where: {
      customerId_vendorId: {
        customerId: userId,
        vendorId,
      },
    },
    select: { id: true },
  });

  if (!existing) {
    throw new AppError(
      'Vendor is not in your favorites list.',
      404,
      'FAVORITE_NOT_FOUND'
    );
  }

  await prisma.vendorFavorite.delete({
    where: { id: existing.id },
  });

  return {
    removedVendorId: vendorId,
  };
}

export async function toggleVendorFavorite(userId: string, vendorId: string) {
  const vendor = await prisma.vendorProfile.findUnique({
    where: { id: vendorId },
    select: { id: true },
  });

  if (!vendor) {
    throw new AppError('Vendor not found.', 404, 'VENDOR_NOT_FOUND');
  }

  const existing = await prisma.vendorFavorite.findUnique({
    where: {
      customerId_vendorId: {
        customerId: userId,
        vendorId,
      },
    },
    select: { id: true },
  });

  if (existing) {
    await prisma.vendorFavorite.delete({
      where: { id: existing.id },
    });
    return {
      vendorId,
      isFavorited: false,
      favorite: null,
    };
  }

  const favorite = await prisma.vendorFavorite.create({
    data: {
      customerId: userId,
      vendorId,
    },
    include: favoriteVendorInclude,
  });

  return {
    vendorId,
    isFavorited: true,
    favorite,
  };
}

export async function getVendorFavoriteStatus(userId: string, vendorId: string) {
  const existing = await prisma.vendorFavorite.findUnique({
    where: {
      customerId_vendorId: {
        customerId: userId,
        vendorId,
      },
    },
    select: {
      id: true,
      createdAt: true,
    },
  });

  return {
    vendorId,
    isFavorited: Boolean(existing),
    favoritedAt: existing?.createdAt ?? null,
  };
}
