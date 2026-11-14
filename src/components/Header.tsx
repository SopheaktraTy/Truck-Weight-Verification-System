import React from 'react';
import { Truck, Scale, FileText, Package, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';
import { CambodiaFlag, USFlag } from './Flags';

interface HeaderProps {
  activeTab: 'entry' | 'report';
  setActiveTab: (tab: 'entry' | 'report') => void;
  lang: 'km' | 'en';
  setLang: (lang: 'km' | 'en') => void;
  isRefreshing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  lang,
  setLang,
  isRefreshing = false,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between py-2.5 md:py-0 md:h-16 gap-2.5">
          {/* Logo & Title */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5 sm:space-x-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
                <Scale className="w-5 h-5 sm:w-6 sm:h-6" />
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

            {/* Mobile language switch (Flag only) */}
            <div className="flex items-center md:hidden">
              <button
                onClick={() => setLang(lang === 'km' ? 'en' : 'km')}
                className="flex items-center justify-center p-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition shadow-2xs"
                title={lang === 'km' ? 'Switch to English' : 'ប្តូរទៅភាសាខ្មែរ'}
              >
                {lang === 'km' ? (
                  <CambodiaFlag className="w-[16px] h-[11px]" />
                ) : (
                  <USFlag className="w-[16px] h-[11px]" />
                )}
              </button>
            </div>
          </div>

          {/* Navigation Tabs & Desktop Controls */}
          <div className="flex items-center justify-between md:justify-end space-x-2 sm:space-x-3 w-full md:w-auto">
            {/* Database Status Pill (Auto-sync indicator) - shown on tablet & desktop */}
            <div
              className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 border border-emerald-200/80 text-emerald-700 shrink-0"
              title={
                isSupabaseConfigured
                  ? lang === 'km'
                    ? 'ភ្ជាប់ Supabase Live (ទិន្នន័យ Sync ស្វ័យប្រវត្តិ Auto-Sync)'
                    : 'Connected to Supabase Live (Auto-sync active)'
                  : 'Running in local demo mode'
              }
            >
              {isSupabaseConfigured ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="text-emerald-700 font-medium">Supabase Live</span>
                  {isRefreshing && (
                    <RefreshCw className="w-3 h-3 text-emerald-600 animate-spin ml-0.5 shrink-0" />
                  )}
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="text-amber-700">Demo Mode</span>
                </>
              )}
            </div>

            {/* Desktop Language Switcher (Flag only) */}
            <button
              onClick={() => setLang(lang === 'km' ? 'en' : 'km')}
              className="hidden md:inline-flex items-center justify-center p-1.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition shadow-2xs bg-white shrink-0 cursor-pointer"
              title={lang === 'km' ? 'Switch to English' : 'ប្តូរទៅភាសាខ្មែរ'}
            >
              {lang === 'km' ? (
                <CambodiaFlag className="w-[18px] h-[12px]" />
              ) : (
                <USFlag className="w-[18px] h-[12px]" />
              )}
            </button>

            {/* Navigation Tabs - Responsive (Full width on phone, fitted on tablet/desktop) */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 w-full md:w-auto justify-between sm:justify-start">
              <button
                onClick={() => setActiveTab('entry')}
                className={`flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition ${
                  activeTab === 'entry'
                    ? 'bg-white text-blue-600 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Truck className="w-4 h-4 shrink-0" />
                <span>{lang === 'km' ? 'បញ្ចូលទិន្នន័យ' : 'Data Entry'}</span>
              </button>
              <button
                onClick={() => setActiveTab('report')}
                className={`flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition ${
                  activeTab === 'report'
                    ? 'bg-white text-blue-600 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-4 h-4 shrink-0" />
                <span>{lang === 'km' ? 'របាយការណ៍' : 'Reports'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
