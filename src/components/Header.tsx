import React, { useState, useRef, useEffect } from 'react';
import { Truck, Scale, FileText, CheckCircle2, AlertCircle, RefreshCw, LogIn, LogOut, ShieldCheck, UserCheck } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';
import { CambodiaFlag, USFlag } from './Flags';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  activeTab: 'entry' | 'report';
  setActiveTab: (tab: 'entry' | 'report') => void;
  lang: 'km' | 'en';
  setLang: (lang: 'km' | 'en') => void;
  isRefreshing?: boolean;
  onOpenAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  lang,
  setLang,
  isRefreshing = false,
  onOpenAuth,
}) => {
  const [logoError, setLogoError] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, profile, isAdmin, signOut } = useAuth();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User';
  const avatarLetter = displayName.charAt(0).toUpperCase();
  const roleBadgeClass = isAdmin
    ? 'bg-rose-100 text-rose-700 border-rose-200'
    : 'bg-blue-100 text-blue-700 border-blue-200';
  const roleLabel = isAdmin
    ? lang === 'km' ? 'អ្នកគ្រប់គ្រង' : 'Admin'
    : lang === 'km' ? 'ប្រតិបត្តិករ' : 'Operator';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between py-2.5 md:py-0 md:h-16 gap-2.5">

          {/* Logo & Title */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5 sm:space-x-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden bg-white border border-slate-200/90 shadow-2xs flex items-center justify-center shrink-0">
                {!logoError ? (
                  <img
                    src="/logo.jpg"
                    alt="App Logo"
                    className="w-full h-full object-contain p-0.5"
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white">
                    <Scale className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center space-x-1.5 sm:space-x-2">
                  <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                    {lang === 'km' ? 'ប្រព័ន្ធផ្ទៀងផ្ទាត់ទម្ងន់រថយន្ត' : 'Truck Weight Verification'}
                  </h1>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                    v1.0
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 hidden sm:block">
                  {lang === 'km'
                    ? 'ផ្ទៀងផ្ទាត់ទម្ងន់ទំនិញរវាងឃ្លាំង និងជញ្ជីង (±0.4% Tolerance)'
                    : 'Warehouse vs weighbridge reconciliation'}
                </p>
              </div>
            </div>

            {/* Mobile: avatar or login */}
            <div className="flex items-center space-x-2 md:hidden">
              {!user ? (
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold shadow-2xs"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{lang === 'km' ? 'ចូល' : 'Login'}</span>
                </button>
              ) : (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="w-8 h-8 rounded-full overflow-hidden border-2 border-blue-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm">
                        {avatarLetter}
                      </div>
                    )}
                  </button>
                  {dropdownOpen && <AvatarDropdown name={displayName} email={user.email || ''} roleLabel={roleLabel} roleBadgeClass={roleBadgeClass} isAdmin={isAdmin} onSignOut={() => { signOut(); setDropdownOpen(false); }} lang={lang} />}
                </div>
              )}
              <button
                onClick={() => setLang(lang === 'km' ? 'en' : 'km')}
                className="flex items-center justify-center p-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition shadow-2xs"
              >
                {lang === 'km' ? <CambodiaFlag className="w-[16px] h-[11px]" /> : <USFlag className="w-[16px] h-[11px]" />}
              </button>
            </div>
          </div>

          {/* Nav Tabs & Desktop Controls */}
          <div className="flex items-center justify-between md:justify-end space-x-2 sm:space-x-3 w-full md:w-auto">

            {/* DB status pill */}
            <div
              className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 border border-emerald-200/80 text-emerald-700 shrink-0"
              title={isSupabaseConfigured ? 'Connected — Auto-sync active' : 'Demo mode'}
            >
              {isSupabaseConfigured ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="text-emerald-700 font-medium">Supabase Live</span>
                  {isRefreshing && <RefreshCw className="w-3 h-3 text-emerald-600 animate-spin ml-0.5 shrink-0" />}
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="text-amber-700">Demo Mode</span>
                </>
              )}
            </div>

            {/* Language flag */}
            <button
              onClick={() => setLang(lang === 'km' ? 'en' : 'km')}
              className="hidden md:inline-flex items-center justify-center p-1.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition shadow-2xs bg-white shrink-0 cursor-pointer"
            >
              {lang === 'km' ? <CambodiaFlag className="w-[18px] h-[12px]" /> : <USFlag className="w-[18px] h-[12px]" />}
            </button>

            {/* Nav tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 w-full md:w-auto justify-between sm:justify-start">
              <button
                onClick={() => setActiveTab('entry')}
                className={`flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition ${
                  activeTab === 'entry' ? 'bg-white text-blue-600 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Truck className="w-4 h-4 shrink-0" />
                <span>{lang === 'km' ? 'បញ្ចូលទិន្នន័យ' : 'Data Entry'}</span>
              </button>
              <button
                onClick={() => setActiveTab('report')}
                className={`flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition ${
                  activeTab === 'report' ? 'bg-white text-blue-600 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-4 h-4 shrink-0" />
                <span>{lang === 'km' ? 'របាយការណ៍' : 'Reports'}</span>
              </button>
            </div>

            {/* Desktop: avatar circle or login */}
            <div className="hidden md:block">
              {!user ? (
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold transition shadow-xs shadow-blue-500/20 active:scale-95 cursor-pointer shrink-0"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{lang === 'km' ? 'ចូលប្រព័ន្ធ' : 'Sign In'}</span>
                </button>
              ) : (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="w-9 h-9 rounded-full overflow-hidden border-2 border-blue-300 shadow-sm hover:border-blue-500 transition focus:outline-none focus:ring-2 focus:ring-blue-400"
                    title={displayName}
                  >
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-blue-600 text-white font-black flex items-center justify-center text-sm">
                        {avatarLetter}
                      </div>
                    )}
                  </button>

                  {dropdownOpen && (
                    <AvatarDropdown
                      name={displayName}
                      email={user.email || ''}
                      roleLabel={roleLabel}
                      roleBadgeClass={roleBadgeClass}
                      isAdmin={isAdmin}
                      onSignOut={() => { signOut(); setDropdownOpen(false); }}
                      lang={lang}
                    />
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </header>
  );
};

/* ── Avatar Dropdown Component ── */
interface AvatarDropdownProps {
  name: string;
  email: string;
  roleLabel: string;
  roleBadgeClass: string;
  isAdmin: boolean;
  onSignOut: () => void;
  lang: 'km' | 'en';
}

const AvatarDropdown: React.FC<AvatarDropdownProps> = ({
  name, email, roleLabel, roleBadgeClass, isAdmin, onSignOut, lang,
}) => {
  const cleanName = name.replace(/\s*\((?:Admin|Operator)\)/gi, '').trim();

  return (
    <div className="absolute right-0 top-full mt-2 w-auto min-w-[200px] max-w-[280px] bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
      {/* User info */}
      <div className="px-4 py-3.5 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-bold text-slate-900 truncate">{cleanName}</span>
          <span className={`inline-flex items-center space-x-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-md border shrink-0 ${roleBadgeClass}`}>
            {isAdmin ? (
              <>
                <ShieldCheck className="w-3 h-3 text-rose-600 shrink-0" />
                <span>{roleLabel}</span>
              </>
            ) : (
              <>
                <UserCheck className="w-3 h-3 text-blue-600 shrink-0" />
                <span>{roleLabel}</span>
              </>
            )}
          </span>
        </div>
        <p className="text-xs text-slate-500 truncate mt-1">{email}</p>
      </div>

      {/* Sign out */}
      <button
        onClick={onSignOut}
        className="w-full flex items-center space-x-2.5 px-4 py-3 text-sm text-rose-600 hover:bg-rose-50 transition font-semibold"
      >
        <LogOut className="w-4 h-4" />
        <span>{lang === 'km' ? 'ចាកចេញពីប្រព័ន្ធ' : 'Sign Out'}</span>
      </button>
    </div>
  );
};
