import React, { useState } from 'react';
import { TruckRecord } from '../types';
import { Search, Download, CheckCircle2, AlertTriangle } from 'lucide-react';

interface ReportTableProps {
  records: TruckRecord[];
  lang: 'km' | 'en';
}

export const ReportTable: React.FC<ReportTableProps> = ({ records, lang }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedCompany, setSelectedCompany] = useState<string>('ALL');

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
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            {lang === 'km' 
              ? 'របាយការណ៍ទម្ងន់ផលិតផលសម្រេចដឹកចេញក្រៅ' 
              : 'Truck Outbound Cargo Weight Log'}
          </h2>
          <p className="text-xs text-slate-500">
            {lang === 'km'
              ? `សរុបមាន ${filtered.length} កំណត់ត្រា (Tolerance Threshold: ±0.4%)`
              : `Total ${filtered.length} verified records`}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search by plate */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={lang === 'km' ? 'ស្វែងរកផ្លាកលេខ...' : 'Search plate...'}
              className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="py-1.5 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-700"
          >
            <option value="ALL">{lang === 'km' ? 'គ្រប់ស្ថានភាព' : 'All Status'}</option>
            <option value="អនុញ្ញាត">អនុញ្ញាត (Approved)</option>
            <option value="ត្រួតពិនិត្យ">ត្រួតពិនិត្យ (Inspect)</option>
          </select>

          {/* Company Filter */}
          <select
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
            className="py-1.5 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-700"
          >
            <option value="ALL">{lang === 'km' ? 'គ្រប់ក្រុមហ៊ុន' : 'All Companies'}</option>
            <option value="HB">HB</option>
            <option value="PCAM">PCAM</option>
          </select>

          {/* Export CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition"
          >
            <Download className="w-4 h-4" />
            <span>{lang === 'km' ? 'ទាញយក Excel/CSV' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto -mx-5 px-5">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase bg-slate-50/70">
              <th className="py-3 px-3">
                {lang === 'km' ? 'កាលបរិច្ឆេទ' : 'Date'}
              </th>
              <th className="py-3 px-3">
                {lang === 'km' ? 'ផ្លាកលេខឡាន' : 'Plate No.'}
              </th>
              <th className="py-3 px-3">
                {lang === 'km' ? 'ក្រុមហ៊ុន' : 'Company'}
              </th>
              <th className="py-3 px-3 text-right">
                {lang === 'km' ? 'ទម្ងន់ជញ្ជីង (Kg)' : 'Scale Net'}
              </th>
              <th className="py-3 px-3 text-right">
                {lang === 'km' ? 'ទម្ងន់ឃ្លាំង (Kg)' : 'Whs Total'}
              </th>
              <th className="py-3 px-3 text-right">
                {lang === 'km' ? 'ខុសគ្នា (Kg)' : 'Diff (Kg)'}
              </th>
              <th className="py-3 px-3 text-right">
                {lang === 'km' ? 'ភាគរយ (%)' : 'Diff (%)'}
              </th>
              <th className="py-3 px-3 text-center">
                {lang === 'km' ? 'ស្ថានភាព' : 'Status'}
              </th>
              <th className="py-3 px-3">
                {lang === 'km' ? 'ការសន្និដ្ឋាន' : 'Summary'}
              </th>
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
                return (
                  <tr key={r.id || i} className="hover:bg-slate-50/50 transition">
                    <td className="py-3 px-3 text-slate-600 font-medium whitespace-nowrap">
                      {r.record_date}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900 whitespace-nowrap">
                      <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200">
                        {r.plate_number}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-700">
                      {r.company_code || 'HB'}
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-slate-900">
                      {r.scale_net_kg.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-blue-700">
                      {r.warehouse_total_kg.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-right font-bold">
                      <span className={r.diff_kg >= 0 ? 'text-amber-700' : 'text-blue-700'}>
                        {r.diff_kg > 0 ? `+${r.diff_kg.toFixed(2)}` : r.diff_kg.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-bold">
                      <span className={Math.abs(r.diff_percent) > 0.4 ? 'text-rose-600' : 'text-emerald-700'}>
                        {r.diff_percent > 0 ? `+${r.diff_percent.toFixed(3)}` : r.diff_percent.toFixed(3)}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold ${
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
                    <td className="py-3 px-3 text-xs font-semibold text-slate-600">
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
