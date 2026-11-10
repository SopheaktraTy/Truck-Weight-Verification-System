import React, { useState, useRef } from 'react';
import { Product, Company } from '../types';
import { uploadImage } from '../lib/storage';
import { X, Upload, Package, Image as ImageIcon, Loader2 } from 'lucide-react';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Partial<Product>) => Promise<void>;
  company: Company | undefined;
  lang: 'km' | 'en';
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  company,
  lang,
}) => {
  const [nameKh, setNameKh] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [packagingSpec, setPackagingSpec] = useState('Sleek 250ml x 24 Can');
  const [unit, setUnit] = useState('កេស');
  const [unitWeightKg, setUnitWeightKg] = useState<number | ''>('');
  const [imageUrl, setImageUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !company) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const localPreview = URL.createObjectURL(file);
      setPreviewUrl(localPreview);

      const uploadedUrl = await uploadImage(file, 'products');
      setImageUrl(uploadedUrl);
    } catch (err) {
      console.error('Failed to upload product image:', err);
      alert('Failed to upload product image.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameKh.trim() || !nameEn.trim() || unitWeightKg === '' || Number(unitWeightKg) <= 0) {
      alert(lang === 'km' ? 'សូមបំពេញព័ត៌មានទំនិញ និងទម្ងន់ឱ្យបានត្រឹមត្រូវ!' : 'Please fill all product details and a valid weight!');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave({
        company_id: company.id,
        name_kh: nameKh.trim(),
        name_en: nameEn.trim(),
        packaging_spec: packagingSpec.trim(),
        unit: unit.trim(),
        unit_weight_kg: Number(unitWeightKg),
        image_url: imageUrl || previewUrl,
        display_order: 10,
      });

      // Reset
      setNameKh('');
      setNameEn('');
      setPackagingSpec('Sleek 250ml x 24 Can');
      setUnit('កេស');
      setUnitWeightKg('');
      setImageUrl('');
      setPreviewUrl('');
      onClose();
    } catch (err: any) {
      alert('Error saving product: ' + (err.message || err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center space-x-2">
            <Package className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {lang === 'km' ? 'បន្ថែមមុខទំនិញថ្មី' : 'Add New Product'}
              </h3>
              <p className="text-xs text-slate-500">
                {lang === 'km' ? `សម្រាប់ក្រុមហ៊ុន៖ ${company.name} (${company.code})` : `For Company: ${company.name} (${company.code})`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Product Image Upload */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">
              {lang === 'km' ? 'រូបភាពទំនិញ (Product Image)' : 'Product Image'}
            </label>
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 rounded-xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden flex-shrink-0 relative group">
                {previewUrl || imageUrl ? (
                  <img
                    src={previewUrl || imageUrl}
                    alt="Product Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="w-8 h-8 text-slate-300" />
                )}
                {isUploading && (
                  <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center text-white">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                )}
              </div>

              <div className="flex-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition border border-slate-300"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{lang === 'km' ? 'ជ្រើសរើសរូបភាព...' : 'Upload Image...'}</span>
                </button>
                <p className="text-[11px] text-slate-400 mt-1">
                  Photos of beverage can or pallet. Max 5MB.
                </p>
              </div>
            </div>
          </div>

          {/* Names Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                {lang === 'km' ? 'ឈ្មោះជាភាសាខ្មែរ (KH)' : 'Name in Khmer'} *
              </label>
              <input
                type="text"
                required
                value={nameKh}
                onChange={(e) => setNameKh(e.target.value)}
                placeholder="e.g. គីងកុង, រេម"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                {lang === 'km' ? 'ឈ្មោះជាភាសាអង់គ្លេស (EN)' : 'Name in English'} *
              </label>
              <input
                type="text"
                required
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="e.g. King Kong, RAM"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Packaging & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                {lang === 'km' ? 'ខ្នាត/ចំណុះ (Packaging Spec)' : 'Packaging Spec'} *
              </label>
              <input
                type="text"
                required
                value={packagingSpec}
                onChange={(e) => setPackagingSpec(e.target.value)}
                placeholder="e.g. Sleek 250ml x 24 Can"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white text-xs sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                {lang === 'km' ? 'ឯកតា (Unit)' : 'Unit'}
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:ring-2 focus:ring-blue-500 focus:bg-white text-xs sm:text-sm"
              >
                <option value="កេស">កេស (Case)</option>
                <option value="ប៉ាឡែត">ប៉ាឡែត (Pallet)</option>
                <option value="កំប៉ុង">កំប៉ុង (Can)</option>
              </select>
            </div>
          </div>

          {/* Unit Weight */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              {lang === 'km' ? 'ទម្ងន់១ឯកតា (Unit Weight in Kg)' : 'Weight per Unit (Kg)'} *
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.001"
                min="0.001"
                required
                value={unitWeightKg}
                onChange={(e) => setUnitWeightKg(e.target.value === '' ? '' : parseFloat(e.target.value))}
                placeholder="e.g. 6.650"
                className="w-full px-3 py-2 pr-12 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
              <span className="absolute inset-y-0 right-3 flex items-center text-xs font-bold text-slate-400">
                Kg
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {lang === 'km' ? 'ទម្ងន់នេះនឹងត្រូវប្រើសម្រាប់គណនាស្វ័យប្រវត្តក្នុងតារាងទម្ងន់។' : 'Used for automatic calculation during weighing.'}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              {lang === 'km' ? 'បោះបង់' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="inline-flex items-center space-x-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md transition disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{lang === 'km' ? 'រក្សាទុកទំនិញ' : 'Save Product'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
