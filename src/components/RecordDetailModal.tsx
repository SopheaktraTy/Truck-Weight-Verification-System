import React from 'react';
import { TruckRecord, Company, Product } from '../types';
import { X, Scale, CheckCircle2, AlertTriangle, Package } from 'lucide-react';
import { formatRecordDateTime } from '../lib/calculator';

interface RecordDetailModalProps {
  record: TruckRecord | null;
  companies?: Company[];
  products?: Product[];
  isOpen: boolean;
  onClose: () => void;
  lang: 'km' | 'en';
}

export const RecordDetailModal: React.FC<RecordDetailModalProps> = ({
  record,
  companies,
  products = [],
  isOpen,
  onClose,
  lang,
}) => {
  if (!isOpen || !record) return null;

  const isApproved = record.status === 'អនុញ្ញាត';
  const comp = companies?.find(
    (c) => c.id === record.company_id || c.code === record.company_code
  );

  const items = record.items || [];
  const toleranceUsed = record.tolerance_percent ?? 0.40;
  const formattedDateTime = formatRecordDateTime(record.record_date, record.record_time, record.created_at);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center space-x-3">
            {/* Company Logo */}
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200/90 p-1 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
              {comp?.logo_url || record.company_logo ? (
                <img
                  src={comp?.logo_url || record.company_logo}
                  alt={comp?.name || record.company_code}
                  className="w-full h-full object-contain rounded-xl"
                />
              ) : (
                <div className="w-full h-full rounded-xl bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                  {comp?.code || record.company_code || 'HB'}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono font-bold text-sm sm:text-base text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                  {record.plate_number}
                </span>
                <span
                  className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    isApproved
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {isApproved ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5" />
                  )}
                  <span>{record.status}</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center space-x-2">
                <span>{comp?.name || record.company_name || comp?.code || 'Company'}</span>
                <span>•</span>
                <span className="font-medium text-slate-700">{formattedDateTime}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content with Modern Sleek Custom Scrollbar */}
        <div className="overflow-y-auto flex-1 py-4 space-y-4 custom-scrollbar pr-1 sm:pr-2">
          {/* Weight Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">
                {lang === 'km' ? 'ទម្ងន់ឡានចូល' : 'Scale In'}
              </span>
              <span className="text-sm sm:text-base font-black text-slate-900">
                {record.scale_in_kg.toLocaleString()} <span className="text-xs font-medium">Kg</span>
              </span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">
                {lang === 'km' ? 'ទម្ងន់ឡានចេញ' : 'Scale Out'}
              </span>
              <span className="text-sm sm:text-base font-black text-slate-900">
                {record.scale_out_kg.toLocaleString()} <span className="text-xs font-medium">Kg</span>
              </span>
            </div>

            <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-blue-700 block">
                {lang === 'km' ? 'សរុបជញ្ជីង (Net)' : 'Scale Net'}
              </span>
              <span className="text-sm sm:text-base font-black text-blue-900">
                {record.scale_net_kg.toLocaleString()} <span className="text-xs font-medium">Kg</span>
              </span>
            </div>

            <div className="p-3 bg-indigo-50/70 border border-indigo-200/80 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-indigo-700 block">
                {lang === 'km' ? 'សរុបឃ្លាំង' : 'Warehouse Total'}
              </span>
              <span className="text-sm sm:text-base font-black text-indigo-900">
                {record.warehouse_total_kg.toLocaleString()} <span className="text-xs font-medium">Kg</span>
              </span>
            </div>
          </div>

          {/* Variance & Tolerance Box */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-semibold text-slate-500">
                {lang === 'km' ? 'លទ្ធផលផ្ទៀងផ្ទាត់ (Verification Summary):' : 'Verification Summary:'}
              </span>
              <div className="flex items-center space-x-2 mt-0.5">
                <span className={`text-sm font-bold ${!isApproved ? 'text-rose-600 font-black' : 'text-slate-900'}`}>
                  {record.status_message}
                </span>
                <span className={`text-xs font-mono font-bold ${!isApproved ? 'text-rose-600' : 'text-slate-500'}`}>
                  ({record.diff_kg > 0 ? `+${record.diff_kg.toFixed(2)}` : record.diff_kg.toFixed(2)} Kg / {record.diff_percent > 0 ? `+${record.diff_percent.toFixed(3)}` : record.diff_percent.toFixed(3)}%)
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                {lang === 'km' ? 'កម្រិតលំអៀងអនុញ្ញាត' : 'Applied Tolerance'}
              </span>
              <span className="text-xs font-bold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 inline-block">
                ±{toleranceUsed}%
              </span>
            </div>
          </div>

          {/* Retained Product Items Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center space-x-1.5">
                <Package className="w-4 h-4 text-blue-600" />
                <span>{lang === 'km' ? 'មុខទំនិញលម្អិត (Retained Products)' : 'Line Item Details'}</span>
              </h4>
              <span className="text-xs text-slate-500">
                {items.length} {lang === 'km' ? 'មុខទំនិញ' : 'items'}
              </span>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
                {lang === 'km' ? 'មិនមានទំនិញលម្អិតត្រូវបានកត់ត្រាទេ' : 'No line items recorded'}
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">{lang === 'km' ? 'ទំនិញ' : 'Product'}</th>
                      <th className="py-2.5 px-3 text-right">{lang === 'km' ? 'ទម្ងន់/ឯកតា' : 'Unit Wt'}</th>
                      <th className="py-2.5 px-3 text-right">{lang === 'km' ? 'ចំនួន' : 'Qty'}</th>
                      <th className="py-2.5 px-3 text-right">{lang === 'km' ? 'សរុប (Kg)' : 'Total Kg'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((item, index) => {
                      // Robust lookup from snapshot, joined relation, product_id, or unit weight fallback
                      const itemUnitWeight = Number(item.unit_weight_kg) || 0;
                      const matchedProd =
                        item.product ||
                        products.find((p) => p.id === item.product_id) ||
                        products.find(
                          (p) =>
                            Math.abs(Number(p.unit_weight_kg) - itemUnitWeight) < 0.005 &&
                            (!record.company_id || p.company_id === record.company_id || p.company_id === comp?.id)
                        ) ||
                        products.find(
                          (p) => Math.abs(Number(p.unit_weight_kg) - itemUnitWeight) < 0.005
                        );

                      const nameKh = item.product_name_kh || matchedProd?.name_kh;
                      const nameEn = item.product_name_en || matchedProd?.name_en;

                      let displayName = '';
                      if (nameKh && nameEn && nameKh !== nameEn) {
                        displayName = lang === 'km' ? `${nameKh} (${nameEn})` : `${nameEn} (${nameKh})`;
                      } else {
                        displayName =
                          (lang === 'km' ? (nameKh || nameEn) : (nameEn || nameKh)) ||
                          matchedProd?.name_kh ||
                          matchedProd?.name_en ||
                          (lang === 'km' ? 'មុខទំនិញ' : 'Cargo Item');
                      }

                      const spec = item.packaging_spec || matchedProd?.packaging_spec || '';
                      const unit = item.unit || matchedProd?.unit || 'កេស';
                      const img = item.image_url || matchedProd?.image_url;

                      return (
                        <tr key={item.id || index} className="hover:bg-slate-50/80">
                          <td className="py-2.5 px-3 text-slate-400 font-medium">{index + 1}</td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center space-x-2">
                              {img && (
                                <img
                                  src={img}
                                  alt={displayName}
                                  className="w-7 h-7 rounded-lg object-cover border border-slate-200 shrink-0 shadow-2xs"
                                />
                              )}
                              <div>
                                <span className="font-bold text-slate-900 block">{displayName}</span>
                                {spec && <span className="text-[10px] text-slate-500">{spec}</span>}
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-medium text-slate-700">
                            {Number(item.unit_weight_kg).toFixed(3)} Kg
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                            {item.quantity.toLocaleString()} {unit}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-blue-700">
                            {Number(item.total_weight_kg).toLocaleString(undefined, { minimumFractionDigits: 2 })} Kg
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Audit / Operator info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
            <div>
              <span className="font-semibold text-slate-700">{lang === 'km' ? 'អ្នកបញ្ចូលទិន្នន័យ:' : 'Operator:'}</span>{' '}
              {record.operator_name || 'N/A'}
            </div>
            {record.driver_name && (
              <div>
                <span className="font-semibold text-slate-700">{lang === 'km' ? 'ឈ្មោះតៃកុងឡាន:' : 'Driver:'}</span>{' '}
                {record.driver_name}
              </div>
            )}
            {record.notes && (
              <div className="col-span-full">
                <span className="font-semibold text-slate-700">{lang === 'km' ? 'កំណត់ចំណាំ:' : 'Notes:'}</span>{' '}
                {record.notes}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition"
          >
            {lang === 'km' ? 'បិទ' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
