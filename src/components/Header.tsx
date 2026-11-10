import React from 'react';
import { Truck, Scale, FileText, Package, CheckCircle2, AlertCircle } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';
import { CambodiaFlag, USFlag } from './Flags';

interface HeaderProps {
  activeTab: 'entry' | 'report' | 'master';
  setActiveTab: (tab: 'entry' | 'report' | 'master') => void;
  lang: 'km' | 'en';
  setLang: (lang: 'km' | 'en') => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  lang,
  setLang,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold text-slate-900 leading-tight">
                  {lang === 'km' ? 'ប្រព័ន្ធផ្ទៀងផ្ទាត់ទម្ងន់រថយន្ត' : 'Truck Weight Verification System'}
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  v1.0
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                {lang === 'km'
                  ? 'ផ្ទៀងផ្ទាត់ទម្ងន់ទំនិញរវាងឃ្លាំង និងជញ្ជីង (±0.4% Tolerance)'
                  : 'Automated warehouse vs weighbridge reconciliation'}
              </p>
            </div>
          </div>

          {/* Navigation & Controls */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Database status pill */}
            <div
              className="hidden md:flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 border border-slate-200 text-slate-600"
              title={isSupabaseConfigured ? 'Connected to live Supabase database' : 'Running with local demo data.'}
            >
              {isSupabaseConfigured ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-700">Supabase Live</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-amber-700">Demo Mode</span>
                </>
              )}
            </div>

            {/* Language toggle */}
            <button
              onClick={() => setLang(lang === 'km' ? 'en' : 'km')}
              className="flex items-center space-x-2 px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 hover:bg-slate-50 transition text-slate-800 shadow-sm bg-white"
              title={lang === 'km' ? 'Switch to English' : 'ប្តូរទៅភាសាខ្មែរ'}
            >
              {lang === 'km' ? (
                <>
                  <CambodiaFlag className="w-5 h-3.5" />
                  <span>ខ្មែរ (KM)</span>
                </>
              ) : (
                <>
                  <USFlag className="w-5 h-3.5" />
                  <span>EN (US)</span>
                </>
              )}
            </button>

            {/* Tab Buttons */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setActiveTab('entry')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition ${
                  activeTab === 'entry'
                    ? 'bg-white text-blue-600 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Truck className="w-4 h-4" />
                <span>{lang === 'km' ? 'បញ្ចូលទិន្នន័យ' : 'Data Entry'}</span>
              </button>
              <button
                onClick={() => setActiveTab('report')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition ${
                  activeTab === 'report'
                    ? 'bg-white text-blue-600 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>{lang === 'km' ? 'របាយការណ៍' : 'Reports'}</span>
              </button>
              <button
                onClick={() => setActiveTab('master')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition ${
                  activeTab === 'master'
                    ? 'bg-white text-blue-600 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>{lang === 'km' ? 'គ្រប់គ្រង' : 'Master'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
