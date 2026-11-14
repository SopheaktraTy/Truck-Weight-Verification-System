import React from 'react';
import { Product, LineItemState } from '../types';
import { Package, Plus, Trash2, Layers, Settings2 } from 'lucide-react';
import { ProductDropdown } from './ProductDropdown';

interface LineItemsTableProps {
  items: LineItemState[];
  availableProducts: Product[];
  onAddItem: () => void;
  onRemoveItem: (id: string) => void;
  onProductChange: (id: string, productId: string) => void;
  onQuantityChange: (id: string, quantity: number) => void;
  onAddNewProduct?: () => void;
  onEditProduct?: (product: Product) => void;
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
  onAddNewProduct,
  onEditProduct,
  totalWarehouseKg,
  lang,
}) => {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs overflow-hidden">
      {/* Header and Add Buttons - strictly 1 single row across mobile, tablet & desktop */}
      <div className="flex items-center justify-between pb-3 sm:pb-4 mb-3 sm:mb-4 border-b border-slate-100 gap-2">
        <div className="flex items-center space-x-1.5 sm:space-x-2 min-w-0">
          <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 shrink-0" />
          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wide truncate">
              {lang === 'km' ? 'មុខទំនិញ' : 'Cargo Items Breakdown'}
            </h2>
            <p className="text-[11px] text-slate-500 hidden md:block">
              {lang === 'km' 
                ? 'ជ្រើសរើសមុខទំនិញ និងបញ្ចូលចំនួនកេស ឬប៉ាឡែត' 
                : 'Select products and enter quantities'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Quick Summary Pill - visible on mobile, tablet and desktop */}
          <div className="px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-[11px] sm:text-xs font-bold shrink-0 whitespace-nowrap">
            {totalWarehouseKg.toLocaleString(undefined, { maximumFractionDigits: 1 })} Kg
          </div>

          {/* Product Management Definition Button */}
          {onAddNewProduct && (
            <button
              type="button"
              onClick={onAddNewProduct}
              className="inline-flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition shadow-2xs active:scale-95 shrink-0 whitespace-nowrap"
              title={lang === 'km' ? 'គ្រប់គ្រងមុខទំនិញសម្រាប់ក្រុមហ៊ុននេះ' : 'Manage products for this company'}
            >
              <Settings2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
              <span>{lang === 'km' ? 'មុខទំនិញ' : 'Products'}</span>
            </button>
          )}

          {/* Add Line Item Row */}
          <button
            type="button"
            onClick={onAddItem}
            className="inline-flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition shadow-xs shadow-blue-500/20 active:scale-95 shrink-0 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
            <span>{lang === 'km' ? 'បន្ថែមជួរ' : 'Add Row'}</span>
          </button>
        </div>
      </div>

      {/* Mobile Fluid Responsive Cards (Active on mobile screens < sm) */}
      <div className="sm:hidden space-y-3">
        {items.length === 0 ? (
          <div className="py-8 text-center text-slate-400 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
            <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-xs font-medium">
              {lang === 'km' ? 'មិនទាន់មានមុខទំនិញនៅឡើយ។ សូមចុច "បន្ថែមជួរ"' : 'No items added. Tap "Add Row" above.'}
            </p>
          </div>
        ) : (
          items.map((item, index) => (
            <div
              key={item.id}
              className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs space-y-2.5"
            >
              {/* Row Header: # Index + Delete Button */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs">
                  {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => onRemoveItem(item.id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="Remove item"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>

              {/* Product Picker */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                  {lang === 'km' ? 'មុខទំនិញ' : 'Product'}
                </label>
                <div className="flex items-center space-x-2">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.productNameEn} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <ProductDropdown
                      selectedProductId={item.productId}
                      products={availableProducts}
                      onChange={(newProdId) => onProductChange(item.id, newProdId)}
                      lang={lang}
                    />
                  </div>
                </div>
              </div>

              {/* Specs Badge */}
              <div className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-lg border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 block">{lang === 'km' ? 'ខ្នាត/ចំណុះ' : 'Packaging'}</span>
                  <span className="font-semibold text-slate-700">{item.packagingSpec || '-'}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">{lang === 'km' ? 'ទម្ងន់១ឯកតា' : 'Unit Weight'}</span>
                  <span className="font-bold text-slate-800">{item.unitWeightKg > 0 ? `${item.unitWeightKg.toFixed(2)} kg` : '-'}</span>
                </div>
              </div>

              {/* Quantity Input and Unit */}
              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    {lang === 'km' ? 'ចំនួន' : 'Quantity'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="any"
                    value={item.quantity === 0 ? '' : item.quantity}
                    onChange={(e) => onQuantityChange(item.id, parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full text-center py-2 px-3 bg-white border border-slate-300 hover:border-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/15 rounded-xl font-semibold text-slate-900 outline-none transition shadow-2xs placeholder:text-slate-400 placeholder:font-normal text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    {lang === 'km' ? 'ឯកតា' : 'Unit'}
                  </label>
                  <div className="h-9 sm:h-10 flex items-center justify-center rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
                    {item.unit || '-'}
                  </div>
                </div>
              </div>

              {/* Calculated Weight Summary Box */}
              <div className="bg-blue-50/80 border border-blue-200/60 rounded-xl p-2.5 flex items-center justify-between text-xs">
                <span className="font-semibold text-blue-900">{lang === 'km' ? 'ទម្ងន់សរុប (Total)' : 'Total Weight'}:</span>
                <div className="text-right">
                  <span className="font-extrabold text-blue-900 text-sm">
                    {item.totalWeightKg.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg
                  </span>
                  <span className="text-[10px] text-blue-700 block font-medium">
                    ({item.totalWeightTon.toFixed(3)} Ton)
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop & Tablet Table Container (hidden on mobile phones < sm) */}
      <div className="hidden sm:block overflow-x-auto -mx-4 sm:-mx-5 px-4 sm:px-5 pb-0">
        <table className="w-full text-left text-sm min-w-[640px]">
          <thead>
            <tr className="border-b border-slate-200 text-slate-700 text-xs font-bold uppercase bg-slate-50/90 tracking-wide">
              <th className="py-3 px-2 w-8 text-center font-bold text-slate-700">#</th>
              <th className="py-3 px-3 min-w-[240px] font-bold text-slate-700">
                {lang === 'km' ? 'ឈ្មោះផលិតផល' : 'Product Name'}
              </th>
              <th className="py-3 px-2.5 min-w-[100px] font-bold text-slate-700">
                {lang === 'km' ? 'ខ្នាត/ចំណុះ' : 'Packaging'}
              </th>
              <th className="py-3 px-2 text-center whitespace-nowrap font-bold text-slate-700">
                {lang === 'km' ? 'ទម្ងន់១ឯកតា' : 'Unit Kg'}
              </th>
              <th className="py-3 px-2.5 min-w-[90px] text-center font-bold text-slate-700">
                {lang === 'km' ? 'ចំនួន' : 'Quantity'} *
              </th>
              <th className="py-3 px-2 text-center whitespace-nowrap font-bold text-slate-700">
                {lang === 'km' ? 'ឯកតា' : 'Unit'}
              </th>
              <th className="py-3 px-2.5 text-right font-bold text-slate-700 min-w-[95px] whitespace-nowrap">
                {lang === 'km' ? 'គណនា (Kg)' : 'Total Kg'}
              </th>
              <th className="py-3 px-2.5 text-right font-bold text-slate-700 min-w-[75px] whitespace-nowrap">
                {lang === 'km' ? 'តោន (Ton)' : 'Ton'}
              </th>
              <th className="py-3 px-2 w-8 text-center"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-10 text-center text-slate-400">
                  <Package className="w-9 h-9 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm font-medium">
                    {lang === 'km' ? 'មិនទាន់មានមុខទំនិញនៅឡើយ។ សូមចុចប៊ូតុង "បន្ថែមជួរ"' : 'No items added. Click "Add Row" to begin.'}
                  </p>
                </td>
              </tr>
            ) : (
              items.map((item, index) => {
                return (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition">
                    {/* Row Index */}
                    <td className="py-3 px-2.5 text-center font-bold text-slate-500 text-xs">
                      {index + 1}
                    </td>

                    {/* Product Selector with Image Thumbnail and Rich Custom Dropdown */}
                    <td className="py-3 px-3">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center shadow-2xs">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.productNameEn}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <ProductDropdown
                          selectedProductId={item.productId}
                          products={availableProducts}
                          onChange={(newProdId) => onProductChange(item.id, newProdId)}
                          lang={lang}
                        />
                      </div>
                    </td>

                    {/* Packaging */}
                    <td className="py-3 px-3 text-xs text-slate-600 font-medium whitespace-nowrap">
                      {item.packagingSpec || '-'}
                    </td>

                    {/* Unit Weight */}
                    <td className="py-3 px-3 text-center font-bold text-slate-800 whitespace-nowrap">
                      {item.unitWeightKg > 0 ? item.unitWeightKg.toFixed(2) : '-'}
                    </td>

                    {/* Quantity */}
                    <td className="py-3 px-3 text-center">
                      <input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="any"
                        value={item.quantity === 0 ? '' : item.quantity}
                        onChange={(e) => onQuantityChange(item.id, parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="w-24 text-center py-2 px-3 bg-white border border-slate-300 hover:border-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/15 rounded-xl font-semibold text-slate-900 outline-none transition shadow-2xs placeholder:text-slate-400 placeholder:font-normal text-xs sm:text-sm"
                      />
                    </td>

                    {/* Unit */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700">
                        {item.unit || '-'}
                      </span>
                    </td>

                    {/* Total Kg */}
                    <td className="py-3 px-3 text-right font-bold text-blue-900 whitespace-nowrap">
                      {item.totalWeightKg.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Total Ton */}
                    <td className="py-3 px-3 text-right font-bold text-slate-700 whitespace-nowrap">
                      {item.totalWeightTon.toFixed(3)}
                    </td>

                    {/* Delete */}
                    <td className="py-3 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => onRemoveItem(item.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
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
              <td className="py-3.5 px-3 text-right text-sm sm:text-base text-blue-700 whitespace-nowrap">
                {totalWarehouseKg.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                <span className="text-xs font-normal text-slate-500">Kg</span>
              </td>
              <td className="py-3.5 px-3 text-right text-xs sm:text-sm text-slate-700 whitespace-nowrap">
                {(totalWarehouseKg / 1000).toFixed(3)}{' '}
                <span className="text-xs font-normal text-slate-500">Ton</span>
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
