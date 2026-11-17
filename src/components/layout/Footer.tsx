import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#174C3C] text-white border-t border-[#10372B]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand overview */}
          <div className="space-y-4">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-[#E99A43] text-[#242D2A] flex items-center justify-center font-display font-bold text-base">
                D
              </span>
              <span className="font-display font-bold text-xl tracking-tight text-white">
                DigiThela
              </span>
            </Link>
            <p className="text-sm text-[#F5EBDD]/85 leading-relaxed">
              Empowering street vendors and neighborhood small businesses in Mira-Bhayandar with clear online profiles, digital payment literacy, and local discovery.
            </p>
          </div>

          {/* Explore */}
          <div>
            <h3 className="font-display font-semibold text-sm text-[#E99A43] mb-4">
              Marketplace
            </h3>
            <ul className="space-y-2.5 text-sm text-[#F5EBDD]/85">
              <li>
                <Link to="/explore" className="hover:text-white transition-colors">
                  Explore Local Vendors
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-white transition-colors">
                  Register Your Business
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-white transition-colors">
                  Vendor Dashboard (Demo)
                </Link>
              </li>
              <li>
                <Link to="/auth" className="hover:text-white transition-colors">
                  Login / Sign Up
                </Link>
              </li>
            </ul>
          </div>

          {/* Learning & Mission */}
          <div>
            <h3 className="font-display font-semibold text-sm text-[#E99A43] mb-4">
              Resources & Mission
            </h3>
            <ul className="space-y-2.5 text-sm text-[#F5EBDD]/85">
              <li>
                <Link to="/learning" className="hover:text-white transition-colors">
                  Digital Learning Centre
                </Link>
              </li>
              <li>
                <Link to="/learning?category=Digital+Payments" className="hover:text-white transition-colors">
                  UPI & QR Payment Guides
                </Link>
              </li>
              <li>
                <Link to="/learning?category=Digital+Safety" className="hover:text-white transition-colors">
                  Spotting UPI Scams
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition-colors">
                  About DigiThela
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Information (Fictional Demo) */}
          <div>
            <h3 className="font-display font-semibold text-sm text-[#E99A43] mb-4">
              Community Support (Demo)
            </h3>
            <ul className="space-y-3 text-sm text-[#F5EBDD]/85">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#E99A43] shrink-0 mt-0.5" />
                <span>Mira-Bhayandar Local Vendor Support Desk, Thane 401107</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#E99A43] shrink-0" />
                <span className="tabular-nums">+91 22 2810 0000 (Demo)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#E99A43] shrink-0" />
                <span>hello@digithela-demo.in</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#F5EBDD]/75">
          <p>
            © {new Date().getFullYear()} DigiThela. Frontend demonstration prototype with fictional vendor profiles and illustrative metrics.
          </p>
          <p>Built for Mira-Bhayandar’s local small-business community.</p>
        </div>
      </div>
    </footer>
  );
};
