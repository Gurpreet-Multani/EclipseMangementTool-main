import React, { useState } from 'react';
import { SaleOrder, UserProfile } from '../types';
import { downloadCsv } from '../lib/csvExport';
import {
  Download,
  X,
  FileSpreadsheet,
  CheckCircle2,
  Users,
  DollarSign,
  BarChart3,
  Calendar,
  Layers,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface WorkExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  filteredSales: SaleOrder[];
  allSales: SaleOrder[];
  leaderboardData: {
    user: UserProfile;
    installs: number;
    totalSales: number;
    cancels: number;
    installRate: number;
    commission: number;
  }[];
  allUsers: UserProfile[];
  currentScope: string;
  currentTimeframe: string;
}

export const WorkExportModal: React.FC<WorkExportModalProps> = ({
  isOpen,
  onClose,
  filteredSales,
  allSales,
  leaderboardData,
  allUsers,
  currentScope,
  currentTimeframe,
}) => {
  const [exportType, setExportType] = useState<'filtered_sales' | 'all_sales' | 'rep_performance'>('filtered_sales');
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const todayStr = new Date().toISOString().slice(0, 10);

  const handleExport = () => {
    setDownloadSuccess(null);

    if (exportType === 'filtered_sales' || exportType === 'all_sales') {
      const targetSales = exportType === 'filtered_sales' ? filteredSales : allSales;
      const filename = `Eclipse_Sales_Export_${exportType === 'filtered_sales' ? 'Filtered' : 'All'}_${todayStr}`;

      const headers = [
        'Order Number',
        'Order Date',
        'Installation Date',
        'Status',
        'Rep Name',
        'Rep Role',
        'Upline Manager',
        'Customer Name',
        'Customer Phone',
        'Customer Email',
        'Service Street Address',
        'City',
        'State',
        'Zip Code',
        'Carrier Program',
        'Speed Tier',
        'Commission Payout ($)',
        'Blitz Market',
        'Field Notes',
      ];

      const rows = targetSales.map((sale) => [
        sale.orderNumber,
        sale.orderDate,
        sale.installDate,
        sale.status.toUpperCase(),
        sale.repName,
        sale.repRole || 'Representative',
        sale.uplineManagerName || 'Direct to Founder',
        sale.customerName,
        sale.customerPhone,
        sale.customerEmail || '',
        sale.address,
        sale.city,
        sale.state,
        sale.zipCode,
        sale.ispProgram,
        sale.speedTier,
        sale.payout,
        sale.blitzName || 'Local Turf',
        sale.notes || '',
      ]);

      downloadCsv(filename, headers, rows);
      setDownloadSuccess(`Successfully exported ${targetSales.length} orders to ${filename}.csv`);
    } else {
      // Rep Performance & Leaderboard Data
      const filename = `Eclipse_Rep_Performance_${currentScope}_${currentTimeframe}_${todayStr}`;

      const headers = [
        'Rank',
        'Representative Name',
        'Role',
        'Title',
        'Email',
        'Direct Manager',
        'Verified Installs',
        'Total Sales Orders',
        'Cancelled Orders',
        'Completion Rate (%)',
        'Estimated Earned Commission ($)',
      ];

      const rows = leaderboardData.map((row, idx) => [
        idx + 1,
        row.user.displayName,
        row.user.role,
        row.user.title || 'Fiber Field Specialist',
        row.user.email,
        row.user.managerName || 'Direct to Founder',
        row.installs,
        row.totalSales,
        row.cancels,
        `${row.installRate}%`,
        row.commission,
      ]);

      downloadCsv(filename, headers, rows);
      setDownloadSuccess(`Successfully exported ${leaderboardData.length} reps' performance metrics to ${filename}.csv`);
    }

    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.6 },
    });

    setTimeout(() => {
      setDownloadSuccess(null);
    }, 4000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 max-w-xl w-full max-h-[92vh] overflow-y-auto space-y-5 shadow-2xl relative text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
              Executive Data Export
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1 flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
            <span>Export Performance & Sales CSV</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Export comprehensive field reports, verified installs, and agent performance rosters for executive audits and external payroll record keeping.
          </p>
        </div>

        {/* Success Alert */}
        {downloadSuccess && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{downloadSuccess}</span>
          </div>
        )}

        {/* Export Dataset Options */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-300 block">Select Export Dataset:</label>

          {/* Option 1: Current Filtered Sales */}
          <div
            onClick={() => setExportType('filtered_sales')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3.5 ${
              exportType === 'filtered_sales'
                ? 'bg-emerald-950/20 border-emerald-500 text-white'
                : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className={`p-2.5 rounded-xl ${exportType === 'filtered_sales' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-900 text-slate-400'}`}>
              <DollarSign className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white">Current Filtered Sales Orders</h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-emerald-400">
                  {filteredSales.length} Orders
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                Includes all orders matching your currently active search, state, ISP, agent, and status filters.
              </p>
            </div>
          </div>

          {/* Option 2: All Company Sales */}
          <div
            onClick={() => setExportType('all_sales')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3.5 ${
              exportType === 'all_sales'
                ? 'bg-emerald-950/20 border-emerald-500 text-white'
                : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className={`p-2.5 rounded-xl ${exportType === 'all_sales' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-900 text-slate-400'}`}>
              <Layers className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white">Entire Company Sales Ledger</h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-emerald-400">
                  {allSales.length} Total Orders
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                Complete database dump of all customer orders, verified carrier dispatches, payouts, and addresses across the fleet.
              </p>
            </div>
          </div>

          {/* Option 3: Agent Performance Roster */}
          <div
            onClick={() => setExportType('rep_performance')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3.5 ${
              exportType === 'rep_performance'
                ? 'bg-emerald-950/20 border-emerald-500 text-white'
                : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className={`p-2.5 rounded-xl ${exportType === 'rep_performance' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-900 text-slate-400'}`}>
              <BarChart3 className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white">Representative Performance & Rankings</h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-emerald-400">
                  {leaderboardData.length} Field Reps
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                Leaderboard metrics including rank, installs, completion rates, gross sales, and commission totals for the currently selected timeframe ({currentTimeframe}) and scope ({currentScope}).
              </p>
            </div>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleExport}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/25 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Download CSV File</span>
          </button>
        </div>
      </div>
    </div>
  );
};
