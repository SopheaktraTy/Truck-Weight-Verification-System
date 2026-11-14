import React from 'react';
import { Company } from '../types';
import { Building2, Check, Plus, Edit2 } from 'lucide-react';

interface CompanySelectorProps {
  companies: Company[];
  selectedCompanyId: string;
  onSelectCompany: (companyId: string) => void;
  onAddCompany: () => void;
  onEditCompany: (company: Company) => void;
  lang: 'km' | 'en';
}

export const CompanySelector: React.FC<CompanySelectorProps> = ({
  companies,
  selectedCompanyId,
  onSelectCompany,
  onAddCompany,
  onEditCompany,
  lang,
}) => {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <Building2 className="w-5 h-5 text-blue-600 shrink-0" />
          <h2 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wide">
            {lang === 'km' ? 'សូមជ្រើសរើសក្រុមហ៊ុន' : 'Select Company'}
          </h2>
        </div>

        {/* Add Company Button */}
        <button
          type="button"
          onClick={onAddCompany}
          className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition"
          title={lang === 'km' ? 'បន្ថែមក្រុមហ៊ុនថ្មី' : 'Add New Company'}
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span>{lang === 'km' ? 'បន្ថែមក្រុមហ៊ុន' : 'Add Company'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {companies.map((c) => {
          const isSelected = c.id === selectedCompanyId;
          return (
            <div
              key={c.id}
              onClick={() => onSelectCompany(c.id)}
              className={`group relative flex items-center p-3 sm:p-3.5 rounded-xl border-2 transition text-left cursor-pointer ${
                isSelected
                  ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200 mr-3 flex items-center justify-center">
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

              <div className="flex-1 min-w-0 pr-2">
                <div className="flex items-center space-x-1.5">
                  <span className="text-sm sm:text-base font-bold text-slate-900">
                    {c.code}
                  </span>
                  <span className="text-xs text-slate-500 font-medium truncate">
                    ({c.name})
                  </span>
                </div>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  {c.description || (c.code === 'HB' ? 'Hanuman Beverages' : 'PCAM International')}
                </p>
              </div>

              <div className="flex items-center space-x-1.5 shrink-0">
                {/* Edit Company Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditCompany(c);
                  }}
                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-100/60 rounded-lg transition"
                  title={lang === 'km' ? 'កែសម្រួលក្រុមហ៊ុន' : 'Edit Company'}
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
