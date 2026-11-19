import React, { useState, useEffect } from 'react';
import { TruckRecord, TruckRecordItem, Company, Product } from '../types';
import { verifyTruckWeight, VerificationResult } from '../lib/calculator';
import { X, Save, Scale, CheckCircle2, AlertTriangle, Trash2, Plus } from 'lucide-react';

interface EditRecordModalProps {
  record: TruckRecord | null;
  companies?: Company[];
  products?: Product[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedRecord: TruckRecord, updatedItems: TruckRecordItem[]) => Promise<void>;
  lang: 'km' | 'en';
}

export const EditRecordModal: React.FC<EditRecordModalProps> = ({
  record,
  companies,
  products = [],
  isOpen,
  onClose,
  onSave,
  lang,
}) => {
  if (!isOpen || !record) return null;

  const [plateNumber, setPlateNumber] = useState(record.plate_number);
  const [recordDate, setRecordDate] = useState(record.record_date);
  const [recordTime, setRecordTime] = useState(record.record_time || '');
  const [operatorName, setOperatorName] = useState(record.operator_name || '');

  const [scaleInKg, setScaleInKg] = useState(record.scale_in_kg);
  const [scaleOutKg, setScaleOutKg] = useState(record.scale_out_kg);
  const [tolerancePercent, setTolerancePercent] = useState(record.tolerance_percent ?? 0.40);

  const [items, setItems] = useState<TruckRecordItem[]>(record.items || []);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state when record changes
  useEffect(() => {
    if (record) {
      setPlateNumber(record.plate_number);
      setRecordDate(record.record_date);
      setRecordTime(record.record_time || '');
      setOperatorName(record.operator_name || '');
      setScaleInKg(record.scale_in_kg);
      setScaleOutKg(record.scale_out_kg);
      setTolerancePercent(record.tolerance_percent ?? 0.40);
      setItems(record.items || []);
    }
  }, [record]);

  // Recalculate live
  const calculation: VerificationResult = React.useMemo(() => {
    const rawItems = items.map((i) => ({
      productId: i.product_id || '',
      productNameKh: i.product_name_kh || '',
      productNameEn: i.product_name_en || '',
      quantity: i.quantity,
      unitWeightKg: i.unit_weight_kg,
    }));
    return verifyTruckWeight(scaleInKg, scaleOutKg, rawItems, tolerancePercent);
  }, [scaleInKg, scaleOutKg, items, tolerancePercent]);

  const handleQuantityChange = (index: number, newQty: number) => {
    const updated = [...items];
    const item = updated[index];
    const qty = Math.max(0, newQty);
    const totalKg = Math.round(qty * item.unit_weight_kg * 1000) / 1000;
    const totalTon = Math.round((totalKg / 1000) * 10000) / 10000;
    updated[index] = { ...item, quantity: qty, total_weight_kg: totalKg, total_weight_ton: totalTon };
    setItems(updated);
  };

  const handleProductChange = (index: number, productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;
    const updated = [...items];
    const item = updated[index];
    const totalKg = Math.round(item.quantity * prod.unit_weight_kg * 1000) / 1000;
    const totalTon = Math.round((totalKg / 1000) * 10000) / 10000;
    updated[index] = {
      ...item,
      product_id: prod.id,
      product_name_kh: prod.name_kh,
      product_name_en: prod.name_en,
      packaging_spec: prod.packaging_spec,
      unit: prod.unit,
      unit_weight_kg: prod.unit_weight_kg,
      total_weight_kg: totalKg,
      total_weight_ton: totalTon,
      product: prod,
    };
    setItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleAddItem = () => {
    const firstProd = availableProducts[0];
    if (!firstProd) return;
    const newItem: TruckRecordItem = {
      product_id: firstProd.id,
      product_name_kh: firstProd.name_kh,
      product_name_en: firstProd.name_en,
      packaging_spec: firstProd.packaging_spec,
      unit: firstProd.unit,
      unit_weight_kg: firstProd.unit_weight_kg,
      quantity: 0,
      total_weight_kg: 0,
      total_weight_ton: 0,
      product: firstProd,
    };
    setItems([...items, newItem]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plateNumber.trim()) {
      alert(lang === 'km' ? 'សូមបញ្ចូលផ្លាកលេខរថយន្ត' : 'Plate number is required');
      return;
    }
    setIsSubmitting(true);
    try {
      const updatedRecord: TruckRecord = {
        ...record,
        plate_number: plateNumber,
        record_date: recordDate,
        record_time: recordTime,
        operator_name: operatorName,
        scale_in_kg: calculation.scaleInKg,
        scale_out_kg: calculation.scaleOutKg,
        scale_net_kg: calculation.scaleNetKg,
        warehouse_total_kg: calculation.warehouseTotalKg,
        diff_kg: calculation.diffKg,
        diff_percent: calculation.diffPercent,
        tolerance_percent: tolerancePercent,
        status: calculation.status,
        status_message: calculation.statusMessage,
        updated_at: new Date().toISOString(),
      };
      await onSave(updatedRecord, items);
      onClose();
    } catch (err: any) {
      alert(`Error updating record: ${err.message || err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isApproved = calculation.isApproved;

  // Filter products for this company
  const companyProducts = products.filter(
    (p) => !record.company_id || p.company_id === record.company_id
  );
  const availableProducts = companyProducts.length > 0 ? companyProducts : products;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 relative flex flex-col max-h-[90vh]">

        {/* Fixed Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100 shrink-0">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              {lang === 'km' ? 'កែប្រែកំណត់ត្រារថយន្ត (Admin Edit)' : 'Edit Truck Record (Admin)'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {lang === 'km' ? 'កែសម្រួលទម្ងន់ជញ្ជីង ឬចំនួនទំនិញ' : 'Update weights or line items'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <form
          onSubmit={handleSubmit}
          className="overflow-y-auto flex-1 px-5 py-4 space-y-4"
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 transparent' }}
        >

          {/* Row 1: Plate + Date + Operator (3 cols) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1 uppercase tracking-wide">
                {lang === 'km' ? 'ផ្លាកលេខ *' : 'Plate No. *'}
              </label>
              <input
                type="text"
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono font-bold text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 outline-none bg-slate-50"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1 uppercase tracking-wide">
                {lang === 'km' ? 'កាលបរិច្ឆេទ & ម៉ោង' : 'Date & Time'}
              </label>
              <input
                type="datetime-local"
                value={recordDate && recordTime ? `${recordDate}T${recordTime}` : recordDate ? `${recordDate}T00:00` : ''}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val) {
                    const [d, t] = val.split('T');
                    setRecordDate(d || '');
                    setRecordTime(t || '');
                  } else {
                    setRecordDate('');
                    setRecordTime('');
                  }
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 outline-none bg-slate-50 cursor-pointer"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1 uppercase tracking-wide">
                {lang === 'km' ? 'អ្នកបញ្ចូល' : 'Operator'}
              </label>
              <input
                type="text"
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 outline-none bg-slate-50"
              />
            </div>
          </div>

          {/* Scale Weights & Tolerance */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center space-x-1.5">
              <Scale className="w-4 h-4 text-blue-600" />
              <span>{lang === 'km' ? 'ទម្ងន់ជញ្ជីង & កម្រិត Tolerance' : 'Scale Weights & Tolerance'}</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                  {lang === 'km' ? 'ទម្ងន់ចូល (Kg)' : 'Scale In (Kg)'}
                </label>
                <input
                  type="number"
                  step="any"
                  value={scaleInKg}
                  onChange={(e) => setScaleInKg(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl font-bold text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                  {lang === 'km' ? 'ទម្ងន់ចេញ (Kg)' : 'Scale Out (Kg)'}
                </label>
                <input
                  type="number"
                  step="any"
                  value={scaleOutKg}
                  onChange={(e) => setScaleOutKg(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl font-bold text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                  Tolerance (%)
                </label>
                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => setTolerancePercent(Math.max(0.01, parseFloat((tolerancePercent - 0.1).toFixed(2))))}
                    className="w-8 h-9 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-700 font-bold hover:bg-slate-100 transition"
                  >−</button>
                  <input
                    type="number"
                    step="any"
                    value={tolerancePercent}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val) && val > 0) setTolerancePercent(val);
                    }}
                    className="w-full px-2 py-2 border border-slate-200 bg-white rounded-lg font-bold text-sm text-center focus:border-blue-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setTolerancePercent(parseFloat((tolerancePercent + 0.1).toFixed(2)))}
                    className="w-8 h-9 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-700 font-bold hover:bg-slate-100 transition"
                  >+</button>
                </div>
              </div>
            </div>

            {/* Live metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 block">{lang === 'km' ? 'ជញ្ជីង Net:' : 'Scale Net:'}</span>
                <span className="font-bold text-slate-900">{calculation.scaleNetKg.toLocaleString()} Kg</span>
              </div>
              <div>
                <span className="text-slate-500 block">{lang === 'km' ? 'ឃ្លាំង Total:' : 'Warehouse Total:'}</span>
                <span className="font-bold text-slate-900">{calculation.warehouseTotalKg.toLocaleString()} Kg</span>
              </div>
              <div>
                <span className="text-slate-500 block">{lang === 'km' ? 'ខុសគ្នា:' : 'Delta:'}</span>
                <span className="font-bold text-slate-900">{calculation.diffKg.toFixed(2)} Kg ({calculation.diffPercent.toFixed(3)}%)</span>
              </div>
              <div>
                <span className="text-slate-500 block">{lang === 'km' ? 'ស្ថានភាព:' : 'Status:'}</span>
                <span className={`inline-flex items-center space-x-1 font-bold ${isApproved ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {isApproved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                  <span>{calculation.status}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Product Line Items Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                {lang === 'km' ? 'កែសម្រួលចំនួន & មុខទំនិញ' : 'Line Items — Product & Quantity'}
              </h4>
              {availableProducts.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleAddItem(availableProducts)}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold transition shadow-sm"
                >
                  <Plus className="w-3 h-3" />
                  <span>{lang === 'km' ? 'បន្ថែមមុខទំនិញ' : 'Add Item'}</span>
                </button>
              )}
            </div>

            {items.length === 0 ? (
              <div
                onClick={() => handleAddItem(availableProducts)}
                className="text-center py-8 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition"
              >
                <Plus className="w-5 h-5 mx-auto mb-1 text-slate-300" />
                {lang === 'km' ? 'ចុចដើម្បីបន្ថែមមុខទំនិញ' : 'Click to add an item'}
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wide">
                    <tr>
                      <th className="py-2.5 px-3">{lang === 'km' ? 'មុខទំនិញ' : 'Product'}</th>
                      <th className="py-2.5 px-3 text-right whitespace-nowrap">{lang === 'km' ? 'ទម្ងន់/ឯកតា' : 'Unit Wt'}</th>
                      <th className="py-2.5 px-3 text-right">{lang === 'km' ? 'ចំនួន' : 'Qty'}</th>
                      <th className="py-2.5 px-3 text-right whitespace-nowrap">{lang === 'km' ? 'សរុប (Kg)' : 'Total Kg'}</th>
                      <th className="py-2.5 px-3 text-center w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((item, index) => {
                      const currentName = item.product_name_kh || item.product?.name_kh || item.product_name_en || '';
                      return (
                        <tr key={index} className="hover:bg-slate-50/80">
                          {/* Product dropdown */}
                          <td className="py-2 px-3">
                            {availableProducts.length > 0 ? (
                              <select
                                value={item.product_id || ''}
                                onChange={(e) => handleProductChange(index, e.target.value)}
                                className="w-full min-w-[130px] px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 bg-white focus:border-blue-500 outline-none"
                              >
                                {!item.product_id && (
                                  <option value="" disabled>
                                    {currentName || (lang === 'km' ? '-- ជ្រើសទំនិញ --' : '-- Select --')}
                                  </option>
                                )}
                                {availableProducts.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {lang === 'km' ? p.name_kh : p.name_en}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span className="font-semibold text-slate-800">{currentName || '—'}</span>
                            )}
                          </td>

                          {/* Unit weight */}
                          <td className="py-2 px-3 text-right font-medium text-slate-600 whitespace-nowrap">
                            {Number(item.unit_weight_kg).toFixed(3)} Kg
                          </td>

                          {/* Quantity input */}
                          <td className="py-2 px-3 text-right">
                            <input
                              type="number"
                              min="0"
                              value={item.quantity}
                              onChange={(e) => handleQuantityChange(index, parseFloat(e.target.value) || 0)}
                              className="w-20 px-2 py-1 text-right font-bold border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-sm bg-white"
                            />
                          </td>

                          {/* Total */}
                          <td className="py-2 px-3 text-right font-bold text-blue-700 whitespace-nowrap">
                            {Number(item.total_weight_kg).toLocaleString(undefined, { minimumFractionDigits: 2 })} Kg
                          </td>

                          {/* Delete */}
                          <td className="py-2 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              className="p-1 text-slate-300 hover:text-rose-600 rounded transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer buttons inside scroll — always visible at bottom */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2 pb-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
            >
              {lang === 'km' ? 'បោះបង់' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center space-x-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition disabled:opacity-60"
            >
              {isSubmitting ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{isSubmitting ? (lang === 'km' ? 'កំពុងរក្សាទុក...' : 'Saving...') : (lang === 'km' ? 'រក្សាទុកការកែប្រែ' : 'Save Changes')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
