import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Clock,
  Copy,
  Heart,
  Info,
  Loader2,
  MapPin,
  Minus,
  Phone,
  Plus,
  RefreshCw,
  ShoppingBag,
  User,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { SafeImage } from '../components/common/SafeImage';
import { DemoQrCode } from '../components/common/DemoQrCode';
import { ApiClientError, vendorsApi } from '../services/api';
import { Vendor } from '../types';

export const VendorDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { favoriteVendorIds, toggleFavoriteVendor, showToast } = useAppContext();

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [togglingFavorite, setTogglingFavorite] = useState(false);

  const [copiedUpi, setCopiedUpi] = useState(false);
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [basket, setBasket] = useState<Record<string, number>>({});
  const [copiedInquiry, setCopiedInquiry] = useState(false);

  const loadVendor = useCallback(async () => {
    if (!id) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const data = await vendorsApi.getById(id);
      setVendor(data);
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 404) {
        setNotFound(true);
      } else {
        setError(
          err instanceof ApiClientError
            ? err.message
            : 'Unable to load vendor details.'
        );
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadVendor();
  }, [loadVendor]);

  const isFavorited = vendor ? favoriteVendorIds.includes(vendor.id) : false;

  const visibleProducts = useMemo(() => {
    if (!vendor) return [];
    return onlyAvailable
      ? vendor.products.filter((p) => p.available)
      : vendor.products;
  }, [vendor, onlyAvailable]);

  if (loading) {
    return (
      <div className="bg-[#FAF6F0] min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-20">
        <div className="flex items-center gap-2.5 text-sm text-[#242D2A]/75">
          <Loader2 className="w-5 h-5 animate-spin text-[#174C3C]" />
          Loading vendor profile...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <AlertTriangle className="w-10 h-10 text-[#B96614] mx-auto" />
        <h1 className="mt-3 font-display font-bold text-2xl text-[#242D2A]">
          Could Not Load Vendor Profile
        </h1>
        <p className="mt-2 text-sm text-[#242D2A]/70">{error}</p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => void loadVendor()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#174C3C] text-white text-sm font-semibold"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
          <Link
            to="/explore"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#242D2A]/15 text-sm font-semibold text-[#242D2A]"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Explore
          </Link>
        </div>
      </div>
    );
  }

  if (notFound || !vendor) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="font-display font-bold text-2xl text-[#242D2A]">
          Vendor Profile Not Found
        </h1>
        <p className="mt-2 text-sm text-[#242D2A]/70">
          This stall profile may have been removed or the link is incomplete.
        </p>
        <Link
          to="/explore"
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#174C3C] text-white text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Explore Vendors
        </Link>
      </div>
    );
  }

  const handleToggleFavorite = async () => {
    if (togglingFavorite) return;
    setTogglingFavorite(true);
    try {
      const nextState = await toggleFavoriteVendor(vendor.id);
      setVendor((prev) =>
        prev
          ? {
              ...prev,
              favoritesCount: Math.max(
                0,
                (prev.favoritesCount || 0) + (nextState ? 1 : -1)
              ),
            }
          : prev
      );
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Unable to update favorites.',
        'warning'
      );
    } finally {
      setTogglingFavorite(false);
    }
  };

  const handleCopyUpi = () => {
    if (!vendor.upiId) return;
    navigator.clipboard?.writeText(vendor.upiId);
    setCopiedUpi(true);
    showToast('UPI ID copied to clipboard', 'info');
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const adjustQuantity = (productId: string, delta: number) => {
    setBasket((prev) => {
      const nextQty = (prev[productId] || 0) + delta;
      if (nextQty <= 0) {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      }
      return { ...prev, [productId]: nextQty };
    });
  };

  const basketItems = vendor.products
    .filter((p) => (basket[p.id] || 0) > 0)
    .map((p) => ({
      product: p,
      qty: basket[p.id],
      subtotal: p.price * basket[p.id],
    }));

  const basketTotal = basketItems.reduce((sum, item) => sum + item.subtotal, 0);

  const handleCopyInquiry = () => {
    const lines = basketItems.map(
      (i) => `- ${i.product.name} x${i.qty} (₹${i.subtotal})`
    );
    const summary = `Hello ${vendor.businessName}, I would like to check availability for:\n${lines.join(
      '\n'
    )}\nEstimated Total: ₹${basketTotal} (Inquiry via DigiThela)`;
    navigator.clipboard?.writeText(summary);
    setCopiedInquiry(true);
    showToast('Order list copied! Share with vendor at stall.', 'success');
    setTimeout(() => setCopiedInquiry(false), 2500);
  };

  return (
    <div className="bg-[#FAF6F0] min-h-screen pb-16">
      {/* Top Breadcrumb */}
      <div className="bg-white border-b border-[#242D2A]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-[#242D2A]/70 min-w-0">
            <Link
              to="/explore"
              className="inline-flex items-center gap-1.5 font-medium text-[#174C3C] hover:underline whitespace-nowrap shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              Explore Vendors
            </Link>
            <span aria-hidden="true">/</span>
            <span className="truncate font-medium text-[#242D2A]">
              {vendor.businessName}
            </span>
          </div>
          <span className="text-xs text-[#242D2A]/60 whitespace-nowrap shrink-0">
            {vendor.verificationStatus === 'VERIFIED' ? 'Verified Vendor' : 'Vendor Profile'}
          </span>
        </div>
      </div>

      {/* Cover & Business Header */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="bg-white border border-[#242D2A]/12 rounded-2xl overflow-hidden">
          <div className="h-56 sm:h-72 lg:h-80 w-full bg-[#F5EBDD] overflow-hidden">
            <SafeImage
              src={vendor.coverImage}
              alt={`${vendor.businessName} cover`}
              fallbackLabel={vendor.businessName}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="p-6 sm:p-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 -mt-14 sm:-mt-16 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-4 border-white overflow-hidden bg-[#F5EBDD] shadow-sm shrink-0">
                  <SafeImage
                    src={vendor.profileImage}
                    alt={`${vendor.ownerName} portrait`}
                    fallbackLabel={vendor.ownerName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="pt-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#174C3C]">
                    <span>{vendor.category}</span>
                    <span aria-hidden="true" className="text-[#242D2A]/30">·</span>
                    <span>{vendor.area}, {vendor.city || 'Mira-Bhayandar'}</span>
                  </div>
                  <h1 className="mt-1 font-display font-bold text-2xl sm:text-3xl text-[#242D2A]">
                    {vendor.businessName}
                  </h1>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="text-xs text-[#242D2A]/65 tabular-nums">
                  Profile views:{' '}
                  <span className="font-semibold text-[#242D2A]">
                    {vendor.profileViewsDemo}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleToggleFavorite}
                  disabled={togglingFavorite}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                    isFavorited
                      ? 'bg-[#174C3C] text-white border-[#174C3C]'
                      : 'bg-[#FAF6F0] text-[#242D2A] border-[#242D2A]/15 hover:bg-[#F5EBDD]'
                  }`}
                >
                  {togglingFavorite ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Heart className={`w-3.5 h-3.5 ${isFavorited ? 'fill-current' : ''}`} />
                  )}
                  {isFavorited ? 'Saved in Favorites' : 'Save Vendor'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6 border-t border-[#242D2A]/10">
              <div className="lg:col-span-7 space-y-4">
                <h2 className="font-display font-bold text-lg text-[#242D2A]">
                  About This Business
                </h2>
                <p className="text-sm sm:text-base text-[#242D2A]/80 leading-relaxed">
                  {vendor.description}
                </p>
              </div>

              <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 text-sm">
                <div className="flex items-start gap-3">
                  <User className="w-4 h-4 text-[#174C3C] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-[#242D2A]/60">Owner</p>
                    <p className="font-medium text-[#242D2A]">{vendor.ownerName}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-[#174C3C] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-[#242D2A]/60">Location</p>
                    <p className="font-medium text-[#242D2A]">{vendor.address}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-[#174C3C] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-[#242D2A]/60">Opening Hours</p>
                    <p className="font-medium text-[#242D2A]">{vendor.openingHours}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-[#174C3C] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-[#242D2A]/60">Contact</p>
                    <p className="font-medium text-[#242D2A] tabular-nums">{vendor.phone}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Split: Product Catalogue + UPI Payment Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Product Catalogue */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-display font-bold text-2xl text-[#242D2A]">
                  Product Catalogue
                </h2>
                <p className="text-sm text-[#242D2A]/70 mt-0.5">
                  Browse current items and build an estimated list before visiting the stall.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOnlyAvailable((prev) => !prev)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                  onlyAvailable
                    ? 'bg-[#174C3C] text-white border-[#174C3C]'
                    : 'bg-white text-[#242D2A] border-[#242D2A]/15 hover:bg-[#F5EBDD]'
                }`}
              >
                {onlyAvailable ? 'Showing In-Stock Only' : 'Show Available Only'}
              </button>
            </div>

            {visibleProducts.length === 0 ? (
              <div className="bg-white border border-[#242D2A]/12 rounded-xl p-10 text-center">
                <p className="font-display font-semibold text-base text-[#242D2A]">
                  No products listed under this filter yet.
                </p>
                <p className="text-sm text-[#242D2A]/65 mt-1">
                  Vendors can add items anytime from the Vendor Dashboard.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {visibleProducts.map((product) => {
                  const qty = basket[product.id] || 0;
                  return (
                    <article
                      key={product.id}
                      className="bg-white border border-[#242D2A]/12 rounded-xl overflow-hidden flex flex-col"
                    >
                      <div className="aspect-[4/3] bg-[#FAF6F0] overflow-hidden">
                        <SafeImage
                          src={product.image || vendor.coverImage}
                          alt={product.name}
                          fallbackLabel={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-5 flex-1 flex flex-col">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="text-[#242D2A]/65">{product.category}</span>
                          <span
                            className={`font-semibold ${
                              product.available ? 'text-[#174C3C]' : 'text-[#242D2A]/50'
                            }`}
                          >
                            {product.available ? 'In Stock' : 'Currently Out'}
                          </span>
                        </div>

                        <h3 className="mt-1.5 font-display font-bold text-base text-[#242D2A]">
                          {product.name}
                        </h3>
                        <p className="mt-1.5 text-sm text-[#242D2A]/75 leading-relaxed flex-1">
                          {product.description}
                        </p>

                        <div className="mt-4 pt-3.5 border-t border-[#242D2A]/10 flex items-center justify-between gap-3">
                          <div className="tabular-nums">
                            <span className="font-display font-bold text-lg text-[#174C3C]">
                              ₹{product.price}
                            </span>
                            <span className="text-xs text-[#242D2A]/60 ml-1">
                              {product.unit}
                            </span>
                          </div>

                          {product.available && (
                            <div>
                              {qty === 0 ? (
                                <button
                                  type="button"
                                  onClick={() => adjustQuantity(product.id, 1)}
                                  className="px-3 py-1.5 rounded-lg bg-[#F5EBDD] text-[#174C3C] text-xs font-semibold hover:bg-[#E99A43] hover:text-[#242D2A] transition-colors"
                                >
                                  + Add to Estimate
                                </button>
                              ) : (
                                <div className="inline-flex items-center gap-2 bg-[#FAF6F0] border border-[#242D2A]/15 rounded-lg px-2 py-1">
                                  <button
                                    type="button"
                                    onClick={() => adjustQuantity(product.id, -1)}
                                    aria-label={`Decrease quantity of ${product.name}`}
                                    className="p-1 text-[#242D2A] hover:text-[#174C3C]"
                                  >
                                    <Minus className="w-3.5 h-3.5" />
                                  </button>
                                  <span className="text-xs font-semibold tabular-nums min-w-[1.25rem] text-center">
                                    {qty}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => adjustQuantity(product.id, 1)}
                                    aria-label={`Increase quantity of ${product.name}`}
                                    className="p-1 text-[#242D2A] hover:text-[#174C3C]"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Sidebar: UPI Payment Placeholder + Order Estimate */}
          <aside className="lg:col-span-4 space-y-6">
            {/* UPI Payment Section */}
            <div className="bg-white border border-[#242D2A]/12 rounded-2xl p-6">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display font-bold text-lg text-[#242D2A]">
                  Digital Payment Info
                </h2>
                <span className="text-[11px] font-semibold text-[#174C3C]">
                  {vendor.upiId ? 'UPI Active' : 'Pending'}
                </span>
              </div>

              <p className="mt-1.5 text-xs text-[#242D2A]/70 leading-relaxed">
                UPI QR code preview generated from the vendor&apos;s listed UPI ID. Pay directly using your preferred UPI app at the stall.
              </p>

              <div className="mt-5 flex justify-center">
                <DemoQrCode
                  upiId={vendor.upiId || 'not-configured@upi'}
                  businessName={vendor.businessName}
                  size={172}
                />
              </div>

              <div className="mt-5 p-3.5 rounded-xl bg-[#FAF6F0] border border-[#242D2A]/10">
                <p className="text-[11px] font-medium text-[#242D2A]/60">
                  Vendor UPI ID
                </p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <code className="font-mono text-xs sm:text-sm font-semibold text-[#174C3C] truncate">
                    {vendor.upiId || 'Not configured yet'}
                  </code>
                  {vendor.upiId && (
                    <button
                      type="button"
                      onClick={handleCopyUpi}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-[#242D2A]/15 text-xs font-medium text-[#242D2A] hover:border-[#174C3C] transition-colors shrink-0"
                    >
                      {copiedUpi ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#174C3C]" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copy
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-4 p-3 rounded-xl bg-[#F5EBDD]/70 flex items-start gap-2.5 text-xs text-[#242D2A]/85 leading-relaxed">
                <Info className="w-4 h-4 text-[#174C3C] shrink-0 mt-0.5" />
                <span>
                  Always verify the recipient business name inside your UPI app before confirming any payment at the stall.
                </span>
              </div>
            </div>

            {/* Interactive Local Order Estimate */}
            <div className="bg-white border border-[#242D2A]/12 rounded-2xl p-6">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#174C3C]" />
                <h2 className="font-display font-bold text-lg text-[#242D2A]">
                  Quick Order Estimate
                </h2>
              </div>

              {basketItems.length === 0 ? (
                <p className="mt-3 text-sm text-[#242D2A]/70 leading-relaxed">
                  Select &ldquo;+ Add to Estimate&rdquo; on any product to calculate your total in Rupees before visiting {vendor.businessName}.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  <ul className="divide-y divide-[#242D2A]/10">
                    {basketItems.map(({ product, qty, subtotal }) => (
                      <li
                        key={product.id}
                        className="py-2.5 flex items-center justify-between gap-3 text-sm"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-[#242D2A] truncate">
                            {product.name}
                          </p>
                          <p className="text-xs text-[#242D2A]/60 tabular-nums">
                            {qty} x ₹{product.price}
                          </p>
                        </div>
                        <span className="font-semibold text-[#174C3C] tabular-nums shrink-0">
                          ₹{subtotal}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="pt-3 border-t border-[#242D2A]/15 flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#242D2A]">
                      Estimated Total
                    </span>
                    <span className="font-display font-bold text-xl text-[#174C3C] tabular-nums">
                      ₹{basketTotal}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyInquiry}
                    className="w-full mt-2 px-4 py-2.5 rounded-xl bg-[#174C3C] text-white text-sm font-semibold hover:bg-[#10372B] transition-colors"
                  >
                    {copiedInquiry ? 'Copied Order Summary!' : 'Copy List for Vendor'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setBasket({})}
                    className="w-full px-4 py-2 rounded-xl text-xs font-medium text-[#242D2A]/70 hover:text-[#242D2A] transition-colors"
                  >
                    Clear Estimate
                  </button>
                </div>
              )}
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
};
