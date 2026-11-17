import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Flower2,
  Loader2,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Shirt,
  ShoppingBasket,
  Store,
  TrendingUp,
  Utensils,
  Apple,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import {
  MOCK_TESTIMONIALS,
  PLATFORM_STATS_DEMO,
  VENDOR_CATEGORIES,
} from '../data/mockVendors';
import { VendorCard } from '../components/vendors/VendorCard';
import { SafeImage } from '../components/common/SafeImage';
import { VendorCategory } from '../types';

const CATEGORY_ICONS: Record<VendorCategory, React.FC<{ className?: string }>> = {
  'Fruits & Vegetables': Apple,
  'Street Food': Utensils,
  Grocery: ShoppingBasket,
  Clothing: Shirt,
  Flowers: Flower2,
  'Other Local Businesses': Store,
};

export const HomePage: React.FC = () => {
  const {
    vendors,
    vendorsLoading,
    vendorsError,
    refreshVendors,
    tutorials,
    tutorialsLoading,
    tutorialsError,
    refreshTutorials,
  } = useAppContext();
  const location = useLocation();

  useEffect(() => {
    if (location.hash === '#how-it-works') {
      const el = document.getElementById('how-it-works');
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 60);
      }
    }
  }, [location.hash]);

  const featuredVendors = (
    vendors.some((v) => v.featured)
      ? vendors.filter((v) => v.featured)
      : vendors
  ).slice(0, 4);

  const preferredSlugs = ['tut-what-is-upi', 'tut-create-profile', 'tut-fake-screenshots'];
  const matchingPreview = tutorials.filter((t) =>
    preferredSlugs.includes(t.slug || t.id)
  );
  const previewTutorials = (
    matchingPreview.length > 0 ? matchingPreview : tutorials
  ).slice(0, 3);

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-[#FAF6F0] border-b border-[#242D2A]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-center">
              <p className="text-xs font-semibold tracking-wide text-[#174C3C] mb-3">
                Mira-Bhayandar Local Commerce Initiative
              </p>
              <h1 className="font-display font-extrabold text-[clamp(2.25rem,4vw,3.5rem)] leading-[1.1] tracking-tight text-[#242D2A] text-balance">
                Your Business Deserves a Digital Identity.
              </h1>
              <p className="mt-5 text-base sm:text-lg text-[#242D2A]/80 leading-relaxed max-w-xl">
                Bringing Mira-Bhayandar&apos;s local vendors closer to a world of digital opportunities.
              </p>
              <p className="mt-3 text-sm text-[#242D2A]/70 leading-relaxed max-w-xl">
                Create a clean online storefront, display your daily products with transparent Indian Rupee prices, accept UPI payments safely, and help neighborhood shoppers discover your stall.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  to="/explore"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#174C3C] text-white text-sm font-semibold hover:bg-[#10372B] transition-colors whitespace-nowrap"
                >
                  Explore Local Vendors
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#E99A43] text-[#242D2A] text-sm font-semibold hover:bg-[#D4822A] hover:text-white transition-colors whitespace-nowrap"
                >
                  Register Your Business
                </Link>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="h-full min-h-[300px] sm:min-h-[380px] lg:min-h-[440px] rounded-2xl overflow-hidden border border-[#242D2A]/12 bg-[#F5EBDD]">
                <SafeImage
                  src="/src/assets/images/hero_indian_vendor_1794857942496.jpg"
                  alt="Smiling Indian street vendor beside his fresh fruit and vegetable cart in Mira-Bhayandar"
                  fallbackLabel="Local Mira-Bhayandar Vendor"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Statistics (Illustrative Demo Figures) */}
      <section className="bg-white border-b border-[#242D2A]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <h2 className="font-display font-bold text-base text-[#242D2A]">
              Community Reach Snapshot
            </h2>
            <span className="text-xs text-[#242D2A]/60">
              Illustrative demo figures for prototype demonstration
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PLATFORM_STATS_DEMO.map((stat) => (
              <div
                key={stat.label}
                className="p-5 rounded-xl bg-[#FAF6F0] border border-[#242D2A]/10"
              >
                <p className="font-display font-extrabold text-3xl text-[#174C3C] tabular-nums">
                  {stat.value}
                </p>
                <p className="mt-1.5 font-semibold text-sm text-[#242D2A]">
                  {stat.label}
                </p>
                <p className="mt-1 text-xs text-[#242D2A]/65 leading-relaxed">
                  {stat.context}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How DigiThela Works — 3 Steps */}
      <section id="how-it-works" className="bg-white py-16 lg:py-20 border-b border-[#242D2A]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold text-[#174C3C]">Simple Onboarding</p>
            <h2 className="mt-2 font-display font-bold text-3xl sm:text-4xl text-[#242D2A] text-balance">
              How DigiThela Works
            </h2>
            <p className="mt-3 text-base text-[#242D2A]/75 leading-relaxed">
              Designed for busy cart owners and neighborhood shopkeepers—no technical background needed.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl bg-[#FAF6F0] border border-[#242D2A]/10 flex flex-col">
              <span className="font-mono text-sm font-semibold text-[#E99A43]">01.</span>
              <h3 className="mt-3 font-display font-bold text-xl text-[#242D2A]">
                Register Your Business
              </h3>
              <p className="mt-2.5 text-sm text-[#242D2A]/75 leading-relaxed flex-1">
                Enter your stall name, Mira-Bhayandar area, opening hours, and photos in under three minutes using our beginner-friendly form.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#FAF6F0] border border-[#242D2A]/10 flex flex-col">
              <span className="font-mono text-sm font-semibold text-[#E99A43]">02.</span>
              <h3 className="mt-3 font-display font-bold text-xl text-[#242D2A]">
                Go Digital
              </h3>
              <p className="mt-2.5 text-sm text-[#242D2A]/75 leading-relaxed flex-1">
                List your products with Rupee prices, add your UPI QR display, and complete short plain-language lessons on safe digital payments.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#FAF6F0] border border-[#242D2A]/10 flex flex-col">
              <span className="font-mono text-sm font-semibold text-[#E99A43]">03.</span>
              <h3 className="mt-3 font-display font-bold text-xl text-[#242D2A]">
                Reach More Customers
              </h3>
              <p className="mt-2.5 text-sm text-[#242D2A]/75 leading-relaxed flex-1">
                Residents across Mira Road, Bhayandar East, and Bhayandar West discover your profile, browse daily stock, and visit with confidence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Local Vendors */}
      <section className="bg-[#FAF6F0] py-16 lg:py-20 border-b border-[#242D2A]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-[#174C3C]">Neighborhood Showcase</p>
              <h2 className="mt-2 font-display font-bold text-3xl text-[#242D2A]">
                Featured Local Vendors
              </h2>
              <p className="mt-2 text-sm sm:text-base text-[#242D2A]/75">
                Fictional sample profiles demonstrating stalls across Mira Road and Bhayandar.
              </p>
            </div>
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#174C3C] hover:text-[#10372B] whitespace-nowrap shrink-0"
            >
              View All {vendors.length} Vendors
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {vendorsLoading ? (
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((idx) => (
                <div
                  key={idx}
                  className="bg-white border border-[#242D2A]/12 rounded-xl overflow-hidden animate-pulse"
                >
                  <div className="aspect-[4/3] bg-[#F5EBDD]" />
                  <div className="p-5 space-y-3">
                    <div className="h-3 w-24 bg-[#F5EBDD] rounded" />
                    <div className="h-5 w-3/4 bg-[#F5EBDD] rounded" />
                    <div className="h-4 w-full bg-[#FAF6F0] rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : vendorsError ? (
            <div className="mt-10 p-6 rounded-xl bg-white border border-[#E99A43]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-[#B96614] shrink-0 mt-0.5" />
                <div>
                  <p className="font-display font-bold text-sm text-[#242D2A]">
                    Could not load vendors from server
                  </p>
                  <p className="text-xs text-[#242D2A]/70 mt-0.5">{vendorsError}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => void refreshVendors()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#174C3C] text-white text-xs font-semibold hover:bg-[#10372B] shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry
              </button>
            </div>
          ) : featuredVendors.length === 0 ? (
            <div className="mt-10 p-8 rounded-xl bg-white border border-[#242D2A]/12 text-center">
              <p className="font-display font-bold text-base text-[#242D2A]">
                No local vendors registered yet
              </p>
              <p className="text-sm text-[#242D2A]/70 mt-1">
                Be the first Mira-Bhayandar stall to create an online business profile.
              </p>
              <Link
                to="/register"
                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#174C3C] text-white text-sm font-semibold hover:bg-[#10372B]"
              >
                Register Your Business
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredVendors.map((vendor) => (
                <VendorCard key={vendor.id} vendor={vendor} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Explore Categories */}
      <section className="bg-white py-16 lg:py-20 border-b border-[#242D2A]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold text-[#174C3C]">Browse by Trade</p>
            <h2 className="mt-2 font-display font-bold text-3xl text-[#242D2A]">
              Explore Categories
            </h2>
            <p className="mt-2 text-base text-[#242D2A]/75">
              Find everyday produce, snacks, groceries, clothing, flowers, and trusted neighborhood services.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {VENDOR_CATEGORIES.map((category) => {
              const Icon = CATEGORY_ICONS[category];
              const count = vendors.filter((v) => v.category === category).length;
              return (
                <Link
                  key={category}
                  to={`/explore?category=${encodeURIComponent(category)}`}
                  className="group p-5 rounded-xl bg-white border border-[#242D2A]/12 hover:border-[#174C3C] hover:bg-[#FAF6F0] transition-all flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-[#F5EBDD] text-[#174C3C] flex items-center justify-center shrink-0 group-hover:bg-[#174C3C] group-hover:text-white transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-display font-bold text-base text-[#242D2A] truncate">
                        {category}
                      </h3>
                      <p className="text-xs text-[#242D2A]/65 mt-0.5 tabular-nums">
                        {count} {count === 1 ? 'vendor' : 'vendors'}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#242D2A]/45 group-hover:text-[#174C3C] group-hover:translate-x-0.5 transition-all shrink-0" />
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits for Vendors + Digital Learning Preview */}
      <section className="bg-[#FAF6F0] py-16 lg:py-20 border-b border-[#242D2A]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          {/* Benefits */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-5">
              <p className="text-xs font-semibold text-[#174C3C]">Why Join DigiThela</p>
              <h2 className="mt-2 font-display font-bold text-3xl text-[#242D2A] text-balance">
                Practical Benefits for Local Street Vendors
              </h2>
              <p className="mt-3 text-base text-[#242D2A]/75 leading-relaxed">
                Cash-only dependency often costs small sellers everyday impulse sales. DigiThela gives every hawker and shopkeeper the tools to grow at zero complexity.
              </p>
              <div className="mt-6">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#174C3C] text-white text-sm font-semibold hover:bg-[#10372B] transition-colors"
                >
                  Create Free Demo Profile
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="p-5 rounded-xl bg-white border border-[#242D2A]/10">
                <QrCode className="w-6 h-6 text-[#174C3C]" />
                <h3 className="mt-3 font-display font-bold text-base text-[#242D2A]">
                  Zero-Change UPI Readiness
                </h3>
                <p className="mt-1.5 text-sm text-[#242D2A]/75 leading-relaxed">
                  Display a clean UPI ID &amp; QR placeholder on your profile so customers know cashless payments are welcome.
                </p>
              </div>
              <div className="p-5 rounded-xl bg-white border border-[#242D2A]/10">
                <Store className="w-6 h-6 text-[#174C3C]" />
                <h3 className="mt-3 font-display font-bold text-base text-[#242D2A]">
                  Always-On Product Catalogue
                </h3>
                <p className="mt-1.5 text-sm text-[#242D2A]/75 leading-relaxed">
                  Update daily vegetable rates, snack menus, or garment stock in seconds from your vendor dashboard.
                </p>
              </div>
              <div className="p-5 rounded-xl bg-white border border-[#242D2A]/10">
                <ShieldCheck className="w-6 h-6 text-[#174C3C]" />
                <h3 className="mt-3 font-display font-bold text-base text-[#242D2A]">
                  Scam &amp; Fraud Protection
                </h3>
                <p className="mt-1.5 text-sm text-[#242D2A]/75 leading-relaxed">
                  Learn how to verify payments on your own phone and spot fake screenshots before handing over goods.
                </p>
              </div>
              <div className="p-5 rounded-xl bg-white border border-[#242D2A]/10">
                <TrendingUp className="w-6 h-6 text-[#174C3C]" />
                <h3 className="mt-3 font-display font-bold text-base text-[#242D2A]">
                  Neighborhood Visibility
                </h3>
                <p className="mt-1.5 text-sm text-[#242D2A]/75 leading-relaxed">
                  Show up when Mira-Bhayandar residents search by area or product category.
                </p>
              </div>
            </div>
          </div>

          {/* Digital Learning Preview */}
          <div className="pt-12 border-t border-[#242D2A]/10">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-[#174C3C]">Digital Learning Centre</p>
                <h2 className="mt-2 font-display font-bold text-3xl text-[#242D2A]">
                  Step-by-Step Guides in Simple Language
                </h2>
                <p className="mt-2 text-sm sm:text-base text-[#242D2A]/75">
                  Short, beginner-friendly lessons on UPI, online storefronts, and digital safety.
                </p>
              </div>
              <Link
                to="/learning"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#174C3C] hover:text-[#10372B] whitespace-nowrap shrink-0"
              >
                <BookOpen className="w-4 h-4" />
                Explore All {tutorials.length > 0 ? `${tutorials.length} ` : ''}Lessons
              </Link>
            </div>

            {tutorialsLoading ? (
              <div className="mt-8 flex items-center justify-center py-10 text-sm text-[#242D2A]/70 gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#174C3C]" />
                Loading digital learning guides...
              </div>
            ) : tutorialsError ? (
              <div className="mt-8 p-6 rounded-xl bg-white border border-[#E99A43]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="text-xs sm:text-sm text-[#242D2A]/80">{tutorialsError}</p>
                <button
                  type="button"
                  onClick={() => void refreshTutorials()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#174C3C] text-white text-xs font-semibold hover:bg-[#10372B] shrink-0"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Retry
                </button>
              </div>
            ) : (
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                {previewTutorials.map((tut) => (
                  <article
                    key={tut.id}
                    className="bg-white border border-[#242D2A]/12 rounded-xl overflow-hidden flex flex-col"
                  >
                    <div className="aspect-[16/10] bg-[#F5EBDD] overflow-hidden">
                      <SafeImage
                        src={tut.image}
                        alt={tut.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex items-center gap-2 text-xs text-[#242D2A]/65">
                        <span className="font-medium text-[#174C3C]">{tut.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>{tut.difficulty}</span>
                        <span aria-hidden="true">·</span>
                        <span>{tut.readingTime}</span>
                      </div>
                      <h3 className="mt-2 font-display font-bold text-lg text-[#242D2A]">
                        {tut.title}
                      </h3>
                      <p className="mt-2 text-sm text-[#242D2A]/75 leading-relaxed flex-1">
                        {tut.summary}
                      </p>
                      <Link
                        to={`/learning?lesson=${tut.slug || tut.id}`}
                        className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#174C3C] hover:text-[#E99A43] transition-colors"
                      >
                        Read Guide
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Fictional Demo Testimonials */}
      <section className="bg-white py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <p className="text-xs font-semibold text-[#174C3C]">Illustrative Vendor Stories</p>
              <h2 className="mt-2 font-display font-bold text-3xl text-[#242D2A]">
                Voices from Mira-Bhayandar
              </h2>
            </div>
            <p className="text-xs text-[#242D2A]/60">
              Clearly fictional demonstration stories showing intended impact
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            {MOCK_TESTIMONIALS.map((item) => (
              <blockquote
                key={item.id}
                className="p-6 rounded-xl bg-[#FAF6F0] border border-[#242D2A]/10 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 text-xs font-medium text-[#174C3C]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#E99A43] shrink-0" />
                    <span>{item.beforeAfterOutcome}</span>
                  </div>
                  <p className="mt-4 text-sm text-[#242D2A]/85 leading-relaxed">
                    &ldquo;{item.quote}&rdquo;
                  </p>
                </div>

                <footer className="mt-6 pt-4 border-t border-[#242D2A]/10">
                  <p className="font-display font-bold text-sm text-[#242D2A]">
                    {item.name}
                  </p>
                  <p className="text-xs text-[#242D2A]/65 mt-0.5">
                    {item.businessName} · {item.area}
                  </p>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
