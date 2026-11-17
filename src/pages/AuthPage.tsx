import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2, ShoppingBag, Store } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { ApiClientError } from '../services/api';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    loginUser,
    registerCustomerAccount,
    registerVendorAccount,
    showToast,
  } = useAppContext();

  const [role, setRole] = useState<'customer' | 'vendor'>('vendor');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const parseIdentifierFields = (rawValue: string) => {
    const trimmed = rawValue.trim();
    if (trimmed.includes('@')) {
      return { email: trimmed.toLowerCase(), mobileNumber: undefined };
    }
    const compact = trimmed.replace(/[\s-]/g, '');
    return { email: undefined, mobileNumber: compact };
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedContact = phoneOrEmail.trim();
    if (mode === 'signup' && name.trim().length < 2) {
      setError('Please enter your full name (at least 2 characters).');
      return;
    }
    if (trimmedContact.length < 5) {
      setError('Please enter a valid 10-digit mobile number or email address.');
      return;
    }

    const { email, mobileNumber } = parseIdentifierFields(trimmedContact);
    if (mode === 'signup') {
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError('Please enter a valid email address.');
        return;
      }
      if (mobileNumber && !/^(\+91)?[6-9]\d{9}$/.test(mobileNumber)) {
        setError('Enter a valid 10-digit Indian mobile number (e.g., 9820000101).');
        return;
      }
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'login') {
        const result = await loginUser(trimmedContact, password);
        if (result.user.role === 'vendor') {
          navigate(result.vendorProfile ? '/dashboard' : '/register');
        } else {
          navigate('/explore');
        }
      } else if (role === 'vendor') {
        await registerVendorAccount({
          name: name.trim(),
          email,
          mobileNumber,
          password,
        });
        navigate('/register');
      } else {
        await registerCustomerAccount({
          name: name.trim(),
          email,
          mobileNumber,
          password,
        });
        navigate('/explore');
      }
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : 'Authentication failed. Please try again.';
      setError(message);
      showToast(message, 'warning');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#FAF6F0] min-h-[calc(100vh-4rem)] py-12 sm:py-16 px-4">
      <div className="max-w-lg mx-auto bg-white border border-[#242D2A]/12 rounded-2xl p-6 sm:p-8">
        <div className="text-center">
          <p className="text-xs font-semibold text-[#174C3C]">
            DigiThela Account Access
          </p>
          <h1 className="mt-1.5 font-display font-bold text-2xl sm:text-3xl text-[#242D2A]">
            {mode === 'login' ? 'Welcome Back to DigiThela' : 'Create Your Account'}
          </h1>
          <p className="mt-1.5 text-sm text-[#242D2A]/70">
            Sign in or register as a Customer or Vendor in Mira-Bhayandar.
          </p>
        </div>

        {/* Role Selector */}
        <div className="mt-6 grid grid-cols-2 gap-2 p-1 bg-[#FAF6F0] rounded-xl border border-[#242D2A]/10">
          <button
            type="button"
            onClick={() => {
              setRole('vendor');
              setError('');
            }}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              role === 'vendor'
                ? 'bg-[#174C3C] text-white'
                : 'text-[#242D2A]/75 hover:text-[#242D2A]'
            }`}
          >
            <Store className="w-4 h-4" />
            Vendor
          </button>
          <button
            type="button"
            onClick={() => {
              setRole('customer');
              setError('');
            }}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              role === 'customer'
                ? 'bg-[#174C3C] text-white'
                : 'text-[#242D2A]/75 hover:text-[#242D2A]'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            Customer
          </button>
        </div>

        {/* Login / Sign Up Mode Toggle */}
        <div className="mt-5 flex items-center justify-center gap-6 text-sm border-b border-[#242D2A]/10">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError('');
            }}
            className={`pb-2.5 font-semibold border-b-2 transition-colors ${
              mode === 'login'
                ? 'text-[#174C3C] border-[#E99A43]'
                : 'text-[#242D2A]/60 border-transparent hover:text-[#242D2A]'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setError('');
            }}
            className={`pb-2.5 font-semibold border-b-2 transition-colors ${
              mode === 'signup'
                ? 'text-[#174C3C] border-[#E99A43]'
                : 'text-[#242D2A]/60 border-transparent hover:text-[#242D2A]'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleFormSubmit} noValidate className="mt-6 space-y-4">
          {mode === 'signup' && (
            <div>
              <label htmlFor="auth-name" className="block text-sm font-medium text-[#242D2A] mb-1">
                Full Name
              </label>
              <input
                id="auth-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={role === 'vendor' ? 'e.g., Ramesh Patil' : 'e.g., Rohan Kulkarni'}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F0] border border-[#242D2A]/15 text-sm focus:bg-white focus:border-[#174C3C] focus:outline-none"
              />
            </div>
          )}

          <div>
            <label htmlFor="auth-contact" className="block text-sm font-medium text-[#242D2A] mb-1">
              Mobile Number or Email
            </label>
            <input
              id="auth-contact"
              type="text"
              value={phoneOrEmail}
              onChange={(e) => setPhoneOrEmail(e.target.value)}
              placeholder="e.g., 9820000101 or vendor@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F0] border border-[#242D2A]/15 text-sm focus:bg-white focus:border-[#174C3C] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="auth-pass" className="block text-sm font-medium text-[#242D2A] mb-1">
              Password
            </label>
            <input
              id="auth-pass"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F0] border border-[#242D2A]/15 text-sm focus:bg-white focus:border-[#174C3C] focus:outline-none"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#174C3C] text-white text-sm font-semibold hover:bg-[#10372B] disabled:opacity-60 transition-colors"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {mode === 'login' ? 'Signing In...' : 'Creating Account...'}
              </>
            ) : (
              <>
                {mode === 'login'
                  ? `Sign In as ${role === 'vendor' ? 'Vendor' : 'Customer'}`
                  : `Create ${role === 'vendor' ? 'Vendor' : 'Customer'} Account`}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Helpful Next Steps */}
        <div className="mt-6 pt-6 border-t border-[#242D2A]/10 space-y-2.5">
          <p className="text-xs text-center text-[#242D2A]/65">
            New vendor onboarding or public browsing:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <Link
              to="/register"
              className="text-center px-3.5 py-2.5 rounded-xl bg-[#F5EBDD] text-[#174C3C] text-xs font-semibold hover:bg-[#E99A43] hover:text-[#242D2A] transition-colors"
            >
              Register Stall Profile
            </Link>
            <Link
              to="/explore"
              className="text-center px-3.5 py-2.5 rounded-xl border border-[#242D2A]/15 text-[#242D2A] text-xs font-semibold hover:bg-[#FAF6F0] transition-colors"
            >
              Browse Local Vendors
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
