import React, { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  Heart,
  Loader2,
  MapPin,
  RefreshCw,
  RotateCcw,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { MIRA_BHAYANDAR_AREAS, VENDOR_CATEGORIES } from '../data/mockVendors';
import { VendorCard } from '../components/vendors/VendorCard';
import { ApiClientError, favoritesApi, vendorsApi } from '../services/api';
import { Vendor } from '../types';

type SortOption = 'name-asc' | 'name-desc' | 'category';

export const ExploreVendorsPage: React.FC = () => {
  const { authUser, favoriteVendorIds } = useAppContext();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialCategory = searchParams.get('category') || 'All';
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedArea, setSelectedArea] = useState<string>('All');
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [page, setPage] = useState(1);

  const [vendorsList, setVendorsList] = useState<Vendor[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const paramCat = searchParams.get('category');
    if (paramCat) {
      setSelectedCategory(paramCat);
    }
  }, [searchParams]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setPage(1);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (onlyFavorites && authUser) {
        const favResult = await favoritesApi.list();
        const q = debouncedSearch.toLowerCase();
        const filteredFavs = favResult.favorites
          .map((f) => f.vendor)
          .filter((v) => {
            const matchCat =
              selectedCategory === 'All' || v.category === selectedCategory;
            const matchArea = selectedArea === 'All' || v.area === selectedArea;
            if (!matchCat || !matchArea) return false;
            if (!q) return true;
            return (
              v.businessName.toLowerCase().includes(q) ||
              v.ownerName.toLowerCase().includes(q) ||
              v.description.toLowerCase().includes(q) ||
              v.area.toLowerCase().includes(q)
            );
          })
          .sort((a, b) => {
            if (sortBy === 'name-desc') return b.businessName.localeCompare(a.businessName);
            if (sortBy === 'category') return a.category.localeCompare(b.category);
            return a.businessName.localeCompare(b.businessName);
          });

        setVendorsList(filteredFavs);
        setPagination({
          page: 1,
          limit: 100,
          total: filteredFavs.length,
          totalPages: 1,
        });
      } else {
        const res = await vendorsApi.list({
          search: debouncedSearch || undefined,
          category: selectedCategory,
          area: selectedArea,
          sort: sortBy,
          page,
          limit: 12,
        });
        setVendorsList(res.vendors);
        setPagination(res.pagination);
      }
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : 'Unable to load local vendors from server.'
      );
    } finally {
      setLoading(false);
    }
  }, [
    authUser,
    debouncedSearch,
    onlyFavorites,
    page,
    selectedArea,
    selectedCategory,
    sortBy,
  ]);

  useEffect(() => {
    void fetchVendors();
  }, [fetchVendors]);

  // Keep favorited list synchronized if a user un-favorites while viewing Saved Favorites
  useEffect(() => {
    if (onlyFavorites) {
      setVendorsList((prev) =>
        prev.filter((v) => favoriteVendorIds.includes(v.id))
      );
    }
  }, [favoriteVendorIds, onlyFavorites]);

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setPage(1);
    if (cat === 'All') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', cat);
    }
    setSearchParams(searchParams, { replace: true });
  };

  const resetFilters = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setSelectedCategory('All');
    setSelectedArea('All');
    setSortBy('name-asc');
    setOnlyFavorites(false);
    setPage(1);
    setSearchParams({}, { replace: true });
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedCategory !== 'All' ||
    selectedArea !== 'All' ||
    onlyFavorites;

  return (
    <div className="bg-[#FAF6F0] min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <section className="bg-white border-b border-[#242D2A]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-[#174C3C]">
                Mira-Bhayandar Local Directory
              </p>
              <h1 className="mt-1.5 font-display font-bold text-3xl sm:text-4xl text-[#242D2A]">
                Explore Local Vendors
              </h1>
              <p className="mt-2 text-sm sm:text-base text-[#242D2A]/75 max-w-2xl">
                Search by business name or product—such as mangoes, vada pav, toor dal, or cotton kurtis—across Mira Road and Bhayandar.
              </p>
            </div>
            <Link
              to="/register"
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-[#E99A43] text-[#242D2A] text-sm font-semibold hover:bg-[#D4822A] hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              List Your Stall
            </Link>
          </div>

          {/* Search & Dropdown Controls */}
          <div className="mt-7 grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-6 relative">
              <Search className="w-4 h-4 text-[#242D2A]/50 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search vendor name or product (e.g., Mangoes, Vada Pav, Kurti)..."
                aria-label="Search vendors or products"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FAF6F0] border border-[#242D2A]/15 text-sm text-[#242D2A] placeholder:text-[#242D2A]/50 focus:bg-white focus:border-[#174C3C] focus:outline-none transition-colors"
              />
            </div>

            <div className="md:col-span-3 relative">
              <MapPin className="w-4 h-4 text-[#174C3C] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={selectedArea}
                onChange={(e) => {
                  setSelectedArea(e.target.value);
                  setPage(1);
                }}
                aria-label="Filter by Mira-Bhayandar area"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FAF6F0] border border-[#242D2A]/15 text-sm text-[#242D2A] focus:bg-white focus:border-[#174C3C] focus:outline-none transition-colors"
              >
                <option value="All">All Mira-Bhayandar Areas</option>
                {MIRA_BHAYANDAR_AREAS.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3 relative">
              <SlidersHorizontal className="w-4 h-4 text-[#174C3C] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as SortOption);
                  setPage(1);
                }}
                aria-label="Sort vendors"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FAF6F0] border border-[#242D2A]/15 text-sm text-[#242D2A] focus:bg-white focus:border-[#174C3C] focus:outline-none transition-colors"
              >
                <option value="name-asc">Sort: Business Name (A–Z)</option>
                <option value="name-desc">Sort: Business Name (Z–A)</option>
                <option value="category">Sort: Category</option>
              </select>
            </div>
          </div>

          {/* Category Filter Buttons */}
          <div className="mt-5 flex items-center gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => handleCategoryChange('All')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                selectedCategory === 'All'
                  ? 'bg-[#174C3C] text-white'
                  : 'bg-[#FAF6F0] text-[#242D2A]/80 hover:bg-[#F5EBDD]'
              }`}
            >
              All Categories
            </button>
            {VENDOR_CATEGORIES.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => handleCategoryChange(category)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                  selectedCategory === category
                    ? 'bg-[#174C3C] text-white'
                    : 'bg-[#FAF6F0] text-[#242D2A]/80 hover:bg-[#F5EBDD]'
                }`}
              >
                {category}
              </button>
            ))}
            {authUser && (
              <button
                type="button"
                onClick={() => {
                  setOnlyFavorites((prev) => !prev);
                  setPage(1);
                }}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                  onlyFavorites
                    ? 'bg-[#E99A43] text-[#242D2A]'
                    : 'bg-[#FAF6F0] text-[#242D2A]/80 hover:bg-[#F5EBDD]'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-current' : ''}`} />
                Saved Favorites ({favoriteVendorIds.length})
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Results Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <p className="text-sm text-[#242D2A]/75 tabular-nums">
            Showing <span className="font-semibold text-[#242D2A]">{vendorsList.length}</span>{' '}
            {vendorsList.length === 1 ? 'vendor' : 'vendors'}
            {pagination.total > vendorsList.length && ` of ${pagination.total}`}
            {selectedCategory !== 'All' && (
              <>
                {' '}
                in <span className="font-semibold text-[#174C3C]">{selectedCategory}</span>
              </>
            )}
            {selectedArea !== 'All' && (
              <>
                {' '}
                near <span className="font-semibold text-[#174C3C]">{selectedArea}</span>
              </>
            )}
          </p>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#174C3C] hover:text-[#E99A43] transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Filters
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 gap-2.5 text-sm text-[#242D2A]/75">
            <Loader2 className="w-5 h-5 animate-spin text-[#174C3C]" />
            Loading Mira-Bhayandar vendors...
          </div>
        ) : error ? (
          <div className="bg-white border border-[#E99A43]/40 rounded-2xl p-8 text-center max-w-lg mx-auto">
            <AlertTriangle className="w-8 h-8 text-[#B96614] mx-auto" />
            <p className="mt-3 font-display font-bold text-lg text-[#242D2A]">
              Unable to load vendor directory
            </p>
            <p className="mt-1.5 text-sm text-[#242D2A]/70 leading-relaxed">{error}</p>
            <button
              type="button"
              onClick={() => void fetchVendors()}
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#174C3C] text-white text-sm font-semibold hover:bg-[#10372B] transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Retry Loading
            </button>
          </div>
        ) : vendorsList.length === 0 ? (
          <div className="bg-white border border-[#242D2A]/12 rounded-2xl p-12 text-center max-w-lg mx-auto">
            <p className="font-display font-bold text-xl text-[#242D2A]">
              No matching vendors found
            </p>
            <p className="mt-2 text-sm text-[#242D2A]/70 leading-relaxed">
              {onlyFavorites
                ? 'You have not saved any matching favorite stalls yet.'
                : 'Try searching for a different product keyword, switching the area filter, or viewing all Mira-Bhayandar categories.'}
            </p>
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={resetFilters}
                className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#174C3C] text-white text-sm font-semibold hover:bg-[#10372B] transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Show All Vendors
              </button>
            ) : (
              <Link
                to="/register"
                className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#174C3C] text-white text-sm font-semibold hover:bg-[#10372B] transition-colors"
              >
                Register First Vendor
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {vendorsList.map((vendor) => (
                <VendorCard key={vendor.id} vendor={vendor} />
              ))}
            </div>

            {pagination.totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-3">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-4 py-2 rounded-lg border border-[#242D2A]/15 bg-white text-xs font-semibold text-[#242D2A] disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-xs font-medium text-[#242D2A]/75 tabular-nums">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-4 py-2 rounded-lg border border-[#242D2A]/15 bg-white text-xs font-semibold text-[#242D2A] disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};
