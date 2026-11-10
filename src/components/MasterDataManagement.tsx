import React, { useState } from 'react';
import { Company, Product } from '../types';
import { Building2, Package, Plus, Trash2, Image as ImageIcon } from 'lucide-react';
import { CompanyModal } from './CompanyModal';
import { ProductModal } from './ProductModal';

interface MasterDataManagementProps {
  companies: Company[];
  products: Product[];
  onAddCompany: (company: Partial<Company>) => Promise<void>;
  onDeleteCompany: (id: string) => Promise<void>;
  onAddProduct: (product: Partial<Product>) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
  lang: 'km' | 'en';
}

export const MasterDataManagement: React.FC<MasterDataManagementProps> = ({
  companies,
  products,
  onAddCompany,
  onDeleteCompany,
  onAddProduct,
  onDeleteProduct,
  lang,
}) => {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(companies[0]?.id || '');
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId) || companies[0];
  const companyProducts = products.filter((p) => p.company_id === selectedCompany?.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            {lang === 'km' ? 'គ្រប់គ្រងក្រុមហ៊ុន និងមុខទំនិញ' : 'Company & Product Management'}
          </h2>
          <p className="text-xs text-slate-500">
            {lang === 'km' 
              ? 'បង្កើតក្រុមហ៊ុន ផ្ទុករូបសញ្ញា (Logo) និងបន្ថែមមុខទំនិញជាមួយរូបភាព' 
              : 'Add companies with custom logos and products with photos'}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setIsCompanyModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-blue-500/20 transition"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>{lang === 'km' ? 'បន្ថែមក្រុមហ៊ុន' : 'Add Company'}</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Companies List */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-900 text-sm uppercase">
                {lang === 'km' ? 'បញ្ជីក្រុមហ៊ុន' : 'Companies'} ({companies.length})
              </h3>
            </div>
          </div>

          <div className="space-y-2">
            {companies.map((c) => {
              const isSelected = c.id === selectedCompany?.id;
              const count = products.filter((p) => p.company_id === c.id).length;
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCompanyId(c.id)}
                  className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {c.logo_url ? (
                        <img
                          src={c.logo_url}
                          alt={c.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Building2 className="w-6 h-6 text-slate-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-slate-900 text-sm">
                          {c.code}
                        </span>
                        <span className="text-xs text-slate-500 font-medium truncate">
                          {c.name}
                        </span>
                      </div>
                      <span className="text-[11px] text-blue-600 font-semibold block mt-0.5">
                        {count} {lang === 'km' ? 'មុខទំនិញ' : 'products'}
                      </span>
                    </div>
                  </div>

                  {companies.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete company ${c.name}?`)) {
                          onDeleteCompany(c.id);
                        }
                      }}
                      className="p-1.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Delete company"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Products of Selected Company */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
                {selectedCompany?.logo_url ? (
                  <img
                    src={selectedCompany.logo_url}
                    alt={selectedCompany.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Building2 className="w-5 h-5 text-slate-400" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {lang === 'km' ? 'មុខទំនិញរបស់ក្រុមហ៊ុន៖' : 'Products of:'}{' '}
                  <span className="text-blue-600">{selectedCompany?.name} ({selectedCompany?.code})</span>
                </h3>
                <p className="text-xs text-slate-500">
                  {companyProducts.length} {lang === 'km' ? 'មុខទំនិញបានចុះបញ្ជី' : 'registered products'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsProductModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs sm:text-sm font-semibold transition self-start sm:self-auto"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>{lang === 'km' ? 'បន្ថែមមុខទំនិញថ្មី' : 'Add New Product'}</span>
            </button>
          </div>

          {/* Products Grid / Cards */}
          {companyProducts.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Package className="w-12 h-12 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-medium">
                {lang === 'km' ? 'មិនទាន់មានមុខទំនិញសម្រាប់ក្រុមហ៊ុននេះនៅឡើយទេ' : 'No products found for this company.'}
              </p>
              <button
                type="button"
                onClick={() => setIsProductModalOpen(true)}
                className="mt-3 text-xs font-bold text-blue-600 hover:underline"
              >
                + {lang === 'km' ? 'បន្ថែមមុខទំនិញឥឡូវនេះ' : 'Add product now'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {companyProducts.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center space-x-3.5 p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/40 hover:bg-white transition shadow-sm group"
                >
                  {/* Product Image Thumbnail */}
                  <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center shadow-xs">
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt={p.name_en}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-slate-300" />
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-900 text-sm truncate">
                      {p.name_kh} <span className="font-normal text-slate-500">({p.name_en})</span>
                    </h4>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {p.packaging_spec} • {p.unit}
                    </p>
                    <div className="flex items-center space-x-2 mt-1.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-blue-100 text-blue-800">
                        {p.unit_weight_kg.toFixed(2)} Kg / {p.unit}
                      </span>
                    </div>
                  </div>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Delete product ${p.name_en}?`)) {
                        onDeleteProduct(p.id);
                      }
                    }}
                    className="p-1.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Delete product"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <CompanyModal
        isOpen={isCompanyModalOpen}
        onClose={() => setIsCompanyModalOpen(false)}
        onSave={onAddCompany}
        lang={lang}
      />

      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSave={onAddProduct}
        company={selectedCompany}
        lang={lang}
      />
    </div>
  );
};
