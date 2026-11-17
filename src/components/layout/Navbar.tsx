import React, { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

export const Navbar: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { authUser, logoutUser } = useAppContext();
  const location = useLocation();
  const navigate = useNavigate();

  const handleHowItWorksClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setMobileOpen(false);
    if (location.pathname === '/') {
      const el = document.getElementById('how-it-works');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    navigate('/#how-it-works');
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium whitespace-nowrap shrink-0 transition-colors duration-150 py-1 border-b-2 ${
      isActive
        ? 'text-[#174C3C] border-[#E99A43]'
        : 'text-[#242D2A]/80 border-transparent hover:text-[#174C3C] hover:border-[#174C3C]/30'
    }`;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-[#242D2A]/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark (single line, clean) */}
        <Link
          to="/"
          className="flex items-center gap-2.5 whitespace-nowrap shrink-0 group"
          onClick={() => setMobileOpen(false)}
        >
          <span className="w-8 h-8 rounded-lg bg-[#174C3C] text-[#F5EBDD] flex items-center justify-center font-display font-bold text-base tracking-tight group-hover:bg-[#10372B] transition-colors">
            D
          </span>
          <span className="font-display font-bold text-xl tracking-tight text-[#174C3C] whitespace-nowrap shrink-0">
            DigiThela
          </span>
        </Link>

        {/* Zone 2: 5 concise single-line navigation links */}
        <nav className="hidden lg:flex items-center gap-7" aria-label="Primary Navigation">
          <NavLink to="/" end className={navLinkClass}>
            Home
          </NavLink>
          <NavLink to="/explore" className={navLinkClass}>
            Explore Vendors
          </NavLink>
          <a
            href="/#how-it-works"
            onClick={handleHowItWorksClick}
            className="text-sm font-medium whitespace-nowrap shrink-0 transition-colors duration-150 py-1 border-b-2 text-[#242D2A]/80 border-transparent hover:text-[#174C3C] hover:border-[#174C3C]/30"
          >
            How It Works
          </a>
          <NavLink to="/learning" className={navLinkClass}>
            Digital Learning
          </NavLink>
          <NavLink to="/about" className={navLinkClass}>
            About Us
          </NavLink>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="hidden lg:flex items-center gap-3 shrink-0">
          {authUser?.role === 'vendor' ? (
            <Link
              to="/dashboard"
              className="px-4 py-2 rounded-lg bg-[#174C3C] text-white text-sm font-medium hover:bg-[#10372B] transition-colors whitespace-nowrap shrink-0"
            >
              Vendor Dashboard
            </Link>
          ) : authUser ? (
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-medium text-[#242D2A]/75 whitespace-nowrap">
                Hi, {authUser.name.split(' ')[0]}
              </span>
              <button
                type="button"
                onClick={() => {
                  void logoutUser();
                }}
                className="px-3.5 py-2 rounded-lg border border-[#242D2A]/15 text-[#242D2A] text-sm font-medium hover:bg-[#F5EBDD] transition-colors whitespace-nowrap shrink-0"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              to="/auth"
              className="px-4 py-2 rounded-lg bg-[#174C3C] text-white text-sm font-medium hover:bg-[#10372B] transition-colors whitespace-nowrap shrink-0"
            >
              Login / Sign Up
            </Link>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileOpen}
          className="lg:hidden p-2.5 rounded-lg text-[#242D2A] hover:bg-[#F5EBDD]/60 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile navigation drawer */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-b border-[#242D2A]/10 px-4 py-4 space-y-1">
          <NavLink
            to="/"
            end
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `block px-3 py-2.5 rounded-lg text-sm font-medium ${
                isActive ? 'bg-[#F5EBDD] text-[#174C3C]' : 'text-[#242D2A] hover:bg-[#FAF6F0]'
              }`
            }
          >
            Home
          </NavLink>
          <NavLink
            to="/explore"
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `block px-3 py-2.5 rounded-lg text-sm font-medium ${
                isActive ? 'bg-[#F5EBDD] text-[#174C3C]' : 'text-[#242D2A] hover:bg-[#FAF6F0]'
              }`
            }
          >
            Explore Vendors
          </NavLink>
          <a
            href="/#how-it-works"
            onClick={handleHowItWorksClick}
            className="block px-3 py-2.5 rounded-lg text-sm font-medium text-[#242D2A] hover:bg-[#FAF6F0]"
          >
            How It Works
          </a>
          <NavLink
            to="/learning"
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `block px-3 py-2.5 rounded-lg text-sm font-medium ${
                isActive ? 'bg-[#F5EBDD] text-[#174C3C]' : 'text-[#242D2A] hover:bg-[#FAF6F0]'
              }`
            }
          >
            Digital Learning
          </NavLink>
          <NavLink
            to="/about"
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `block px-3 py-2.5 rounded-lg text-sm font-medium ${
                isActive ? 'bg-[#F5EBDD] text-[#174C3C]' : 'text-[#242D2A] hover:bg-[#FAF6F0]'
              }`
            }
          >
            About Us
          </NavLink>
          <div className="pt-2 border-t border-[#242D2A]/10 flex flex-col gap-2">
            <Link
              to="/register"
              onClick={() => setMobileOpen(false)}
              className="w-full text-center px-4 py-2.5 rounded-lg border border-[#174C3C] text-[#174C3C] text-sm font-medium"
            >
              Register Your Business
            </Link>
            {authUser?.role === 'vendor' ? (
              <Link
                to="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="w-full text-center px-4 py-2.5 rounded-lg bg-[#174C3C] text-white text-sm font-medium"
              >
                Vendor Dashboard
              </Link>
            ) : authUser ? (
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  void logoutUser();
                }}
                className="w-full text-center px-4 py-2.5 rounded-lg bg-[#174C3C] text-white text-sm font-medium"
              >
                Logout ({authUser.name.split(' ')[0]})
              </button>
            ) : (
              <Link
                to="/auth"
                onClick={() => setMobileOpen(false)}
                className="w-full text-center px-4 py-2.5 rounded-lg bg-[#174C3C] text-white text-sm font-medium"
              >
                Login / Sign Up
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
