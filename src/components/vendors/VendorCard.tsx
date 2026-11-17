import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Heart, Loader2, MapPin } from 'lucide-react';
import { Vendor } from '../../types';
import { SafeImage } from '../common/SafeImage';
import { useAppContext } from '../../context/AppContext';

interface VendorCardProps {
  vendor: Vendor;
}

export const VendorCard: React.FC<VendorCardProps> = ({ vendor }) => {
  const { favoriteVendorIds, toggleFavoriteVendor, showToast } = useAppContext();
  const [toggling, setToggling] = useState(false);

  const isFavorited = favoriteVendorIds.includes(vendor.id);
  const availableCount = vendor.products.filter((p) => p.available).length;
  const minPrice =
    vendor.products.length > 0
      ? Math.min(...vendor.products.map((p) => p.price))
      : null;

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (toggling) return;
    setToggling(true);
    try {
      await toggleFavoriteVendor(vendor.id);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Unable to update favorites.',
        'warning'
      );
    } finally {
      setToggling(false);
    }
  };

  return (
    <article className="group bg-white border border-[#242D2A]/12 rounded-xl overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <Link to={`/vendors/${vendor.id}`} className="block aspect-[4/3] overflow-hidden bg-[#FAF6F0]">
        <SafeImage
          src={vendor.coverImage}
          alt={`${vendor.businessName} in ${vendor.area}`}
          fallbackLabel={vendor.businessName}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </Link>

      <div className="p-5 flex-1 flex flex-col">
        {/* Zero-pill unboxed metadata + favorite toggle */}
        <div className="flex items-center justify-between gap-2 text-xs font-medium text-[#174C3C]">
          <div className="flex items-center gap-2 min-w-0">
            <span className="truncate">{vendor.category}</span>
            <span aria-hidden="true" className="text-[#242D2A]/30">·</span>
            <span className="inline-flex items-center gap-1 text-[#242D2A]/70 truncate">
              <MapPin className="w-3.5 h-3.5 text-[#E99A43] shrink-0" />
              <span className="truncate">{vendor.area}</span>
            </span>
          </div>

          <button
            type="button"
            onClick={handleToggleFavorite}
            disabled={toggling}
            aria-label={isFavorited ? `Remove ${vendor.businessName} from favorites` : `Save ${vendor.businessName} to favorites`}
            className={`p-1.5 rounded-lg transition-colors shrink-0 ${
              isFavorited
                ? 'text-[#D4822A] bg-[#F5EBDD]'
                : 'text-[#242D2A]/45 hover:text-[#174C3C] hover:bg-[#FAF6F0]'
            }`}
          >
            {toggling ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
            )}
          </button>
        </div>

        <h3 className="mt-2 font-display font-bold text-lg text-[#242D2A] leading-snug">
          <Link to={`/vendors/${vendor.id}`} className="hover:text-[#174C3C] transition-colors">
            {vendor.businessName}
          </Link>
        </h3>

        <p className="mt-2 text-sm text-[#242D2A]/75 leading-relaxed line-clamp-2 flex-1">
          {vendor.description}
        </p>

        <div className="mt-4 pt-4 border-t border-[#242D2A]/10 flex items-center justify-between gap-3">
          <div className="text-xs text-[#242D2A]/70 tabular-nums">
            <span className="font-semibold text-[#242D2A]">{availableCount}</span> items
            {minPrice !== null && (
              <>
                <span aria-hidden="true" className="mx-1.5">·</span>
                From <span className="font-semibold text-[#174C3C]">₹{minPrice}</span>
              </>
            )}
          </div>

          <Link
            to={`/vendors/${vendor.id}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#F5EBDD] text-[#174C3C] text-xs font-semibold hover:bg-[#E99A43] hover:text-[#242D2A] transition-colors whitespace-nowrap shrink-0"
          >
            View Details
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
};
