import React from 'react';
import { Truck, Calendar, User } from 'lucide-react';

interface TruckInfoFormProps {
  plateNumber: string;
  setPlateNumber: (plate: string) => void;
  recordDate: string;
  setRecordDate: (date: string) => void;
  operatorName: string;
  setOperatorName: (name: string) => void;
  lang: 'km' | 'en';
}

export const TruckInfoForm: React.FC<TruckInfoFormProps> = ({
  plateNumber,
  setPlateNumber,
  recordDate,
  setRecordDate,
  operatorName,
  setOperatorName,
  lang,
}) => {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
      <div className="flex items-center space-x-2 mb-3">
        <Truck className="w-5 h-5 text-blue-600" />
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
          {lang === 'km' ? 'ព័ត៌មានរថយន្ត និងកាលបរិច្ឆេទ' : 'Truck & Session Information'}
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Truck Plate */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            {lang === 'km' ? 'ផ្លាកលេខឡាន' : 'Truck Plate Number'} <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Truck className="w-4 h-4" />
            </div>
            <input
              type="text"
              required
              value={plateNumber}
              onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
              placeholder="e.g. 3G-2487"
              className="w-full pl-10 pr-3.5 py-2 sm:py-2.5 bg-white border border-slate-300 hover:border-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/15 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 outline-none transition shadow-2xs placeholder:text-slate-400 placeholder:font-normal"
            />
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            {lang === 'km' ? 'ថ្ងៃ/ខែ/ឆ្នាំ' : 'Date'}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Calendar className="w-4 h-4" />
            </div>
            <input
              type="date"
              value={recordDate}
              onChange={(e) => setRecordDate(e.target.value)}
              onClick={(e) => {
                try {
                  (e.currentTarget as any).showPicker?.();
                } catch {
                  // Fallback for older browsers
                }
              }}
              className="w-full pl-10 pr-3.5 py-2 sm:py-2.5 min-h-[42px] bg-white border border-slate-300 hover:border-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/15 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 outline-none transition shadow-2xs cursor-pointer"
            />
          </div>
        </div>

        {/* Operator Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            {lang === 'km' ? 'បុគ្គលិកថ្លឹងជញ្ជីង' : 'Scale Operator'}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <User className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={operatorName}
              onChange={(e) => setOperatorName(e.target.value)}
              placeholder="e.g. Sopheaktra"
              className="w-full pl-10 pr-3.5 py-2 sm:py-2.5 bg-white border border-slate-300 hover:border-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/15 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 outline-none transition shadow-2xs placeholder:text-slate-400 placeholder:font-normal"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
