export type VendorCategory =
  | 'Fruits & Vegetables'
  | 'Street Food'
  | 'Grocery'
  | 'Clothing'
  | 'Flowers'
  | 'Other Local Businesses';

export type MiraBhayandarArea =
  | 'Mira Road East'
  | 'Mira Road West'
  | 'Bhayandar East'
  | 'Bhayandar West'
  | 'Kashimira'
  | 'Shanti Park'
  | 'Golden Nest';

export interface Product {
  id: string;
  vendorId?: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  description: string;
  image: string;
  available: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Vendor {
  id: string;
  userId?: string;
  ownerName: string;
  businessName: string;
  category: VendorCategory | string;
  area: MiraBhayandarArea | string;
  city?: string;
  address: string;
  phone: string;
  openingHours: string;
  openingTime?: string;
  closingTime?: string;
  description: string;
  upiId: string;
  profileImage: string;
  coverImage: string;
  verificationStatus?: 'PENDING' | 'VERIFIED' | 'REJECTED';
  featured?: boolean;
  profileViewsDemo: number;
  favoritesCount?: number;
  productsCount?: number;
  products: Product[];
}

export type TutorialCategory =
  | 'Digital Payments'
  | 'Online Business'
  | 'Digital Marketing'
  | 'Digital Safety';

export type DifficultyLevel = 'Beginner' | 'Easy Guide' | 'Safety Essential';

export interface TutorialStep {
  heading: string;
  explanation: string;
}

export interface Tutorial {
  id: string;
  slug?: string;
  title: string;
  category: TutorialCategory | string;
  difficulty: DifficultyLevel | string;
  readingTime: string;
  summary: string;
  image: string;
  steps: TutorialStep[];
  keyTip: string;
  avoidTip: string;
  isCompleted?: boolean;
  completedAt?: string | null;
}

export interface Testimonial {
  id: string;
  name: string;
  businessName: string;
  area: MiraBhayandarArea;
  category: VendorCategory;
  beforeAfterOutcome: string;
  quote: string;
}

export interface ActivityItem {
  id: string;
  title: string;
  detail: string;
  timestamp: string;
  type: 'product' | 'profile' | 'payment' | 'view' | 'learning' | 'favorite';
}

export interface AuthUser {
  id: string;
  role: 'customer' | 'vendor' | 'admin';
  name: string;
  phoneOrEmail: string;
  email?: string | null;
  mobileNumber?: string | null;
  vendorId?: string;
}

export interface LearningProgressSummary {
  totalTutorials: number;
  completedCount: number;
  completionPercentage: number;
  completedMaterialIds: string[];
  completedSlugs: string[];
  categoryBreakdown: Array<{
    category: string;
    total: number;
    completed: number;
    percentage: number;
  }>;
}

export interface DashboardData {
  vendor: {
    id: string;
    businessName: string;
    ownerName: string;
    category: string;
    area: string;
    city: string;
    openingTime: string;
    closingTime: string;
    contactNumber: string;
    upiId: string | null;
    profileImage: string | null;
    coverImage: string | null;
    verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
    createdAt: string;
    updatedAt: string;
  };
  profileCompletion: {
    percentage: number;
    completedSteps: number;
    totalSteps: number;
    missingFields: Array<{ key: string; label: string }>;
  };
  stats: {
    totalProducts: number;
    availableProducts: number;
    outOfStockProducts: number;
    totalViews: number;
    viewsInWindow: number;
    viewsWindowDays: number;
    viewsLast30Days: number;
    totalFavorites: number;
    upiReady: boolean;
    learning: {
      totalTutorials: number;
      completedTutorials: number;
      completionPercentage: number;
    };
  };
  categoryBreakdown: Array<{ category: string; count: number }>;
  viewsByDay: Array<{ date: string; views: number }>;
  recentProducts: Product[];
  recentActivity: Array<{
    id: string;
    type: 'PRODUCT' | 'LEARNING' | 'FAVORITE' | 'PROFILE';
    title: string;
    detail: string;
    timestamp: string;
  }>;
}
