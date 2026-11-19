import React from 'react';
import { Truck, Calendar, User } from 'lucide-react';

interface TruckInfoFormProps {
  plateNumber: string;
  setPlateNumber: (plate: string) => void;
  recordDate: string;
  setRecordDate: (date: string) => void;
  recordTime?: string;
  setRecordTime?: (time: string) => void;
  operatorName: string;
  setOperatorName: (name: string) => void;
  lang: 'km' | 'en';
}

export const TruckInfoForm: React.FC<TruckInfoFormProps> = ({
  plateNumber,
  setPlateNumber,
  recordDate,
  setRecordDate,
  recordTime = '',
  setRecordTime,
  operatorName,
  setOperatorName,
  lang,
}) => {
  // Construct ISO-like string YYYY-MM-DDTHH:mm for native datetime-local input
  const dateTimeValue =
    recordDate && recordTime
      ? `${recordDate}T${recordTime.slice(0, 5)}`
      : recordDate
      ? `${recordDate}T00:00`
      : '';

  const handleDateTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val) {
      setRecordDate('');
      setRecordTime?.('');
      return;
    }
    const [datePart, timePart] = val.split('T');
    if (datePart) setRecordDate(datePart);
    if (timePart) setRecordTime?.(timePart.slice(0, 5));
  };

  const handleSetCurrentDateTime = () => {
    const now = new Date();
    const d = now.toISOString().slice(0, 10);
    const t = now.toTimeString().slice(0, 5);
    setRecordDate(d);
    setRecordTime?.(t);
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
      <div className="flex items-center space-x-2 mb-3">
        <Truck className="w-5 h-5 text-blue-600" />
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
          {lang === 'km' ? 'ព័ត៌មានរថយន្ត និងកាលបរិច្ឆេទ' : 'Truck & Session Information'}
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-3.5">
        {/* 1. Truck Plate Number */}
        <div className="sm:col-span-4">
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            {lang === 'km' ? 'ផ្លាកលេខឡាន' : 'Truck Plate Number'} <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-blue-600 z-10">
              <Truck className="w-4 h-4" />
            </div>
            <input
              type="text"
              required
              value={plateNumber}
              onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
              placeholder="e.g. 3G-2487"
              className="w-full pl-10 pr-3.5 py-2.5 bg-blue-50/40 border border-blue-200/90 hover:border-blue-400 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 rounded-xl text-xs sm:text-sm font-bold text-slate-900 outline-none transition shadow-2xs placeholder:text-slate-400 placeholder:font-normal min-h-[42px]"
            />
          </div>
        </div>

        {/* 2. Merged Date & Time (Unified Native DateTime-Local Control) */}
        <div className="sm:col-span-5">
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-slate-700">
              {lang === 'km' ? 'កាលបរិច្ឆេទ និងម៉ោង' : 'Date & Time'}
            </label>
            <button
              type="button"
              onClick={handleSetCurrentDateTime}
              className="text-[10px] text-blue-600 hover:text-blue-800 font-bold hover:underline"
              title={lang === 'km' ? 'កំណត់ជាថ្ងៃ និងម៉ោងបច្ចុប្បន្ន' : 'Set to current date and time'}
            >
              {lang === 'km' ? 'ឥឡូវនេះ (Now)' : 'Now'}
            </button>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-blue-600 z-10">
              <Calendar className="w-4 h-4" />
            </div>
            <input
              type="datetime-local"
              value={dateTimeValue}
              onChange={handleDateTimeChange}
              onClick={(e) => {
                try {
                  (e.currentTarget as any).showPicker?.();
                } catch {
                  // Fallback for older browsers
                }
              }}
              className="w-full pl-10 pr-3.5 py-2.5 bg-blue-50/40 border border-blue-200/90 hover:border-blue-400 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 outline-none transition shadow-2xs cursor-pointer min-h-[42px]"
            />
          </div>
        </div>

        {/* 3. Scale Operator */}
        <div className="sm:col-span-3">
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            {lang === 'km' ? 'បុគ្គលិកថ្លឹងជញ្ជីង' : 'Scale Operator'}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-blue-600 z-10">
              <User className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={operatorName}
              onChange={(e) => setOperatorName(e.target.value)}
              placeholder="e.g. Sopheaktra"
              className="w-full pl-10 pr-3.5 py-2.5 bg-blue-50/40 border border-blue-200/90 hover:border-blue-400 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 outline-none transition shadow-2xs placeholder:text-slate-400 placeholder:font-normal min-h-[42px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
