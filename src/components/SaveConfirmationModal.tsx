import React from 'react';
import { Company, LineItemState } from '../types';
import { VerificationResult } from '../lib/calculator';
import {
  CheckCircle2,
  AlertTriangle,
  X,
  Truck,
  Building2,
  Calendar,
  User,
  Scale,
  Package,
  Save,
  RotateCcw,
} from 'lucide-react';

interface SaveConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isSaving: boolean;
  plateNumber: string;
  company: Company | undefined;
  recordDate: string;
  operatorName: string;
  scaleInKg: number;
  scaleOutKg: number;
  calculationResult: VerificationResult;
  lineItems: LineItemState[];
  lang: 'km' | 'en';
}

export const SaveConfirmationModal: React.FC<SaveConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isSaving,
  plateNumber,
  company,
  recordDate,
  operatorName,
  scaleInKg,
  scaleOutKg,
  calculationResult,
  lineItems,
  lang,
}) => {
  if (!isOpen) return null;

  const isApproved = calculationResult.isApproved;
  const validItems = lineItems.filter((i) => i.quantity > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm ${
                isApproved ? 'bg-emerald-600' : 'bg-rose-600'
              }`}
            >
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {lang === 'km' ? 'ផ្ទៀងផ្ទាត់ និងបញ្ជាក់ការរក្សាទុក' : 'Review & Confirm Save'}
              </h3>
              <p className="text-xs text-slate-500">
                {lang === 'km'
                  ? 'សូមពិនិត្យទិន្នន័យសង្ខេបខាងក្រោមមុននឹងកត់ត្រាចូលប្រព័ន្ធ'
                  : 'Please review verification summary before committing record'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Status Decision Banner */}
          <div
            className={`p-4 rounded-2xl border-2 flex items-center justify-between transition ${
              isApproved
                ? 'bg-emerald-50/80 border-emerald-500 text-emerald-950'
                : 'bg-rose-50/80 border-rose-500 text-rose-950'
            }`}
          >
            <div className="flex items-center space-x-3">
              {isApproved ? (
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
                </div>
              )}
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider block opacity-75">
                  {lang === 'km' ? 'ស្ថានភាពនៃការផ្ទៀងផ្ទាត់' : 'Verification Status'}
                </span>
                <span className="text-xl sm:text-2xl font-black">
                  {calculationResult.status}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-medium opacity-75 block">
                {lang === 'km' ? 'លទ្ធផល' : 'Decision'}
              </span>
              <span className="text-xs sm:text-sm font-bold">
                {calculationResult.statusMessage}
              </span>
            </div>
          </div>

          {/* Truck & Company Details Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-xs sm:text-sm">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <Truck className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-slate-900 text-sm">{plateNumber}</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-slate-700 font-bold">
                {company?.logo_url ? (
                  <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 p-0.5 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
                    <img
                      src={company.logo_url}
                      alt={company.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <Building2 className="w-4 h-4 text-slate-400" />
                )}
                <span>{company?.name || 'Hanuman Beverages'}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
              <div className="flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{recordDate}</span>
              </div>
              <div className="flex items-center space-x-1.5 justify-end">
                <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{operatorName || 'Operator'}</span>
              </div>
            </div>
          </div>

          {/* Weight Comparison Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Scale Net */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
              <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                {lang === 'km' ? 'ទម្ងន់ជញ្ជីងសុទ្ធ (Scale Net)' : 'Scale Net Weight'}
              </span>
              <div className="text-lg sm:text-xl font-black text-slate-900">
                {calculationResult.scaleNetKg.toLocaleString(undefined, { minimumFractionDigits: 2 })}{' '}
                <span className="text-xs font-normal text-slate-500">Kg</span>
              </div>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                {(calculationResult.scaleNetKg / 1000).toFixed(3)} Ton
              </span>
            </div>

            {/* Warehouse Total */}
            <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-2xl">
              <span className="text-[11px] font-bold text-blue-700 uppercase block mb-1">
                {lang === 'km' ? 'ទម្ងន់ឃ្លាំងសរុប (Whs Total)' : 'Warehouse Total'}
              </span>
              <div className="text-lg sm:text-xl font-black text-blue-800">
                {calculationResult.warehouseTotalKg.toLocaleString(undefined, { minimumFractionDigits: 2 })}{' '}
                <span className="text-xs font-normal text-blue-500">Kg</span>
              </div>
              <span className="text-[11px] text-blue-500 block mt-0.5">
                {(calculationResult.warehouseTotalKg / 1000).toFixed(3)} Ton
              </span>
            </div>
          </div>

          {/* Difference & Variance Row */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs sm:text-sm font-bold">
            <span className="text-slate-600">
              {lang === 'km' ? 'គម្លាតខុសគ្នា (Variance):' : 'Difference & Variance:'}
            </span>
            <div className="text-right">
              <span
                className={
                  Math.abs(calculationResult.diffPercent) > calculationResult.tolerancePercent
                    ? 'text-rose-600 font-black'
                    : 'text-emerald-700 font-black'
                }
              >
                {calculationResult.diffKg > 0 ? `+${calculationResult.diffKg.toFixed(2)}` : calculationResult.diffKg.toFixed(2)} Kg
                {' '}({calculationResult.diffPercent > 0 ? `+${calculationResult.diffPercent.toFixed(3)}` : calculationResult.diffPercent.toFixed(3)}%)
              </span>
            </div>
          </div>

          {/* Cargo Breakdown Items Mini List */}
          {validItems.length > 0 && (
            <div className="border border-slate-200 rounded-2xl p-3.5 bg-slate-50/40 space-y-2">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700 uppercase">
                <Package className="w-3.5 h-3.5 text-blue-600" />
                <span>
                  {lang === 'km'
                    ? `មុខទំនិញផ្ទុកក្នុងឡាន (${validItems.length} មុខ)`
                    : `Loaded Cargo Items (${validItems.length} items)`}
                </span>
              </div>
              <div className="max-h-36 overflow-y-auto divide-y divide-slate-100 text-xs">
                {validItems.map((item, idx) => (
                  <div key={item.id} className="py-1.5 flex items-center justify-between">
                    <div className="flex items-center space-x-2 truncate pr-2">
                      <span className="text-slate-400 font-bold">{idx + 1}.</span>
                      <span className="font-semibold text-slate-800 truncate">
                        {item.productNameKh || item.productNameEn}
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        ({item.quantity} {item.unit})
                      </span>
                    </div>
                    <span className="font-bold text-slate-900 shrink-0">
                      {item.totalWeightKg.toLocaleString(undefined, { minimumFractionDigits: 1 })} Kg
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end space-x-3 p-4 sm:px-6 border-t border-slate-100 bg-slate-50/70 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition disabled:opacity-50"
          >
            {lang === 'km' ? 'កែប្រែឡើងវិញ (Cancel)' : 'Cancel & Edit'}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isSaving}
            className={`px-5 py-2.5 text-sm font-bold text-white rounded-xl shadow-md transition flex items-center space-x-2 disabled:opacity-50 ${
              isApproved
                ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                : 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20'
            }`}
          >
            {isSaving ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>
              {isSaving
                ? lang === 'km' ? 'កំពុងរក្សាទុក...' : 'Saving...'
                : lang === 'km' ? 'បញ្ជាក់ និងរក្សាទុក (Confirm & Save)' : 'Confirm & Save'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
