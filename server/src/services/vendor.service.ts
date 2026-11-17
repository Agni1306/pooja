import bcrypt from 'bcryptjs';
import { type Prisma, UserRole } from '@prisma/client';
import { prisma } from '../config/prisma.ts';
import { AppError } from '../utils/appError.ts';
import { type JwtPayload, signAuthToken } from '../utils/jwt.ts';
import { sanitizeUser } from './auth.service.ts';
import type {
  RegisterVendorEndpointInput,
  UpdateMyVendorProfileInput,
  VendorListQueryInput,
} from '../validators/vendor.validator.ts';

const BCRYPT_SALT_ROUNDS = 10;

export async function registerVendorWithProfile(
  input: RegisterVendorEndpointInput,
  authenticatedUser?: JwtPayload
) {
  // Case 1: Logged-in user creating their own VendorProfile
  if (authenticatedUser) {
    if (authenticatedUser.role !== UserRole.VENDOR) {
      throw new AppError(
        'Only accounts with VENDOR role can create a vendor business profile.',
        403,
        'FORBIDDEN'
      );
    }

    const existingProfile = await prisma.vendorProfile.findUnique({
      where: { userId: authenticatedUser.userId },
    });

    if (existingProfile) {
      throw new AppError(
        'A business profile already exists for this vendor account.',
        409,
        'VENDOR_PROFILE_EXISTS'
      );
    }

    const profile = await prisma.vendorProfile.create({
      data: {
        userId: authenticatedUser.userId,
        businessName: input.businessName,
        category: input.category,
        description: input.description,
        address: input.address,
        area: input.area,
        city: input.city || 'Mira-Bhayandar',
        openingTime: input.openingTime,
        closingTime: input.closingTime,
        contactNumber:
          input.contactNumber || authenticatedUser.mobileNumber || '',
        upiId: input.upiId ?? null,
        profileImage: input.profileImage ?? null,
        coverImage: input.coverImage ?? null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            mobileNumber: true,
            role: true,
          },
        },
      },
    });

    return { vendorProfile: profile };
  }

  // Case 2: Unauthenticated onboarding (creates User + VendorProfile atomically)
  const ownerName = (input.name || input.ownerName || '').trim();
  if (ownerName.length < 2) {
    throw new AppError(
      'Owner name is required when registering a new vendor account.',
      400,
      'VALIDATION_ERROR'
    );
  }
  if (!input.password) {
    throw new AppError(
      'Password is required when registering a new vendor account.',
      400,
      'VALIDATION_ERROR'
    );
  }
  const contactMobile = input.mobileNumber || input.contactNumber;
  if (!input.email && !contactMobile) {
    throw new AppError(
      'Provide a mobile number or email address for the vendor account.',
      400,
      'VALIDATION_ERROR'
    );
  }

  const uniqueChecks: Prisma.UserWhereInput[] = [];
  if (input.email) uniqueChecks.push({ email: input.email });
  if (contactMobile) uniqueChecks.push({ mobileNumber: contactMobile });

  const existingUser = await prisma.user.findFirst({
    where: { OR: uniqueChecks },
  });

  if (existingUser) {
    throw new AppError(
      'An account with this email or mobile number already exists.',
      409,
      'USER_ALREADY_EXISTS'
    );
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_SALT_ROUNDS);

  const created = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: ownerName,
        email: input.email ?? null,
        mobileNumber: contactMobile ?? null,
        passwordHash,
        role: UserRole.VENDOR,
      },
    });

    const vendorProfile = await tx.vendorProfile.create({
      data: {
        userId: user.id,
        businessName: input.businessName,
        category: input.category,
        description: input.description,
        address: input.address,
        area: input.area,
        city: input.city || 'Mira-Bhayandar',
        openingTime: input.openingTime,
        closingTime: input.closingTime,
        contactNumber: input.contactNumber || contactMobile || '',
        upiId: input.upiId ?? null,
        profileImage: input.profileImage ?? null,
        coverImage: input.coverImage ?? null,
      },
    });

    return { user, vendorProfile };
  });

  const token = signAuthToken({
    userId: created.user.id,
    role: created.user.role,
    name: created.user.name,
    email: created.user.email,
    mobileNumber: created.user.mobileNumber,
  });

  return {
    token,
    user: sanitizeUser(created.user),
    vendorProfile: created.vendorProfile,
  };
}

export async function listPublicVendors(query: VendorListQueryInput) {
  const where: Prisma.VendorProfileWhereInput = {};

  if (query.category && query.category !== 'All') {
    where.category = query.category;
  }
  if (query.area && query.area !== 'All') {
    where.area = query.area;
  }
  if (query.city) {
    where.city = query.city;
  }
  if (query.verificationStatus) {
    where.verificationStatus = query.verificationStatus;
  }

  if (query.search) {
    const q = query.search;
    where.OR = [
      { businessName: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
      { area: { contains: q, mode: 'insensitive' } },
      {
        user: {
          name: { contains: q, mode: 'insensitive' },
        },
      },
      {
        products: {
          some: {
            OR: [
              { productName: { contains: q, mode: 'insensitive' } },
              { category: { contains: q, mode: 'insensitive' } },
            ],
          },
        },
      },
    ];
  }

  const orderBy: Prisma.VendorProfileOrderByWithRelationInput[] =
    query.sort === 'name-desc'
      ? [{ businessName: 'desc' }]
      : query.sort === 'category'
      ? [{ category: 'asc' }, { businessName: 'asc' }]
      : query.sort === 'newest'
      ? [{ createdAt: 'desc' }]
      : [{ businessName: 'asc' }];

  const skip = (query.page - 1) * query.limit;

  const [total, vendors] = await Promise.all([
    prisma.vendorProfile.count({ where }),
    prisma.vendorProfile.findMany({
      where,
      orderBy,
      skip,
      take: query.limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        products: {
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            products: true,
            views: true,
            favoritedBy: true,
          },
        },
      },
    }),
  ]);

  return {
    vendors,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
  };
}

export async function getPublicVendorById(vendorId: string) {
  const vendor = await prisma.vendorProfile.findUnique({
    where: { id: vendorId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
      products: {
        orderBy: { createdAt: 'desc' },
      },
      _count: {
        select: {
          products: true,
          views: true,
          favoritedBy: true,
        },
      },
    },
  });

  if (!vendor) {
    throw new AppError('Vendor profile not found.', 404, 'VENDOR_NOT_FOUND');
  }

  // Record a public profile view non-blockingly
  try {
    await prisma.vendorView.create({
      data: { vendorId: vendor.id },
    });
  } catch {
    // Do not fail profile view response if view counter insert errors
  }

  return vendor;
}

export async function getMyVendorProfile(userId: string) {
  const profile = await prisma.vendorProfile.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          mobileNumber: true,
          role: true,
        },
      },
      products: {
        orderBy: { createdAt: 'desc' },
      },
      _count: {
        select: {
          products: true,
          views: true,
          favoritedBy: true,
        },
      },
    },
  });

  if (!profile) {
    throw new AppError(
      'Vendor business profile not found for this account.',
      404,
      'VENDOR_PROFILE_NOT_FOUND'
    );
  }

  return profile;
}

export async function updateMyVendorProfile(
  userId: string,
  input: UpdateMyVendorProfileInput
) {
  const existing = await prisma.vendorProfile.findUnique({
    where: { userId },
  });

  if (!existing) {
    throw new AppError(
      'Vendor business profile not found for this account.',
      404,
      'VENDOR_PROFILE_NOT_FOUND'
    );
  }

  // Explicit ownership guard
  if (existing.userId !== userId) {
    throw new AppError(
      'You are not authorized to modify another vendor’s profile.',
      403,
      'FORBIDDEN'
    );
  }

  const updated = await prisma.vendorProfile.update({
    where: { id: existing.id },
    data: {
      ...(input.businessName !== undefined ? { businessName: input.businessName } : {}),
      ...(input.category !== undefined ? { category: input.category } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.address !== undefined ? { address: input.address } : {}),
      ...(input.area !== undefined ? { area: input.area } : {}),
      ...(input.city !== undefined ? { city: input.city } : {}),
      ...(input.openingTime !== undefined ? { openingTime: input.openingTime } : {}),
      ...(input.closingTime !== undefined ? { closingTime: input.closingTime } : {}),
      ...(input.contactNumber !== undefined ? { contactNumber: input.contactNumber } : {}),
      ...(input.upiId !== undefined ? { upiId: input.upiId } : {}),
      ...(input.profileImage !== undefined ? { profileImage: input.profileImage } : {}),
      ...(input.coverImage !== undefined ? { coverImage: input.coverImage } : {}),
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          mobileNumber: true,
          role: true,
        },
      },
      products: {
        orderBy: { createdAt: 'desc' },
      },
      _count: {
        select: {
          products: true,
          views: true,
          favoritedBy: true,
        },
      },
    },
  });

  return updated;
}

export async function deleteMyVendorProfile(userId: string) {
  const existing = await prisma.vendorProfile.findUnique({
    where: { userId },
  });

  if (!existing) {
    throw new AppError(
      'Vendor business profile not found for this account.',
      404,
      'VENDOR_PROFILE_NOT_FOUND'
    );
  }

  if (existing.userId !== userId) {
    throw new AppError(
      'You are not authorized to delete another vendor’s profile.',
      403,
      'FORBIDDEN'
    );
  }

  await prisma.vendorProfile.delete({
    where: { id: existing.id },
  });

  return { deletedId: existing.id };
}
