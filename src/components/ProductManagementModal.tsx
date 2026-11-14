import React, { useState } from 'react';
import { Product, Company } from '../types';
import { ProductModal } from './ProductModal';
import {
  X,
  Package,
  Plus,
  Edit2,
  Trash2,
  Search,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

interface ProductManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: Company | undefined;
  products: Product[]; // products already filtered for this company
  onSaveProduct: (productData: Partial<Product>) => Promise<void>;
  onDeleteProduct: (productId: string) => Promise<void>;
  lang: 'km' | 'en';
}

export const ProductManagementModal: React.FC<ProductManagementModalProps> = ({
  isOpen,
  onClose,
  company,
  products,
  onSaveProduct,
  onDeleteProduct,
  lang,
}) => {
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen || !company) return null;

  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.name_kh.toLowerCase().includes(q) ||
      p.name_en.toLowerCase().includes(q) ||
      p.packaging_spec.toLowerCase().includes(q)
    );
  });

  const handleOpenAddForm = () => {
    setEditingProduct(null);
    setIsProductFormOpen(true);
  };

  const handleOpenEditForm = (product: Product) => {
    setEditingProduct(product);
    setIsProductFormOpen(true);
  };

  const handleDelete = async (product: Product) => {
    const confirm = window.confirm(
      lang === 'km'
        ? `តើអ្នកប្រាកដជាចង់លុប "${product.name_kh}" (${product.name_en}) មែនទេ?\n\nសកម្មភាពនេះមិនអាចដកវិញបានទេ!`
        : `Are you sure you want to delete "${product.name_en}" (${product.name_kh})?\n\nThis action cannot be undone!`
    );
    if (!confirm) return;

    setDeletingId(product.id);
    try {
      await onDeleteProduct(product.id);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaveFromForm = async (productData: Partial<Product>) => {
    await onSaveProduct(productData);
    setIsProductFormOpen(false);
    setEditingProduct(null);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Panel */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 pointer-events-none">
        <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col pointer-events-auto">

          {/* ── Header ── */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/80 shrink-0">
            <div className="flex items-center space-x-3 min-w-0">
              {company.logo_url ? (
                <img
                  src={company.logo_url}
                  alt={company.code}
                  className="w-9 h-9 rounded-xl object-contain border border-slate-200 bg-white shrink-0"
                />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
              )}
              <div className="min-w-0">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base truncate">
                  {lang === 'km' ? 'គ្រប់គ្រងមុខទំនិញ' : 'Product Management'}
                </h3>
                <p className="text-xs text-slate-500 truncate">
                  {company.name} ({company.code}) &nbsp;·&nbsp;{' '}
                  {products.length}{' '}
                  {lang === 'km' ? 'មុខទំនិញ' : 'products'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0 ml-3">
              {/* Add product button */}
              <button
                type="button"
                onClick={handleOpenAddForm}
                className="inline-flex items-center space-x-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span className="hidden sm:inline">
                  {lang === 'km' ? 'បន្ថែមថ្មី' : 'Add New'}
                </span>
              </button>

              {/* Close button */}
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* ── Search bar ── */}
          <div className="px-5 sm:px-6 py-3 border-b border-slate-100 bg-white shrink-0">
            <div className="relative">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="search"
                placeholder={
                  lang === 'km'
                    ? 'ស្វែងរកមុខទំនិញ...'
                    : 'Search products...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2 sm:py-2.5 bg-white border border-slate-300 hover:border-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/15 rounded-xl text-xs sm:text-sm text-slate-900 font-medium outline-none transition shadow-2xs placeholder:text-slate-400 placeholder:font-normal"
              />
            </div>
          </div>

          {/* ── Product List ── */}
          <div className="flex-1 overflow-y-auto">
            {filteredProducts.length === 0 ? (
              <div className="py-16 flex flex-col items-center text-slate-400">
                <Package className="w-12 h-12 mb-3 text-slate-200" />
                <p className="font-semibold text-sm">
                  {searchQuery
                    ? (lang === 'km' ? 'រកមិនឃើញ' : 'No results found')
                    : (lang === 'km'
                        ? 'មិនទាន់មានមុខទំនិញ'
                        : 'No products yet')}
                </p>
                {!searchQuery && (
                  <p className="text-xs mt-1">
                    {lang === 'km'
                      ? 'ចុចប៊ូតុង "បន្ថែមថ្មី" ដើម្បីចាប់ផ្តើម'
                      : 'Click "Add New" to get started'}
                  </p>
                )}
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {filteredProducts.map((product) => (
                  <li
                    key={product.id}
                    className="flex items-center space-x-4 px-5 sm:px-6 py-3.5 hover:bg-slate-50/70 transition group"
                  >
                    {/* Thumbnail */}
                    <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name_en}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="w-5 h-5 text-slate-400" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 text-sm truncate">
                        {product.name_kh}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {product.name_en}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                        <span className="text-[11px] text-slate-400">
                          {product.packaging_spec}
                        </span>
                        <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[11px] font-semibold">
                          {product.unit}
                        </span>
                        <span className="text-[11px] font-bold text-blue-700">
                          {product.unit_weight_kg} kg
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-1 shrink-0 opacity-70 group-hover:opacity-100 transition">
                      <button
                        type="button"
                        onClick={() => handleOpenEditForm(product)}
                        className="p-2 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                        title={lang === 'km' ? 'កែប្រែ' : 'Edit'}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(product)}
                        disabled={deletingId === product.id}
                        className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                        title={lang === 'km' ? 'លុប' : 'Delete'}
                      >
                        {deletingId === product.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* ── Footer ── */}
          <div className="px-5 sm:px-6 py-3.5 border-t border-slate-100 bg-slate-50/60 shrink-0 flex items-center justify-between gap-3">
            <div className="flex items-center space-x-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>
                {lang === 'km'
                  ? 'ការលុបផ្លាស់ប្តូរត្រូវបានកត់ត្រានៅ Supabase ភ្លាមៗ'
                  : 'Changes are saved to Supabase immediately'}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition"
            >
              {lang === 'km' ? 'បិទ' : 'Close'}
            </button>
          </div>
        </div>
      </div>

      {/* Sub-modal: Add / Edit product form */}
      <ProductModal
        isOpen={isProductFormOpen}
        onClose={() => {
          setIsProductFormOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveFromForm}
        company={company}
        initialProduct={editingProduct}
        lang={lang}
      />
    </>
  );
};
