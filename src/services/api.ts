import {
  AuthUser,
  DashboardData,
  LearningProgressSummary,
  Product,
  Tutorial,
  TutorialStep,
  Vendor,
} from '../types';

const TOKEN_STORAGE_KEY = 'digithela_auth_token';

const FALLBACK_COVER_BY_CATEGORY: Record<string, string> = {
  'Fruits & Vegetables': '/src/assets/images/vendor_vegetables_stall_1794857943239.jpg',
  'Street Food': '/src/assets/images/vendor_chaat_food_1794857943606.jpg',
  Grocery: '/src/assets/images/vendor_grocery_kirana_1794857944226.jpg',
  Clothing: '/src/assets/images/vendor_cotton_clothing_1794857943977.jpg',
  Flowers: '/src/assets/images/vendor_flower_garlands_1794857944734.jpg',
  'Other Local Businesses': '/src/assets/images/vendor_tailor_alteration_1794857946936.jpg',
};

export class ApiClientError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(message: string, status = 500, code = 'API_ERROR', details?: unknown) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function getStoredToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // Ignore storage access restrictions
  }
}

interface ApiResponseEnvelope<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
}

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(init.headers);

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const isFormData =
    typeof FormData !== 'undefined' && init.body instanceof FormData;
  if (!isFormData && init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      headers,
      credentials: 'include',
    });
  } catch {
    throw new ApiClientError(
      'Unable to reach DigiThela server. Please check your connection.',
      0,
      'NETWORK_ERROR'
    );
  }

  let payload: ApiResponseEnvelope<T> | null = null;
  try {
    payload = (await response.json()) as ApiResponseEnvelope<T>;
  } catch {
    payload = null;
  }

  if (!response.ok || !payload?.success) {
    const message =
      payload?.error?.message ||
      payload?.message ||
      `Request failed with status ${response.status}.`;
    const code = payload?.error?.code || 'API_ERROR';
    throw new ApiClientError(message, response.status, code, payload?.error?.details);
  }

  return payload.data as T;
}

export function mapBackendProduct(raw: any): Product {
  return {
    id: String(raw.id),
    vendorId: raw.vendorId ? String(raw.vendorId) : undefined,
    name: String(raw.productName ?? raw.name ?? ''),
    category: String(raw.category ?? 'General'),
    price: Number(raw.price ?? 0),
    unit: String(raw.unit ?? 'per piece'),
    description: String(raw.description ?? ''),
    image: raw.image ? String(raw.image) : '',
    available: Boolean(raw.availability ?? raw.available ?? true),
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export function mapBackendVendor(raw: any): Vendor {
  const category = String(raw.category ?? 'Other Local Businesses');
  const openingTime = String(raw.openingTime ?? '8:00 AM');
  const closingTime = String(raw.closingTime ?? '9:00 PM');
  const rawProducts = Array.isArray(raw.products) ? raw.products : [];

  return {
    id: String(raw.id),
    userId: raw.userId ? String(raw.userId) : undefined,
    ownerName: String(raw.user?.name ?? raw.ownerName ?? 'Local Vendor'),
    businessName: String(raw.businessName ?? ''),
    category,
    area: String(raw.area ?? 'Mira Road East'),
    city: raw.city ? String(raw.city) : 'Mira-Bhayandar',
    address: String(raw.address ?? ''),
    phone: String(raw.contactNumber ?? raw.phone ?? ''),
    openingHours: `${openingTime} – ${closingTime}`,
    openingTime,
    closingTime,
    description: String(raw.description ?? ''),
    upiId: raw.upiId ? String(raw.upiId) : '',
    profileImage: raw.profileImage
      ? String(raw.profileImage)
      : '/src/assets/images/hero_indian_vendor_1794857942496.jpg',
    coverImage: raw.coverImage
      ? String(raw.coverImage)
      : FALLBACK_COVER_BY_CATEGORY[category] ||
        '/src/assets/images/vendor_vegetables_stall_1794857943239.jpg',
    verificationStatus: raw.verificationStatus,
    featured: raw.verificationStatus === 'VERIFIED' || rawProducts.length > 0,
    profileViewsDemo: Number(raw._count?.views ?? raw.profileViewsDemo ?? 0),
    favoritesCount: Number(raw._count?.favoritedBy ?? 0),
    productsCount: Number(raw._count?.products ?? rawProducts.length),
    products: rawProducts.map(mapBackendProduct),
  };
}

export function mapBackendUser(raw: any): AuthUser {
  const roleLower = String(raw.role ?? 'CUSTOMER').toLowerCase() as
    | 'customer'
    | 'vendor'
    | 'admin';

  return {
    id: String(raw.id),
    role: roleLower,
    name: String(raw.name ?? ''),
    phoneOrEmail: String(raw.mobileNumber || raw.email || ''),
    email: raw.email ?? null,
    mobileNumber: raw.mobileNumber ?? null,
    vendorId: raw.vendorProfile?.id ? String(raw.vendorProfile.id) : undefined,
  };
}

export function mapBackendTutorial(raw: any): Tutorial {
  let steps: TutorialStep[] = [];
  let keyTip = '';
  let avoidTip = '';

  if (raw.structuredContent && Array.isArray(raw.structuredContent.steps)) {
    steps = raw.structuredContent.steps;
    keyTip = raw.structuredContent.keyTip || '';
    avoidTip = raw.structuredContent.avoidTip || '';
  } else if (typeof raw.content === 'string') {
    try {
      const parsed = JSON.parse(raw.content) as {
        steps?: TutorialStep[];
        keyTip?: string;
        avoidTip?: string;
      };
      if (Array.isArray(parsed.steps)) {
        steps = parsed.steps;
      }
      keyTip = parsed.keyTip || '';
      avoidTip = parsed.avoidTip || '';
    } catch {
      steps = [
        {
          heading: raw.title || 'Lesson Guide',
          explanation: raw.content,
        },
      ];
    }
  }

  return {
    id: String(raw.id),
    slug: raw.slug ? String(raw.slug) : undefined,
    title: String(raw.title ?? ''),
    category: String(raw.category ?? 'Digital Payments'),
    difficulty: String(raw.difficultyLevel ?? 'Beginner'),
    readingTime: String(raw.estimatedReadingTime ?? '4 min read'),
    summary: String(raw.description ?? ''),
    image: raw.image
      ? String(raw.image)
      : '/src/assets/images/learning_digital_payments_1794857947455.jpg',
    steps,
    keyTip,
    avoidTip,
    isCompleted: Boolean(raw.isCompleted),
    completedAt: raw.completedAt ?? null,
  };
}

export const authApi = {
  async login(identifier: string, password: string) {
    const data = await apiFetch<{ token: string; user: any }>(
      '/api/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ identifier, password }),
      }
    );
    return {
      token: data.token,
      user: mapBackendUser(data.user),
      vendorProfile: data.user?.vendorProfile
        ? mapBackendVendor(data.user.vendorProfile)
        : null,
    };
  },

  async registerCustomer(input: {
    name: string;
    email?: string;
    mobileNumber?: string;
    password: string;
  }) {
    const data = await apiFetch<{ token: string; user: any }>(
      '/api/auth/register/customer',
      {
        method: 'POST',
        body: JSON.stringify(input),
      }
    );
    return {
      token: data.token,
      user: mapBackendUser(data.user),
    };
  },

  async registerVendorAccount(input: {
    name: string;
    email?: string;
    mobileNumber?: string;
    password: string;
  }) {
    const data = await apiFetch<{ token: string; user: any }>(
      '/api/auth/register/vendor',
      {
        method: 'POST',
        body: JSON.stringify(input),
      }
    );
    return {
      token: data.token,
      user: mapBackendUser(data.user),
    };
  },

  async me() {
    const data = await apiFetch<{ user: any }>('/api/auth/me');
    return {
      user: mapBackendUser(data.user),
      vendorProfile: data.user?.vendorProfile
        ? mapBackendVendor(data.user.vendorProfile)
        : null,
    };
  },

  async logout() {
    await apiFetch('/api/auth/logout', { method: 'POST' });
  },
};

export interface VendorListParams {
  search?: string;
  category?: string;
  area?: string;
  sort?: 'name-asc' | 'name-desc' | 'category' | 'newest';
  page?: number;
  limit?: number;
}

export const vendorsApi = {
  async list(params: VendorListParams = {}) {
    const qs = new URLSearchParams();
    if (params.search) qs.set('search', params.search);
    if (params.category && params.category !== 'All') qs.set('category', params.category);
    if (params.area && params.area !== 'All') qs.set('area', params.area);
    if (params.sort) qs.set('sort', params.sort);
    if (params.page) qs.set('page', String(params.page));
    if (params.limit) qs.set('limit', String(params.limit));

    const queryStr = qs.toString();
    const data = await apiFetch<{
      vendors: any[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(`/api/vendors${queryStr ? `?${queryStr}` : ''}`);

    return {
      vendors: data.vendors.map(mapBackendVendor),
      pagination: data.pagination,
    };
  },

  async getById(vendorId: string) {
    const data = await apiFetch<{ vendor: any }>(`/api/vendors/${encodeURIComponent(vendorId)}`);
    return mapBackendVendor(data.vendor);
  },

  async register(payload: {
    name?: string;
    ownerName?: string;
    email?: string;
    mobileNumber?: string;
    password?: string;
    businessName: string;
    category: string;
    description: string;
    address: string;
    area: string;
    city?: string;
    openingTime: string;
    closingTime: string;
    contactNumber?: string;
    upiId?: string;
    profileImage?: string;
    coverImage?: string;
  }) {
    const data = await apiFetch<{
      token?: string;
      user?: any;
      vendorProfile: any;
    }>('/api/vendors/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return {
      token: data.token,
      user: data.user ? mapBackendUser(data.user) : undefined,
      vendor: mapBackendVendor({
        ...data.vendorProfile,
        user: data.vendorProfile?.user ?? data.user,
      }),
    };
  },

  async getMyProfile() {
    const data = await apiFetch<{ vendor: any }>('/api/vendors/my-profile');
    return mapBackendVendor(data.vendor);
  },

  async updateMyProfile(payload: Record<string, unknown>) {
    const data = await apiFetch<{ vendor: any }>('/api/vendors/my-profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return mapBackendVendor(data.vendor);
  },

  async deleteMyProfile() {
    return apiFetch<{ deletedId: string }>('/api/vendors/my-profile', {
      method: 'DELETE',
    });
  },
};

export const productsApi = {
  async create(
    payload: {
      productName: string;
      description: string;
      category: string;
      price: number;
      unit: string;
      image?: string;
      availability?: boolean;
    },
    imageFile?: File | null
  ) {
    let body: BodyInit;
    if (imageFile) {
      const formData = new FormData();
      formData.append('productName', payload.productName);
      formData.append('description', payload.description);
      formData.append('category', payload.category);
      formData.append('price', String(payload.price));
      formData.append('unit', payload.unit);
      if (payload.availability !== undefined) {
        formData.append('availability', String(payload.availability));
      }
      formData.append('image', imageFile);
      body = formData;
    } else {
      body = JSON.stringify(payload);
    }

    const data = await apiFetch<{ product: any }>('/api/products', {
      method: 'POST',
      body,
    });
    return mapBackendProduct(data.product);
  },

  async update(
    productId: string,
    payload: {
      productName?: string;
      description?: string;
      category?: string;
      price?: number;
      unit?: string;
      image?: string | null;
      availability?: boolean;
    },
    imageFile?: File | null
  ) {
    let body: BodyInit;
    if (imageFile) {
      const formData = new FormData();
      if (payload.productName !== undefined) formData.append('productName', payload.productName);
      if (payload.description !== undefined) formData.append('description', payload.description);
      if (payload.category !== undefined) formData.append('category', payload.category);
      if (payload.price !== undefined) formData.append('price', String(payload.price));
      if (payload.unit !== undefined) formData.append('unit', payload.unit);
      if (payload.availability !== undefined) {
        formData.append('availability', String(payload.availability));
      }
      formData.append('image', imageFile);
      body = formData;
    } else {
      body = JSON.stringify(payload);
    }

    const data = await apiFetch<{ product: any }>(
      `/api/products/${encodeURIComponent(productId)}`,
      {
        method: 'PUT',
        body,
      }
    );
    return mapBackendProduct(data.product);
  },

  async toggleAvailability(productId: string, availability: boolean) {
    const data = await apiFetch<{ product: any }>(
      `/api/products/${encodeURIComponent(productId)}/availability`,
      {
        method: 'PATCH',
        body: JSON.stringify({ availability }),
      }
    );
    return mapBackendProduct(data.product);
  },

  async remove(productId: string) {
    return apiFetch<{ deletedId: string }>(
      `/api/products/${encodeURIComponent(productId)}`,
      {
        method: 'DELETE',
      }
    );
  },
};

export const learningApi = {
  async list(params: { category?: string; search?: string; limit?: number } = {}) {
    const qs = new URLSearchParams();
    if (params.category && params.category !== 'All') qs.set('category', params.category);
    if (params.search) qs.set('search', params.search);
    if (params.limit) qs.set('limit', String(params.limit));

    const queryStr = qs.toString();
    const data = await apiFetch<{
      tutorials: any[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
      progressSummary?: {
        completedCount: number;
        totalTutorials: number;
        completionPercentage: number;
      };
    }>(`/api/learning${queryStr ? `?${queryStr}` : ''}`);

    return {
      tutorials: data.tutorials.map(mapBackendTutorial),
      pagination: data.pagination,
      progressSummary: data.progressSummary,
    };
  },

  async getByIdOrSlug(idOrSlug: string) {
    const data = await apiFetch<{ tutorial: any }>(
      `/api/learning/${encodeURIComponent(idOrSlug)}`
    );
    return mapBackendTutorial(data.tutorial);
  },

  async getProgress() {
    return apiFetch<LearningProgressSummary>('/api/learning/progress');
  },

  async setCompletion(idOrSlug: string, isCompleted: boolean) {
    return apiFetch<{
      progress: {
        learningMaterialId: string;
        isCompleted: boolean;
        completedAt: string | null;
        learningMaterial: { id: string; slug: string; title: string; category: string };
      };
      summary: {
        totalTutorials: number;
        completedCount: number;
        completionPercentage: number;
      };
    }>(`/api/learning/${encodeURIComponent(idOrSlug)}/progress`, {
      method: 'PATCH',
      body: JSON.stringify({ isCompleted }),
    });
  },
};

export const favoritesApi = {
  async list() {
    const data = await apiFetch<{
      favorites: Array<{ id: string; vendorId: string; createdAt: string; vendor: any }>;
      vendorIds: string[];
    }>('/api/favorites?limit=100');
    return {
      favorites: data.favorites.map((f) => ({
        id: f.id,
        vendorId: f.vendorId,
        createdAt: f.createdAt,
        vendor: mapBackendVendor(f.vendor),
      })),
      vendorIds: data.vendorIds,
    };
  },

  async toggle(vendorId: string) {
    return apiFetch<{
      vendorId: string;
      isFavorited: boolean;
    }>(`/api/favorites/${encodeURIComponent(vendorId)}/toggle`, {
      method: 'POST',
    });
  },

  async getStatus(vendorId: string) {
    return apiFetch<{
      vendorId: string;
      isFavorited: boolean;
      favoritedAt: string | null;
    }>(`/api/favorites/${encodeURIComponent(vendorId)}/status`);
  },
};

export const dashboardApi = {
  async getVendorDashboard(days = 7) {
    const data = await apiFetch<any>(`/api/dashboard/vendor?days=${days}`);
    return {
      ...data,
      recentProducts: Array.isArray(data.recentProducts)
        ? data.recentProducts.map(mapBackendProduct)
        : [],
    } as DashboardData;
  },
};

export const uploadsApi = {
  async uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('image', file);
    const data = await apiFetch<{ imageUrl: string }>('/api/uploads/image', {
      method: 'POST',
      body: formData,
    });
    return data.imageUrl;
  },
};
