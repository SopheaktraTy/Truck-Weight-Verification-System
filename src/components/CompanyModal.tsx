import React, { useState, useRef } from 'react';
import { Company } from '../types';
import { uploadImage } from '../lib/storage';
import { X, Upload, Building2, Image as ImageIcon, Loader2 } from 'lucide-react';

interface CompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (company: Partial<Company>) => Promise<void>;
  lang: 'km' | 'en';
}

export const CompanyModal: React.FC<CompanyModalProps> = ({
  isOpen,
  onClose,
  onSave,
  lang,
}) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      // Generate instant local preview
      const localPreview = URL.createObjectURL(file);
      setPreviewUrl(localPreview);

      // Upload file to Supabase or Base64
      const uploadedUrl = await uploadImage(file, 'companies');
      setLogoUrl(uploadedUrl);
    } catch (err) {
      console.error('Failed to upload company logo:', err);
      alert('Failed to upload logo image.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) {
      alert(lang === 'km' ? 'សូមបញ្ចូលកូដ និងឈ្មោះក្រុមហ៊ុន!' : 'Please enter company code and name!');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        description: description.trim(),
        logo_url: logoUrl || previewUrl,
      });

      // Reset
      setCode('');
      setName('');
      setDescription('');
      setLogoUrl('');
      setPreviewUrl('');
      onClose();
    } catch (err: any) {
      alert('Error saving company: ' + (err.message || err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-base">
              {lang === 'km' ? 'បង្កើតក្រុមហ៊ុនថ្មី' : 'Create New Company'}
            </h3>
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
          {/* Logo Upload Box */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">
              {lang === 'km' ? 'រូបសញ្ញាក្រុមហ៊ុន (Logo)' : 'Company Logo Image'}
            </label>
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 rounded-xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden flex-shrink-0 relative group">
                {previewUrl || logoUrl ? (
                  <img
                    src={previewUrl || logoUrl}
                    alt="Logo Preview"
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
                  accept="image/png, image/jpeg, image/webp, image/svg+xml"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition border border-slate-300"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{lang === 'km' ? 'ជ្រើសរើសរូបភាព...' : 'Upload Logo...'}</span>
                </button>
                <p className="text-[11px] text-slate-400 mt-1">
                  PNG, JPG, or WebP. Max 5MB.
                </p>
              </div>
            </div>
          </div>

          {/* Company Code */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              {lang === 'km' ? 'កូដក្រុមហ៊ុន (Code)' : 'Company Code'} *
            </label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. HB, PCAM, CB"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          {/* Company Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              {lang === 'km' ? 'ឈ្មោះក្រុមហ៊ុន (Name)' : 'Company Name'} *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Hanuman Beverages Co., Ltd."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              {lang === 'km' ? 'ពិពណ៌នា (Description)' : 'Description'}
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Warehouse 1, Phnom Penh"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-700 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
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
              <span>{lang === 'km' ? 'រក្សាទុក' : 'Save Company'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
