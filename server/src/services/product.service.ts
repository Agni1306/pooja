import { Prisma, type Product } from '@prisma/client';
import { prisma } from '../config/prisma.ts';
import { AppError } from '../utils/appError.ts';
import type {
  CreateProductInput,
  ProductListQueryInput,
  UpdateProductInput,
} from '../validators/product.validator.ts';

export function serializeProduct<T extends Product>(product: T) {
  return {
    ...product,
    price: Number(product.price),
  };
}

export async function createProduct(userId: string, input: CreateProductInput) {
  const vendorProfile = await prisma.vendorProfile.findUnique({
    where: { userId },
    select: { id: true, businessName: true },
  });

  if (!vendorProfile) {
    throw new AppError(
      'You must create a vendor business profile before adding products.',
      404,
      'VENDOR_PROFILE_NOT_FOUND'
    );
  }

  const created = await prisma.product.create({
    data: {
      vendorId: vendorProfile.id,
      productName: input.productName,
      description: input.description,
      category: input.category,
      price: new Prisma.Decimal(input.price.toFixed(2)),
      unit: input.unit || 'per piece',
      image: input.image ?? null,
      availability: input.availability ?? true,
    },
    include: {
      vendor: {
        select: {
          id: true,
          businessName: true,
          area: true,
          category: true,
        },
      },
    },
  });

  return serializeProduct(created);
}

export async function listProducts(query: ProductListQueryInput) {
  const where: Prisma.ProductWhereInput = {};

  if (query.category && query.category !== 'All') {
    where.category = query.category;
  }
  if (query.vendorId) {
    where.vendorId = query.vendorId;
  }
  if (query.availability !== undefined) {
    where.availability = query.availability;
  }
  if (query.area && query.area !== 'All') {
    where.vendor = {
      area: query.area,
    };
  }
  if (query.search) {
    const q = query.search;
    where.OR = [
      { productName: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
      { category: { contains: q, mode: 'insensitive' } },
    ];
  }

  const orderBy: Prisma.ProductOrderByWithRelationInput[] =
    query.sort === 'price-asc'
      ? [{ price: 'asc' }]
      : query.sort === 'price-desc'
      ? [{ price: 'desc' }]
      : query.sort === 'name-asc'
      ? [{ productName: 'asc' }]
      : [{ createdAt: 'desc' }];

  const skip = (query.page - 1) * query.limit;

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy,
      skip,
      take: query.limit,
      include: {
        vendor: {
          select: {
            id: true,
            businessName: true,
            area: true,
            city: true,
            category: true,
            verificationStatus: true,
          },
        },
      },
    }),
  ]);

  return {
    products: products.map(serializeProduct),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
  };
}

export async function getProductById(productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      vendor: {
        select: {
          id: true,
          businessName: true,
          area: true,
          city: true,
          address: true,
          contactNumber: true,
          upiId: true,
          verificationStatus: true,
        },
      },
    },
  });

  if (!product) {
    throw new AppError('Product not found.', 404, 'PRODUCT_NOT_FOUND');
  }

  return serializeProduct(product);
}

export async function listProductsByVendor(
  vendorId: string,
  query: ProductListQueryInput
) {
  const vendor = await prisma.vendorProfile.findUnique({
    where: { id: vendorId },
    select: { id: true, businessName: true, area: true, category: true },
  });

  if (!vendor) {
    throw new AppError('Vendor not found.', 404, 'VENDOR_NOT_FOUND');
  }

  const result = await listProducts({
    ...query,
    vendorId,
  });

  return {
    vendor,
    ...result,
  };
}

export async function updateProduct(
  userId: string,
  productId: string,
  input: UpdateProductInput
) {
  const existing = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      vendor: {
        select: { id: true, userId: true },
      },
    },
  });

  if (!existing) {
    throw new AppError('Product not found.', 404, 'PRODUCT_NOT_FOUND');
  }

  // Strict product ownership enforcement
  if (existing.vendor.userId !== userId) {
    throw new AppError(
      'You are not authorized to modify another vendor’s product.',
      403,
      'FORBIDDEN'
    );
  }

  const updated = await prisma.product.update({
    where: { id: productId },
    data: {
      ...(input.productName !== undefined ? { productName: input.productName } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.category !== undefined ? { category: input.category } : {}),
      ...(input.price !== undefined
        ? { price: new Prisma.Decimal(input.price.toFixed(2)) }
        : {}),
      ...(input.unit !== undefined ? { unit: input.unit } : {}),
      ...(input.image !== undefined ? { image: input.image } : {}),
      ...(input.availability !== undefined ? { availability: input.availability } : {}),
    },
    include: {
      vendor: {
        select: {
          id: true,
          businessName: true,
          area: true,
          category: true,
        },
      },
    },
  });

  return serializeProduct(updated);
}

export async function updateProductAvailability(
  userId: string,
  productId: string,
  availability: boolean
) {
  return updateProduct(userId, productId, { availability });
}

export async function deleteProduct(userId: string, productId: string) {
  const existing = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      vendor: {
        select: { id: true, userId: true },
      },
    },
  });

  if (!existing) {
    throw new AppError('Product not found.', 404, 'PRODUCT_NOT_FOUND');
  }

  if (existing.vendor.userId !== userId) {
    throw new AppError(
      'You are not authorized to delete another vendor’s product.',
      403,
      'FORBIDDEN'
    );
  }

  await prisma.product.delete({
    where: { id: productId },
  });

  return { deletedId: productId };
}
