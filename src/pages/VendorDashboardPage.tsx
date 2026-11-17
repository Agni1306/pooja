import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowUpRight,
  BookOpen,
  Check,
  CheckCircle2,
  Copy,
  Edit3,
  Eye,
  Heart,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  Package,
  Plus,
  QrCode,
  RefreshCw,
  Settings,
  ShieldCheck,
  Store,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { MIRA_BHAYANDAR_AREAS, VENDOR_CATEGORIES } from '../data/mockVendors';
import { MiraBhayandarArea, Product, VendorCategory } from '../types';
import { SafeImage } from '../components/common/SafeImage';
import { DemoQrCode } from '../components/common/DemoQrCode';
import { ApiClientError, uploadsApi } from '../services/api';

type DashboardTab =
  | 'overview'
  | 'profile'
  | 'products'
  | 'payments'
  | 'learning'
  | 'settings';

interface ProductFormState {
  name: string;
  category: string;
  price: string;
  unit: string;
  description: string;
  image: string;
  available: boolean;
}

function formatActivityTime(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) return isoTimestamp;
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export const VendorDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    authUser,
    authLoading,
    activeVendor,
    activeVendorLoading,
    dashboardData,
    dashboardLoading,
    dashboardError,
    refreshDashboard,
    updateVendorProfile,
    deleteVendorProfile,
    addProduct,
    updateProduct,
    deleteProduct,
    toggleProductAvailability,
    tutorials,
    completedLessons,
    toggleLessonCompleted,
    logoutUser,
    showToast,
  } = useAppContext();

  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fetch dashboard stats whenever an authenticated vendor with a profile opens /dashboard
  useEffect(() => {
    if (authUser?.role === 'vendor' && activeVendor) {
      void refreshDashboard(7);
    }
  }, [authUser?.role, activeVendor?.id, refreshDashboard]);

  // Profile Edit State synced with activeVendor
  const [profileForm, setProfileForm] = useState({
    businessName: '',
    category: 'Fruits & Vegetables' as VendorCategory | string,
    area: 'Mira Road East' as MiraBhayandarArea | string,
    address: '',
    contactNumber: '',
    openingTime: '8:00 AM',
    closingTime: '9:30 PM',
    description: '',
    profileImage: '',
    coverImage: '',
  });
  const [profileError, setProfileError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingProfileField, setUploadingProfileField] = useState<
    'profileImage' | 'coverImage' | null
  >(null);

  useEffect(() => {
    if (!activeVendor) return;
    setProfileForm({
      businessName: activeVendor.businessName,
      category: activeVendor.category,
      area: activeVendor.area,
      address: activeVendor.address,
      contactNumber: activeVendor.phone,
      openingTime: activeVendor.openingTime || '8:00 AM',
      closingTime: activeVendor.closingTime || '9:30 PM',
      description: activeVendor.description,
      profileImage: activeVendor.profileImage,
      coverImage: activeVendor.coverImage,
    });
    setUpiInput(activeVendor.upiId || '');
  }, [activeVendor]);

  // Product Management State
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [productError, setProductError] = useState('');
  const [savingProduct, setSavingProduct] = useState(false);
  const [busyProductId, setBusyProductId] = useState<string | null>(null);
  const [productImageFile, setProductImageFile] = useState<File | null>(null);
  const [productForm, setProductForm] = useState<ProductFormState>({
    name: '',
    category: 'Daily Essentials',
    price: '',
    unit: 'per kg',
    description: '',
    image: '',
    available: true,
  });

  // Payments State
  const [upiInput, setUpiInput] = useState('');
  const [savingUpi, setSavingUpi] = useState(false);
  const [upiError, setUpiError] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Learning & Settings State
  const [togglingLessonKey, setTogglingLessonKey] = useState<string | null>(null);
  const [confirmDeleteProfile, setConfirmDeleteProfile] = useState(false);
  const [deletingProfile, setDeletingProfile] = useState(false);

  const profileCompletion = useMemo(() => {
    if (dashboardData?.profileCompletion) {
      return dashboardData.profileCompletion.percentage;
    }
    if (!activeVendor) return 0;
    const checks = [
      Boolean(activeVendor.ownerName.trim()),
      Boolean(activeVendor.businessName.trim()),
      Boolean(activeVendor.phone.trim()),
      Boolean(activeVendor.address.trim()),
      Boolean(activeVendor.description.trim().length >= 15),
      Boolean(activeVendor.openingHours.trim()),
      Boolean(activeVendor.upiId.trim()),
      activeVendor.products.length > 0,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [activeVendor, dashboardData]);

  const filteredProducts = useMemo(() => {
    if (!activeVendor) return [];
    const q = productSearch.trim().toLowerCase();
    if (!q) return activeVendor.products;
    return activeVendor.products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }, [activeVendor, productSearch]);

  // Auth / Onboarding gates
  if (authLoading || activeVendorLoading) {
    return (
      <div className="min-h-screen bg-[#FAF6F0] flex items-center justify-center px-4">
        <div className="flex items-center gap-2.5 text-sm text-[#242D2A]/75">
          <Loader2 className="w-5 h-5 animate-spin text-[#174C3C]" />
          Loading your Vendor Dashboard...
        </div>
      </div>
    );
  }

  if (!authUser || authUser.role !== 'vendor') {
    return (
      <div className="min-h-screen bg-[#FAF6F0] flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full bg-white border border-[#242D2A]/12 rounded-2xl p-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-[#F5EBDD] text-[#174C3C] flex items-center justify-center mx-auto">
            <Store className="w-6 h-6" />
          </div>
          <h1 className="mt-4 font-display font-bold text-2xl text-[#242D2A]">
            Vendor Sign In Required
          </h1>
          <p className="mt-2 text-sm text-[#242D2A]/75 leading-relaxed">
            Sign in with a Vendor account or register your local stall to access the DigiThela Vendor Dashboard.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/auth"
              className="px-5 py-2.5 rounded-xl bg-[#174C3C] text-white text-sm font-semibold hover:bg-[#10372B] transition-colors"
            >
              Vendor Sign In
            </Link>
            <Link
              to="/register"
              className="px-5 py-2.5 rounded-xl bg-[#F5EBDD] text-[#174C3C] text-sm font-semibold hover:bg-[#E99A43] hover:text-[#242D2A] transition-colors"
            >
              Register Your Stall
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!activeVendor) {
    return (
      <div className="min-h-screen bg-[#FAF6F0] flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full bg-white border border-[#242D2A]/12 rounded-2xl p-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-[#F5EBDD] text-[#174C3C] flex items-center justify-center mx-auto">
            <Store className="w-6 h-6" />
          </div>
          <h1 className="mt-4 font-display font-bold text-2xl text-[#242D2A]">
            Complete Your Business Profile
          </h1>
          <p className="mt-2 text-sm text-[#242D2A]/75 leading-relaxed">
            Your vendor account is active, {authUser.name}. Create your Mira-Bhayandar stall profile to start listing products and viewing dashboard insights.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/register"
              className="px-5 py-2.5 rounded-xl bg-[#174C3C] text-white text-sm font-semibold hover:bg-[#10372B] transition-colors"
            >
              Create Business Profile
            </Link>
            <button
              type="button"
              onClick={() => {
                void logoutUser();
                navigate('/');
              }}
              className="px-5 py-2.5 rounded-xl border border-[#242D2A]/15 text-sm font-medium text-[#242D2A]"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleNavClick = (tab: DashboardTab) => {
    setProfileError('');
    setUpiError('');
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  const handleLogout = async () => {
    await logoutUser();
    navigate('/auth');
  };

  const handleProfileImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'profileImage' | 'coverImage'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingProfileField(field);
    setProfileError('');
    try {
      const imageUrl = await uploadsApi.uploadImage(file);
      setProfileForm((prev) => ({ ...prev, [field]: imageUrl }));
      showToast('Photo uploaded. Click Save Profile Changes to apply.', 'info');
    } catch (err) {
      const msg =
        err instanceof ApiClientError
          ? err.message
          : 'Failed to upload image.';
      setProfileError(msg);
      showToast(msg, 'warning');
    } finally {
      setUploadingProfileField(null);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');

    if (profileForm.businessName.trim().length < 2) {
      setProfileError('Business name must be at least 2 characters.');
      return;
    }
    if (profileForm.address.trim().length < 5) {
      setProfileError('Address must be at least 5 characters.');
      return;
    }
    if (profileForm.description.trim().length < 10) {
      setProfileError('Description must be at least 10 characters.');
      return;
    }
    const cleanPhone = profileForm.contactNumber.replace(/[\s-]/g, '');
    if (!/^(\+91)?[6-9]\d{9}$/.test(cleanPhone)) {
      setProfileError('Enter a valid 10-digit Indian mobile number.');
      return;
    }

    setSavingProfile(true);
    try {
      await updateVendorProfile({
        businessName: profileForm.businessName.trim(),
        category: profileForm.category,
        area: profileForm.area,
        address: profileForm.address.trim(),
        contactNumber: cleanPhone,
        openingTime: profileForm.openingTime.trim(),
        closingTime: profileForm.closingTime.trim(),
        description: profileForm.description.trim(),
        profileImage: profileForm.profileImage || null,
        coverImage: profileForm.coverImage || null,
      });
    } catch (err) {
      const msg =
        err instanceof ApiClientError
          ? err.message
          : 'Failed to save business profile.';
      setProfileError(msg);
      showToast(msg, 'warning');
    } finally {
      setSavingProfile(false);
    }
  };

  const openAddProductModal = () => {
    setEditingProductId(null);
    setProductError('');
    setProductImageFile(null);
    setProductForm({
      name: '',
      category: activeVendor.category,
      price: '',
      unit: 'per piece',
      description: '',
      image: activeVendor.coverImage,
      available: true,
    });
    setProductModalOpen(true);
  };

  const openEditProductModal = (product: Product) => {
    setEditingProductId(product.id);
    setProductError('');
    setProductImageFile(null);
    setProductForm({
      name: product.name,
      category: product.category,
      price: String(product.price),
      unit: product.unit,
      description: product.description,
      image: product.image || activeVendor.coverImage,
      available: product.available,
    });
    setProductModalOpen(true);
  };

  const handleProductImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProductImageFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setProductForm((prev) => ({ ...prev, image: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setProductError('');
    const numericPrice = Number(productForm.price);
    if (productForm.name.trim().length < 2) {
      setProductError('Product name must be at least 2 characters.');
      return;
    }
    if (Number.isNaN(numericPrice) || numericPrice <= 0) {
      setProductError('Please enter a valid price in Rupees (greater than 0).');
      return;
    }
    if (!productForm.unit.trim()) {
      setProductError('Please specify a unit (e.g., per kg, per plate, per piece).');
      return;
    }
    const cleanDescription =
      productForm.description.trim() || 'Freshly stocked local item from our stall.';
    if (cleanDescription.length < 4) {
      setProductError('Product description must be at least 4 characters.');
      return;
    }

    setSavingProduct(true);
    try {
      const safeImageString =
        !productImageFile &&
        productForm.image &&
        !productForm.image.startsWith('data:')
          ? productForm.image
          : undefined;

      const payload = {
        name: productForm.name.trim(),
        category: productForm.category.trim() || 'General',
        price: Number(numericPrice.toFixed(2)),
        unit: productForm.unit.trim(),
        description: cleanDescription,
        ...(safeImageString ? { image: safeImageString } : {}),
        available: productForm.available,
      };

      if (editingProductId) {
        await updateProduct(editingProductId, payload, productImageFile);
      } else {
        await addProduct(payload, productImageFile);
      }
      setProductModalOpen(false);
    } catch (err) {
      const msg =
        err instanceof ApiClientError ? err.message : 'Unable to save product.';
      setProductError(msg);
      showToast(msg, 'warning');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleToggleProductAvailability = async (product: Product) => {
    setBusyProductId(product.id);
    try {
      await toggleProductAvailability(product.id, !product.available);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Failed to update stock status.',
        'warning'
      );
    } finally {
      setBusyProductId(null);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    setBusyProductId(productId);
    try {
      await deleteProduct(productId);
      setConfirmDeleteId(null);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Failed to delete product.',
        'warning'
      );
    } finally {
      setBusyProductId(null);
    }
  };

  const handleSaveUpi = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpiError('');
    const trimmed = upiInput.trim();
    if (trimmed && !trimmed.includes('@')) {
      setUpiError('Please enter a valid UPI ID (e.g., myshop@okaxis).');
      return;
    }
    setSavingUpi(true);
    try {
      await updateVendorProfile({ upiId: trimmed || null });
    } catch (err) {
      const msg =
        err instanceof ApiClientError ? err.message : 'Failed to update UPI ID.';
      setUpiError(msg);
      showToast(msg, 'warning');
    } finally {
      setSavingUpi(false);
    }
  };

  const handleCopyUpi = () => {
    if (!activeVendor.upiId) return;
    navigator.clipboard?.writeText(activeVendor.upiId);
    setCopiedUpi(true);
    showToast('UPI ID copied', 'info');
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleToggleLesson = async (key: string) => {
    setTogglingLessonKey(key);
    try {
      await toggleLessonCompleted(key);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Unable to update learning progress.',
        'warning'
      );
    } finally {
      setTogglingLessonKey(null);
    }
  };

  const handleDeleteProfile = async () => {
    setDeletingProfile(true);
    try {
      await deleteVendorProfile();
      setConfirmDeleteProfile(false);
      navigate('/register');
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Failed to delete business profile.',
        'warning'
      );
    } finally {
      setDeletingProfile(false);
    }
  };

  const navItems: Array<{
    id: DashboardTab;
    label: string;
    icon: React.FC<{ className?: string }>;
  }> = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'profile', label: 'My Business Profile', icon: Store },
    { id: 'products', label: 'Manage Products', icon: Package },
    { id: 'payments', label: 'Digital Payments', icon: QrCode },
    { id: 'learning', label: 'Learning Centre', icon: BookOpen },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const activeNavLabel = navItems.find((i) => i.id === activeTab)?.label || 'Overview';

  const totalProducts =
    dashboardData?.stats.totalProducts ?? activeVendor.products.length;
  const availableProducts =
    dashboardData?.stats.availableProducts ??
    activeVendor.products.filter((p) => p.available).length;
  const totalViews =
    dashboardData?.stats.totalViews ?? activeVendor.profileViewsDemo;
  const totalFavorites =
    dashboardData?.stats.totalFavorites ?? activeVendor.favoritesCount ?? 0;
  const completedLessonsCount =
    dashboardData?.stats.learning.completedTutorials ??
    tutorials.filter(
      (t) =>
        completedLessons.includes(t.id) ||
        (t.slug ? completedLessons.includes(t.slug) : false)
    ).length;
  const totalLessonsCount =
    dashboardData?.stats.learning.totalTutorials ?? tutorials.length;

  return (
    <div className="min-h-screen bg-[#FAF6F0] flex">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#242D2A]/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Dedicated Vendor Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#174C3C] text-white flex flex-col transition-transform duration-200 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 px-5 border-b border-white/15 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-[#E99A43] text-[#242D2A] flex items-center justify-center font-display font-bold text-base">
              D
            </span>
            <span className="font-display font-bold text-lg tracking-tight text-white">
              DigiThela
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
            className="lg:hidden p-1.5 rounded-lg text-white/80 hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Active Stall Summary */}
        <div className="px-5 py-4 border-b border-white/15">
          <p className="text-[11px] text-[#F5EBDD]/70">Managing Stall</p>
          <p className="mt-0.5 font-display font-bold text-sm text-white truncate">
            {activeVendor.businessName}
          </p>
          <p className="text-xs text-[#E99A43] truncate mt-0.5">{activeVendor.area}</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1" aria-label="Vendor Dashboard Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                  isActive
                    ? 'bg-white text-[#174C3C] font-semibold'
                    : 'text-[#F5EBDD]/85 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/15 space-y-1">
          <Link
            to={`/vendors/${activeVendor.id}`}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium text-[#F5EBDD]/85 hover:bg-white/10 hover:text-white transition-colors"
          >
            <span>View Public Storefront</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-[#F5EBDD]/85 hover:bg-white/10 hover:text-white transition-colors text-left"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Workspace */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar Contract for Dashboard */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-[#242D2A]/10 px-4 sm:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open dashboard menu"
              className="lg:hidden p-2 rounded-lg text-[#242D2A] hover:bg-[#FAF6F0]"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="text-[#242D2A]/55 hidden sm:inline">Vendor Dashboard</span>
              <span className="text-[#242D2A]/35 hidden sm:inline">/</span>
              <h1 className="font-display font-bold text-[#242D2A] truncate">
                {activeNavLabel}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/explore"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#242D2A]/15 text-xs font-semibold text-[#242D2A] hover:bg-[#FAF6F0] transition-colors whitespace-nowrap"
            >
              Public Marketplace
            </Link>
            <button
              type="button"
              onClick={() => {
                setActiveTab('products');
                openAddProductModal();
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#174C3C] text-white text-xs font-semibold hover:bg-[#10372B] transition-colors whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Product
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-8 max-w-6xl w-full mx-auto">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {dashboardError && (
                <div className="p-4 rounded-xl bg-white border border-[#E99A43]/40 flex items-center justify-between gap-4">
                  <p className="text-xs sm:text-sm text-[#242D2A]/80">{dashboardError}</p>
                  <button
                    type="button"
                    onClick={() => void refreshDashboard(7)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#174C3C] text-white text-xs font-semibold shrink-0"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Retry
                  </button>
                </div>
              )}

              {/* Welcome & Profile Completion */}
              <div className="bg-white border border-[#242D2A]/12 rounded-2xl p-6 sm:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                  <p className="text-xs font-semibold text-[#174C3C]">
                    {activeVendor.businessName} · {activeVendor.area}
                  </p>
                  <h2 className="mt-1 font-display font-bold text-2xl sm:text-3xl text-[#242D2A]">
                    Welcome back, {activeVendor.ownerName}
                  </h2>
                  <p className="mt-1.5 text-sm text-[#242D2A]/75">
                    Manage your product prices, check your UPI QR display, and complete digital learning guides.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#FAF6F0] border border-[#242D2A]/10 min-w-[260px]">
                  <div className="flex items-center justify-between text-xs font-semibold text-[#242D2A]">
                    <span>Business Profile Completion</span>
                    <span className="tabular-nums text-[#174C3C]">{profileCompletion}%</span>
                  </div>
                  <div className="mt-2 h-2.5 w-full rounded-full bg-[#242D2A]/10 overflow-hidden">
                    <div
                      className="h-full bg-[#174C3C] transition-all duration-300"
                      style={{ width: `${profileCompletion}%` }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleNavClick('profile')}
                    className="mt-2.5 text-xs font-semibold text-[#174C3C] hover:text-[#E99A43] transition-colors"
                  >
                    Update Business Details →
                  </button>
                </div>
              </div>

              {/* KPI Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="p-5 rounded-xl bg-white border border-[#242D2A]/12">
                  <div className="flex items-center justify-between text-xs text-[#242D2A]/65">
                    <span>Total Listed Products</span>
                    <Package className="w-4 h-4 text-[#174C3C]" />
                  </div>
                  <p className="mt-2 font-display font-extrabold text-3xl text-[#242D2A] tabular-nums">
                    {totalProducts}
                  </p>
                  <p className="mt-1 text-xs text-[#174C3C] tabular-nums">
                    {availableProducts} currently in stock
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-white border border-[#242D2A]/12">
                  <div className="flex items-center justify-between text-xs text-[#242D2A]/65">
                    <span>Profile Views</span>
                    <Eye className="w-4 h-4 text-[#174C3C]" />
                  </div>
                  <p className="mt-2 font-display font-extrabold text-3xl text-[#242D2A] tabular-nums">
                    {dashboardLoading && !dashboardData ? '...' : totalViews}
                  </p>
                  <p className="mt-1 text-xs text-[#242D2A]/60 inline-flex items-center gap-1.5 tabular-nums">
                    <Heart className="w-3.5 h-3.5 text-[#E99A43]" />
                    {totalFavorites} customer favorites
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-white border border-[#242D2A]/12">
                  <div className="flex items-center justify-between text-xs text-[#242D2A]/65">
                    <span>UPI QR Readiness</span>
                    <QrCode className="w-4 h-4 text-[#174C3C]" />
                  </div>
                  <p className="mt-2 font-display font-bold text-xl text-[#174C3C] truncate">
                    {activeVendor.upiId ? 'UPI ID Set' : 'Pending'}
                  </p>
                  <p className="mt-1 text-xs font-mono text-[#242D2A]/65 truncate">
                    {activeVendor.upiId || 'Configure in Digital Payments'}
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-white border border-[#242D2A]/12">
                  <div className="flex items-center justify-between text-xs text-[#242D2A]/65">
                    <span>Lessons Completed</span>
                    <BookOpen className="w-4 h-4 text-[#174C3C]" />
                  </div>
                  <p className="mt-2 font-display font-extrabold text-3xl text-[#242D2A] tabular-nums">
                    {completedLessonsCount}/{totalLessonsCount}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleNavClick('learning')}
                    className="mt-1 text-xs font-semibold text-[#174C3C] hover:underline"
                  >
                    Continue Learning
                  </button>
                </div>
              </div>

              {/* Recent Activity + Quick Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 bg-white border border-[#242D2A]/12 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display font-bold text-lg text-[#242D2A]">
                      Recent Activity
                    </h3>
                    <button
                      type="button"
                      onClick={() => void refreshDashboard(7)}
                      className="inline-flex items-center gap-1 text-xs text-[#174C3C] font-medium hover:underline"
                    >
                      {dashboardLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3.5 h-3.5" />
                      )}
                      Refresh
                    </button>
                  </div>
                  {!dashboardData || dashboardData.recentActivity.length === 0 ? (
                    <p className="text-sm text-[#242D2A]/65 py-6">
                      Activity from your products, profile updates, and customer favorites will appear here.
                    </p>
                  ) : (
                    <ul className="divide-y divide-[#242D2A]/10">
                      {dashboardData.recentActivity.slice(0, 6).map((act) => (
                        <li key={act.id} className="py-3.5 flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[#242D2A]">{act.title}</p>
                            <p className="text-xs text-[#242D2A]/70 mt-0.5">{act.detail}</p>
                          </div>
                          <span className="text-xs text-[#242D2A]/55 whitespace-nowrap shrink-0">
                            {formatActivityTime(act.timestamp)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="lg:col-span-5 bg-white border border-[#242D2A]/12 rounded-2xl p-6 space-y-4">
                  <h3 className="font-display font-bold text-lg text-[#242D2A]">
                    Quick Actions
                  </h3>
                  <div className="space-y-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('products');
                        openAddProductModal();
                      }}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-[#FAF6F0] hover:bg-[#F5EBDD] text-sm font-semibold text-[#242D2A] transition-colors"
                    >
                      <span>Add a New Product</span>
                      <Plus className="w-4 h-4 text-[#174C3C]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNavClick('payments')}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-[#FAF6F0] hover:bg-[#F5EBDD] text-sm font-semibold text-[#242D2A] transition-colors"
                    >
                      <span>Preview UPI QR Standee</span>
                      <QrCode className="w-4 h-4 text-[#174C3C]" />
                    </button>
                    <Link
                      to={`/vendors/${activeVendor.id}`}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-[#174C3C] text-white hover:bg-[#10372B] text-sm font-semibold transition-colors"
                    >
                      <span>Open Public Profile Page</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MY BUSINESS PROFILE */}
          {activeTab === 'profile' && (
            <form
              onSubmit={handleSaveProfile}
              className="bg-white border border-[#242D2A]/12 rounded-2xl p-6 sm:p-8 space-y-6"
            >
              <div>
                <h2 className="font-display font-bold text-2xl text-[#242D2A]">
                  My Business Profile
                </h2>
                <p className="mt-1 text-sm text-[#242D2A]/70">
                  Changes saved here update your public storefront and vendor profile page in PostgreSQL.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-[#242D2A] mb-1.5">
                    Owner Name
                  </label>
                  <input
                    type="text"
                    value={activeVendor.ownerName}
                    disabled
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F0]/70 border border-[#242D2A]/10 text-sm text-[#242D2A]/70 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#242D2A] mb-1.5">
                    Business Name
                  </label>
                  <input
                    type="text"
                    value={profileForm.businessName}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, businessName: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F0] border border-[#242D2A]/15 text-sm focus:bg-white focus:border-[#174C3C] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#242D2A] mb-1.5">
                    Category
                  </label>
                  <select
                    value={profileForm.category}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        category: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F0] border border-[#242D2A]/15 text-sm focus:bg-white focus:border-[#174C3C] focus:outline-none"
                  >
                    {VENDOR_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#242D2A] mb-1.5">
                    Mira-Bhayandar Area
                  </label>
                  <select
                    value={profileForm.area}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        area: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F0] border border-[#242D2A]/15 text-sm focus:bg-white focus:border-[#174C3C] focus:outline-none"
                  >
                    {MIRA_BHAYANDAR_AREAS.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#242D2A] mb-1.5">
                    Contact Number
                  </label>
                  <input
                    type="text"
                    value={profileForm.contactNumber}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, contactNumber: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F0] border border-[#242D2A]/15 text-sm tabular-nums focus:bg-white focus:border-[#174C3C] focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-[#242D2A] mb-1.5">
                      Opening Time
                    </label>
                    <input
                      type="text"
                      value={profileForm.openingTime}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, openingTime: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F0] border border-[#242D2A]/15 text-sm focus:bg-white focus:border-[#174C3C] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#242D2A] mb-1.5">
                      Closing Time
                    </label>
                    <input
                      type="text"
                      value={profileForm.closingTime}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, closingTime: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F0] border border-[#242D2A]/15 text-sm focus:bg-white focus:border-[#174C3C] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#242D2A] mb-1.5">
                  Street Address &amp; Landmark
                </label>
                <input
                  type="text"
                  value={profileForm.address}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, address: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F0] border border-[#242D2A]/15 text-sm focus:bg-white focus:border-[#174C3C] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#242D2A] mb-1.5">
                  Business Description
                </label>
                <textarea
                  rows={3}
                  value={profileForm.description}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, description: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F0] border border-[#242D2A]/15 text-sm focus:bg-white focus:border-[#174C3C] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="p-4 rounded-xl bg-[#FAF6F0] border border-[#242D2A]/10 flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-white border border-[#242D2A]/10 shrink-0">
                    <SafeImage src={profileForm.profileImage} alt="Owner portrait" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#242D2A]">Profile Photo</p>
                    <label className="mt-1.5 cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#242D2A]/15 text-xs font-semibold text-[#174C3C] hover:border-[#174C3C]">
                      {uploadingProfileField === 'profileImage' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )}
                      {uploadingProfileField === 'profileImage'
                        ? 'Uploading...'
                        : 'Change Photo'}
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploadingProfileField !== null}
                        onChange={(e) => void handleProfileImageUpload(e, 'profileImage')}
                        className="sr-only"
                      />
                    </label>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#FAF6F0] border border-[#242D2A]/10 flex items-center gap-4">
                  <div className="w-24 h-16 rounded-xl overflow-hidden bg-white border border-[#242D2A]/10 shrink-0">
                    <SafeImage src={profileForm.coverImage} alt="Stall cover" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#242D2A]">Cover Photo</p>
                    <label className="mt-1.5 cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#242D2A]/15 text-xs font-semibold text-[#174C3C] hover:border-[#174C3C]">
                      {uploadingProfileField === 'coverImage' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )}
                      {uploadingProfileField === 'coverImage'
                        ? 'Uploading...'
                        : 'Change Cover'}
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploadingProfileField !== null}
                        onChange={(e) => void handleProfileImageUpload(e, 'coverImage')}
                        className="sr-only"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {profileError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-700">
                  {profileError}
                </div>
              )}

              <div className="pt-4 border-t border-[#242D2A]/10 flex justify-end">
                <button
                  type="submit"
                  disabled={savingProfile || uploadingProfileField !== null}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#174C3C] text-white text-sm font-semibold hover:bg-[#10372B] disabled:opacity-60 transition-colors"
                >
                  {savingProfile && <Loader2 className="w-4 h-4 animate-spin" />}
                  {savingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: MANAGE PRODUCTS */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-display font-bold text-2xl text-[#242D2A]">
                    Manage Products ({activeVendor.products.length})
                  </h2>
                  <p className="text-sm text-[#242D2A]/70 mt-0.5">
                    Add, edit, delete, or toggle stock status for items in your catalogue.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={openAddProductModal}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#174C3C] text-white text-sm font-semibold hover:bg-[#10372B] transition-colors whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  Add New Product
                </button>
              </div>

              <div className="bg-white border border-[#242D2A]/12 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-[#242D2A]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <input
                    type="search"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Filter your products by name or category..."
                    className="w-full sm:max-w-sm px-3.5 py-2 rounded-xl bg-[#FAF6F0] border border-[#242D2A]/15 text-sm focus:bg-white focus:border-[#174C3C] focus:outline-none"
                  />
                  <span className="text-xs text-[#242D2A]/60 tabular-nums">
                    {filteredProducts.length} shown
                  </span>
                </div>

                {filteredProducts.length === 0 ? (
                  <div className="p-12 text-center">
                    <Package className="w-10 h-10 text-[#174C3C]/50 mx-auto" />
                    <p className="mt-3 font-display font-bold text-lg text-[#242D2A]">
                      {activeVendor.products.length === 0
                        ? 'No products listed yet'
                        : 'No products match your search'}
                    </p>
                    <p className="mt-1 text-sm text-[#242D2A]/65">
                      Add your bestselling items with clear Indian Rupee prices so local customers can browse them.
                    </p>
                    <button
                      type="button"
                      onClick={openAddProductModal}
                      className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#174C3C] text-white text-sm font-semibold"
                    >
                      <Plus className="w-4 h-4" />
                      Add First Product
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-[#242D2A]/10">
                    {filteredProducts.map((product) => {
                      const isBusy = busyProductId === product.id;
                      return (
                        <div
                          key={product.id}
                          className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FAF6F0]/60 transition-colors"
                        >
                          <div className="flex items-start gap-4 min-w-0">
                            <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#F5EBDD] border border-[#242D2A]/10 shrink-0">
                              <SafeImage
                                src={product.image || activeVendor.coverImage}
                                alt={product.name}
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2 text-xs text-[#242D2A]/60">
                                <span className="font-medium text-[#174C3C]">
                                  {product.category}
                                </span>
                                <span aria-hidden="true">·</span>
                                <span className="tabular-nums font-semibold text-[#242D2A]">
                                  ₹{product.price} {product.unit}
                                </span>
                              </div>
                              <h3 className="mt-0.5 font-display font-bold text-base text-[#242D2A] truncate">
                                {product.name}
                              </h3>
                              <p className="mt-0.5 text-xs text-[#242D2A]/70 line-clamp-1">
                                {product.description}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => void handleToggleProductAvailability(product)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors disabled:opacity-60 ${
                                product.available
                                  ? 'bg-[#F5EBDD] text-[#174C3C] border-[#174C3C]/20'
                                  : 'bg-white text-[#242D2A]/65 border-[#242D2A]/15'
                              }`}
                            >
                              {isBusy
                                ? 'Updating...'
                                : product.available
                                ? 'In Stock'
                                : 'Out of Stock'}
                            </button>

                            <button
                              type="button"
                              onClick={() => openEditProductModal(product)}
                              aria-label={`Edit ${product.name}`}
                              className="p-2 rounded-lg border border-[#242D2A]/15 text-[#242D2A] hover:border-[#174C3C] hover:text-[#174C3C] transition-colors"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            {confirmDeleteId === product.id ? (
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => void handleDeleteProduct(product.id)}
                                  className="px-2.5 py-1.5 rounded-lg bg-red-700 text-white text-xs font-semibold disabled:opacity-60"
                                >
                                  Confirm
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="px-2.5 py-1.5 rounded-lg border border-[#242D2A]/15 text-xs"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(product.id)}
                                aria-label={`Delete ${product.name}`}
                                className="p-2 rounded-lg border border-[#242D2A]/15 text-red-700 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: DIGITAL PAYMENTS */}
          {activeTab === 'payments' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-5 bg-white border border-[#242D2A]/12 rounded-2xl p-6 space-y-5">
                <div>
                  <h2 className="font-display font-bold text-xl text-[#242D2A]">
                    Your UPI QR Standee
                  </h2>
                  <p className="mt-1 text-xs text-[#242D2A]/70">
                    QR preview generated from your saved UPI ID.
                  </p>
                </div>

                <div className="flex justify-center py-2">
                  <DemoQrCode
                    upiId={activeVendor.upiId || 'not-configured@upi'}
                    businessName={activeVendor.businessName}
                    size={190}
                  />
                </div>

                <form onSubmit={handleSaveUpi} className="space-y-3">
                  <label className="block text-xs font-semibold text-[#242D2A]">
                    UPI ID
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={upiInput}
                      onChange={(e) => setUpiInput(e.target.value)}
                      placeholder="yourshop@okaxis"
                      className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-[#FAF6F0] border border-[#242D2A]/15 text-sm font-mono focus:bg-white focus:border-[#174C3C] focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={savingUpi}
                      className="px-4 py-2 rounded-xl bg-[#174C3C] text-white text-xs font-semibold hover:bg-[#10372B] disabled:opacity-60 whitespace-nowrap"
                    >
                      {savingUpi ? 'Saving...' : 'Save ID'}
                    </button>
                  </div>
                  {upiError && (
                    <p className="text-xs font-medium text-red-700">{upiError}</p>
                  )}
                </form>

                {activeVendor.upiId && (
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#F5EBDD] text-[#174C3C] text-xs font-semibold hover:bg-[#E99A43] hover:text-[#242D2A] transition-colors"
                  >
                    {copiedUpi ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copiedUpi ? 'Copied UPI ID' : `Copy ${activeVendor.upiId}`}
                  </button>
                )}
              </div>

              <div className="lg:col-span-7 space-y-6">
                <div className="bg-white border border-[#242D2A]/12 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-[#174C3C]" />
                    <h3 className="font-display font-bold text-lg text-[#242D2A]">
                      How UPI Works for Your Stall
                    </h3>
                  </div>
                  <p className="text-sm text-[#242D2A]/80 leading-relaxed">
                    Unified Payments Interface (UPI) allows customers to scan one QR code using PhonePe, Google Pay, Paytm, or BHIM and send money straight into your linked bank account—with zero card-machine rental.
                  </p>
                  <ol className="space-y-3 pt-2 text-sm text-[#242D2A]/85">
                    <li className="p-3.5 rounded-xl bg-[#FAF6F0] border border-[#242D2A]/10">
                      <span className="font-semibold text-[#174C3C]">Step 1:</span> Display your printed QR sticker in a clean plastic sleeve near your counter.
                    </li>
                    <li className="p-3.5 rounded-xl bg-[#FAF6F0] border border-[#242D2A]/10">
                      <span className="font-semibold text-[#174C3C]">Step 2:</span> When a customer scans and pays, wait for the SMS or payment alert on <strong>your own phone</strong>—not just a screenshot on theirs.
                    </li>
                    <li className="p-3.5 rounded-xl bg-[#FAF6F0] border border-[#242D2A]/10">
                      <span className="font-semibold text-[#174C3C]">Step 3:</span> Never enter your UPI PIN or share an OTP to receive money. Your PIN is only required when you send money out.
                    </li>
                  </ol>
                </div>

                <div className="p-5 rounded-2xl bg-[#F5EBDD] border border-[#E99A43]/40 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-[#B96614] shrink-0 mt-0.5" />
                  <div className="text-xs sm:text-sm text-[#242D2A]/85 leading-relaxed">
                    <p className="font-bold text-[#242D2A]">Safety Reminder</p>
                    <p className="mt-1">
                      DigiThela only displays your public UPI handle for customer convenience. Never store or share banking passwords, OTPs, or UPI PINs anywhere online.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: LEARNING CENTRE */}
          {activeTab === 'learning' && (
            <div className="space-y-6">
              <div className="bg-white border border-[#242D2A]/12 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-display font-bold text-2xl text-[#242D2A]">
                    Vendor Learning Checklist
                  </h2>
                  <p className="text-sm text-[#242D2A]/75 mt-1">
                    Track essential digital skills or open the full interactive Learning Centre.
                  </p>
                </div>
                <Link
                  to="/learning"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#174C3C] text-white text-sm font-semibold hover:bg-[#10372B] whitespace-nowrap shrink-0"
                >
                  Open Full Learning Portal
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tutorials.map((tut) => {
                  const key = tut.slug || tut.id;
                  const done =
                    completedLessons.includes(tut.id) ||
                    (tut.slug ? completedLessons.includes(tut.slug) : false);
                  const isBusy = togglingLessonKey === key;

                  return (
                    <div
                      key={tut.id}
                      className="p-5 rounded-xl bg-white border border-[#242D2A]/12 flex items-start justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-[#174C3C]">
                          {tut.category} · {tut.readingTime}
                        </p>
                        <h3 className="mt-1 font-display font-bold text-base text-[#242D2A]">
                          {tut.title}
                        </h3>
                        <Link
                          to={`/learning?lesson=${key}`}
                          className="mt-2 inline-block text-xs font-semibold text-[#174C3C] hover:underline"
                        >
                          Read Lesson →
                        </Link>
                      </div>

                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => void handleToggleLesson(key)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors disabled:opacity-60 ${
                          done
                            ? 'bg-[#174C3C] text-white'
                            : 'bg-[#FAF6F0] text-[#242D2A]/80 border border-[#242D2A]/15 hover:bg-[#F5EBDD]'
                        }`}
                      >
                        {isBusy ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : done ? (
                          <span className="inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Done
                          </span>
                        ) : (
                          'Mark Done'
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 6: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="bg-white border border-[#242D2A]/12 rounded-2xl p-6 sm:p-8 space-y-8 max-w-3xl">
              <div>
                <h2 className="font-display font-bold text-2xl text-[#242D2A]">
                  Account &amp; Profile Settings
                </h2>
                <p className="mt-1 text-sm text-[#242D2A]/70">
                  Review your DigiThela vendor account details and profile status.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[#FAF6F0] border border-[#242D2A]/10 text-sm">
                <div>
                  <p className="text-xs text-[#242D2A]/60">Registered Account</p>
                  <p className="font-semibold text-[#242D2A] mt-0.5">{authUser.name}</p>
                  <p className="text-xs text-[#242D2A]/70">{authUser.phoneOrEmail}</p>
                </div>
                <div>
                  <p className="text-xs text-[#242D2A]/60">Verification Status</p>
                  <p className="font-semibold text-[#174C3C] mt-0.5">
                    {activeVendor.verificationStatus || 'PENDING'}
                  </p>
                  <p className="text-xs text-[#242D2A]/70">
                    {activeVendor.area}, {activeVendor.city || 'Mira-Bhayandar'}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-[#242D2A]/10 space-y-3">
                <h3 className="font-display font-bold text-base text-red-800">
                  Remove Business Profile
                </h3>
                <p className="text-xs text-[#242D2A]/70 leading-relaxed">
                  Deleting your business profile permanently removes your stall listing and all listed products from DigiThela.
                </p>
                {confirmDeleteProfile ? (
                  <div className="flex items-center gap-3 pt-1">
                    <button
                      type="button"
                      disabled={deletingProfile}
                      onClick={() => void handleDeleteProfile()}
                      className="px-4 py-2 rounded-xl bg-red-700 text-white text-xs font-semibold disabled:opacity-60"
                    >
                      {deletingProfile ? 'Deleting...' : 'Yes, Delete My Profile'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteProfile(false)}
                      className="px-4 py-2 rounded-xl border border-[#242D2A]/15 text-xs font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteProfile(true)}
                    className="px-4 py-2 rounded-xl border border-red-300 text-red-700 text-xs font-semibold hover:bg-red-50 transition-colors"
                  >
                    Delete Business Profile
                  </button>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Add / Edit Product Modal */}
      {productModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#242D2A]/55 backdrop-blur-[2px] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="product-modal-title"
        >
          <div className="bg-white border border-[#242D2A]/15 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="px-6 py-4 border-b border-[#242D2A]/10 flex items-center justify-between">
              <h2
                id="product-modal-title"
                className="font-display font-bold text-lg text-[#242D2A]"
              >
                {editingProductId ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button
                type="button"
                onClick={() => setProductModalOpen(false)}
                aria-label="Close product modal"
                className="p-1.5 rounded-lg text-[#242D2A]/70 hover:bg-[#FAF6F0]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#242D2A] mb-1">
                  Product Name <span className="text-[#D4822A]">*</span>
                </label>
                <input
                  type="text"
                  value={productForm.name}
                  onChange={(e) =>
                    setProductForm({ ...productForm, name: e.target.value })
                  }
                  placeholder="e.g., Fresh Alphonso Mangoes"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F0] border border-[#242D2A]/15 text-sm focus:bg-white focus:border-[#174C3C] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#242D2A] mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={productForm.category}
                    onChange={(e) =>
                      setProductForm({ ...productForm, category: e.target.value })
                    }
                    placeholder="e.g., Seasonal Fruits"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F0] border border-[#242D2A]/15 text-sm focus:bg-white focus:border-[#174C3C] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#242D2A] mb-1">
                    Price (₹ INR) <span className="text-[#D4822A]">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={productForm.price}
                    onChange={(e) =>
                      setProductForm({ ...productForm, price: e.target.value })
                    }
                    placeholder="e.g., 120"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F0] border border-[#242D2A]/15 text-sm tabular-nums focus:bg-white focus:border-[#174C3C] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#242D2A] mb-1">
                  Unit <span className="text-[#D4822A]">*</span>
                </label>
                <input
                  type="text"
                  value={productForm.unit}
                  onChange={(e) =>
                    setProductForm({ ...productForm, unit: e.target.value })
                  }
                  placeholder="e.g., per kg, per plate, per piece"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F0] border border-[#242D2A]/15 text-sm focus:bg-white focus:border-[#174C3C] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#242D2A] mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={productForm.description}
                  onChange={(e) =>
                    setProductForm({ ...productForm, description: e.target.value })
                  }
                  placeholder="Short description of quality, size, or freshness..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F0] border border-[#242D2A]/15 text-sm focus:bg-white focus:border-[#174C3C] focus:outline-none"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-[#FAF6F0] border border-[#242D2A]/10 flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-white border border-[#242D2A]/10 shrink-0">
                  <SafeImage src={productForm.image} alt="Product preview" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#242D2A]">Product Image</p>
                  <label className="mt-1.5 cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#242D2A]/15 text-xs font-semibold text-[#174C3C] hover:border-[#174C3C]">
                    <Upload className="w-3.5 h-3.5" />
                    Upload Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProductImageUpload}
                      className="sr-only"
                    />
                  </label>
                </div>
              </div>

              <label className="flex items-center gap-2.5 text-sm font-medium text-[#242D2A] cursor-pointer">
                <input
                  type="checkbox"
                  checked={productForm.available}
                  onChange={(e) =>
                    setProductForm({ ...productForm, available: e.target.checked })
                  }
                  className="w-4 h-4 accent-[#174C3C]"
                />
                Available (In Stock)
              </label>

              {productError && (
                <p className="text-xs font-medium text-red-700">{productError}</p>
              )}

              <div className="pt-3 border-t border-[#242D2A]/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#242D2A]/15 text-sm font-medium text-[#242D2A]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#174C3C] text-white text-sm font-semibold hover:bg-[#10372B] disabled:opacity-60"
                >
                  {savingProduct && <Loader2 className="w-4 h-4 animate-spin" />}
                  {savingProduct
                    ? 'Saving...'
                    : editingProductId
                    ? 'Save Changes'
                    : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
