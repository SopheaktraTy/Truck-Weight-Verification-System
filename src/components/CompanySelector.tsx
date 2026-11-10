import React from 'react';
import { Company } from '../types';
import { Building2, Check } from 'lucide-react';

interface CompanySelectorProps {
  companies: Company[];
  selectedCompanyId: string;
  onSelectCompany: (companyId: string) => void;
  lang: 'km' | 'en';
}

export const CompanySelector: React.FC<CompanySelectorProps> = ({
  companies,
  selectedCompanyId,
  onSelectCompany,
  lang,
}) => {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
      <div className="flex items-center space-x-2 mb-3">
        <Building2 className="w-5 h-5 text-blue-600" />
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
          {lang === 'km' ? 'សូមជ្រើសរើសក្រុមហ៊ុន' : 'Select Company'}
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {companies.map((c) => {
          const isSelected = c.id === selectedCompanyId;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelectCompany(c.id)}
              className={`relative flex items-center p-3.5 rounded-xl border-2 transition text-left ${
                isSelected
                  ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200 mr-3.5 flex items-center justify-center">
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

              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-1.5">
                  <span className="text-base font-bold text-slate-900">
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

              {isSelected && (
                <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 ml-2">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
