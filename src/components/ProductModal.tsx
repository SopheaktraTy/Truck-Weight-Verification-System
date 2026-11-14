import React, { useState, useEffect, useRef } from 'react';
import { Product, Company } from '../types';
import { uploadImage, deleteImage } from '../lib/storage';
import { X, Upload, Package, Image as ImageIcon, Loader2 } from 'lucide-react';
import { CustomSelect, SelectOption } from './CustomSelect';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Partial<Product>) => Promise<void>;
  company: Company | undefined;
  initialProduct?: Product | null;
  lang: 'km' | 'en';
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  company,
  initialProduct,
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

  useEffect(() => {
    if (initialProduct) {
      setNameKh(initialProduct.name_kh || '');
      setNameEn(initialProduct.name_en || '');
      setPackagingSpec(initialProduct.packaging_spec || 'Sleek 250ml x 24 Can');
      setUnit(initialProduct.unit || 'កេស');
      setUnitWeightKg(initialProduct.unit_weight_kg || '');
      setImageUrl(initialProduct.image_url || '');
      setPreviewUrl(initialProduct.image_url || '');
    } else {
      setNameKh('');
      setNameEn('');
      setPackagingSpec('Sleek 250ml x 24 Can');
      setUnit('កេស');
      setUnitWeightKg('');
      setImageUrl('');
      setPreviewUrl('');
    }
  }, [initialProduct, isOpen]);

  if (!isOpen || !company) return null;

  const handleClose = () => {
    // If an image was uploaded during this session but not saved, clean it up
    if (imageUrl && imageUrl !== initialProduct?.image_url) {
      deleteImage(imageUrl);
    }
    onClose();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const localPreview = URL.createObjectURL(file);
      setPreviewUrl(localPreview);

      // Upload new image
      const uploadedUrl = await uploadImage(file, 'products');

      // If user uploaded a previous image in this same session, delete that intermediate file
      if (imageUrl && imageUrl !== initialProduct?.image_url && imageUrl !== uploadedUrl) {
        deleteImage(imageUrl);
      }

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

    if (isUploading) {
      alert(lang === 'km' ? 'សូមរង់ចាំការ Upload រូបភាពឱ្យចប់សិន!' : 'Please wait for image upload to complete!');
      return;
    }

    try {
      setIsSubmitting(true);
      const cleanImage = imageUrl && !imageUrl.startsWith('blob:') ? imageUrl : (initialProduct?.image_url || '');

      // If replacing an existing image with a new one, delete the old image from Supabase storage
      if (initialProduct?.image_url && cleanImage && cleanImage !== initialProduct.image_url) {
        deleteImage(initialProduct.image_url);
      }

      await onSave({
        ...(initialProduct?.id ? { id: initialProduct.id } : {}),
        company_id: company.id,
        name_kh: nameKh.trim(),
        name_en: nameEn.trim(),
        packaging_spec: packagingSpec.trim(),
        unit: unit.trim(),
        unit_weight_kg: Number(unitWeightKg),
        image_url: cleanImage,
        display_order: initialProduct?.display_order ?? 10,
      });

      onClose();
    } catch (err: any) {
      alert('Error saving product: ' + (err.message || err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEditing = Boolean(initialProduct?.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div className="flex items-center space-x-2">
            <Package className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {isEditing
                  ? (lang === 'km' ? 'កែប្រែព័ត៌មានមុខទំនិញ' : 'Edit Product')
                  : (lang === 'km' ? 'បន្ថែមមុខទំនិញថ្មី' : 'Add New Product')}
              </h3>
              <p className="text-xs text-slate-500">
                {lang === 'km' ? `ក្រុមហ៊ុន៖ ${company.name} (${company.code})` : `Company: ${company.name} (${company.code})`}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Product Image Upload */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">
              {lang === 'km' ? 'រូបភាពទំនិញ (Product Image)' : 'Product Image'}
            </label>
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 rounded-xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden shrink-0 relative group">
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
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                {lang === 'km' ? 'ឈ្មោះជាភាសាខ្មែរ (KH)' : 'Name in Khmer'} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={nameKh}
                onChange={(e) => setNameKh(e.target.value)}
                placeholder="e.g. គីងកុង, រេម"
                className="w-full px-3.5 py-2 sm:py-2.5 bg-white border border-slate-300 hover:border-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/15 rounded-xl text-slate-900 font-medium text-xs sm:text-sm outline-none transition placeholder:text-slate-400 placeholder:font-normal"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                {lang === 'km' ? 'ឈ្មោះជាភាសាអង់គ្លេស (EN)' : 'Name in English'} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="e.g. King Kong, RAM"
                className="w-full px-3.5 py-2 sm:py-2.5 bg-white border border-slate-300 hover:border-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/15 rounded-xl text-slate-900 font-medium text-xs sm:text-sm outline-none transition placeholder:text-slate-400 placeholder:font-normal"
              />
            </div>
          </div>

          {/* Packaging & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                {lang === 'km' ? 'ខ្នាត/ចំណុះ (Packaging Spec)' : 'Packaging Spec'} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={packagingSpec}
                onChange={(e) => setPackagingSpec(e.target.value)}
                placeholder="e.g. Sleek 250ml x 24 Can"
                className="w-full px-3.5 py-2 sm:py-2.5 bg-white border border-slate-300 hover:border-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/15 rounded-xl text-slate-900 font-medium text-xs sm:text-sm outline-none transition placeholder:text-slate-400 placeholder:font-normal"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                {lang === 'km' ? 'ឯកតា (Unit)' : 'Unit'} <span className="text-rose-500">*</span>
              </label>
              <CustomSelect
                value={unit}
                options={[
                  { value: 'កេស', label: 'កេស (Case)' },
                  { value: 'ប៉ាឡែត', label: 'ប៉ាឡែត (Pallet)' },
                  { value: 'ដប', label: 'ដប (Bottle)' },
                  { value: 'កំប៉ុង', label: 'កំប៉ុង (Can)' },
                ]}
                onChange={setUnit}
                className="w-full"
              />
            </div>
          </div>

          {/* Unit Weight */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              {lang === 'km' ? 'ទម្ងន់១ឯកតា គិតជាគីឡូ (Unit Weight in Kg)' : 'Unit Weight in Kg'} <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.001"
                min="0.001"
                required
                value={unitWeightKg}
                onChange={(e) => setUnitWeightKg(e.target.value === '' ? '' : parseFloat(e.target.value))}
                placeholder="e.g. 6.65, 19.7"
                className="w-full pl-3.5 pr-12 py-2 sm:py-2.5 bg-white border border-slate-300 hover:border-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/15 rounded-xl text-slate-900 font-semibold text-xs sm:text-sm outline-none transition placeholder:text-slate-400 placeholder:font-normal"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                Kg
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {lang === 'km' ? 'ទម្ងន់សុទ្ធសម្រាប់គណនាទម្ងន់ទំនិញក្នុងរថយន្ត' : 'Weight per package used for scale reconciliation'}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              {lang === 'km' ? 'បោះបង់' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="px-4 py-2 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-500/20 transition flex items-center space-x-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>
                {isEditing
                  ? (lang === 'km' ? 'រក្សាទុកការកែប្រែ' : 'Save Changes')
                  : (lang === 'km' ? 'បន្ថែមមុខទំនិញ' : 'Add Product')}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
