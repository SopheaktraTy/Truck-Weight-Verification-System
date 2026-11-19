import React, { useState } from 'react';
import { TruckRecord, Company, Product } from '../types';
import { Search, Download, CheckCircle2, AlertTriangle, FileSpreadsheet, Scale, Edit2, Trash2, X, Check } from 'lucide-react';
import { formatRecordDateTime } from '../lib/calculator';
import { CustomSelect, SelectOption } from './CustomSelect';
import { RecordDetailModal } from './RecordDetailModal';

interface ReportTableProps {
  records: TruckRecord[];
  companies?: Company[];
  products?: Product[];
  lang: 'km' | 'en';
  isAdmin?: boolean;
  onEditRecord?: (record: TruckRecord) => void;
  onDeleteRecord?: (recordId: string) => Promise<void>;
}

export const ReportTable: React.FC<ReportTableProps> = ({
  records,
  companies,
  products = [],
  lang,
  isAdmin = false,
  onEditRecord,
  onDeleteRecord,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedCompany, setSelectedCompany] = useState<string>('ALL');

  // Excel Export Modal States
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportDateMode, setExportDateMode] = useState<'all' | 'single' | 'range'>('range');
  const [exportSingleDate, setExportSingleDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [exportDateFrom, setExportDateFrom] = useState<string>('');
  const [exportDateTo, setExportDateTo] = useState<string>('');
  const [exportStatus, setExportStatus] = useState<string>('ALL');
  const [exportCompany, setExportCompany] = useState<string>('ALL');

  // Modal states
  const [detailRecord, setDetailRecord] = useState<TruckRecord | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<TruckRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  // Calculate filtered records for export
  const recordsToExport = React.useMemo(() => {
    return records.filter((r) => {
      // 1. Date filter
      if (exportDateMode === 'single' && exportSingleDate) {
        if (r.record_date !== exportSingleDate) return false;
      } else if (exportDateMode === 'range') {
        if (exportDateFrom && r.record_date < exportDateFrom) return false;
        if (exportDateTo && r.record_date > exportDateTo) return false;
      }

      // 2. Status filter
      if (exportStatus !== 'ALL' && r.status !== exportStatus) return false;

      // 3. Company filter
      if (exportCompany !== 'ALL' && r.company_code !== exportCompany) return false;

      return true;
    });
  }, [records, exportDateMode, exportSingleDate, exportDateFrom, exportDateTo, exportStatus, exportCompany]);

  const handleExportExcel = () => {
    if (recordsToExport.length === 0) {
      alert(lang === 'km' ? 'មិនមានទិន្នន័យក្នុងជម្រើសដែលបានជ្រើស!' : 'No records found matching selected export criteria!');
      return;
    }

    const headers = [
      'ID',
      'Date (កាលបរិច្ឆេទ)',
      'Time (ម៉ោង)',
      'Plate Number (ផ្លាកលេខ)',
      'Company (ក្រុមហ៊ុន)',
      'Scale Net (Kg)',
      'Warehouse Total (Kg)',
      'Difference (Kg)',
      'Variance (%)',
      'Tolerance (%)',
      'Status (ស្ថានភាព)',
      'Summary Message',
      'Operator (អ្នកបញ្ចូល)',
      'Driver (តៃកុងឡាន)',
    ];

    const rows = recordsToExport.map((r) => [
      r.id || '',
      r.record_date,
      r.record_time || '',
      r.plate_number,
      r.company_code || '',
      r.scale_net_kg,
      r.warehouse_total_kg,
      r.diff_kg,
      r.diff_percent,
      r.tolerance_percent ?? 0.40,
      r.status,
      `"${(r.status_message || '').replace(/"/g, '""')}"`,
      r.operator_name || '',
      r.driver_name || '',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);

    let dateSuffix = '';
    if (exportDateMode === 'single' && exportSingleDate) {
      dateSuffix = `_${exportSingleDate}`;
    } else if (exportDateMode === 'range') {
      dateSuffix = `_${exportDateFrom || 'start'}_to_${exportDateTo || 'end'}`;
    } else {
      dateSuffix = `_All_${new Date().toISOString().slice(0, 10)}`;
    }

    link.setAttribute('download', `Truck_Weight_Verification_Report${dateSuffix}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportModalOpen(false);
  };

  const confirmDelete = async () => {
    if (!recordToDelete || !onDeleteRecord || !recordToDelete.id) return;
    setIsDeleting(true);
    try {
      await onDeleteRecord(recordToDelete.id);
      setRecordToDelete(null);
    } catch (err: any) {
      alert(`Delete failed: ${err.message || err}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
        {/* Header & Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0" />
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                {lang === 'km'
                  ? 'របាយការណ៍ទម្ងន់ផលិតផលសម្រេចដឹកចេញក្រៅ'
                  : 'Truck Outbound Cargo Weight Log'}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {lang === 'km'
                ? `សរុបមាន ${filtered.length} កំណត់ត្រា (Reconciliation Log)`
                : `Total ${filtered.length} verified records`}
            </p>
          </div>

          {/* Filters - Responsive Grid/Wrap */}
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5">
            {/* Search by plate */}
            <div className="relative flex-1 sm:flex-initial sm:w-52">
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

            {/* Export to Excel Trigger Button */}
            <button
              type="button"
              onClick={() => setIsExportModalOpen(true)}
              className="inline-flex items-center justify-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition active:scale-95"
              title={lang === 'km' ? 'ជ្រើសកាលបរិច្ឆេទ និងទាញយកជា Excel' : 'Choose date and export to Excel'}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{lang === 'km' ? 'ទាញយក Excel' : 'Export Excel'}</span>
            </button>
          </div>
        </div>

        {/* Mobile Fluid Responsive Cards */}
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
              const comp = getCompanyInfo(r);
              const isZeroDiff = Math.abs(r.diff_kg) < 0.001;
              const diffPctColor = !isApproved
                ? 'text-rose-600 font-black'
                : isZeroDiff
                ? 'text-slate-500'
                : r.diff_percent > 0
                ? 'text-amber-600'
                : 'text-blue-600';

              return (
                <div
                  key={r.id || i}
                  onClick={() => setDetailRecord(r)}
                  className={`rounded-2xl p-4 border shadow-xs space-y-3.5 transition-all cursor-pointer ${
                    !isApproved
                      ? 'bg-rose-50/60 border-rose-200 hover:border-rose-300 hover:shadow-md'
                      : 'bg-white border-slate-200/90 hover:border-blue-300 hover:shadow-md'
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200/90 p-1 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
                        {comp.logo ? (
                          <img src={comp.logo} alt={comp.name} className="w-full h-full object-contain rounded-xl" />
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
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                            ±{(r.tolerance_percent ?? 0.40).toFixed(1)}%
                          </span>
                        </div>

                        <div className="flex items-center space-x-2 text-xs text-slate-500 mt-1.5">
                          <span className="font-bold text-white font-mono bg-slate-900 px-2 py-0.5 rounded-md text-xs shadow-2xs">
                            {r.plate_number}
                          </span>
                          <span>•</span>
                          <span className="text-slate-700 font-semibold text-xs">
                            {formatRecordDateTime(r.record_date, r.record_time, r.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>

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

                  {/* Weights Box */}
                  <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50/90 rounded-xl border border-slate-200/70">
                    <div className="border-r border-slate-200/70 pr-3">
                      <div className="text-[11px] font-semibold text-slate-500 flex items-center space-x-1">
                        <Scale className="w-3.5 h-3.5 text-slate-400" />
                        <span>{lang === 'km' ? 'ទម្ងន់ជញ្ជីង' : 'Scale Net'}</span>
                      </div>
                      <div className="text-base font-black text-slate-900 mt-0.5">
                        {r.scale_net_kg.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        <span className="text-xs font-normal text-slate-500 ml-1">Kg</span>
                      </div>
                    </div>

                    <div className="pl-1">
                      <div className="text-[11px] font-semibold text-slate-500 flex items-center space-x-1">
                        <span>{lang === 'km' ? 'ទម្ងន់ឃ្លាំង' : 'Warehouse Total'}</span>
                      </div>
                      <div className="text-base font-black text-blue-700 mt-0.5">
                        {r.warehouse_total_kg.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        <span className="text-xs font-normal text-slate-500 ml-1">Kg</span>
                      </div>
                    </div>
                  </div>

                  {/* Summary & Mobile Action Bar */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs font-bold ${!isApproved ? 'text-rose-600 font-black' : 'text-slate-700'}`}>
                        {r.status_message}
                      </span>
                      <span className={`text-xs font-bold ${diffPctColor}`}>
                        ({r.diff_percent > 0 ? `+${r.diff_percent.toFixed(2)}` : r.diff_percent.toFixed(2)}%)
                      </span>
                    </div>

                    {isAdmin && (
                      <div
                        className="flex items-center space-x-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {onEditRecord && (
                          <button
                            onClick={() => onEditRecord(r)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Admin Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}

                        {onDeleteRecord && (
                          <button
                            onClick={() => setRecordToDelete(r)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Admin Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden sm:block overflow-x-auto -mx-4 sm:-mx-5 px-4 sm:px-5">
          <table className="w-full text-left text-sm min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase bg-slate-50/80">
                <th className="py-2.5 px-3 whitespace-nowrap">{lang === 'km' ? 'ថ្ងៃ / ម៉ោង' : 'Date / Time'}</th>
                <th className="py-2.5 px-3 whitespace-nowrap">{lang === 'km' ? 'ផ្លាកលេខ' : 'Plate No.'}</th>
                <th className="py-2.5 px-3 whitespace-nowrap">{lang === 'km' ? 'ក្រុមហ៊ុន' : 'Company'}</th>
                <th className="py-2.5 px-3 text-right whitespace-nowrap">{lang === 'km' ? 'ទម្ងន់ជញ្ជីង (Kg)' : 'Scale Net'}</th>
                <th className="py-2.5 px-3 text-right whitespace-nowrap">{lang === 'km' ? 'ទម្ងន់ឃ្លាំង (Kg)' : 'Whs Total'}</th>
                <th className="py-2.5 px-3 text-right whitespace-nowrap">{lang === 'km' ? 'ខុសគ្នា (Kg)' : 'Diff (Kg)'}</th>
                <th className="py-2.5 px-3 text-right whitespace-nowrap">{lang === 'km' ? 'ភាគរយ (%)' : 'Diff (%)'}</th>
                <th className="py-2.5 px-3 text-center whitespace-nowrap">{lang === 'km' ? 'កម្រិតលំអៀង (%)' : 'Tolerance'}</th>
                <th className="py-2.5 px-3 text-center whitespace-nowrap">{lang === 'km' ? 'ស្ថានភាព' : 'Status'}</th>
                {isAdmin && (
                  <th className="py-2.5 px-3 text-center whitespace-nowrap">{lang === 'km' ? 'សកម្មភាព' : 'Actions'}</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 10 : 9} className="py-10 text-center text-slate-400">
                    {lang === 'km' ? 'មិនមានទិន្នន័យត្រូវស្វែងរកទេ' : 'No records found matching filters'}
                  </td>
                </tr>
              ) : (
                filtered.map((r, i) => {
                  const isApproved = r.status === 'អនុញ្ញាត';
                  const comp = getCompanyInfo(r);
                  const isZeroDiff = Math.abs(r.diff_kg) < 0.001;
                  const diffKgColor = !isApproved
                    ? 'text-rose-600'
                    : isZeroDiff
                    ? 'text-slate-500'
                    : r.diff_kg > 0
                    ? 'text-amber-600'
                    : 'text-blue-600';
                  const diffPctColor = !isApproved
                    ? 'text-rose-600'
                    : isZeroDiff
                    ? 'text-slate-500'
                    : r.diff_percent > 0
                    ? 'text-amber-600'
                    : 'text-blue-600';
                  return (
                    <tr
                      key={r.id || i}
                      onClick={() => setDetailRecord(r)}
                      className={`transition cursor-pointer ${
                        !isApproved
                          ? 'bg-rose-50/60 hover:bg-rose-100/60'
                          : 'hover:bg-blue-50/40'
                      }`}
                    >
                      <td className="py-3 px-3 text-slate-800 whitespace-nowrap text-xs sm:text-sm font-semibold">
                        {formatRecordDateTime(r.record_date, r.record_time, r.created_at)}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-xs sm:text-sm font-mono">
                          {r.plate_number}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-700 whitespace-nowrap">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/90 p-0.5 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
                            {comp.logo ? (
                              <img src={comp.logo} alt={comp.code} className="w-full h-full object-contain rounded-lg" />
                            ) : (
                              <div className="w-full h-full rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center text-[10px] font-bold">
                                {comp.code.substring(0, 2)}
                              </div>
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 text-xs sm:text-sm block">{comp.code}</span>
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
                        <span className={`font-bold ${diffKgColor}`}>
                          {r.diff_kg > 0 ? `+${r.diff_kg.toFixed(2)}` : r.diff_kg.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-bold whitespace-nowrap">
                        <span className={`font-bold ${diffPctColor}`}>
                          {r.diff_percent > 0 ? `+${r.diff_percent.toFixed(3)}` : r.diff_percent.toFixed(3)}%
                        </span>
                      </td>
                      {/* Tolerance Column */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className="inline-block px-2 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          ±{(r.tolerance_percent ?? 0.40).toFixed(1)}%
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
                      {isAdmin && (
                        <td
                          className="py-3 px-3 text-center whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-center space-x-1">
                            {onEditRecord && (
                              <button
                                type="button"
                                onClick={() => onEditRecord(r)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                title={lang === 'km' ? 'កែប្រែកំណត់ត្រា (Admin)' : 'Edit Record (Admin)'}
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            )}

                            {onDeleteRecord && (
                              <button
                                type="button"
                                onClick={() => setRecordToDelete(r)}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                title={lang === 'km' ? 'លុបកំណត់ត្រា (Admin)' : 'Delete Record (Admin)'}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Excel Export Date Selection Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 bg-emerald-50/70">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {lang === 'km' ? 'ទាញយករបាយការណ៍ជា Excel' : 'Export Report to Excel'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {lang === 'km'
                      ? 'ជ្រើសរើសកាលបរិច្ឆេទ និងលក្ខខណ្ឌដើម្បីទាញយក'
                      : 'Select date criteria and filters to export'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-4">
              {/* Date Filter Mode Tabs */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                  {lang === 'km' ? '១. ជម្រើសកាលបរិច្ឆេទ (Date Filter)' : '1. Date Selection'}
                </label>
                <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setExportDateMode('range')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition ${
                      exportDateMode === 'range'
                        ? 'bg-white text-emerald-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {lang === 'km' ? 'ចន្លោះថ្ងៃ (Range)' : 'Date Range'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setExportDateMode('single')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition ${
                      exportDateMode === 'single'
                        ? 'bg-white text-emerald-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {lang === 'km' ? 'ថ្ងៃជាក់លាក់ (Single)' : 'Specific Date'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setExportDateMode('all')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition ${
                      exportDateMode === 'all'
                        ? 'bg-white text-emerald-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {lang === 'km' ? 'គ្រប់ថ្ងៃ (All)' : 'All Dates'}
                  </button>
                </div>
              </div>

              {/* Date Inputs based on selected mode */}
              {exportDateMode === 'range' && (
                <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl animate-in fade-in duration-100">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      {lang === 'km' ? 'ចាប់ពីថ្ងៃ (From):' : 'From Date:'}
                    </label>
                    <input
                      type="date"
                      value={exportDateFrom}
                      onChange={(e) => setExportDateFrom(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      {lang === 'km' ? 'ដល់ថ្ងៃ (To):' : 'To Date:'}
                    </label>
                    <input
                      type="date"
                      value={exportDateTo}
                      onChange={(e) => setExportDateTo(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
                    />
                  </div>
                </div>
              )}

              {exportDateMode === 'single' && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl animate-in fade-in duration-100">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    {lang === 'km' ? 'ជ្រើសរើសថ្ងៃដែលចង់ទាញយក:' : 'Choose Date to Export:'}
                  </label>
                  <input
                    type="date"
                    value={exportSingleDate}
                    onChange={(e) => setExportSingleDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
                  />
                </div>
              )}

              {exportDateMode === 'all' && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-600 flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    {lang === 'km'
                      ? 'ទិន្នន័យគ្រប់កាលបរិច្ឆេទទាំងអស់នឹងត្រូវទាញយក'
                      : 'All records across all dates will be included'}
                  </span>
                </div>
              )}

              {/* Extra Filters: Status & Company */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    {lang === 'km' ? 'ក្រុមហ៊ុន:' : 'Company:'}
                  </label>
                  <CustomSelect
                    value={exportCompany}
                    options={companyOptions}
                    onChange={setExportCompany}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    {lang === 'km' ? 'ស្ថានភាព:' : 'Status:'}
                  </label>
                  <CustomSelect
                    value={exportStatus}
                    options={statusOptions}
                    onChange={setExportStatus}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Matched Count Banner */}
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-900">
                  {lang === 'km' ? 'ចំនួនកំណត់ត្រាដែលត្រូវនាំចេញ:' : 'Matched records to export:'}
                </span>
                <span className="text-sm font-black text-emerald-700 bg-white px-2.5 py-0.5 rounded-lg border border-emerald-300 shadow-2xs">
                  {recordsToExport.length} {lang === 'km' ? 'ជួរ' : 'records'}
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end space-x-2.5 px-5 sm:px-6 py-4 border-t border-slate-100 bg-slate-50/70">
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition"
              >
                {lang === 'km' ? 'បោះបង់' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleExportExcel}
                disabled={recordsToExport.length === 0}
                className="inline-flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-500/20 transition disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{lang === 'km' ? 'ទាញយក Excel ឥឡូវនេះ' : 'Download Excel File'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Detail Modal */}
      <RecordDetailModal
        record={detailRecord}
        companies={companies}
        products={products}
        isOpen={Boolean(detailRecord)}
        onClose={() => setDetailRecord(null)}
        lang={lang}
      />

      {/* Delete Confirmation Dialog */}
      {recordToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900 text-center">
              {lang === 'km' ? 'តើអ្នកប្រាកដជាចង់លុបឬ?' : 'Confirm Deletion'}
            </h4>
            <p className="text-xs text-slate-500 text-center mt-1">
              {lang === 'km'
                ? `កំណត់ត្រារថយន្ត ${recordToDelete.plate_number} នឹងត្រូវលុបចេញពីប្រព័ន្ធទាំងស្រុង។`
                : `Are you sure you want to delete truck record ${recordToDelete.plate_number}? This cannot be undone.`}
            </p>

            <div className="flex items-center space-x-2.5 mt-5">
              <button
                type="button"
                onClick={() => setRecordToDelete(null)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                {lang === 'km' ? 'បោះបង់' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
              >
                {isDeleting ? (lang === 'km' ? 'កំពុងលុប...' : 'Deleting...') : (lang === 'km' ? 'លុប' : 'Delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
