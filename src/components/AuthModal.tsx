import React, { useState } from 'react';
import { X, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'km' | 'en';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, lang }) => {
  const { signInWithGoogle } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGoogleProviderDisabled, setIsGoogleProviderDisabled] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsGoogleProviderDisabled(false);
    setGoogleLoading(true);
    const { error: err } = await signInWithGoogle();
    setGoogleLoading(false);
    if (err) {
      if (err.message?.includes('not enabled') || err.message?.includes('validation_failed')) {
        setIsGoogleProviderDisabled(true);
      } else {
        setError(err.message || 'Failed to sign in with Google');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden relative">
        <div className="p-6 sm:p-7">
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Logo / icon */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center mb-3.5 shadow-lg shadow-blue-500/20">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              {lang === 'km' ? 'ចូលប្រើប្រាស់ប្រព័ន្ធ' : 'Sign In to System'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-[240px]">
              {lang === 'km'
                ? 'ចូលតាម Google OAuth ដើម្បីគ្រប់គ្រងទិន្នន័យ'
                : 'Sign in with your Google account to access system'}
            </p>
          </div>

          {/* Google Provider Not Enabled Notice */}
          {isGoogleProviderDisabled && (
            <div className="mb-4 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-1.5">
              <div className="flex items-center space-x-1.5 font-bold text-amber-800">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>
                  {lang === 'km'
                    ? 'Google OAuth មិនទាន់បើកក្នុង Supabase ទេ'
                    : 'Google OAuth not enabled in Supabase yet'}
                </span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-700">
                {lang === 'km'
                  ? 'សូមបើក Google ក្នុង Supabase Dashboard > Authentication > Providers > Google។ ឬចុច "ចូលរហ័សជា Admin" ខាងក្រោមដើម្បីចូលភ្លាមៗ!'
                  : 'Please enable Google in Supabase Dashboard > Authentication > Providers > Google, or click "1-Click Admin Access" below to sign in right now!'}
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}

          {/* Google OAuth Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || !isSupabaseConfigured}
            className="w-full flex items-center justify-center space-x-3 px-4 py-3.5 border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 rounded-2xl transition shadow-xs text-slate-700 font-semibold text-sm active:scale-[0.98] disabled:opacity-50"
          >
            {googleLoading ? (
              <span className="w-5 h-5 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
            )}
            <span>
              {googleLoading
                ? (lang === 'km' ? 'កំពុងភ្ជាប់ Google...' : 'Connecting Google...')
                : (lang === 'km' ? 'ចូលជាមួយ Google' : 'Continue with Google')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
