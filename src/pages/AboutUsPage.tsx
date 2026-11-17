import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Compass,
  HandHeart,
  QrCode,
  ShieldCheck,
  Store,
  Target,
} from 'lucide-react';
import { SafeImage } from '../components/common/SafeImage';

export const AboutUsPage: React.FC = () => {
  return (
    <div className="bg-white">
      {/* Intro Hero */}
      <section className="bg-[#FAF6F0] border-b border-[#242D2A]/10 py-14 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6">
            <p className="text-xs font-semibold text-[#174C3C]">About DigiThela</p>
            <h1 className="mt-2 font-display font-bold text-3xl sm:text-5xl text-[#242D2A] leading-tight text-balance">
              Bridging Mira-Bhayandar&apos;s Street Vendors to the Digital Economy.
            </h1>
            <p className="mt-4 text-base text-[#242D2A]/80 leading-relaxed">
              DigiThela is a community-focused vendor empowerment platform created to help local hawkers, fruit sellers, chaat stalls, flower vendors, and neighborhood shops build an online presence and adopt safe digital payments.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/explore"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#174C3C] text-white text-sm font-semibold hover:bg-[#10372B] transition-colors"
              >
                Explore Local Vendors
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/learning"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#F5EBDD] text-[#174C3C] text-sm font-semibold hover:bg-[#E99A43] hover:text-[#242D2A] transition-colors"
              >
                Visit Learning Centre
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="aspect-[16/10] rounded-2xl overflow-hidden border border-[#242D2A]/12 bg-[#F5EBDD]">
              <SafeImage
                src="/src/assets/images/learning_digital_payments_1794857947455.jpg"
                alt="Local Indian shopkeeper displaying a smartphone and QR standee"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Problem Statement & Objectives */}
      <section className="py-16 border-b border-[#242D2A]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-6 p-7 rounded-2xl bg-[#FAF6F0] border border-[#242D2A]/10">
            <p className="text-xs font-semibold text-[#174C3C]">01. The Challenge</p>
            <h2 className="mt-2 font-display font-bold text-2xl text-[#242D2A]">
              Problem Statement
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#242D2A]/80 leading-relaxed">
              Street vendors and small-scale hawkers in Mira-Bhayandar form the backbone of daily neighborhood convenience. Yet many remain excluded from the cashless economy due to limited familiarity with digital payment tools, fear of online scams, and lack of a simple online storefront.
            </p>
            <p className="mt-3 text-sm sm:text-base text-[#242D2A]/80 leading-relaxed">
              When residents carry less cash or search online for everyday goods, unrepresented vendors lose potential buyers and repeat neighborhood orders.
            </p>
          </div>

          <div className="lg:col-span-6 p-7 rounded-2xl bg-white border border-[#242D2A]/12">
            <p className="text-xs font-semibold text-[#174C3C]">02. What We Aim to Solve</p>
            <h2 className="mt-2 font-display font-bold text-2xl text-[#242D2A]">
              Project Objectives
            </h2>
            <ul className="mt-4 space-y-3 text-sm sm:text-base text-[#242D2A]/80">
              <li className="flex items-start gap-3">
                <Target className="w-5 h-5 text-[#E99A43] shrink-0 mt-0.5" />
                <span>Give every street vendor a simple, searchable digital business profile with transparent Rupee pricing.</span>
              </li>
              <li className="flex items-start gap-3">
                <QrCode className="w-5 h-5 text-[#E99A43] shrink-0 mt-0.5" />
                <span>Encourage safe UPI QR payment readiness with clear educational guides in plain language.</span>
              </li>
              <li className="flex items-start gap-3">
                <Store className="w-5 h-5 text-[#E99A43] shrink-0 mt-0.5" />
                <span>Connect Mira Road, Bhayandar East, Bhayandar West, and Kashimira residents directly with trusted nearby stalls.</span>
              </li>
              <li className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[#E99A43] shrink-0 mt-0.5" />
                <span>Build confidence against fake payment screenshots, collect-request scams, and OTP fraud.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* How DigiThela Helps + Vision + Social Impact */}
      <section className="py-16 bg-[#FAF6F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white border border-[#242D2A]/10">
              <Store className="w-6 h-6 text-[#174C3C]" />
              <h3 className="mt-4 font-display font-bold text-xl text-[#242D2A]">
                How DigiThela Helps Vendors
              </h3>
              <p className="mt-2.5 text-sm text-[#242D2A]/75 leading-relaxed">
                Vendors can register in minutes, manage their product availability from a clean dashboard, showcase a UPI QR code, and learn essential digital habits at their own pace.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-[#242D2A]/10">
              <Compass className="w-6 h-6 text-[#174C3C]" />
              <h3 className="mt-4 font-display font-bold text-xl text-[#242D2A]">
                Our Vision
              </h3>
              <p className="mt-2.5 text-sm text-[#242D2A]/75 leading-relaxed">
                A Mira-Bhayandar where every neighborhood cart, flower seller, tailor, and kirana store participates equally in India&apos;s digital economy without needing complex software or middlemen.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-[#242D2A]/10">
              <HandHeart className="w-6 h-6 text-[#174C3C]" />
              <h3 className="mt-4 font-display font-bold text-xl text-[#242D2A]">
                Intended Social Impact
              </h3>
              <p className="mt-2.5 text-sm text-[#242D2A]/75 leading-relaxed">
                Stronger micro-entrepreneurship, fewer lost cashless sales, safer financial literacy for first-time smartphone users, and deeper community support for hyper-local livelihoods.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
