import bcrypt from 'bcryptjs';
import { type Prisma, type User, UserRole, type VendorProfile } from '@prisma/client';
import { prisma } from '../config/prisma.ts';
import { env } from '../config/env.ts';
import { AppError } from '../utils/appError.ts';
import { signAuthToken } from '../utils/jwt.ts';
import type {
  AdminRegisterInput,
  CustomerRegisterInput,
  LoginInput,
  VendorRegisterInput,
} from '../validators/auth.validator.ts';

const BCRYPT_SALT_ROUNDS = 10;

export type SafeUser = Omit<User, 'passwordHash'> & {
  vendorProfile?: VendorProfile | null;
};

export function sanitizeUser(
  user: User & { vendorProfile?: VendorProfile | null }
): SafeUser {
  const { passwordHash: _passwordHash, ...safe } = user;
  return safe;
}

function normalizeMobile(raw: string): string {
  const stripped = raw.replace(/[\s-]/g, '');
  if (/^[6-9]\d{9}$/.test(stripped)) {
    return `+91${stripped}`;
  }
  return stripped;
}

async function ensureUniqueIdentifiers(
  email?: string,
  mobileNumber?: string
): Promise<void> {
  const conditions: Prisma.UserWhereInput[] = [];
  if (email) conditions.push({ email });
  if (mobileNumber) conditions.push({ mobileNumber });

  if (conditions.length === 0) return;

  const existing = await prisma.user.findFirst({
    where: { OR: conditions },
  });

  if (existing) {
    if (email && existing.email === email) {
      throw new AppError('An account with this email already exists.', 409, 'EMAIL_EXISTS');
    }
    if (mobileNumber && existing.mobileNumber === mobileNumber) {
      throw new AppError(
        'An account with this mobile number already exists.',
        409,
        'MOBILE_EXISTS'
      );
    }
  }
}

function buildAuthResponse(
  user: User & { vendorProfile?: VendorProfile | null }
) {
  const token = signAuthToken({
    userId: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
    mobileNumber: user.mobileNumber,
  });

  return {
    token,
    user: sanitizeUser(user),
  };
}

export async function registerCustomer(input: CustomerRegisterInput) {
  await ensureUniqueIdentifiers(input.email, input.mobileNumber);

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email ?? null,
      mobileNumber: input.mobileNumber ?? null,
      passwordHash,
      role: UserRole.CUSTOMER,
    },
  });

  return buildAuthResponse(user);
}

export async function registerVendor(input: VendorRegisterInput) {
  await ensureUniqueIdentifiers(input.email, input.mobileNumber);

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_SALT_ROUNDS);

  const user = await prisma.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: {
        name: input.name,
        email: input.email ?? null,
        mobileNumber: input.mobileNumber ?? null,
        passwordHash,
        role: UserRole.VENDOR,
      },
    });

    if (input.vendorProfile) {
      const vp = input.vendorProfile;
      await tx.vendorProfile.create({
        data: {
          userId: createdUser.id,
          businessName: vp.businessName,
          category: vp.category,
          description: vp.description,
          address: vp.address,
          area: vp.area,
          city: vp.city || 'Mira-Bhayandar',
          openingTime: vp.openingTime,
          closingTime: vp.closingTime,
          contactNumber: vp.contactNumber || input.mobileNumber || '',
          upiId: vp.upiId ?? null,
          profileImage: vp.profileImage ?? null,
          coverImage: vp.coverImage ?? null,
        },
      });
    }

    return tx.user.findUniqueOrThrow({
      where: { id: createdUser.id },
      include: { vendorProfile: true },
    });
  });

  return buildAuthResponse(user);
}

export async function registerAdmin(input: AdminRegisterInput) {
  if (env.adminRegistrationKey) {
    if (!input.adminSecret || input.adminSecret !== env.adminRegistrationKey) {
      throw new AppError(
        'Invalid or missing admin registration key.',
        403,
        'INVALID_ADMIN_KEY'
      );
    }
  }

  await ensureUniqueIdentifiers(input.email, input.mobileNumber);

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email ?? null,
      mobileNumber: input.mobileNumber ?? null,
      passwordHash,
      role: UserRole.ADMIN,
    },
  });

  return buildAuthResponse(user);
}

export async function loginUser(input: LoginInput) {
  const rawIdentifier = (
    input.identifier ||
    input.email ||
    input.mobileNumber ||
    ''
  ).trim();

  const isEmail = rawIdentifier.includes('@');
  const normalizedEmail = isEmail ? rawIdentifier.toLowerCase() : null;
  const normalizedMobile = !isEmail ? normalizeMobile(rawIdentifier) : null;

  const user = await prisma.user.findFirst({
    where: isEmail
      ? { email: normalizedEmail }
      : {
          OR: [{ mobileNumber: normalizedMobile }, { mobileNumber: rawIdentifier }],
        },
    include: { vendorProfile: true },
  });

  if (!user) {
    throw new AppError(
      'Invalid email/mobile number or password.',
      401,
      'INVALID_CREDENTIALS'
    );
  }

  const isMatch = await bcrypt.compare(input.password, user.passwordHash);
  if (!isMatch) {
    throw new AppError(
      'Invalid email/mobile number or password.',
      401,
      'INVALID_CREDENTIALS'
    );
  }

  return buildAuthResponse(user);
}

export async function getUserProfileById(userId: string): Promise<SafeUser> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { vendorProfile: true },
  });

  if (!user) {
    throw new AppError('Authenticated user account no longer exists.', 404, 'USER_NOT_FOUND');
  }

  return sanitizeUser(user);
}
