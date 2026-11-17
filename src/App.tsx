/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { PublicLayout } from './components/layout/PublicLayout';
import { ToastBanner } from './components/common/ToastBanner';
import { HomePage } from './pages/HomePage';
import { ExploreVendorsPage } from './pages/ExploreVendorsPage';
import { VendorDetailsPage } from './pages/VendorDetailsPage';
import { VendorRegisterPage } from './pages/VendorRegisterPage';
import { VendorDashboardPage } from './pages/VendorDashboardPage';
import { LearningCentrePage } from './pages/LearningCentrePage';
import { AboutUsPage } from './pages/AboutUsPage';
import { AuthPage } from './pages/AuthPage';

const ScrollToTop: React.FC = () => {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);
  return null;
};

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <ScrollToTop />
        <ToastBanner />
        <Routes>
          <Route
            path="/"
            element={
              <PublicLayout>
                <HomePage />
              </PublicLayout>
            }
          />
          <Route
            path="/explore"
            element={
              <PublicLayout>
                <ExploreVendorsPage />
              </PublicLayout>
            }
          />
          <Route
            path="/vendors/:id"
            element={
              <PublicLayout>
                <VendorDetailsPage />
              </PublicLayout>
            }
          />
          <Route
            path="/register"
            element={
              <PublicLayout>
                <VendorRegisterPage />
              </PublicLayout>
            }
          />
          <Route
            path="/learning"
            element={
              <PublicLayout>
                <LearningCentrePage />
              </PublicLayout>
            }
          />
          <Route
            path="/about"
            element={
              <PublicLayout>
                <AboutUsPage />
              </PublicLayout>
            }
          />
          <Route
            path="/auth"
            element={
              <PublicLayout>
                <AuthPage />
              </PublicLayout>
            }
          />
          {/* Dedicated Vendor Dashboard Layout (own sidebar, no public navbar/footer) */}
          <Route path="/dashboard" element={<VendorDashboardPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
