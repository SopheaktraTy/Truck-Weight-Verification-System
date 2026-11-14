import React, { useState } from 'react';
import { TruckRecord, Company } from '../types';
import { Search, Download, CheckCircle2, AlertTriangle, FileSpreadsheet, Calendar, User, Scale, Building2 } from 'lucide-react';
import { CustomSelect, SelectOption } from './CustomSelect';

interface ReportTableProps {
  records: TruckRecord[];
  companies?: Company[];
  lang: 'km' | 'en';
}

export const ReportTable: React.FC<ReportTableProps> = ({ records, companies, lang }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedCompany, setSelectedCompany] = useState<string>('ALL');

  // Helper to get company information and logo
  const getCompanyInfo = (r: TruckRecord) => {
    const comp = companies?.find(
      (c) => c.id === r.company_id || c.code === r.company_code || c.name === r.company_name
    );
    return {
      code: comp?.code || r.company_code || 'HB',
      name: comp?.name || r.company_name || comp?.code || r.company_code || 'HB',
      logo: comp?.logo_url || r.company_logo,
    };
  };

  const statusOptions: SelectOption[] = [
    { value: 'ALL', label: lang === 'km' ? 'គ្រប់ស្ថានភាព' : 'All Status' },
    { value: 'អនុញ្ញាត', label: 'អនុញ្ញាត (Approved)' },
    { value: 'ត្រួតពិនិត្យ', label: 'ត្រួតពិនិត្យ (Inspect)' },
  ];

  const companyOptions: SelectOption[] = [
    { value: 'ALL', label: lang === 'km' ? 'គ្រប់ក្រុមហ៊ុន' : 'All Companies' },
    ...(companies && companies.length > 0
      ? companies.map((c) => ({
          value: c.code,
          label: c.code,
          sublabel: c.name,
          logo: c.logo_url,
        }))
      : [
          { value: 'HB', label: 'HB', sublabel: 'Hanuman Beverages' },
          { value: 'PCAM', label: 'PCAM', sublabel: 'PCAM Trading' },
        ]),
  ];

  // Filter records
  const filtered = records.filter((r) => {
    const matchesPlate = r.plate_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'ALL' || r.status === selectedStatus;
    const matchesCompany = selectedCompany === 'ALL' || r.company_code === selectedCompany;
    return matchesPlate && matchesStatus && matchesCompany;
  });

  // Export to CSV
  const handleExportCSV = () => {
    if (filtered.length === 0) return;
    const headers = [
      'ID',
      'Date',
      'Plate Number',
      'Company',
      'Scale Net (Kg)',
      'Warehouse Total (Kg)',
      'Difference (Kg)',
      'Variance (%)',
      'Status',
      'Summary Message',
      'Operator',
    ];

    const rows = filtered.map((r) => [
      r.id || '',
      r.record_date,
      r.plate_number,
      r.company_code || '',
      r.scale_net_kg,
      r.warehouse_total_kg,
      r.diff_kg,
      r.diff_percent,
      r.status,
      `"${r.status_message}"`,
      r.operator_name || '',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Truck_Weight_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-600 shrink-0" />
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              {lang === 'km' 
                ? 'របាយការណ៍ទម្ងន់ផលិតផលសម្រេចដឹកចេញក្រៅ' 
                : 'Truck Outbound Cargo Weight Log'}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {lang === 'km'
              ? `សរុបមាន ${filtered.length} កំណត់ត្រា (Tolerance Threshold: ±0.4%)`
              : `Total ${filtered.length} verified records`}
          </p>
        </div>

        {/* Filters - Responsive Grid/Wrap */}
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5">
          {/* Search by plate */}
          <div className="relative flex-1 sm:flex-initial sm:w-56">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={lang === 'km' ? 'ស្វែងរកផ្លាកលេខ...' : 'Search plate...'}
              className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-300 hover:border-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/15 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal outline-none transition shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-2 flex-1 sm:flex-initial">
            {/* Status Filter */}
            <div className="w-1/2 sm:w-44">
              <CustomSelect
                value={selectedStatus}
                options={statusOptions}
                onChange={setSelectedStatus}
                placeholder={lang === 'km' ? 'គ្រប់ស្ថានភាព' : 'All Status'}
              />
            </div>

            {/* Company Filter */}
            <div className="w-1/2 sm:w-52">
              <CustomSelect
                value={selectedCompany}
                options={companyOptions}
                onChange={setSelectedCompany}
                placeholder={lang === 'km' ? 'គ្រប់ក្រុមហ៊ុន' : 'All Companies'}
              />
            </div>
          </div>

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center justify-center space-x-1.5 px-3.5 py-2 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>{lang === 'km' ? 'ទាញយក CSV' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {/* Mobile Fluid Responsive Cards (Active on mobile screens < sm) */}
      <div className="sm:hidden space-y-3.5">
        {filtered.length === 0 ? (
          <div className="py-8 text-center text-slate-400 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
            <p className="text-xs font-medium">
              {lang === 'km' ? 'មិនមានទិន្នន័យត្រូវស្វែងរកទេ' : 'No records found matching filters'}
            </p>
          </div>
        ) : (
          filtered.map((r, i) => {
            const isApproved = r.status === 'អនុញ្ញាត';
            const isExceeded = Math.abs(r.diff_percent) > 0.4;
            const comp = getCompanyInfo(r);

            return (
              <div
                key={r.id || i}
                className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs space-y-3.5 transition-all hover:border-slate-300"
              >
                {/* 1. Header: Prominent Company Logo, Brand Identity & Status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    {/* Big & Clear Prominent Company Logo */}
                    <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200/90 p-1 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
                      {comp.logo ? (
                        <img
                          src={comp.logo}
                          alt={comp.name}
                          className="w-full h-full object-contain rounded-xl"
                        />
                      ) : (
                        <div className="w-full h-full rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-sm font-black shadow-inner">
                          {comp.code}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                        <span className="font-bold text-slate-900 text-sm leading-tight truncate">
                          {comp.name || comp.code}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                          {comp.code}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2 text-xs text-slate-500 mt-1.5">
                        <span className="font-bold text-white font-mono bg-slate-900 px-2 py-0.5 rounded-md text-xs shadow-2xs">
                          {r.plate_number}
                        </span>
                        <span>•</span>
                        <span className="text-slate-600 font-medium text-xs">{r.record_date}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold shrink-0 border shadow-2xs ${
                      isApproved
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {isApproved ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                    )}
                    <span>{r.status}</span>
                  </span>
                </div>

                {/* 2. Weight Reconciliation Box */}
                <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50/90 rounded-xl border border-slate-200/70">
                  {/* Left: Scale Net */}
                  <div className="border-r border-slate-200/70 pr-3">
                    <div className="text-[11px] font-semibold text-slate-500 flex items-center space-x-1">
                      <Scale className="w-3.5 h-3.5 text-slate-400" />
                      <span>{lang === 'km' ? 'ទម្ងន់ជញ្ជីង' : 'Scale Net'}</span>
                    </div>
                    <div className="text-base sm:text-lg font-black text-slate-900 font-mono mt-1">
                      {r.scale_net_kg.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      <span className="text-xs font-semibold text-slate-400 ml-1">kg</span>
                    </div>
                  </div>

                  {/* Right: Warehouse Total */}
                  <div className="pl-2">
                    <div className="text-[11px] font-semibold text-blue-600 flex items-center space-x-1">
                      <Building2 className="w-3.5 h-3.5 text-blue-500" />
                      <span>{lang === 'km' ? 'ទម្ងន់ឃ្លាំង' : 'Warehouse Total'}</span>
                    </div>
                    <div className="text-base sm:text-lg font-black text-blue-700 font-mono mt-1">
                      {r.warehouse_total_kg.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      <span className="text-xs font-semibold text-blue-400 ml-1">kg</span>
                    </div>
                  </div>
                </div>

                {/* 3. Variance & Driver Details */}
                <div className="flex items-center justify-between text-xs pt-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-500 font-semibold text-xs">
                      {lang === 'km' ? 'គម្លាត:' : 'Diff:'}
                    </span>
                    <span className={`font-mono font-bold text-xs ${r.diff_kg >= 0 ? 'text-amber-700' : 'text-blue-700'}`}>
                      {r.diff_kg > 0 ? `+${r.diff_kg.toFixed(2)}` : r.diff_kg.toFixed(2)} kg
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold text-[11px] border ${
                        isExceeded
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {r.diff_percent > 0 ? `+${r.diff_percent.toFixed(3)}` : r.diff_percent.toFixed(3)}%
                    </span>
                  </div>

                  {r.driver_name && (
                    <div className="flex items-center space-x-1 text-slate-500 text-xs">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate max-w-[120px] font-medium">{r.driver_name}</span>
                    </div>
                  )}
                </div>

                {/* 4. Status Message (if any) */}
                {r.status_message && (
                  <div
                    className={`text-xs px-3 py-2 rounded-xl border font-medium ${
                      isApproved
                        ? 'bg-emerald-50/70 border-emerald-200/80 text-emerald-800'
                        : 'bg-rose-50/80 border-rose-200/80 text-rose-800 font-semibold'
                    }`}
                  >
                    {r.status_message}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Desktop & Tablet Table Container (hidden on mobile phones < sm) */}
      <div className="hidden sm:block overflow-x-auto -mx-4 sm:-mx-5 px-4 sm:px-5">
        <table className="w-full text-left text-sm min-w-[760px]">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase bg-slate-50/80">
              <th className="py-2.5 px-3 whitespace-nowrap">{lang === 'km' ? 'កាលបរិច្ឆេទ' : 'Date'}</th>
              <th className="py-2.5 px-3 whitespace-nowrap">{lang === 'km' ? 'ផ្លាកលេខ' : 'Plate No.'}</th>
              <th className="py-2.5 px-3 whitespace-nowrap">{lang === 'km' ? 'ក្រុមហ៊ុន' : 'Company'}</th>
              <th className="py-2.5 px-3 text-right whitespace-nowrap">{lang === 'km' ? 'ទម្ងន់ជញ្ជីង (Kg)' : 'Scale Net'}</th>
              <th className="py-2.5 px-3 text-right whitespace-nowrap">{lang === 'km' ? 'ទម្ងន់ឃ្លាំង (Kg)' : 'Whs Total'}</th>
              <th className="py-2.5 px-3 text-right whitespace-nowrap">{lang === 'km' ? 'ខុសគ្នា (Kg)' : 'Diff (Kg)'}</th>
              <th className="py-2.5 px-3 text-right whitespace-nowrap">{lang === 'km' ? 'ភាគរយ (%)' : 'Diff (%)'}</th>
              <th className="py-2.5 px-3 text-center whitespace-nowrap">{lang === 'km' ? 'ស្ថានភាព' : 'Status'}</th>
              <th className="py-2.5 px-3 whitespace-nowrap">{lang === 'km' ? 'ការសន្និដ្ឋាន' : 'Summary'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-10 text-center text-slate-400">
                  {lang === 'km' ? 'មិនមានទិន្នន័យត្រូវស្វែងរកទេ' : 'No records found matching filters'}
                </td>
              </tr>
            ) : (
              filtered.map((r, i) => {
                const isApproved = r.status === 'អនុញ្ញាត';
                const comp = getCompanyInfo(r);
                return (
                  <tr key={r.id || i} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-3 text-slate-600 font-medium whitespace-nowrap text-xs sm:text-sm">
                      {r.record_date}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-xs sm:text-sm font-mono">
                        {r.plate_number}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-700 whitespace-nowrap">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-9 h-9 rounded-xl bg-white border border-slate-200/90 p-0.5 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
                          {comp.logo ? (
                            <img
                              src={comp.logo}
                              alt={comp.code}
                              className="w-full h-full object-contain rounded-lg"
                            />
                          ) : (
                            <div className="w-full h-full rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center text-[11px] font-bold">
                              {comp.code.substring(0, 2)}
                            </div>
                          )}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 text-xs sm:text-sm block">{comp.code}</span>
                          {comp.name && comp.name !== comp.code && (
                            <span className="text-[11px] text-slate-500 font-normal block truncate max-w-[120px]">{comp.name}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-slate-900 whitespace-nowrap">
                      {r.scale_net_kg.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-blue-700 whitespace-nowrap">
                      {r.warehouse_total_kg.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-right font-bold whitespace-nowrap">
                      <span className={r.diff_kg >= 0 ? 'text-amber-700' : 'text-blue-700'}>
                        {r.diff_kg > 0 ? `+${r.diff_kg.toFixed(2)}` : r.diff_kg.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-bold whitespace-nowrap">
                      <span className={Math.abs(r.diff_percent) > 0.4 ? 'text-rose-600' : 'text-emerald-700'}>
                        {r.diff_percent > 0 ? `+${r.diff_percent.toFixed(3)}` : r.diff_percent.toFixed(3)}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          isApproved
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {isApproved ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5" />
                        )}
                        <span>{r.status}</span>
                      </span>
                    </td>
                    <td className="py-3 px-3 text-xs font-medium text-slate-600 max-w-[200px] truncate" title={r.status_message}>
                      {r.status_message}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
