import { prisma } from '../config/prisma.ts';
import { AppError } from '../utils/appError.ts';
import { serializeProduct } from './product.service.ts';
import type { DashboardQueryInput } from '../validators/dashboard.validator.ts';

interface DashboardActivityItem {
  id: string;
  type: 'PRODUCT' | 'LEARNING' | 'FAVORITE' | 'PROFILE';
  title: string;
  detail: string;
  timestamp: string;
}

export async function getVendorDashboardStats(
  userId: string,
  query: DashboardQueryInput
) {
  const vendor = await prisma.vendorProfile.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          mobileNumber: true,
          role: true,
          createdAt: true,
        },
      },
    },
  });

  if (!vendor) {
    throw new AppError(
      'Vendor business profile not found for this account.',
      404,
      'VENDOR_PROFILE_NOT_FOUND'
    );
  }

  const now = new Date();
  const windowStart = new Date(now);
  windowStart.setUTCHours(0, 0, 0, 0);
  windowStart.setUTCDate(windowStart.getUTCDate() - (query.days - 1));

  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30);

  const [
    totalProducts,
    availableProducts,
    categoryGroups,
    recentProductsRaw,
    totalViews,
    windowViews,
    viewsLast30Days,
    totalFavorites,
    recentFavorites,
    totalTutorials,
    completedProgress,
  ] = await Promise.all([
    prisma.product.count({ where: { vendorId: vendor.id } }),
    prisma.product.count({ where: { vendorId: vendor.id, availability: true } }),
    prisma.product.groupBy({
      by: ['category'],
      where: { vendorId: vendor.id },
      _count: { _all: true },
    }),
    prisma.product.findMany({
      where: { vendorId: vendor.id },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    }),
    prisma.vendorView.count({ where: { vendorId: vendor.id } }),
    prisma.vendorView.findMany({
      where: {
        vendorId: vendor.id,
        viewedAt: { gte: windowStart },
      },
      select: { viewedAt: true },
      orderBy: { viewedAt: 'asc' },
    }),
    prisma.vendorView.count({
      where: {
        vendorId: vendor.id,
        viewedAt: { gte: thirtyDaysAgo },
      },
    }),
    prisma.vendorFavorite.count({ where: { vendorId: vendor.id } }),
    prisma.vendorFavorite.findMany({
      where: { vendorId: vendor.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),
    prisma.learningMaterial.count(),
    prisma.learningProgress.findMany({
      where: {
        userId,
        isCompleted: true,
      },
      orderBy: { completedAt: 'desc' },
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
    }),
  ]);

  // Calculate profile completion based on real VendorProfile & Product records
  const completionChecks = [
    { key: 'ownerName', label: 'Owner name', done: Boolean(vendor.user.name.trim()) },
    { key: 'businessName', label: 'Business name', done: Boolean(vendor.businessName.trim()) },
    { key: 'contactNumber', label: 'Contact number', done: Boolean(vendor.contactNumber.trim()) },
    { key: 'address', label: 'Street address & landmark', done: Boolean(vendor.address.trim()) },
    {
      key: 'description',
      label: 'Business description (15+ chars)',
      done: vendor.description.trim().length >= 15,
    },
    {
      key: 'timings',
      label: 'Opening & closing timings',
      done: Boolean(vendor.openingTime.trim() && vendor.closingTime.trim()),
    },
    {
      key: 'upiId',
      label: 'UPI ID for cashless payments',
      done: Boolean(vendor.upiId && vendor.upiId.trim()),
    },
    {
      key: 'products',
      label: 'At least one listed product',
      done: totalProducts > 0,
    },
  ];

  const completedSteps = completionChecks.filter((c) => c.done).length;
  const profileCompletionPercentage = Math.round(
    (completedSteps / completionChecks.length) * 100
  );
  const missingFields = completionChecks
    .filter((c) => !c.done)
    .map((c) => ({ key: c.key, label: c.label }));

  // Build daily view series for the requested window
  const dailyCounts = new Map<string, number>();
  for (let i = 0; i < query.days; i += 1) {
    const d = new Date(windowStart);
    d.setUTCDate(windowStart.getUTCDate() + i);
    const key = d.toISOString().slice(0, 10);
    dailyCounts.set(key, 0);
  }
  for (const view of windowViews) {
    const key = view.viewedAt.toISOString().slice(0, 10);
    if (dailyCounts.has(key)) {
      dailyCounts.set(key, (dailyCounts.get(key) || 0) + 1);
    }
  }
  const viewsByDay = Array.from(dailyCounts.entries()).map(([date, count]) => ({
    date,
    views: count,
  }));

  const completedTutorials = completedProgress.length;
  const learningCompletionPercentage =
    totalTutorials > 0
      ? Math.round((completedTutorials / totalTutorials) * 100)
      : 0;

  // Build recent activity feed from real database timestamps
  const recentActivity: DashboardActivityItem[] = [
    ...recentProductsRaw.map((product) => ({
      id: `product-${product.id}`,
      type: 'PRODUCT' as const,
      title:
        product.updatedAt.getTime() - product.createdAt.getTime() > 5000
          ? `Updated ${product.productName}`
          : `Listed ${product.productName}`,
      detail: `₹${Number(product.price)} ${product.unit} · ${
        product.availability ? 'In Stock' : 'Out of Stock'
      }`,
      timestamp: product.updatedAt.toISOString(),
    })),
    ...recentFavorites.map((fav) => ({
      id: `favorite-${fav.id}`,
      type: 'FAVORITE' as const,
      title: 'Saved to customer favorites',
      detail: `${fav.customer.name} bookmarked ${vendor.businessName}`,
      timestamp: fav.createdAt.toISOString(),
    })),
    ...completedProgress
      .filter((p) => p.completedAt !== null)
      .slice(0, 5)
      .map((prog) => ({
        id: `learning-${prog.id}`,
        type: 'LEARNING' as const,
        title: `Completed lesson: ${prog.learningMaterial.title}`,
        detail: prog.learningMaterial.category,
        timestamp: prog.completedAt!.toISOString(),
      })),
    {
      id: `profile-${vendor.id}`,
      type: 'PROFILE' as const,
      title: 'Business profile synced',
      detail: `${vendor.businessName} (${vendor.area})`,
      timestamp: vendor.updatedAt.toISOString(),
    },
  ]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);

  return {
    vendor: {
      id: vendor.id,
      businessName: vendor.businessName,
      ownerName: vendor.user.name,
      category: vendor.category,
      area: vendor.area,
      city: vendor.city,
      openingTime: vendor.openingTime,
      closingTime: vendor.closingTime,
      contactNumber: vendor.contactNumber,
      upiId: vendor.upiId,
      profileImage: vendor.profileImage,
      coverImage: vendor.coverImage,
      verificationStatus: vendor.verificationStatus,
      createdAt: vendor.createdAt,
      updatedAt: vendor.updatedAt,
    },
    profileCompletion: {
      percentage: profileCompletionPercentage,
      completedSteps,
      totalSteps: completionChecks.length,
      missingFields,
    },
    stats: {
      totalProducts,
      availableProducts,
      outOfStockProducts: Math.max(0, totalProducts - availableProducts),
      totalViews,
      viewsInWindow: windowViews.length,
      viewsWindowDays: query.days,
      viewsLast30Days,
      totalFavorites,
      upiReady: Boolean(vendor.upiId && vendor.upiId.trim()),
      learning: {
        totalTutorials,
        completedTutorials,
        completionPercentage: learningCompletionPercentage,
      },
    },
    categoryBreakdown: categoryGroups.map((group) => ({
      category: group.category,
      count: group._count._all,
    })),
    viewsByDay,
    recentProducts: recentProductsRaw.map(serializeProduct),
    recentActivity,
  };
}
