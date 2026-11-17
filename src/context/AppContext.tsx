import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  ApiClientError,
  authApi,
  dashboardApi,
  favoritesApi,
  getStoredToken,
  learningApi,
  productsApi,
  setStoredToken,
  vendorsApi,
} from '../services/api';
import {
  AuthUser,
  DashboardData,
  LearningProgressSummary,
  Product,
  Tutorial,
  Vendor,
} from '../types';

interface ToastState {
  message: string;
  tone: 'success' | 'info' | 'warning';
}

interface RegisterVendorPayload {
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
}

interface AppContextValue {
  vendors: Vendor[];
  vendorsLoading: boolean;
  vendorsError: string | null;
  refreshVendors: () => Promise<void>;

  activeVendor: Vendor | null;
  activeVendorLoading: boolean;
  refreshMyVendorProfile: () => Promise<Vendor | null>;

  dashboardData: DashboardData | null;
  dashboardLoading: boolean;
  dashboardError: string | null;
  refreshDashboard: (days?: number) => Promise<DashboardData | null>;

  authUser: AuthUser | null;
  authLoading: boolean;
  loginUser: (identifier: string, password: string) => Promise<{
    user: AuthUser;
    vendorProfile: Vendor | null;
  }>;
  registerCustomerAccount: (input: {
    name: string;
    email?: string;
    mobileNumber?: string;
    password: string;
  }) => Promise<AuthUser>;
  registerVendorAccount: (input: {
    name: string;
    email?: string;
    mobileNumber?: string;
    password: string;
  }) => Promise<AuthUser>;
  logoutUser: () => Promise<void>;

  registerVendor: (payload: RegisterVendorPayload) => Promise<Vendor>;
  updateVendorProfile: (updates: Record<string, unknown>) => Promise<Vendor>;
  deleteVendorProfile: () => Promise<void>;

  addProduct: (
    product: {
      name: string;
      category: string;
      price: number;
      unit: string;
      description: string;
      image?: string;
      available: boolean;
    },
    imageFile?: File | null
  ) => Promise<Product>;
  updateProduct: (
    productId: string,
    updates: {
      name?: string;
      category?: string;
      price?: number;
      unit?: string;
      description?: string;
      image?: string | null;
      available?: boolean;
    },
    imageFile?: File | null
  ) => Promise<Product>;
  deleteProduct: (productId: string) => Promise<void>;
  toggleProductAvailability: (
    productId: string,
    nextAvailable: boolean
  ) => Promise<void>;

  tutorials: Tutorial[];
  tutorialsLoading: boolean;
  tutorialsError: string | null;
  refreshTutorials: () => Promise<void>;

  completedLessons: string[];
  learningSummary: LearningProgressSummary | null;
  refreshLearningProgress: () => Promise<void>;
  toggleLessonCompleted: (idOrSlug: string) => Promise<void>;

  favoriteVendorIds: string[];
  favoritesLoading: boolean;
  refreshFavorites: () => Promise<void>;
  toggleFavoriteVendor: (vendorId: string) => Promise<boolean>;

  toast: ToastState | null;
  showToast: (message: string, tone?: ToastState['tone']) => void;
  dismissToast: () => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

function extractErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiClientError) {
    return err.message;
  }
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return fallback;
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorsLoading, setVendorsLoading] = useState<boolean>(true);
  const [vendorsError, setVendorsError] = useState<string | null>(null);

  const [activeVendor, setActiveVendor] = useState<Vendor | null>(null);
  const [activeVendorLoading, setActiveVendorLoading] = useState<boolean>(false);

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState<boolean>(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(Boolean(getStoredToken()));

  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [tutorialsLoading, setTutorialsLoading] = useState<boolean>(true);
  const [tutorialsError, setTutorialsError] = useState<string | null>(null);

  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [learningSummary, setLearningSummary] =
    useState<LearningProgressSummary | null>(null);

  const [favoriteVendorIds, setFavoriteVendorIds] = useState<string[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState<boolean>(false);

  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback(
    (message: string, tone: ToastState['tone'] = 'success') => {
      setToast({ message, tone });
      window.setTimeout(() => {
        setToast((current) => (current?.message === message ? null : current));
      }, 3800);
    },
    []
  );

  const dismissToast = useCallback(() => setToast(null), []);

  const refreshVendors = useCallback(async () => {
    setVendorsLoading(true);
    setVendorsError(null);
    try {
      const result = await vendorsApi.list({ limit: 50 });
      setVendors(result.vendors);
    } catch (err) {
      setVendorsError(
        extractErrorMessage(err, 'Failed to load local vendors from server.')
      );
    } finally {
      setVendorsLoading(false);
    }
  }, []);

  const refreshTutorials = useCallback(async () => {
    setTutorialsLoading(true);
    setTutorialsError(null);
    try {
      const result = await learningApi.list({ limit: 50 });
      setTutorials(result.tutorials);
    } catch (err) {
      setTutorialsError(
        extractErrorMessage(err, 'Failed to load Digital Learning tutorials.')
      );
    } finally {
      setTutorialsLoading(false);
    }
  }, []);

  const refreshLearningProgress = useCallback(async () => {
    if (!getStoredToken()) {
      setCompletedLessons([]);
      setLearningSummary(null);
      return;
    }
    try {
      const summary = await learningApi.getProgress();
      setLearningSummary(summary);
      setCompletedLessons([
        ...summary.completedMaterialIds,
        ...summary.completedSlugs,
      ]);
    } catch {
      // Ignore if unauthenticated or DB unavailable
    }
  }, []);

  const refreshFavorites = useCallback(async () => {
    if (!getStoredToken()) {
      setFavoriteVendorIds([]);
      return;
    }
    setFavoritesLoading(true);
    try {
      const res = await favoritesApi.list();
      setFavoriteVendorIds(res.vendorIds);
    } catch {
      // Ignore if unauthenticated
    } finally {
      setFavoritesLoading(false);
    }
  }, []);

  const refreshMyVendorProfile = useCallback(async (): Promise<Vendor | null> => {
    if (!getStoredToken()) {
      setActiveVendor(null);
      return null;
    }
    setActiveVendorLoading(true);
    try {
      const vendor = await vendorsApi.getMyProfile();
      setActiveVendor(vendor);
      return vendor;
    } catch (err) {
      if (
        err instanceof ApiClientError &&
        err.code === 'VENDOR_PROFILE_NOT_FOUND'
      ) {
        setActiveVendor(null);
        return null;
      }
      return null;
    } finally {
      setActiveVendorLoading(false);
    }
  }, []);

  const refreshDashboard = useCallback(
    async (days = 7): Promise<DashboardData | null> => {
      if (!getStoredToken()) {
        setDashboardData(null);
        return null;
      }
      setDashboardLoading(true);
      setDashboardError(null);
      try {
        const data = await dashboardApi.getVendorDashboard(days);
        setDashboardData(data);
        return data;
      } catch (err) {
        if (
          err instanceof ApiClientError &&
          err.code === 'VENDOR_PROFILE_NOT_FOUND'
        ) {
          setDashboardData(null);
          return null;
        }
        setDashboardError(
          extractErrorMessage(err, 'Failed to load vendor dashboard metrics.')
        );
        return null;
      } finally {
        setDashboardLoading(false);
      }
    },
    []
  );

  // Initial load: public directory, tutorials, and restore JWT session if present
  useEffect(() => {
    void refreshVendors();
    void refreshTutorials();

    const token = getStoredToken();
    if (!token) {
      setAuthLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const { user, vendorProfile } = await authApi.me();
        if (cancelled) return;
        setAuthUser(user);
        if (vendorProfile) {
          setActiveVendor(vendorProfile);
        } else if (user.role === 'vendor') {
          void refreshMyVendorProfile();
        }
        await Promise.all([refreshLearningProgress(), refreshFavorites()]);
      } catch {
        if (!cancelled) {
          setStoredToken(null);
          setAuthUser(null);
          setActiveVendor(null);
        }
      } finally {
        if (!cancelled) {
          setAuthLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    refreshFavorites,
    refreshLearningProgress,
    refreshMyVendorProfile,
    refreshTutorials,
    refreshVendors,
  ]);

  const loginUser = useCallback(
    async (identifier: string, password: string) => {
      const result = await authApi.login(identifier, password);
      setStoredToken(result.token);
      setAuthUser(result.user);
      setActiveVendor(result.vendorProfile);
      await Promise.all([
        refreshLearningProgress(),
        refreshFavorites(),
        refreshTutorials(),
      ]);
      if (result.user.role === 'vendor' && !result.vendorProfile) {
        await refreshMyVendorProfile();
      }
      showToast(`Signed in as ${result.user.name}`, 'success');
      return result;
    },
    [
      refreshFavorites,
      refreshLearningProgress,
      refreshMyVendorProfile,
      refreshTutorials,
      showToast,
    ]
  );

  const registerCustomerAccount = useCallback(
    async (input: {
      name: string;
      email?: string;
      mobileNumber?: string;
      password: string;
    }) => {
      const result = await authApi.registerCustomer(input);
      setStoredToken(result.token);
      setAuthUser(result.user);
      setActiveVendor(null);
      setCompletedLessons([]);
      setFavoriteVendorIds([]);
      showToast(`Welcome to DigiThela, ${result.user.name}!`, 'success');
      return result.user;
    },
    [showToast]
  );

  const registerVendorAccount = useCallback(
    async (input: {
      name: string;
      email?: string;
      mobileNumber?: string;
      password: string;
    }) => {
      const result = await authApi.registerVendorAccount(input);
      setStoredToken(result.token);
      setAuthUser(result.user);
      setActiveVendor(null);
      setCompletedLessons([]);
      setFavoriteVendorIds([]);
      showToast(
        `Vendor account created for ${result.user.name}. Complete your stall profile next.`,
        'success'
      );
      return result.user;
    },
    [showToast]
  );

  const logoutUser = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Clear local session regardless
    }
    setStoredToken(null);
    setAuthUser(null);
    setActiveVendor(null);
    setDashboardData(null);
    setCompletedLessons([]);
    setLearningSummary(null);
    setFavoriteVendorIds([]);
    showToast('Signed out successfully', 'info');
  }, [showToast]);

  const registerVendor = useCallback(
    async (payload: RegisterVendorPayload): Promise<Vendor> => {
      const result = await vendorsApi.register(payload);
      if (result.token) {
        setStoredToken(result.token);
      }
      if (result.user) {
        setAuthUser({ ...result.user, vendorId: result.vendor.id });
      } else {
        setAuthUser((prev) =>
          prev ? { ...prev, vendorId: result.vendor.id } : prev
        );
      }
      setActiveVendor(result.vendor);
      setVendors((prev) => {
        const filtered = prev.filter((v) => v.id !== result.vendor.id);
        return [result.vendor, ...filtered];
      });
      showToast('Business profile created! You can now add products.', 'success');
      return result.vendor;
    },
    [showToast]
  );

  const updateVendorProfile = useCallback(
    async (updates: Record<string, unknown>): Promise<Vendor> => {
      const updated = await vendorsApi.updateMyProfile(updates);
      setActiveVendor(updated);
      setVendors((prev) =>
        prev.map((v) => (v.id === updated.id ? updated : v))
      );
      void refreshDashboard();
      showToast('Business profile saved', 'success');
      return updated;
    },
    [refreshDashboard, showToast]
  );

  const deleteVendorProfile = useCallback(async () => {
    const deleted = await vendorsApi.deleteMyProfile();
    setActiveVendor(null);
    setDashboardData(null);
    setVendors((prev) => prev.filter((v) => v.id !== deleted.deletedId));
    setAuthUser((prev) => (prev ? { ...prev, vendorId: undefined } : prev));
    showToast('Business profile deleted', 'info');
  }, [showToast]);

  const addProduct = useCallback(
    async (
      productInput: {
        name: string;
        category: string;
        price: number;
        unit: string;
        description: string;
        image?: string;
        available: boolean;
      },
      imageFile?: File | null
    ): Promise<Product> => {
      const created = await productsApi.create(
        {
          productName: productInput.name,
          description: productInput.description,
          category: productInput.category,
          price: productInput.price,
          unit: productInput.unit,
          image: productInput.image,
          availability: productInput.available,
        },
        imageFile
      );

      setActiveVendor((prev) =>
        prev ? { ...prev, products: [created, ...prev.products] } : prev
      );
      setVendors((prev) =>
        prev.map((v) =>
          v.id === created.vendorId || v.id === activeVendor?.id
            ? { ...v, products: [created, ...v.products] }
            : v
        )
      );
      void refreshDashboard();
      showToast(`Added "${created.name}" to your catalogue`, 'success');
      return created;
    },
    [activeVendor?.id, refreshDashboard, showToast]
  );

  const updateProduct = useCallback(
    async (
      productId: string,
      updates: {
        name?: string;
        category?: string;
        price?: number;
        unit?: string;
        description?: string;
        image?: string | null;
        available?: boolean;
      },
      imageFile?: File | null
    ): Promise<Product> => {
      const updated = await productsApi.update(
        productId,
        {
          ...(updates.name !== undefined ? { productName: updates.name } : {}),
          ...(updates.category !== undefined ? { category: updates.category } : {}),
          ...(updates.price !== undefined ? { price: updates.price } : {}),
          ...(updates.unit !== undefined ? { unit: updates.unit } : {}),
          ...(updates.description !== undefined
            ? { description: updates.description }
            : {}),
          ...(updates.image !== undefined ? { image: updates.image } : {}),
          ...(updates.available !== undefined
            ? { availability: updates.available }
            : {}),
        },
        imageFile
      );

      setActiveVendor((prev) =>
        prev
          ? {
              ...prev,
              products: prev.products.map((p) =>
                p.id === productId ? updated : p
              ),
            }
          : prev
      );
      setVendors((prev) =>
        prev.map((v) => ({
          ...v,
          products: v.products.map((p) => (p.id === productId ? updated : p)),
        }))
      );
      void refreshDashboard();
      showToast('Product changes saved', 'success');
      return updated;
    },
    [refreshDashboard, showToast]
  );

  const deleteProduct = useCallback(
    async (productId: string) => {
      await productsApi.remove(productId);
      setActiveVendor((prev) =>
        prev
          ? {
              ...prev,
              products: prev.products.filter((p) => p.id !== productId),
            }
          : prev
      );
      setVendors((prev) =>
        prev.map((v) => ({
          ...v,
          products: v.products.filter((p) => p.id !== productId),
        }))
      );
      void refreshDashboard();
      showToast('Product removed from catalogue', 'info');
    },
    [refreshDashboard, showToast]
  );

  const toggleProductAvailability = useCallback(
    async (productId: string, nextAvailable: boolean) => {
      const updated = await productsApi.toggleAvailability(
        productId,
        nextAvailable
      );
      setActiveVendor((prev) =>
        prev
          ? {
              ...prev,
              products: prev.products.map((p) =>
                p.id === productId ? updated : p
              ),
            }
          : prev
      );
      setVendors((prev) =>
        prev.map((v) => ({
          ...v,
          products: v.products.map((p) => (p.id === productId ? updated : p)),
        }))
      );
      void refreshDashboard();
      showToast(
        `Marked "${updated.name}" as ${updated.available ? 'In Stock' : 'Out of Stock'}`,
        'info'
      );
    },
    [refreshDashboard, showToast]
  );

  const toggleLessonCompleted = useCallback(
    async (idOrSlug: string) => {
      if (!authUser) {
        showToast(
          'Please sign in to save your learning progress across sessions.',
          'warning'
        );
        return;
      }

      const currentlyDone = completedLessons.includes(idOrSlug);
      const result = await learningApi.setCompletion(idOrSlug, !currentlyDone);

      await refreshLearningProgress();
      setTutorials((prev) =>
        prev.map((t) =>
          t.id === result.progress.learningMaterialId ||
          t.slug === result.progress.learningMaterial.slug
            ? {
                ...t,
                isCompleted: result.progress.isCompleted,
                completedAt: result.progress.completedAt,
              }
            : t
        )
      );
      if (authUser.role === 'vendor') {
        void refreshDashboard();
      }
      showToast(
        result.progress.isCompleted
          ? 'Lesson marked as completed!'
          : 'Lesson completion removed',
        result.progress.isCompleted ? 'success' : 'info'
      );
    },
    [
      authUser,
      completedLessons,
      refreshDashboard,
      refreshLearningProgress,
      showToast,
    ]
  );

  const toggleFavoriteVendor = useCallback(
    async (vendorId: string): Promise<boolean> => {
      if (!authUser) {
        showToast(
          'Please sign in to save favorite Mira-Bhayandar stalls.',
          'warning'
        );
        return false;
      }

      const res = await favoritesApi.toggle(vendorId);
      setFavoriteVendorIds((prev) =>
        res.isFavorited
          ? Array.from(new Set([...prev, vendorId]))
          : prev.filter((id) => id !== vendorId)
      );
      showToast(
        res.isFavorited
          ? 'Added vendor to your favorites'
          : 'Removed vendor from favorites',
        res.isFavorited ? 'success' : 'info'
      );
      return res.isFavorited;
    },
    [authUser, showToast]
  );

  return (
    <AppContext.Provider
      value={{
        vendors,
        vendorsLoading,
        vendorsError,
        refreshVendors,
        activeVendor,
        activeVendorLoading,
        refreshMyVendorProfile,
        dashboardData,
        dashboardLoading,
        dashboardError,
        refreshDashboard,
        authUser,
        authLoading,
        loginUser,
        registerCustomerAccount,
        registerVendorAccount,
        logoutUser,
        registerVendor,
        updateVendorProfile,
        deleteVendorProfile,
        addProduct,
        updateProduct,
        deleteProduct,
        toggleProductAvailability,
        tutorials,
        tutorialsLoading,
        tutorialsError,
        refreshTutorials,
        completedLessons,
        learningSummary,
        refreshLearningProgress,
        toggleLessonCompleted,
        favoriteVendorIds,
        favoritesLoading,
        refreshFavorites,
        toggleFavoriteVendor,
        toast,
        showToast,
        dismissToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return ctx;
}
