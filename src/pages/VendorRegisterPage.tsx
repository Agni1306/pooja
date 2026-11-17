import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  ImagePlus,
  Loader2,
  Store,
  Upload,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { MIRA_BHAYANDAR_AREAS, VENDOR_CATEGORIES } from '../data/mockVendors';
import { MiraBhayandarArea, Vendor, VendorCategory } from '../types';
import { SafeImage } from '../components/common/SafeImage';
import { ApiClientError, uploadsApi } from '../services/api';

interface FormState {
  ownerName: string;
  businessName: string;
  phone: string;
  email: string;
  password: string;
  category: VendorCategory;
  address: string;
  area: MiraBhayandarArea;
  description: string;
  openingTime: string;
  closingTime: string;
  upiId: string;
  profileImage: string;
  coverImage: string;
}

const DEFAULT_IMAGES_BY_CATEGORY: Record<VendorCategory, string> = {
  'Fruits & Vegetables': '/src/assets/images/vendor_vegetables_stall_1794857943239.jpg',
  'Street Food': '/src/assets/images/vendor_chaat_food_1794857943606.jpg',
  Grocery: '/src/assets/images/vendor_grocery_kirana_1794857944226.jpg',
  Clothing: '/src/assets/images/vendor_cotton_clothing_1794857943977.jpg',
  Flowers: '/src/assets/images/vendor_flower_garlands_1794857944734.jpg',
  'Other Local Businesses': '/src/assets/images/vendor_tailor_alteration_1794857946936.jpg',
};

export const VendorRegisterPage: React.FC = () => {
  const { authUser, registerVendor, showToast } = useAppContext();

  const [form, setForm] = useState<FormState>({
    ownerName: authUser?.name || '',
    businessName: '',
    phone: authUser?.mobileNumber || '',
    email: authUser?.email || '',
    password: '',
    category: 'Fruits & Vegetables',
    address: '',
    area: 'Mira Road East',
    description: '',
    openingTime: '8:00 AM',
    closingTime: '9:30 PM',
    upiId: '',
    profileImage: '',
    coverImage: '',
  });

  useEffect(() => {
    if (authUser) {
      setForm((prev) => ({
        ...prev,
        ownerName: prev.ownerName || authUser.name || '',
        phone: prev.phone || authUser.mobileNumber || '',
        email: prev.email || authUser.email || '',
      }));
    }
  }, [authUser]);

  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitError, setSubmitError] = useState('');
  const [uploadingField, setUploadingField] = useState<'profileImage' | 'coverImage' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [createdVendor, setCreatedVendor] = useState<Vendor | null>(null);

  const isAuthenticatedVendor = authUser?.role === 'vendor';

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'profileImage' | 'coverImage'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingField(field);
    setSubmitError('');
    try {
      const imageUrl = await uploadsApi.uploadImage(file);
      setForm((prev) => ({ ...prev, [field]: imageUrl }));
      showToast('Photo uploaded successfully', 'success');
    } catch (err) {
      const msg =
        err instanceof ApiClientError
          ? err.message
          : 'Failed to upload image. Allowed: JPEG, PNG, WEBP, GIF up to 5MB.';
      setSubmitError(msg);
      showToast(msg, 'warning');
    } finally {
      setUploadingField(null);
    }
  };

  const validate = (): boolean => {
    const nextErrors: Partial<Record<keyof FormState, string>> = {};
    if (!form.ownerName.trim() || form.ownerName.trim().length < 2) {
      nextErrors.ownerName = 'Please enter the owner’s full name.';
    }
    if (!form.businessName.trim() || form.businessName.trim().length < 2) {
      nextErrors.businessName = 'Please enter your stall or shop name.';
    }
    const digitsOnly = form.phone.replace(/\D/g, '');
    if (!/^(\+91)?[6-9]\d{9}$/.test(form.phone.replace(/[\s-]/g, '')) && digitsOnly.length !== 10) {
      nextErrors.phone = 'Enter a valid 10-digit Indian mobile number (e.g., 9820000210).';
    }
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = 'Please enter a valid email address.';
    }
    if (!isAuthenticatedVendor && form.password.length < 6) {
      nextErrors.password = 'Create a password of at least 6 characters for your account.';
    }
    if (!form.address.trim() || form.address.trim().length < 5) {
      nextErrors.address = 'Please enter a clear landmark or street address.';
    }
    if (!form.description.trim() || form.description.trim().length < 10) {
      nextErrors.description = 'Write 1–2 sentences describing what you sell (min 10 characters).';
    }
    if (!form.openingTime.trim()) {
      nextErrors.openingTime = 'Opening time is required.';
    }
    if (!form.closingTime.trim()) {
      nextErrors.closingTime = 'Closing time is required.';
    }
    if (form.upiId.trim() && !form.upiId.includes('@')) {
      nextErrors.upiId = 'A UPI ID must contain "@" (for example: myshop.demo@okaxis).';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      const fallbackImg = DEFAULT_IMAGES_BY_CATEGORY[form.category];
      const cleanMobile = form.phone.replace(/[\s-]/g, '');

      const newVendor = await registerVendor({
        ...(!isAuthenticatedVendor
          ? {
              name: form.ownerName.trim(),
              ownerName: form.ownerName.trim(),
              mobileNumber: cleanMobile,
              email: form.email.trim() || undefined,
              password: form.password,
            }
          : {}),
        businessName: form.businessName.trim(),
        category: form.category,
        description: form.description.trim(),
        address: form.address.trim(),
        area: form.area,
        city: 'Mira-Bhayandar',
        openingTime: form.openingTime.trim(),
        closingTime: form.closingTime.trim(),
        contactNumber: cleanMobile,
        upiId: form.upiId.trim() || undefined,
        profileImage:
          form.profileImage || '/src/assets/images/hero_indian_vendor_1794857942496.jpg',
        coverImage: form.coverImage || fallbackImg,
      });

      setCreatedVendor(newVendor);
    } catch (err) {
      const msg =
        err instanceof ApiClientError
          ? err.message
          : 'Could not register business profile. Please try again.';
      setSubmitError(msg);
      showToast(msg, 'warning');
    } finally {
      setSubmitting(false);
    }
  };

  if (createdVendor) {
    return (
      <div className="bg-[#FAF6F0] min-h-[calc(100vh-4rem)] py-14 px-4">
        <div className="max-w-2xl mx-auto bg-white border border-[#242D2A]/12 rounded-2xl p-8 sm:p-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#174C3C] text-white flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <p className="mt-5 text-xs font-semibold text-[#174C3C]">
            Registration Complete
          </p>
          <h1 className="mt-2 font-display font-bold text-2xl sm:text-3xl text-[#242D2A]">
            Welcome to DigiThela, {createdVendor.businessName}!
          </h1>
          <p className="mt-3 text-sm sm:text-base text-[#242D2A]/75 leading-relaxed">
            Your business profile is now saved and active in{' '}
            <span className="font-semibold text-[#242D2A]">{createdVendor.area}</span>. Next, open your Vendor Dashboard to add your first products and preview your UPI QR standee.
          </p>

          <div className="mt-8 p-4 rounded-xl bg-[#FAF6F0] border border-[#242D2A]/10 text-left text-sm space-y-1.5">
            <p>
              <span className="text-[#242D2A]/60">Owner:</span>{' '}
              <span className="font-semibold">{createdVendor.ownerName}</span>
            </p>
            <p>
              <span className="text-[#242D2A]/60">Category:</span>{' '}
              <span className="font-semibold">{createdVendor.category}</span>
            </p>
            <p>
              <span className="text-[#242D2A]/60">UPI ID:</span>{' '}
              <code className="font-mono text-[#174C3C]">
                {createdVendor.upiId || 'Not set yet (add in Dashboard)'}
              </code>
            </p>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#174C3C] text-white text-sm font-semibold hover:bg-[#10372B] transition-colors"
            >
              Open Vendor Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to={`/vendors/${createdVendor.id}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#F5EBDD] text-[#174C3C] text-sm font-semibold hover:bg-[#E99A43] hover:text-[#242D2A] transition-colors"
            >
              View Public Profile
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FAF6F0] min-h-screen py-10 sm:py-14">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-xs font-semibold text-[#174C3C]">
            Vendor Onboarding · Mira-Bhayandar
          </p>
          <h1 className="mt-2 font-display font-bold text-3xl sm:text-4xl text-[#242D2A]">
            Register Your Local Business
          </h1>
          <p className="mt-2 text-sm sm:text-base text-[#242D2A]/75 max-w-2xl">
            {isAuthenticatedVendor
              ? 'Complete your stall details below to publish your business profile on DigiThela.'
              : 'Create your vendor account and digital storefront profile in minutes.'}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="bg-white border border-[#242D2A]/12 rounded-2xl p-6 sm:p-8 space-y-8"
        >
          {/* Section 1: Owner & Business Identity */}
          <div className="space-y-5">
            <h2 className="font-display font-bold text-lg text-[#242D2A] pb-2 border-b border-[#242D2A]/10">
              1. Owner &amp; Stall Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="ownerName" className="block text-sm font-medium text-[#242D2A] mb-1.5">
                  Owner Name <span className="text-[#D4822A]">*</span>
                </label>
                <input
                  id="ownerName"
                  type="text"
                  value={form.ownerName}
                  onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                  placeholder="e.g., Suresh Shinde"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F0] border border-[#242D2A]/15 text-sm focus:bg-white focus:border-[#174C3C] focus:outline-none"
                />
                {errors.ownerName && (
                  <p className="mt-1 text-xs text-red-700">{errors.ownerName}</p>
                )}
              </div>

              <div>
                <label htmlFor="businessName" className="block text-sm font-medium text-[#242D2A] mb-1.5">
                  Business / Stall Name <span className="text-[#D4822A]">*</span>
                </label>
                <input
                  id="businessName"
                  type="text"
                  value={form.businessName}
                  onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                  placeholder="e.g., Shinde Fresh Fruits Cart"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F0] border border-[#242D2A]/15 text-sm focus:bg-white focus:border-[#174C3C] focus:outline-none"
                />
                {errors.businessName && (
                  <p className="mt-1 text-xs text-red-700">{errors.businessName}</p>
                )}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-[#242D2A] mb-1.5">
                  Mobile Number <span className="text-[#D4822A]">*</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="e.g., 9820000210"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F0] border border-[#242D2A]/15 text-sm tabular-nums focus:bg-white focus:border-[#174C3C] focus:outline-none"
                />
                {errors.phone && (
                  <p className="mt-1 text-xs text-red-700">{errors.phone}</p>
                )}
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-[#242D2A] mb-1.5">
                  Business Category <span className="text-[#D4822A]">*</span>
                </label>
                <select
                  id="category"
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value as VendorCategory })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F0] border border-[#242D2A]/15 text-sm focus:bg-white focus:border-[#174C3C] focus:outline-none"
                >
                  {VENDOR_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {!isAuthenticatedVendor && (
                <>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-[#242D2A] mb-1.5">
                      Email Address <span className="text-[#242D2A]/50 font-normal">(Optional)</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="e.g., shindefruits@example.com"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F0] border border-[#242D2A]/15 text-sm focus:bg-white focus:border-[#174C3C] focus:outline-none"
                    />
                    {errors.email && (
                      <p className="mt-1 text-xs text-red-700">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-[#242D2A] mb-1.5">
                      Account Password <span className="text-[#D4822A]">*</span>
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="Minimum 6 characters"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F0] border border-[#242D2A]/15 text-sm focus:bg-white focus:border-[#174C3C] focus:outline-none"
                    />
                    {errors.password && (
                      <p className="mt-1 text-xs text-red-700">{errors.password}</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Section 2: Location & Timings */}
          <div className="space-y-5">
            <h2 className="font-display font-bold text-lg text-[#242D2A] pb-2 border-b border-[#242D2A]/10">
              2. Mira-Bhayandar Location &amp; Hours
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="area" className="block text-sm font-medium text-[#242D2A] mb-1.5">
                  Area / Locality <span className="text-[#D4822A]">*</span>
                </label>
                <select
                  id="area"
                  value={form.area}
                  onChange={(e) =>
                    setForm({ ...form, area: e.target.value as MiraBhayandarArea })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F0] border border-[#242D2A]/15 text-sm focus:bg-white focus:border-[#174C3C] focus:outline-none"
                >
                  {MIRA_BHAYANDAR_AREAS.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="openingTime" className="block text-sm font-medium text-[#242D2A] mb-1.5">
                    Opening Time <span className="text-[#D4822A]">*</span>
                  </label>
                  <input
                    id="openingTime"
                    type="text"
                    value={form.openingTime}
                    onChange={(e) => setForm({ ...form, openingTime: e.target.value })}
                    placeholder="8:00 AM"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F0] border border-[#242D2A]/15 text-sm focus:bg-white focus:border-[#174C3C] focus:outline-none"
                  />
                  {errors.openingTime && (
                    <p className="mt-1 text-xs text-red-700">{errors.openingTime}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="closingTime" className="block text-sm font-medium text-[#242D2A] mb-1.5">
                    Closing Time <span className="text-[#D4822A]">*</span>
                  </label>
                  <input
                    id="closingTime"
                    type="text"
                    value={form.closingTime}
                    onChange={(e) => setForm({ ...form, closingTime: e.target.value })}
                    placeholder="9:30 PM"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F0] border border-[#242D2A]/15 text-sm focus:bg-white focus:border-[#174C3C] focus:outline-none"
                  />
                  {errors.closingTime && (
                    <p className="mt-1 text-xs text-red-700">{errors.closingTime}</p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-[#242D2A] mb-1.5">
                Business Address &amp; Landmark <span className="text-[#D4822A]">*</span>
              </label>
              <input
                id="address"
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="e.g., Near Shanti Nagar Sector 3 Main Gate, Mira Road East"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F0] border border-[#242D2A]/15 text-sm focus:bg-white focus:border-[#174C3C] focus:outline-none"
              />
              {errors.address && (
                <p className="mt-1 text-xs text-red-700">{errors.address}</p>
              )}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-[#242D2A] mb-1.5">
                Short Business Description <span className="text-[#D4822A]">*</span>
              </label>
              <textarea
                id="description"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe what you sell, specialties, and why neighbors love visiting your stall..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F0] border border-[#242D2A]/15 text-sm focus:bg-white focus:border-[#174C3C] focus:outline-none"
              />
              {errors.description && (
                <p className="mt-1 text-xs text-red-700">{errors.description}</p>
              )}
            </div>
          </div>

          {/* Section 3: Digital Payments & Photos */}
          <div className="space-y-5">
            <h2 className="font-display font-bold text-lg text-[#242D2A] pb-2 border-b border-[#242D2A]/10">
              3. Digital Payments &amp; Photos (Optional)
            </h2>

            <div>
              <label htmlFor="upiId" className="block text-sm font-medium text-[#242D2A] mb-1.5">
                UPI ID <span className="text-[#242D2A]/50 font-normal">(Optional)</span>
              </label>
              <input
                id="upiId"
                type="text"
                value={form.upiId}
                onChange={(e) => setForm({ ...form, upiId: e.target.value })}
                placeholder="e.g., shindecart@okaxis"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F0] border border-[#242D2A]/15 text-sm font-mono focus:bg-white focus:border-[#174C3C] focus:outline-none"
              />
              <p className="mt-1 text-xs text-[#242D2A]/60">
                Add your public UPI handle so shoppers can scan &amp; pay at your stall. Never enter UPI PINs or OTPs.
              </p>
              {errors.upiId && (
                <p className="mt-1 text-xs text-red-700">{errors.upiId}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Profile Photo Upload */}
              <div className="p-4 rounded-xl bg-[#FAF6F0] border border-[#242D2A]/15">
                <p className="text-sm font-medium text-[#242D2A]">Owner / Profile Photo</p>
                <p className="text-xs text-[#242D2A]/60 mt-0.5">
                  Helps neighbors recognize your face.
                </p>
                <div className="mt-3 flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-white border border-[#242D2A]/10 shrink-0 flex items-center justify-center">
                    {form.profileImage ? (
                      <SafeImage src={form.profileImage} alt="Profile preview" />
                    ) : (
                      <Store className="w-6 h-6 text-[#174C3C]/50" />
                    )}
                  </div>
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-[#242D2A]/15 text-xs font-semibold text-[#174C3C] hover:border-[#174C3C] transition-colors">
                    {uploadingField === 'profileImage' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    {uploadingField === 'profileImage' ? 'Uploading...' : 'Upload Photo'}
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingField !== null}
                      onChange={(e) => void handleFileUpload(e, 'profileImage')}
                      className="sr-only"
                    />
                  </label>
                </div>
              </div>

              {/* Business Cover Photo Upload */}
              <div className="p-4 rounded-xl bg-[#FAF6F0] border border-[#242D2A]/15">
                <p className="text-sm font-medium text-[#242D2A]">Stall / Shop Cover Photo</p>
                <p className="text-xs text-[#242D2A]/60 mt-0.5">
                  Shown on directory cards and your profile banner.
                </p>
                <div className="mt-3 flex items-center gap-4">
                  <div className="w-24 h-16 rounded-xl overflow-hidden bg-white border border-[#242D2A]/10 shrink-0 flex items-center justify-center">
                    {form.coverImage ? (
                      <SafeImage src={form.coverImage} alt="Business cover preview" />
                    ) : (
                      <ImagePlus className="w-6 h-6 text-[#174C3C]/50" />
                    )}
                  </div>
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-[#242D2A]/15 text-xs font-semibold text-[#174C3C] hover:border-[#174C3C] transition-colors">
                    {uploadingField === 'coverImage' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    {uploadingField === 'coverImage' ? 'Uploading...' : 'Upload Cover'}
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingField !== null}
                      onChange={(e) => void handleFileUpload(e, 'coverImage')}
                      className="sr-only"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {submitError && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs sm:text-sm font-medium text-red-700">
              {submitError}
            </div>
          )}

          <div className="pt-4 border-t border-[#242D2A]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-xs text-[#242D2A]/65">
              Required fields are marked with <span className="text-[#D4822A]">*</span>.
            </p>
            <button
              type="submit"
              disabled={submitting || uploadingField !== null}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#174C3C] text-white text-sm font-semibold hover:bg-[#10372B] disabled:opacity-60 transition-colors"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Profile...
                </>
              ) : (
                <>
                  Create Business Profile
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
