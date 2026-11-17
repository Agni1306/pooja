import React from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-white text-[#242D2A]">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
};
