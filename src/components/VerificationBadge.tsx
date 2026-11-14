import React from 'react';
import { VerificationResult } from '../lib/calculator';
import { CheckCircle2, AlertTriangle, Save, RotateCcw } from 'lucide-react';

interface VerificationBadgeProps {
  result: VerificationResult;
  onSave: () => void;
  onReset: () => void;
  isSaving: boolean;
  lang: 'km' | 'en';
}

export const VerificationBadge: React.FC<VerificationBadgeProps> = ({
  result,
  onSave,
  onReset,
  isSaving,
  lang,
}) => {
  const isApproved = result.isApproved;
  const hasData = result.scaleNetKg > 0 || result.warehouseTotalKg > 0;

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
      <div>
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-3">
          {lang === 'km' ? 'លទ្ធផលនៃការផ្ទៀងផ្ទាត់' : 'Weight Verification Result'}
        </h2>

        {/* Big Status Badge */}
        <div
          className={`p-4 rounded-xl border-2 transition flex items-center justify-between mb-4 ${
            !hasData
              ? 'bg-slate-50 border-slate-200 text-slate-400'
              : isApproved
              ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-sm shadow-emerald-500/10'
              : 'bg-rose-50 border-rose-500 text-rose-900 shadow-sm shadow-rose-500/10 animate-pulse'
          }`}
        >
          <div className="flex items-center space-x-3">
            {isApproved ? (
              <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 shadow">
                <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-rose-500 text-white flex items-center justify-center flex-shrink-0 shadow">
                <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
              </div>
            )}
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider block opacity-75">
                {lang === 'km' ? 'ស្ថានភាពផ្ទៀងផ្ទាត់ (±0.4%)' : 'Status Decision'}
              </span>
              <span className="text-xl sm:text-2xl font-black">
                {result.status}
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-medium opacity-75 block">
              {lang === 'km' ? 'ការសន្និដ្ឋាន' : 'Summary'}
            </span>
            <span className="text-sm sm:text-base font-bold">
              {result.statusMessage || '-'}
            </span>
          </div>
        </div>

        {/* Detailed Metrics Table */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {/* Diff in Kg */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-xs font-semibold text-slate-500 uppercase block mb-0.5">
              {lang === 'km' ? 'គិតជាគីឡូក្រាម (Kg)' : 'Weight Delta (Kg)'}
            </span>
            <span
              className={`text-lg font-black ${
                result.diffKg > 0
                  ? 'text-amber-700'
                  : result.diffKg < 0
                  ? 'text-blue-700'
                  : 'text-slate-800'
              }`}
            >
              {result.diffKg > 0 ? `+${result.diffKg.toFixed(2)}` : result.diffKg.toFixed(2)}{' '}
              <span className="text-xs font-medium text-slate-500">Kg</span>
            </span>
          </div>

          {/* Diff in % */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-xs font-semibold text-slate-500 uppercase block mb-0.5">
              {lang === 'km' ? 'គិតជាភាគរយ (%)' : 'Variance (%)'}
            </span>
            <span
              className={`text-lg font-black ${
                Math.abs(result.diffPercent) > result.tolerancePercent
                  ? 'text-rose-600'
                  : 'text-emerald-700'
              }`}
            >
              {result.diffPercent > 0 ? `+${result.diffPercent.toFixed(3)}` : result.diffPercent.toFixed(3)}{' '}
              <span className="text-xs font-medium text-slate-500">%</span>
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-3 pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={onReset}
          className="flex-1 inline-flex items-center justify-center space-x-1.5 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-sm transition"
        >
          <RotateCcw className="w-4 h-4" />
          <span>{lang === 'km' ? 'សម្អាត' : 'Reset'}</span>
        </button>

        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="flex-[2] inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/20 transition disabled:opacity-50"
        >
          {isSaving ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>
            {isSaving
              ? lang === 'km' ? 'កំពុងរក្សាទុក...' : 'Saving...'
              : lang === 'km' ? 'រក្សាទុកទិន្នន័យ' : 'Save Record'}
          </span>
        </button>
      </div>
    </div>
  );
};
