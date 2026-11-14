import React from 'react';
import { Scale, ArrowDownRight, ArrowUpRight } from 'lucide-react';

interface ScaleEntryCardProps {
  scaleInKg: number;
  setScaleInKg: (val: number) => void;
  scaleOutKg: number;
  setScaleOutKg: (val: number) => void;
  scaleNetKg: number;
  lang: 'km' | 'en';
}

export const ScaleEntryCard: React.FC<ScaleEntryCardProps> = ({
  scaleInKg,
  setScaleInKg,
  scaleOutKg,
  setScaleOutKg,
  scaleNetKg,
  lang,
}) => {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
      <div className="flex items-center space-x-2 mb-3">
        <Scale className="w-5 h-5 text-blue-600" />
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
          {lang === 'km' ? 'បញ្ចូលទិន្នន័យពីជញ្ជីង' : 'Weighbridge Scale Inputs'}
        </h2>
      </div>

      <div className="space-y-4">
        {/* Scale In (Tare / Inbound) */}
        <div>
          <label className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1.5">
            <span className="flex items-center space-x-1.5">
              <ArrowDownRight className="w-4 h-4 text-emerald-600" />
              <span>{lang === 'km' ? 'ទម្ងន់ឡាន (ចូល)' : 'Scale Inbound (Tare)'}</span>
            </span>
            <span className="text-slate-400 font-normal">Kg</span>
          </label>
          <input
            type="number"
            min="0"
            step="any"
            value={scaleInKg === 0 ? '' : scaleInKg}
            onChange={(e) => setScaleInKg(parseFloat(e.target.value) || 0)}
            placeholder="0"
            className="w-full px-3.5 py-2 sm:py-2.5 bg-white border border-slate-300 hover:border-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/15 rounded-xl font-bold text-base sm:text-lg text-slate-900 outline-none transition shadow-2xs placeholder:text-slate-400 placeholder:font-normal"
          />
        </div>

        {/* Scale Out (Gross / Outbound) */}
        <div>
          <label className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1.5">
            <span className="flex items-center space-x-1.5">
              <ArrowUpRight className="w-4 h-4 text-blue-600" />
              <span>{lang === 'km' ? 'ទម្ងន់ឡាន (ចេញ)' : 'Scale Outbound (Gross)'}</span>
            </span>
            <span className="text-slate-400 font-normal">Kg</span>
          </label>
          <input
            type="number"
            min="0"
            step="any"
            value={scaleOutKg === 0 ? '' : scaleOutKg}
            onChange={(e) => setScaleOutKg(parseFloat(e.target.value) || 0)}
            placeholder="0"
            className="w-full px-3.5 py-2 sm:py-2.5 bg-white border border-slate-300 hover:border-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/15 rounded-xl font-bold text-base sm:text-lg text-slate-900 outline-none transition shadow-2xs placeholder:text-slate-400 placeholder:font-normal"
          />
        </div>

        {/* Net Scale Weight Output */}
        <div className="p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-900 uppercase">
              {lang === 'km' ? 'សរុបទម្ងន់ ពីជញ្ជីង (Net Weight)' : 'Scale Net Cargo Weight'}
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-200/60 text-blue-900">
              {(scaleNetKg / 1000).toFixed(3)} Ton
            </span>
          </div>
          <div className="text-2xl font-black text-blue-900 mt-1">
            {scaleNetKg.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
            <span className="text-sm font-medium text-blue-700">Kg</span>
          </div>
        </div>
      </div>
    </div>
  );
};
