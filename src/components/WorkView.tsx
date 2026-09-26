import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { SaleOrder, OrderStatus } from '../types';
import {
  TrendingUp,
  Award,
  CheckCircle2,
  XCircle,
  Calendar,
  AlertTriangle,
  DollarSign,
  Filter,
  Users,
  Search,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  ArrowUpRight,
  Zap,
  Activity,
  Plus,
  BarChart3,
  Scale,
  MessageSquare
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell
} from 'recharts';
import confetti from 'canvas-confetti';

interface WorkViewProps {
  onOpenNewSale: () => void;
  onOpenDirectMessage?: (repId: string) => void;
}

export const WorkView: React.FC<WorkViewProps> = ({ onOpenNewSale, onOpenDirectMessage }) => {
  const { currentUser, allUsers, isAdmin, isManager, isRepresentative, canManageTeam } = useAuth();
  const { sales, updateSaleStatus } = useData();

  const today = new Date();
  const currentMonthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Sub-tab: 'stats' or 'sales'
  const [subTab, setSubTab] = useState<'stats' | 'sales'>('stats');

  // Chart Metric Filter: 'rates' | 'volume' | 'all'
  const [chartMetricView, setChartMetricView] = useState<'rates' | 'volume' | 'all'>('rates');

  // Leaderboard scope: 'team' or 'company'
  const [leaderboardScope, setLeaderboardScope] = useState<'team' | 'company'>('company');
  const [leaderboardTimeframe, setLeaderboardTimeframe] = useState<'month' | 'week' | 'day' | 'custom' | 'lifetime'>('month');
  const [leaderboardCustomStart, setLeaderboardCustomStart] = useState<string>(currentMonthStart);
  const [leaderboardCustomEnd, setLeaderboardCustomEnd] = useState<string>(todayIso);

  // Filters for My Sales
  const [filterRepId, setFilterRepId] = useState<string>('me');
  const [filterIsp, setFilterIsp] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterState, setFilterState] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected order for status update modal
  const [selectedOrder, setSelectedOrder] = useState<SaleOrder | null>(null);

  const fieldFocusSnapshot = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const installDateKey = (value?: string) => (value || '').slice(0, 10);
    const toSafeDate = (value?: string) => {
      const d = new Date(value || '');
      return Number.isNaN(d.getTime()) ? null : d;
    };

    const monthlyOrders = sales.filter((s) => {
      const orderDate = toSafeDate(s.createdAt || s.orderDate);
      if (!orderDate) return false;
      return orderDate >= monthStart && orderDate < monthEnd;
    }).length;

    const installedToday = sales.filter(
      (s) => s.status === 'installed' && installDateKey(s.installDate) === todayKey
    ).length;

    const pendingCount = sales.filter((s) => s.status === 'pending').length;

    const oneGigOrders = sales.filter((s) => /(^|\s|\()1\s*gig/i.test(s.speedTier)).length;
    const twoGigOrders = sales.filter((s) => /(^|\s|\()2\s*gig/i.test(s.speedTier)).length;
    const upsellRatio = oneGigOrders > 0
      ? `${((twoGigOrders / oneGigOrders) * 100).toFixed(1)}%`
      : '0.0%';

    const priorityQueue = sales
      .filter((s) => s.status === 'scheduled' || s.status === 'pending')
      .sort((a, b) => new Date(a.installDate).getTime() - new Date(b.installDate).getTime())
      .slice(0, 5);

    return {
      monthlyOrders,
      pendingCount,
      upsellRatio,
      priorityQueue,
    };
  }, [sales]);

  // Calculate Personal Stats for currently logged in user
  const personalStats = useMemo(() => {
    if (!currentUser) {
      return {
        installs: 0,
        cancels: 0,
        scheduled: 0,
        chargebacks: 0,
        totalSales: 0,
        installRate: 0,
        cancelRate: 0,
        totalCommission: 0,
      };
    }

    const myOrders = sales.filter((s) => s.repId === currentUser.id);
    const installs = myOrders.filter((s) => s.status === 'installed').length;
    const cancels = myOrders.filter((s) => s.status === 'cancelled').length;
    const scheduled = myOrders.filter((s) => s.status === 'scheduled').length;
    const chargebacks = myOrders.filter((s) => s.status === 'chargeback').length;
    const totalSales = myOrders.length;

    const installRate = totalSales > 0 ? parseFloat(((installs / (installs + cancels || 1)) * 100).toFixed(1)) : 100;
    const cancelRate = totalSales > 0 ? parseFloat(((cancels / totalSales) * 100).toFixed(1)) : 0;

    const totalCommission = myOrders.reduce((acc, curr) => {
      if (curr.status === 'installed' || curr.status === 'scheduled') return acc + curr.payout;
      if (curr.status === 'chargeback') return acc - Math.abs(curr.payout);
      return acc;
    }, 0);

    return {
      installs,
      cancels,
      scheduled,
      chargebacks,
      totalSales,
      installRate,
      cancelRate,
      totalCommission,
    };
  }, [sales, currentUser]);

  const timeframeFilteredSales = useMemo(() => {
    if (leaderboardTimeframe === 'lifetime') return sales;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfTomorrow = new Date(startOfToday);
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

    const startOfWeek = new Date(startOfToday);
    const dayOfWeek = startOfWeek.getDay();
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startOfWeek.setDate(startOfWeek.getDate() - diffToMonday);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let rangeStart = startOfMonth;
    let rangeEnd = startOfTomorrow;

    if (leaderboardTimeframe === 'day') {
      rangeStart = startOfToday;
      rangeEnd = startOfTomorrow;
    } else if (leaderboardTimeframe === 'week') {
      rangeStart = startOfWeek;
      rangeEnd = startOfTomorrow;
    } else if (leaderboardTimeframe === 'custom') {
      const customStart = leaderboardCustomStart ? new Date(`${leaderboardCustomStart}T00:00:00`) : null;
      const customEnd = leaderboardCustomEnd ? new Date(`${leaderboardCustomEnd}T00:00:00`) : null;

      if (!customStart || Number.isNaN(customStart.getTime())) return [];

      rangeStart = customStart;
      rangeEnd = customEnd && !Number.isNaN(customEnd.getTime()) ? customEnd : customStart;
      rangeEnd = new Date(rangeEnd);
      rangeEnd.setDate(rangeEnd.getDate() + 1);
    }

    return sales.filter((order) => {
      const dateValue = order.createdAt || order.orderDate;
      const orderDate = new Date(dateValue);
      if (Number.isNaN(orderDate.getTime())) return false;
      return orderDate >= rangeStart && orderDate < rangeEnd;
    });
  }, [sales, leaderboardTimeframe, leaderboardCustomStart, leaderboardCustomEnd]);

  // Leaderboard Calculation
  const leaderboardData = useMemo(() => {
    let targetUsers = allUsers;
    if (leaderboardScope === 'team' && currentUser?.managerId) {
      targetUsers = allUsers.filter(
        (u) => u.managerId === currentUser.managerId || u.id === currentUser.managerId
      );
    } else if (leaderboardScope === 'team' && isManager && currentUser) {
      targetUsers = allUsers.filter((u) => u.managerId === currentUser.id || u.id === currentUser.id);
    }

    return targetUsers
      .map((user) => {
        const userOrders = timeframeFilteredSales.filter((s) => s.repId === user.id);
        const installs = userOrders.filter((s) => s.status === 'installed').length;
        const totalSales = userOrders.length;
        const cancels = userOrders.filter((s) => s.status === 'cancelled').length;
        const installRate = totalSales > 0 ? Math.round((installs / (installs + cancels || 1)) * 100) : 100;
        const commission = userOrders.reduce((sum, o) => (o.status === 'installed' ? sum + o.payout : sum), 0);

        return {
          user,
          installs,
          totalSales,
          cancels,
          installRate,
          commission,
        };
      })
      .sort((a, b) => b.installs - a.installs || b.totalSales - a.totalSales);
  }, [allUsers, timeframeFilteredSales, leaderboardScope, currentUser, isManager]);

  // Comparative Team vs. Company Performance Analytics for Recharts
  const comparativeAnalytics = useMemo(() => {
    // 1. Resolve User's Team Members
    let teamUsers = allUsers;
    let teamLabel = 'My Field Squad';

    if (currentUser?.managerId) {
      teamUsers = allUsers.filter(
        (u) => u.managerId === currentUser.managerId || u.id === currentUser.managerId
      );
      teamLabel = currentUser.managerName ? `${currentUser.managerName}'s Squad` : 'My Assigned Squad';
    } else if (isManager && currentUser) {
      teamUsers = allUsers.filter((u) => u.managerId === currentUser.id || u.id === currentUser.id);
      teamLabel = `${currentUser.displayName}'s Squad`;
    } else if (isAdmin) {
      // Admin sees the primary regional squad compared to entire company
      const mgr = allUsers.find((u) => u.role?.toLowerCase() === 'manager');
      if (mgr) {
        teamUsers = allUsers.filter((u) => u.managerId === mgr.id || u.id === mgr.id);
        teamLabel = `${mgr.displayName}'s Regional Squad`;
      }
    }

    const teamUserIds = new Set(teamUsers.map((u) => u.id));
    const teamSales = sales.filter((s) => teamUserIds.has(s.repId));

    // Team aggregated metrics
    const teamInstalls = teamSales.filter((s) => s.status === 'installed').length;
    const teamCancels = teamSales.filter((s) => s.status === 'cancelled').length;
    const teamScheduled = teamSales.filter((s) => s.status === 'scheduled').length;
    const teamTotal = teamSales.length;
    const teamRepCount = Math.max(1, teamUsers.filter((u) => u.role?.toLowerCase() === 'representative' || u.role?.toLowerCase() === 'rep').length);

    const teamInstallRate =
      teamTotal > 0
        ? parseFloat(((teamInstalls / (teamInstalls + teamCancels || 1)) * 100).toFixed(1))
        : 94.2;
    const teamRetentionRate =
      teamTotal > 0
        ? parseFloat((100 - (teamCancels / teamTotal) * 100).toFixed(1))
        : 93.8;
    const teamAvgInstalls = parseFloat((teamInstalls / teamRepCount).toFixed(1));
    const teamAvgSales = parseFloat((teamTotal / teamRepCount).toFixed(1));

    // Company-wide aggregated metrics
    const companyInstalls = sales.filter((s) => s.status === 'installed').length;
    const companyCancels = sales.filter((s) => s.status === 'cancelled').length;
    const companyTotal = sales.length;
    const companyRepCount = Math.max(1, allUsers.filter((u) => u.role?.toLowerCase() === 'representative' || u.role?.toLowerCase() === 'rep').length);

    const companyInstallRate =
      companyTotal > 0
        ? parseFloat(((companyInstalls / (companyInstalls + companyCancels || 1)) * 100).toFixed(1))
        : 88.5;
    const companyRetentionRate =
      companyTotal > 0
        ? parseFloat((100 - (companyCancels / companyTotal) * 100).toFixed(1))
        : 87.2;
    const companyAvgInstalls = parseFloat((companyInstalls / companyRepCount).toFixed(1));
    const companyAvgSales = parseFloat((companyTotal / companyRepCount).toFixed(1));

    // Datasets for Recharts Bar Chart
    const rateDataset = [
      {
        name: 'Install Rate',
        fullName: 'Install Completion Rate',
        team: teamInstallRate,
        company: companyInstallRate,
        unit: '%',
        higherIsBetter: true,
      },
      {
        name: 'Retention Rate',
        fullName: 'Customer Retention (Zero-Drop)',
        team: teamRetentionRate,
        company: companyRetentionRate,
        unit: '%',
        higherIsBetter: true,
      },
    ];

    const volumeDataset = [
      {
        name: 'Installs / Rep',
        fullName: 'Average Verified Installs per Specialist',
        team: teamAvgInstalls,
        company: companyAvgInstalls,
        unit: ' installs',
        higherIsBetter: true,
      },
      {
        name: 'Orders / Rep',
        fullName: 'Average Gross Sales Orders per Specialist',
        team: teamAvgSales,
        company: companyAvgSales,
        unit: ' orders',
        higherIsBetter: true,
      },
    ];

    const allDataset = [
      {
        name: 'Install Rate (%)',
        fullName: 'Install Completion Rate',
        team: teamInstallRate,
        company: companyInstallRate,
        unit: '%',
      },
      {
        name: 'Retention (%)',
        fullName: 'Retention Rate',
        team: teamRetentionRate,
        company: companyRetentionRate,
        unit: '%',
      },
      {
        name: 'Installs/Rep',
        fullName: 'Avg Installs per Rep',
        team: teamAvgInstalls,
        company: companyAvgInstalls,
        unit: ' installs',
      },
      {
        name: 'Orders/Rep',
        fullName: 'Avg Total Orders per Rep',
        team: teamAvgSales,
        company: companyAvgSales,
        unit: ' orders',
      },
    ];

    const activeDataset =
      chartMetricView === 'rates'
        ? rateDataset
        : chartMetricView === 'volume'
        ? volumeDataset
        : allDataset;

    // Delta percentages
    const installRateDelta = parseFloat((teamInstallRate - companyInstallRate).toFixed(1));
    const avgInstallsDelta = parseFloat((teamAvgInstalls - companyAvgInstalls).toFixed(1));

    return {
      teamLabel,
      teamRepCount,
      activeDataset,
      teamInstallRate,
      companyInstallRate,
      installRateDelta,
      teamAvgInstalls,
      companyAvgInstalls,
      avgInstallsDelta,
    };
  }, [allUsers, sales, currentUser, isManager, isAdmin, chartMetricView]);

  // Filtered Sales List
  const filteredSalesList = useMemo(() => {
    return sales.filter((order) => {
      // Rep filter
      if (filterRepId === 'me') {
        if (order.repId !== currentUser?.id) return false;
      } else if (filterRepId === 'my_team') {
        // Show reps under me if manager or admin
        if (isManager || isAdmin) {
          const rep = allUsers.find((u) => u.id === order.repId);
          if (rep?.managerId !== currentUser?.id && order.repId !== currentUser?.id) return false;
        } else {
          // If representative, show colleagues under same manager
          const myManagerId = currentUser?.managerId;
          const rep = allUsers.find((u) => u.id === order.repId);
          if (rep?.managerId !== myManagerId && order.repId !== currentUser?.id) return false;
        }
      } else if (filterRepId !== 'all') {
        if (order.repId !== filterRepId) return false;
      }

      // ISP Filter
      if (filterIsp !== 'all' && order.ispProgram !== filterIsp) return false;

      // Status Filter
      if (filterStatus !== 'all' && order.status !== filterStatus) return false;

      // State Filter
      if (filterState !== 'all' && order.state !== filterState) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          order.customerName.toLowerCase().includes(q) ||
          order.orderNumber.toLowerCase().includes(q) ||
          order.address.toLowerCase().includes(q) ||
          order.repName.toLowerCase().includes(q) ||
          order.city.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [sales, filterRepId, filterIsp, filterStatus, filterState, searchQuery, currentUser, allUsers, isManager, isAdmin]);

  // Filtered Metrics Aggregate
  const filteredMetrics = useMemo(() => {
    const total = filteredSalesList.length;
    const installs = filteredSalesList.filter((s) => s.status === 'installed').length;
    const scheduled = filteredSalesList.filter((s) => s.status === 'scheduled').length;
    const cancels = filteredSalesList.filter((s) => s.status === 'cancelled').length;
    const chargebacks = filteredSalesList.filter((s) => s.status === 'chargeback').length;
    const installRate = total > 0 ? parseFloat(((installs / (installs + cancels || 1)) * 100).toFixed(1)) : 100;
    const cancelRate = total > 0 ? parseFloat(((cancels / total) * 100).toFixed(1)) : 0;
    const commission = filteredSalesList.reduce((acc, curr) => {
      if (curr.status === 'installed') return acc + curr.payout;
      return acc;
    }, 0);

    return { total, installs, scheduled, cancels, chargebacks, installRate, cancelRate, commission };
  }, [filteredSalesList]);

  const handleTriggerStatus = async (status: OrderStatus) => {
    if (!selectedOrder) return;
    await updateSaleStatus(selectedOrder.id, status);
    if (status === 'installed') {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
    setSelectedOrder(null);
  };

  return (
    <div className="p-2.5 sm:p-3 max-w-7xl mx-auto space-y-3 pb-32 sm:pb-28 lg:pb-20">
      {/* Top Welcome & Sub-Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(12,27,24,0.72),rgba(15,23,42,0.96))] p-3 sm:p-3.5 rounded-2xl border border-emerald-500/15 backdrop-blur-md shadow-[0_14px_30px_rgba(2,6,23,0.22)] ring-1 ring-emerald-500/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">
              Field Execution Station
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
            My Work & Performance Metrics
          </h1>
          <p className="text-[11px] text-slate-400 mt-1">
            Real-time sync across web and mobile. Track installs, verify dispatch, and view leaderboards.
          </p>
        </div>

        {/* Sub-Tab Selector: My Stats vs My Sales */}
        <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 self-start sm:self-center">
          <button
            onClick={() => setSubTab('stats')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-bold transition-all ${
              subTab === 'stats'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>My Stats & Team</span>
          </button>
          <button
            onClick={() => setSubTab('sales')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-bold transition-all ${
              subTab === 'sales'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>My Sales & Orders</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SUB-TAB 1: MY STATS & LEADERBOARD                       */}
      {/* ======================================================== */}
      {subTab === 'stats' && (
        <div className="space-y-4">
          {/* Personal Key Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5">
            {/* Installs */}
            <div className="bg-gradient-to-br from-slate-900/80 via-emerald-950/30 to-slate-900/80 border border-emerald-500/30 p-3 rounded-2xl relative overflow-hidden group hover:border-emerald-500/60 hover:shadow-lg hover:shadow-emerald-500/10 transition-all">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(16,185,129,0.1),transparent_50%)] pointer-events-none"></div>
              <div className="relative z-10 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Verified Installs
                </span>
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="relative z-10 mt-1.5 flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-black text-white">{personalStats.installs}</span>
                <span className="text-xs font-semibold text-emerald-400">
                  {personalStats.installRate}% Rate
                </span>
              </div>
              <p className="relative z-10 text-[11px] text-slate-500 mt-1">Confirmed by carrier dispatch</p>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400"></div>
            </div>

            {/* Scheduled */}
            <div className="bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(5,47,38,0.72),rgba(15,23,42,0.96))] border border-emerald-500/30 p-3 rounded-2xl relative overflow-hidden group hover:border-emerald-500/60 hover:shadow-[0_12px_28px_rgba(16,185,129,0.10)] transition-all">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.16),transparent_40%)] pointer-events-none"></div>
              <div className="relative z-10 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  In-Flight Scheduled
                </span>
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <div className="relative z-10 mt-1.5 flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-black text-white">{personalStats.scheduled}</span>
                <span className="text-xs font-semibold text-emerald-400">Upcoming</span>
              </div>
              <p className="relative z-10 text-[11px] text-slate-500 mt-1">Technician appointment booked</p>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
            </div>

            {/* Cancels & Chargebacks */}
            <div className="bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(69,10,10,0.68),rgba(15,23,42,0.96))] border border-rose-500/30 p-3 rounded-2xl relative overflow-hidden group hover:border-rose-500/60 hover:shadow-[0_12px_28px_rgba(244,63,94,0.10)] transition-all">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(244,63,94,0.16),transparent_40%)] pointer-events-none"></div>
              <div className="relative z-10 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Cancels / Drops
                </span>
                <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
                  <XCircle className="w-4 h-4" />
                </div>
              </div>
              <div className="relative z-10 mt-1.5 flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-black text-white">{personalStats.cancels}</span>
                <span className="text-xs font-semibold text-rose-400">
                  {personalStats.cancelRate}% Rate
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Chargebacks: {personalStats.chargebacks}
              </p>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-amber-500"></div>
            </div>

            {/* Commissions Earned */}
            <div className="bg-slate-900/70 border border-slate-800/80 p-3 rounded-2xl relative overflow-hidden group hover:border-amber-500/40 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Estimated Payout
                </span>
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-1.5 flex items-baseline gap-1">
                <span className="text-xl sm:text-2xl font-black text-amber-400">
                  ${personalStats.totalCommission.toLocaleString()}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Total Sales: {personalStats.totalSales}</p>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-orange-500"></div>
            </div>
          </div>

          {/* TEAM VS. COMPANY BENCHMARK COMPARATIVE BAR CHART (RECHARTS) */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xl">
            {/* Header & Metric Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500/20 via-teal-500/20 to-indigo-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shadow-md shadow-emerald-500/10">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-black text-white">
                      Team Performance vs. Company-Wide Averages
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider hidden sm:inline-block">
                      Recharts Analytics
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Benchmarking <strong className="text-emerald-300">{comparativeAnalytics.teamLabel}</strong> against the company-wide fleet average (50-100 reps).
                  </p>
                </div>
              </div>

              {/* Metric View Switcher */}
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-center">
                <button
                  type="button"
                  onClick={() => setChartMetricView('rates')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    chartMetricView === 'rates'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Efficiency Rates (%)
                </button>
                <button
                  type="button"
                  onClick={() => setChartMetricView('volume')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    chartMetricView === 'volume'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Volume / Rep
                </button>
                <button
                  type="button"
                  onClick={() => setChartMetricView('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    chartMetricView === 'all'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All Metrics
                </button>
              </div>
            </div>

            {/* Recharts Comparative Bar Chart */}
            <div className="w-full h-64 sm:h-72 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={comparativeAnalytics.activeDataset}
                  margin={{ top: 20, right: 30, left: 0, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.35} vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#94a3b8"
                    tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                    axisLine={{ stroke: '#334155' }}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    axisLine={{ stroke: '#334155' }}
                    tickLine={false}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const dataPoint = payload[0].payload;
                        const teamVal = payload[0].value as number;
                        const companyVal = payload[1].value as number;
                        const delta = parseFloat((teamVal - companyVal).toFixed(1));
                        const isPositive = teamVal >= companyVal;

                        return (
                          <div className="bg-slate-950/95 border border-slate-800 p-3.5 rounded-2xl shadow-2xl backdrop-blur-xl text-xs space-y-2 min-w-[240px]">
                            <p className="font-bold text-white border-b border-slate-800 pb-1.5">
                              {dataPoint.fullName || label}
                            </p>
                            <div className="flex items-center justify-between text-emerald-300">
                              <span className="flex items-center gap-1.5 font-medium">
                                <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400"></span>
                                <span>{comparativeAnalytics.teamLabel}:</span>
                              </span>
                              <strong className="font-mono text-sm">{teamVal}{dataPoint.unit || ''}</strong>
                            </div>
                            <div className="flex items-center justify-between text-indigo-300">
                              <span className="flex items-center gap-1.5 font-medium">
                                <span className="w-2.5 h-2.5 rounded-sm bg-indigo-400"></span>
                                <span>Company Average:</span>
                              </span>
                              <strong className="font-mono text-sm">{companyVal}{dataPoint.unit || ''}</strong>
                            </div>
                            <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                              <span className="text-slate-400">Team Delta:</span>
                              <span className={`font-bold font-mono ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {isPositive ? `+${delta}` : delta}{dataPoint.unit || ''} ({isPositive ? 'Above Average' : 'Below Average'})
                              </span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="circle"
                    wrapperStyle={{ paddingBottom: '16px', fontSize: '12px' }}
                  />
                  <Bar
                    dataKey="team"
                    name={comparativeAnalytics.teamLabel}
                    fill="#10b981"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={45}
                  />
                  <Bar
                    dataKey="company"
                    name="Company Fleet Average"
                    fill="#14b8a6"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={45}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Performance Benchmark Highlights Under Chart */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs">
              <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Install Rate Lead</span>
                  <p className="text-xs text-slate-200 mt-0.5">
                    Team at <strong className="text-emerald-400 font-mono">{comparativeAnalytics.teamInstallRate}%</strong> vs{' '}
                    <strong className="text-slate-400 font-mono">{comparativeAnalytics.companyInstallRate}%</strong> company fleet avg{' '}
                    <span className="text-emerald-400 font-bold font-mono">
                      ({comparativeAnalytics.installRateDelta >= 0 ? `+${comparativeAnalytics.installRateDelta}%` : `${comparativeAnalytics.installRateDelta}%`})
                    </span>
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Field Productivity</span>
                  <p className="text-xs text-slate-200 mt-0.5">
                    Averaging <strong className="text-emerald-400 font-mono">{comparativeAnalytics.teamAvgInstalls} installs</strong> / specialist vs{' '}
                    <strong className="text-slate-400 font-mono">{comparativeAnalytics.companyAvgInstalls}</strong> company avg
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Leaderboard & Notifications Tabs Split */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Leaderboard Column (2 cols wide) */}
            <div className="lg:col-span-2 bg-slate-900/70 border border-slate-800 rounded-2xl p-3.5 sm:p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-400" />
                    <h2 className="text-lg font-black text-white">Fiber Blitz Leaderboard</h2>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Live rankings based on verified installs and sales production
                  </p>
                </div>

                {/* Scope + Timeframe Controls */}
                <div className="space-y-2 self-start sm:self-auto">
                  <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 self-start">
                    <button
                      onClick={() => setLeaderboardScope('company')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        leaderboardScope === 'company'
                          ? 'bg-slate-800 text-emerald-300 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Company-Wide
                    </button>
                    <button
                      onClick={() => setLeaderboardScope('team')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        leaderboardScope === 'team'
                          ? 'bg-slate-800 text-emerald-300 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      My Squad / Upline
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {[
                      { key: 'month', label: 'Month' },
                      { key: 'week', label: 'Week' },
                      { key: 'day', label: 'Day' },
                      { key: 'custom', label: 'Custom' },
                      { key: 'lifetime', label: 'Lifetime Sales' },
                    ].map((option) => (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => setLeaderboardTimeframe(option.key as 'month' | 'week' | 'day' | 'custom' | 'lifetime')}
                        className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${
                          leaderboardTimeframe === option.key
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  {leaderboardTimeframe === 'custom' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={leaderboardCustomStart}
                        onChange={(e) => setLeaderboardCustomStart(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-200 focus:outline-none focus:border-emerald-500"
                      />
                      <input
                        type="date"
                        value={leaderboardCustomEnd}
                        onChange={(e) => setLeaderboardCustomEnd(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-200 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Top 3 Podium Cards */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-2">
                {leaderboardData.slice(0, 3).map((item, idx) => {
                  const medals = ['🥇', '🥈', '🥉'];
                  const borderGradients = [
                    'border-amber-400/50 bg-gradient-to-b from-amber-500/10 to-slate-900',
                    'border-slate-400/50 bg-gradient-to-b from-slate-400/10 to-slate-900',
                    'border-amber-700/50 bg-gradient-to-b from-amber-700/10 to-slate-900',
                  ];

                  return (
                    <div
                      key={item.user.id}
                      className={`p-3 sm:p-4 rounded-2xl border text-center relative flex flex-col items-center ${borderGradients[idx]}`}
                    >
                      <div className="text-xl sm:text-2xl mb-1">{medals[idx]}</div>
                      <div className="relative mb-2">
                        <img
                          src={item.user.badgePhotoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                          alt={item.user.displayName}
                          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover ring-2 ring-slate-700"
                        />
                        <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 bg-slate-900 border border-slate-700 rounded-full text-[10px] font-bold text-emerald-400">
                          #{idx + 1}
                        </span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-white truncate max-w-full">
                        {item.user.firstName}
                      </h4>
                      <p className="text-[10px] text-slate-400 truncate max-w-full">
                        {item.user.title || item.user.role}
                      </p>
                      <div className="mt-2 text-center">
                        <span className="text-base sm:text-lg font-black text-emerald-400">
                          {item.installs}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-medium">Installs</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Full Roster Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Rank</th>
                      <th className="py-2.5 px-3">Field Specialist</th>
                      <th className="py-2.5 px-3">Upline / Team</th>
                      <th className="py-2.5 px-3 text-center">Installs</th>
                      <th className="py-2.5 px-3 text-center">Install Rate</th>
                      <th className="py-2.5 px-3 text-right">Commission</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {leaderboardData.map((row, index) => {
                      const isMe = row.user.id === currentUser?.id;
                      return (
                        <tr
                          key={row.user.id}
                          className={`hover:bg-slate-800/40 transition-colors ${
                            isMe ? 'bg-cyan-950/30 font-semibold' : ''
                          }`}
                        >
                          <td className="py-3 px-3">
                            <span
                              className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-[11px] ${
                                index === 0
                                  ? 'bg-amber-400 text-slate-950'
                                  : index === 1
                                  ? 'bg-slate-300 text-slate-950'
                                  : index === 2
                                  ? 'bg-amber-700 text-white'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {index + 1}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <img
                                src={row.user.badgePhotoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                                alt=""
                                className="w-6 h-6 rounded-full object-cover"
                              />
                              <div className="flex items-center gap-1.5">
                                <span className="text-white font-medium">{row.user.displayName}</span>
                                {isMe ? (
                                  <span className="ml-1 px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/20 text-emerald-400 font-bold">
                                    YOU
                                  </span>
                                ) : (
                                  (isAdmin || isManager || canManageTeam) && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onOpenDirectMessage?.(row.user.id);
                                      }}
                                      className="p-1 rounded text-slate-500 hover:text-emerald-400 hover:bg-slate-800 transition-colors ml-1"
                                      title={`Send Direct Push Message to ${row.user.displayName}`}
                                    >
                                      <MessageSquare className="w-3.5 h-3.5" />
                                    </button>
                                  )
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-slate-400">
                            {row.user.managerName || 'Direct to Founder'}
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-white text-sm">
                            {row.installs}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                row.installRate >= 90
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : 'bg-amber-500/20 text-amber-400'
                              }`}
                            >
                              {row.installRate}%
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                            ${row.commission.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Field Focus Panel */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-3.5 sm:p-4 space-y-3 flex flex-col">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-base font-bold text-white">Field Focus Panel</h3>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold">
                  Actionable
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Daily install pulse and priority follow-up queue for field execution.
              </p>

              <div className="grid grid-cols-3 gap-2">
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 text-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Orders This Month</span>
                  <span className="text-lg font-black text-emerald-400">{fieldFocusSnapshot.monthlyOrders}</span>
                </div>
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 text-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Pending</span>
                  <span className="text-lg font-black text-cyan-300">{fieldFocusSnapshot.pendingCount}</span>
                </div>
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 text-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Upsell Ratio (1G→2G)</span>
                  <span className="text-lg font-black text-amber-400">{fieldFocusSnapshot.upsellRatio}</span>
                </div>
              </div>

              <div className="space-y-2 overflow-y-auto max-h-[280px] pr-1 divide-y divide-slate-800/60 flex-1">
                {fieldFocusSnapshot.priorityQueue.length === 0 ? (
                  <div className="py-6 text-center text-[11px] text-slate-500">
                    No pending or scheduled orders in queue.
                  </div>
                ) : (
                  fieldFocusSnapshot.priorityQueue.map((order) => (
                    <div key={order.id} className="pt-2 first:pt-0 space-y-0.5">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-slate-200 truncate">{order.customerName}</span>
                        <span className="text-[10px] text-slate-500 shrink-0 font-mono">{order.installDate}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed truncate">
                        {order.city}, {order.state} • {order.ispProgram} ({order.speedTier})
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-2 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={onOpenNewSale}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 transition-transform active:scale-95"
                >
                  <Plus className="w-4 h-4 stroke-[3px]" />
                  <span>Log New Order</span>
                </button>
                <button
                  onClick={() => setSubTab('sales')}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 border border-slate-700"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Open Sales Board</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 2: MY SALES & ORDER BOOK                        */}
      {/* ======================================================== */}
      {subTab === 'sales' && (
        <div className="space-y-4 pb-8 sm:pb-6">
          {/* Aggregate Stats Bar for the Filtered Selection */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 bg-slate-900/80 p-2.5 rounded-2xl border border-slate-800">
            <div className="p-2 text-center border-r border-slate-800/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total Orders</span>
              <p className="text-xl font-black text-white">{filteredMetrics.total}</p>
            </div>
            <div className="p-2 text-center border-r border-slate-800/80">
              <span className="text-[10px] font-bold text-emerald-400 uppercase">Installs</span>
              <p className="text-xl font-black text-emerald-400">{filteredMetrics.installs}</p>
            </div>
            <div className="p-2 text-center border-r border-slate-800/80">
              <span className="text-[10px] font-bold text-emerald-400 uppercase">Scheduled</span>
              <p className="text-xl font-black text-emerald-400">{filteredMetrics.scheduled}</p>
            </div>
            <div className="p-2 text-center border-r border-slate-800/80">
              <span className="text-[10px] font-bold text-rose-400 uppercase">Cancelled</span>
              <p className="text-xl font-black text-rose-400">{filteredMetrics.cancels}</p>
            </div>
            <div className="p-2 text-center border-r border-slate-800/80">
              <span className="text-[10px] font-bold text-amber-400 uppercase">Chargebacks</span>
              <p className="text-xl font-black text-amber-400">{filteredMetrics.chargebacks}</p>
            </div>
            <div className="p-2 text-center border-r border-slate-800/80">
              <span className="text-[10px] font-bold text-emerald-300 uppercase">Install Rate</span>
              <p className="text-xl font-black text-emerald-300">{filteredMetrics.installRate}%</p>
            </div>
            <div className="p-2 text-center col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold text-amber-400 uppercase">Cancel Rate</span>
              <p className="text-xl font-black text-amber-400">{filteredMetrics.cancelRate}%</p>
            </div>
          </div>

          {/* Effortless Filter Bar */}
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search customer name, order #, address, city, rep..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Log Sale Button */}
              <button
                onClick={onOpenNewSale}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 shrink-0"
              >
                <Plus className="w-4 h-4 stroke-[3px]" />
                <span>Add Sale</span>
              </button>
            </div>

            {/* Filter Dropdowns Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {/* Rep / Team Filter */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Agent / Squad
                </label>
                <select
                  value={filterRepId}
                  onChange={(e) => setFilterRepId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="me">My Personal Orders</option>
                  {(isManager || isAdmin) && (
                    <option value="my_team">My Direct Team / Assignees</option>
                  )}
                  <option value="all">Company-Wide (All Reps)</option>
                  {allUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.displayName} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* ISP Program Filter */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  ISP Program
                </label>
                <select
                  value={filterIsp}
                  onChange={(e) => setFilterIsp(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="all">All Carrier Programs</option>
                  <option value="AT&T Fiber">AT&T Fiber</option>
                  <option value="Frontier Fiber">Frontier Fiber</option>
                  <option value="Quantum Fiber">Quantum Fiber</option>
                  <option value="Brightspeed">Brightspeed Fiber</option>
                  <option value="Spectrum Gig">Spectrum Gig</option>
                  <option value="Kinetic Fiber">Kinetic Fiber</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Install Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="installed">Installed (Verified)</option>
                  <option value="scheduled">Scheduled (Pending)</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="chargeback">Chargeback</option>
                </select>
              </div>

              {/* State Filter */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  State / Market
                </label>
                <select
                  value={filterState}
                  onChange={(e) => setFilterState(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="all">All States</option>
                  <option value="TX">Texas (TX)</option>
                  <option value="FL">Florida (FL)</option>
                  <option value="NC">North Carolina (NC)</option>
                  <option value="AZ">Arizona (AZ)</option>
                  <option value="OH">Ohio (OH)</option>
                  <option value="GA">Georgia (GA)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Orders List / Cards */}
          {filteredSalesList.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
              <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
              <h3 className="text-base font-bold text-white">No Sales Orders Match Filters</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Try switching the rep or status filter, or tap "Add Sale" to record a new fiber order on the turf.
              </p>
              <button
                onClick={onOpenNewSale}
                className="mt-2 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold"
              >
                Log New Order
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSalesList.map((order) => {
                const isInstalled = order.status === 'installed';
                const isScheduled = order.status === 'scheduled';
                const isCancelled = order.status === 'cancelled';
                const isChargeback = order.status === 'chargeback';

                return (
                  <div
                    key={order.id}
                    className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 sm:p-5 transition-all shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    {/* Left: Customer & Address Info */}
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-emerald-400 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-800/40">
                          {order.orderNumber}
                        </span>
                        <h3 className="text-sm sm:text-base font-black text-white">
                          {order.customerName}
                        </h3>
                        <span className="text-xs text-slate-400">• {order.customerPhone}</span>
                      </div>

                      <div className="text-xs text-slate-300 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span>
                          📍 {order.address}, {order.city}, {order.state} {order.zipCode}
                        </span>
                        <span className="text-slate-500">|</span>
                        <span className="font-semibold text-emerald-300">
                          {order.ispProgram} ({order.speedTier})
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5">
                        <span>Sold by: <strong className="text-slate-200">{order.repName}</strong></span>
                        {order.blitzName && (
                          <>
                            <span className="text-slate-600">•</span>
                            <span className="text-indigo-400 font-medium">{order.blitzName}</span>
                          </>
                        )}
                        <span className="text-slate-600">•</span>
                        <span>Install Date: <strong className="text-slate-200">{order.installDate}</strong></span>
                      </div>

                      {order.notes && (
                        <p className="text-[11px] text-slate-400 bg-slate-950/60 p-2 rounded-lg border border-slate-800/60 mt-2 font-mono">
                          Note: {order.notes}
                        </p>
                      )}
                    </div>

                    {/* Right: Status Badge & Commission Payout & Actions */}
                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800/80">
                      <div className="flex items-center gap-2">
                        {/* Status Badge */}
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                            isInstalled
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : isScheduled
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : isCancelled
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">
                          Commission
                        </span>
                        <span
                          className={`text-base font-black font-mono ${
                            isChargeback
                              ? 'text-rose-400'
                              : isCancelled
                              ? 'text-slate-500 line-through'
                              : 'text-amber-400'
                          }`}
                        >
                          ${order.payout}
                        </span>
                      </div>

                      {/* Quick Status Action Button */}
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium transition-colors"
                      >
                        Update Status
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Status Update Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div>
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                Dispatch Management
              </span>
              <h3 className="text-lg font-black text-white mt-0.5">
                Update Order #{selectedOrder.orderNumber}
              </h3>
              <p className="text-xs text-slate-400">
                Customer: {selectedOrder.customerName} ({selectedOrder.ispProgram})
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">Set Order Status:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleTriggerStatus('installed')}
                  className="p-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-bold text-xs flex items-center gap-2 justify-center"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Installed (Verified)</span>
                </button>
                <button
                  onClick={() => handleTriggerStatus('scheduled')}
                  className="p-3 rounded-xl border border-cyan-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-bold text-xs flex items-center gap-2 justify-center"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Scheduled</span>
                </button>
                <button
                  onClick={() => handleTriggerStatus('cancelled')}
                  className="p-3 rounded-xl border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-bold text-xs flex items-center gap-2 justify-center"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Cancelled</span>
                </button>
                <button
                  onClick={() => handleTriggerStatus('chargeback')}
                  className="p-3 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold text-xs flex items-center gap-2 justify-center"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Chargeback</span>
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
