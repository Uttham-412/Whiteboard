import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../ui/Toast';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Key, ArrowRight, AlertTriangle } from 'lucide-react';
import { firebaseInitError } from '../../services/firebase';
import { ProductPreviewHero } from './ProductPreviewHero';
import { ConstellationLogo } from '../ui/ConstellationLogo';
import { AiAtmosphere } from '../ui/AiAtmosphere';

export const AuthPage: React.FC = () => {
  const { login, register, loginWithGoogle, error, clearError, rememberMe, setRememberMe } = useAuthStore();
  const { toast } = useToast();
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const [forgotPassword, setForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  useEffect(() => {
    if (error) {
      toast("Authentication Error", error, "error");
      clearError();
    }
  }, [error, toast, clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast("Validation Error", "Please fill in all required fields.", "error");
      return;
    }
    
    setSubmitting(true);
    try {
      if (isSignUp) {
        if (!displayName) {
          toast("Validation Error", "Name is required for registration.", "error");
          setSubmitting(false);
          return;
        }
        await register(email, displayName, password);
        toast("Welcome to CollabCanvas Pro!", "Your account has been created successfully.", "success");
      } else {
        await login(email, password);
        toast("Success", "Authenticated via Firebase.", "success");
      }
    } catch (err) {
      // Error toast handled by authStore/useEffect
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setSubmitting(true);
    try {
      await loginWithGoogle();
      toast("Welcome!", "Signed in with Google Firebase.", "success");
    } catch (err) {
      // Handled by authStore/useEffect
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      toast("Error", "Please fill in your email address.", "error");
      return;
    }
    setSubmitting(true);
    try {
      await useAuthStore.getState().resetPassword(forgotEmail);
      toast("Reset Link Sent", `Password reset email sent to ${forgotEmail}.`, "success");
      setForgotPassword(false);
    } catch (err: any) {
      toast("Reset Error", err.message || "Failed to send reset email.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-[#F8FAFC] flex overflow-hidden select-none relative">
      {/* Background AI Atmosphere particle constellation */}
      <AiAtmosphere />

      {/* LEFT COLUMN: Authentication Form */}
      <div className="w-full lg:w-[480px] xl:w-[520px] bg-white/95 backdrop-blur-xs border-r border-[#E5E7EB] p-8 lg:p-12 flex flex-col justify-between overflow-y-auto z-10">
        <div>
          {/* Header Brand Logo: Constellation Logo */}
          <div className="flex items-center space-x-3 mb-10">
            <ConstellationLogo size={36} />
            <span className="text-[18px] font-bold text-[#111827] tracking-tight">CollabCanvas Pro</span>
          </div>

          {/* Form Header */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="text-[32px] font-bold text-[#111827] tracking-tight leading-tight">
              {forgotPassword ? 'Reset password' : isSignUp ? 'Create your account' : 'Welcome back'}
            </h1>
            <p className="text-[16px] text-[#6B7280] font-normal mt-2 leading-relaxed">
              {forgotPassword 
                ? 'Enter your email to receive a password reset link.'
                : isSignUp 
                ? 'Start collaborating with enterprise visual architecture tools.' 
                : 'Sign in to access your team whiteboards and visual architecture.'}
            </p>
          </motion.div>

          {/* Firebase Init Error Alert */}
          {firebaseInitError && (
            <div className="mt-6 p-4 rounded-[10px] bg-red-50 border border-red-200 text-red-700 text-xs flex items-start space-x-3 leading-relaxed">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-red-900">Firebase Configuration Error</div>
                <div>{firebaseInitError}</div>
                <div className="mt-1 text-[11px] text-red-600">Populate your <code>.env</code> file with valid <code>VITE_FIREBASE_*</code> keys.</div>
              </div>
            </div>
          )}

          {/* Form Card Body */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="mt-8"
          >
            {forgotPassword ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-[14px] font-medium text-[#374151] mb-1.5">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                    <input
                      type="email"
                      placeholder="name@company.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full h-11 pl-10 pr-4 bg-white border border-[#D1D5DB] focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] rounded-[8px] text-[14px] text-[#111827] outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-11 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white font-semibold text-[15px] rounded-[8px] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm mt-2"
                >
                  {submitting ? 'Sending Link...' : 'Send Password Reset Link'} <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setForgotPassword(false)}
                  className="w-full text-center text-[14px] font-medium text-[#6B7280] hover:text-[#111827] transition-colors pt-2"
                >
                  Back to login
                </button>
              </form>
            ) : (
              <div className="space-y-5">
                {/* Google Official Button */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={submitting}
                  className="w-full h-11 bg-white hover:bg-slate-50 border border-[#D1D5DB] text-[#374151] font-semibold text-[14px] rounded-[8px] transition-colors flex items-center justify-center gap-3 shadow-sm cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  Continue with Google
                </button>

                {/* Or Divider */}
                <div className="relative flex items-center justify-center my-4">
                  <div className="w-full border-t border-[#E5E7EB]" />
                  <span className="relative px-3 bg-white text-[12px] font-medium text-[#6B7280] uppercase tracking-wider">
                    Or continue with email
                  </span>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {isSignUp && (
                    <div>
                      <label className="block text-[14px] font-medium text-[#374151] mb-1.5">Full name</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                        <input
                          type="text"
                          placeholder="Alex Morgan"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          className="w-full h-11 pl-10 pr-4 bg-white border border-[#D1D5DB] focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] rounded-[8px] text-[14px] text-[#111827] outline-none transition-all"
                          required={isSignUp}
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-[14px] font-medium text-[#374151] mb-1.5">Work email</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                      <input
                        type="email"
                        placeholder="alex@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-11 pl-10 pr-4 bg-white border border-[#D1D5DB] focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] rounded-[8px] text-[14px] text-[#111827] outline-none transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[14px] font-medium text-[#374151] mb-1.5">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full h-11 pl-10 pr-4 bg-white border border-[#D1D5DB] focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] rounded-[8px] text-[14px] text-[#111827] outline-none transition-all"
                        required
                      />
                    </div>
                  </div>

                  {!isSignUp && (
                    <div className="flex items-center justify-between text-[14px] text-[#374151]">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="w-4 h-4 rounded border-[#D1D5DB] text-[#2563EB] focus:ring-[#2563EB]"
                        />
                        <span className="text-[#4B5563]">Remember me</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setForgotPassword(true)}
                        className="text-[#2563EB] hover:text-[#1D4ED8] font-medium transition-colors"
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full h-11 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white font-semibold text-[15px] rounded-[8px] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm mt-2"
                  >
                    {submitting ? 'Authenticating...' : isSignUp ? 'Create Workspace Account' : 'Sign In to Workspace'}
                  </button>
                </form>

                <div className="pt-4 border-t border-[#E5E7EB] text-center text-[14px] text-[#6B7280]">
                  {isSignUp ? (
                    <span>
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => setIsSignUp(false)}
                        className="text-[#2563EB] hover:text-[#1D4ED8] font-semibold transition-colors"
                      >
                        Sign in
                      </button>
                    </span>
                  ) : (
                    <span>
                      Don't have an account?{' '}
                      <button
                        type="button"
                        onClick={() => setIsSignUp(true)}
                        className="text-[#2563EB] hover:text-[#1D4ED8] font-semibold transition-colors"
                      >
                        Create an account
                      </button>
                    </span>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Footer info */}
        <div className="pt-8 text-xs text-[#9CA3AF]">
          &copy; {new Date().getFullYear()} CollabCanvas Pro Inc. All rights reserved.
        </div>
      </div>

      {/* RIGHT COLUMN: Large Live Product Preview Hero */}
      <div className="hidden lg:flex flex-1 relative bg-[#F8FAFC] p-8 lg:p-12 items-center justify-center overflow-hidden">
        <ProductPreviewHero />
      </div>
    </div>
  );
};
