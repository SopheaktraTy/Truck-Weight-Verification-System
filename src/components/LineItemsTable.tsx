import React from 'react';
import { Product, LineItemState } from '../types';
import { Package, Plus, Trash2, Layers } from 'lucide-react';

interface LineItemsTableProps {
  items: LineItemState[];
  availableProducts: Product[];
  onAddItem: () => void;
  onRemoveItem: (id: string) => void;
  onProductChange: (id: string, productId: string) => void;
  onQuantityChange: (id: string, quantity: number) => void;
  totalWarehouseKg: number;
  lang: 'km' | 'en';
}

export const LineItemsTable: React.FC<LineItemsTableProps> = ({
  items,
  availableProducts,
  onAddItem,
  onRemoveItem,
  onProductChange,
  onQuantityChange,
  totalWarehouseKg,
  lang,
}) => {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-2">
        <div className="flex items-center space-x-2">
          <Layers className="w-5 h-5 text-blue-600" />
          <div>
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              {lang === 'km' ? 'បញ្ចូលទិន្នន័យ មុខទំនិញ' : 'Cargo Items Breakdown'}
            </h2>
            <p className="text-xs text-slate-500">
              {lang === 'km' 
                ? 'ជ្រើសរើសមុខទំនិញ និងបញ្ចូលចំនួនកេស ឬប៉ាឡែត' 
                : 'Select products and enter case/pallet quantities'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onAddItem}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs sm:text-sm font-semibold transition self-start sm:self-auto shadow-sm"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>{lang === 'km' ? 'បន្ថែមមុខទំនិញ' : 'Add Product'}</span>
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto -mx-5 px-5">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase bg-slate-50/70">
              <th className="py-3 px-3 w-12 text-center">ល.រ</th>
              <th className="py-3 px-3 min-w-[220px]">
                {lang === 'km' ? 'ឈ្មោះផលិតផល' : 'Product Name'}
              </th>
              <th className="py-3 px-3 min-w-[140px]">
                {lang === 'km' ? 'ខ្នាត/ចំណុះ' : 'Packaging'}
              </th>
              <th className="py-3 px-3 text-right">
                {lang === 'km' ? 'ទម្ងន់១ឯកតា (Kg)' : 'Unit Kg'}
              </th>
              <th className="py-3 px-3 min-w-[110px] text-center">
                {lang === 'km' ? 'ចំនួន' : 'Quantity'} *
              </th>
              <th className="py-3 px-3 text-center">
                {lang === 'km' ? 'ឯកតា' : 'Unit'}
              </th>
              <th className="py-3 px-3 text-right font-bold text-slate-700 min-w-[110px]">
                {lang === 'km' ? 'គណនាជាគីឡូ (Kg)' : 'Total Kg'}
              </th>
              <th className="py-3 px-3 text-right font-bold text-slate-700 min-w-[90px]">
                {lang === 'km' ? 'តោន (Ton)' : 'Ton'}
              </th>
              <th className="py-3 px-2 w-10 text-center"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-400">
                  <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm">
                    {lang === 'km' ? 'មិនទាន់មានមុខទំនិញនៅឡើយ។ សូមចុចប៊ូតុង "បន្ថែមមុខទំនិញ"' : 'No items added. Click "Add Product" to begin.'}
                  </p>
                </td>
              </tr>
            ) : (
              items.map((item, index) => {
                return (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition">
                    {/* Row Index */}
                    <td className="py-3 px-3 text-center font-medium text-slate-400">
                      {index + 1}
                    </td>

                    {/* Product Selector with Image Thumbnail */}
                    <td className="py-3 px-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.productNameEn}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                        <select
                          value={item.productId}
                          onChange={(e) => onProductChange(item.id, e.target.value)}
                          className="w-full py-1.5 px-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">{lang === 'km' ? '-- ជ្រើសរើសទំនិញ --' : '-- Select Product --'}</option>
                          {availableProducts.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name_kh} ({p.name_en}) - {p.unit_weight_kg} kg
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>

                    {/* Packaging */}
                    <td className="py-3 px-3 text-xs text-slate-500">
                      {item.packagingSpec || '-'}
                    </td>

                    {/* Unit Weight */}
                    <td className="py-3 px-3 text-right font-medium text-slate-700">
                      {item.unitWeightKg > 0 ? `${item.unitWeightKg.toFixed(2)}` : '-'}
                    </td>

                    {/* Quantity */}
                    <td className="py-3 px-3 text-center">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={item.quantity === 0 ? '' : item.quantity}
                        onChange={(e) => onQuantityChange(item.id, parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="w-24 text-center py-1.5 px-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                      />
                    </td>

                    {/* Unit */}
                    <td className="py-3 px-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">
                        {item.unit || '-'}
                      </span>
                    </td>

                    {/* Total Kg */}
                    <td className="py-3 px-3 text-right font-bold text-blue-900">
                      {item.totalWeightKg.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Total Ton */}
                    <td className="py-3 px-3 text-right font-medium text-slate-600">
                      {item.totalWeightTon.toFixed(3)}
                    </td>

                    {/* Delete */}
                    <td className="py-3 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => onRemoveItem(item.id)}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Remove row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Table Footer - Warehouse Sum */}
          <tfoot>
            <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold text-slate-900">
              <td colSpan={6} className="py-3.5 px-4 text-right uppercase tracking-wider text-xs sm:text-sm">
                {lang === 'km' ? 'សរុបទម្ងន់ ទំនិញពីឃ្លាំង:' : 'Warehouse Total Cargo Weight:'}
              </td>
              <td className="py-3.5 px-3 text-right text-base text-blue-700">
                {totalWarehouseKg.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-normal text-slate-500">Kg</span>
              </td>
              <td className="py-3.5 px-3 text-right text-sm text-slate-700">
                {(totalWarehouseKg / 1000).toFixed(3)} <span className="text-xs font-normal text-slate-500">Ton</span>
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
