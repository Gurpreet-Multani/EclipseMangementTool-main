import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { BlitzEvent, RepAvailabilitySlot } from '../types';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Building,
  DollarSign,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plane,
  X,
  Plus,
  Trash2,
  Send,
  Radio,
  Check,
  CalendarDays,
  ShieldAlert,
  Sparkles,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { US_STATES } from '../lib/states';

interface BlitzCalendarViewProps {
  onOpenMessagingForBlitz?: (blitzId: string) => void;
}

export const BlitzCalendarView: React.FC<BlitzCalendarViewProps> = ({ onOpenMessagingForBlitz }) => {
  const { currentUser, isAdmin, isManager, canManageTeam } = useAuth();
  const {
    blitzes,
    bookBlitz,
    cancelBlitzBooking,
    isUserBookedForBlitz,
    joinRequests,
    submitJoinRequest,
    reviewJoinRequest,
    repAvailability,
    setRepAvailabilitySlot,
    removeRepAvailabilitySlot,
    getUserJoinRequestForBlitz,
  } = useData();

  // Calendar Navigation State - Default to September 2026
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonth, setCurrentMonth] = useState<number>(8); // 0-indexed: 8 = September

  // Filter States
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'upcoming' | 'completed'>('all');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [onlyMyBlitzes, setOnlyMyBlitzes] = useState<boolean>(false);

  // Selected Day / Detail Modal
  const [selectedDate, setSelectedDate] = useState<string | null>('2026-09-25');
  const [selectedBlitz, setSelectedBlitz] = useState<BlitzEvent | null>(null);

  // Join Request Modal State
  const [joinModalBlitz, setJoinModalBlitz] = useState<BlitzEvent | null>(null);
  const [requestNotes, setRequestNotes] = useState('');
  const [roommatePref, setRoommatePref] = useState('');
  const [pledgedGoal, setPledgedGoal] = useState<number>(25);
  const [requestSuccessMsg, setRequestSuccessMsg] = useState('');

  // Availability Management Drawer/Modal
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [availStartDate, setAvailStartDate] = useState('2026-10-01');
  const [availEndDate, setAvailEndDate] = useState('2026-10-15');
  const [availStatus, setAvailStatus] = useState<'available' | 'unavailable' | 'tentative'>('available');
  const [availNotes, setAvailNotes] = useState('');

  // Manager Join Requests Drawer
  const [showRequestsDrawer, setShowRequestsDrawer] = useState(false);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Current user's availability list
  const userAvailability = useMemo(() => {
    if (!currentUser) return [];
    return repAvailability.filter((a) => a.userId === currentUser.id);
  }, [repAvailability, currentUser]);

  // Pending requests count for managers/admins
  const pendingRequestsCount = useMemo(() => {
    return joinRequests.filter((r) => r.status === 'pending').length;
  }, [joinRequests]);

  // Navigate Months
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleGoToToday = () => {
    setCurrentYear(2026);
    setCurrentMonth(8); // September
    setSelectedDate('2026-09-25');
  };

  // Helper to check if a date (YYYY-MM-DD) falls between startDate and endDate
  const isDateInRange = (dateStr: string, startStr: string, endStr: string) => {
    return dateStr >= startStr && dateStr <= endStr;
  };

  // Generate calendar days grid for currentYear and currentMonth
  const calendarGrid = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    interface CalendarCell {
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      blitzes: BlitzEvent[];
      userAvailStatus?: 'available' | 'unavailable' | 'tentative' | 'booked';
      userAvailNotes?: string;
    }

    const cells: CalendarCell[] = [];

    // Preceding days from previous month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevM = currentMonth === 0 ? 12 : currentMonth;
      const prevY = currentMonth === 0 ? currentYear - 1 : currentYear;
      const mStr = String(prevM).padStart(2, '0');
      const dStr = String(dayNum).padStart(2, '0');
      const dateStr = `${prevY}-${mStr}-${dStr}`;

      cells.push({
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: dateStr === '2026-09-25',
        blitzes: [],
      });
    }

    // Days in current month
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const mStr = String(currentMonth + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      const dateStr = `${currentYear}-${mStr}-${dStr}`;

      // Find blitzes active on this date
      const matchedBlitzes = blitzes.filter((b) => {
        // Date overlap check
        if (!isDateInRange(dateStr, b.startDate, b.endDate)) return false;

        // Status Filter
        if (statusFilter !== 'all' && b.status !== statusFilter) return false;

        // State Filter
        if (stateFilter !== 'all' && b.state !== stateFilter) return false;

        // My Blitzes Filter
        if (onlyMyBlitzes && currentUser) {
          const isBooked = b.bookedUserIds.includes(currentUser.id);
          const hasRequested = joinRequests.some(
            (r) => r.blitzId === b.id && r.userId === currentUser.id
          );
          if (!isBooked && !hasRequested) return false;
        }

        return true;
      });

      // Check rep's availability on this day
      let dayAvailStatus: 'available' | 'unavailable' | 'tentative' | 'booked' | undefined;
      let dayAvailNotes: string | undefined;

      // Check if user is booked on any blitz running on this day
      if (currentUser) {
        const bookedBlitz = blitzes.find(
          (b) => b.bookedUserIds.includes(currentUser.id) && isDateInRange(dateStr, b.startDate, b.endDate)
        );
        if (bookedBlitz) {
          dayAvailStatus = 'booked';
          dayAvailNotes = `Deployed: ${bookedBlitz.title}`;
        } else {
          // Check explicit availability slots
          const foundSlot = userAvailability.find((slot) =>
            isDateInRange(dateStr, slot.startDate, slot.endDate)
          );
          if (foundSlot) {
            dayAvailStatus = foundSlot.status;
            dayAvailNotes = foundSlot.notes;
          }
        }
      }

      cells.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: dateStr === '2026-09-25',
        blitzes: matchedBlitzes,
        userAvailStatus: dayAvailStatus,
        userAvailNotes: dayAvailNotes,
      });
    }

    // Trailing days from next month to fill grid to 35 or 42
    const totalSlots = cells.length > 35 ? 42 : 35;
    const remainingSlots = totalSlots - cells.length;
    for (let i = 1; i <= remainingSlots; i++) {
      const nextM = currentMonth === 11 ? 1 : currentMonth + 2;
      const nextY = currentMonth === 11 ? currentYear + 1 : currentYear;
      const mStr = String(nextM).padStart(2, '0');
      const dStr = String(i).padStart(2, '0');
      const dateStr = `${nextY}-${mStr}-${dStr}`;

      cells.push({
        dateStr,
        dayNumber: i,
        isCurrentMonth: false,
        isToday: dateStr === '2026-09-25',
        blitzes: [],
      });
    }

    return cells;
  }, [
    currentYear,
    currentMonth,
    blitzes,
    statusFilter,
    stateFilter,
    onlyMyBlitzes,
    currentUser,
    joinRequests,
    userAvailability,
  ]);

  // Selected date's events
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    return blitzes.filter((b) => isDateInRange(selectedDate, b.startDate, b.endDate));
  }, [selectedDate, blitzes]);

  // Selected date availability status
  const selectedDateAvailability = useMemo(() => {
    if (!selectedDate || !currentUser) return null;
    const bookedBlitz = blitzes.find(
      (b) => b.bookedUserIds.includes(currentUser.id) && isDateInRange(selectedDate, b.startDate, b.endDate)
    );
    if (bookedBlitz) {
      return { status: 'booked' as const, label: `Active on ${bookedBlitz.state} Blitz (${bookedBlitz.city})` };
    }
    const foundSlot = userAvailability.find((slot) =>
      isDateInRange(selectedDate, slot.startDate, slot.endDate)
    );
    if (foundSlot) {
      return {
        status: foundSlot.status,
        label:
          foundSlot.status === 'available'
            ? 'Marked Available for Travel'
            : foundSlot.status === 'unavailable'
            ? 'Blackout / Unavailable'
            : 'Tentative Availability',
        notes: foundSlot.notes,
        slotId: foundSlot.id,
      };
    }
    return null;
  }, [selectedDate, currentUser, blitzes, userAvailability]);

  // Submit Join Request Handler
  const handleSubmitJoinRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinModalBlitz) return;

    const res = await submitJoinRequest({
      blitzId: joinModalBlitz.id,
      requestNotes: requestNotes || 'Standard deployment request. Ready for field execution.',
      roommatePreference: roommatePref || 'No roommate preference.',
      pledgedInstalls: pledgedGoal,
    });

    if (res.success) {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
      });
      setRequestSuccessMsg(res.message);
      setTimeout(() => {
        setJoinModalBlitz(null);
        setRequestSuccessMsg('');
        setRequestNotes('');
        setRoommatePref('');
      }, 1800);
    } else {
      alert(res.message);
    }
  };

  // Add Availability Slot Handler
  const handleSaveAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    if (availStartDate > availEndDate) {
      alert('End date cannot precede start date.');
      return;
    }
    await setRepAvailabilitySlot({
      startDate: availStartDate,
      endDate: availEndDate,
      status: availStatus,
      notes: availNotes,
    });
    setShowAvailabilityModal(false);
    setAvailNotes('');
  };

  return (
    <div className="space-y-3.5 w-full max-w-full overflow-hidden pb-28 sm:pb-24 lg:pb-10">
      {/* Calendar Header Control Bar */}
      <div className="bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,0.9))] border border-emerald-500/10 rounded-3xl p-2 sm:p-2.5 shadow-[0_12px_28px_rgba(2,6,23,0.2)] space-y-2">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2.5">
          {/* Month / Year Navigator */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
                title="Previous Month"
                aria-label="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="px-2 sm:px-3 py-0.5 text-center min-w-[120px] sm:min-w-[140px]">
                <span className="text-xs sm:text-sm font-black text-white tracking-tight">
                  {monthNames[currentMonth]} {currentYear}
                </span>
              </div>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
                title="Next Month"
                aria-label="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleGoToToday}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-[9px] sm:text-[10px] font-bold text-emerald-300 border border-emerald-500/30 transition-all hover:scale-105"
            >
              Today (Sep 25)
            </button>
          </div>

          {/* Availability & Request Management Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Rep Availability Button */}
            <button
              onClick={() => setShowAvailabilityModal(true)}
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-bold text-[10px] sm:text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all hover:scale-105"
            >
              <CalendarDays className="w-4 h-4 stroke-[2.5px]" />
              <span>Manage My Availability</span>
            </button>

            {/* Manager Review Requests Drawer Button */}
            {(isAdmin || isManager || canManageTeam) && (
              <button
                onClick={() => setShowRequestsDrawer(true)}
                className="relative px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] sm:text-xs font-bold text-white flex items-center gap-1.5 transition-colors"
              >
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>Join Requests</span>
                {pendingRequestsCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black animate-pulse">
                    {pendingRequestsCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between text-[10px] sm:text-xs">
          {/* Status Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-400 font-semibold mr-1">Status:</span>
            {[
              { id: 'all', label: 'All' },
              { id: 'active', label: '🟢 Active' },
              { id: 'upcoming', label: '🔵 Upcoming' },
              { id: 'completed', label: '⚪ Done' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id as any)}
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl font-bold transition-all ${
                  statusFilter === st.id
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* State Filter & My Blitzes Toggle */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[10px] sm:text-[11px] font-medium">State:</span>
              <select
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                className="bg-transparent text-slate-200 font-bold text-[10px] sm:text-xs focus:outline-none cursor-pointer max-w-[140px] sm:max-w-[200px]"
              >
                <option value="all" className="bg-slate-900 text-white">All 52 States & Territories</option>
                {US_STATES.map((st) => (
                  <option key={st.code} value={st.code} className="bg-slate-900 text-white">
                    {st.name} ({st.code})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setOnlyMyBlitzes(!onlyMyBlitzes)}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl font-bold border transition-all ${
                onlyMyBlitzes
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-white border-slate-800'
              }`}
            >
              ⭐ My Blitzes
            </button>
          </div>
        </div>

        {/* Legend bar */}
        <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 pt-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Active / Ongoing Blitz</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
            <span>Upcoming Blitz (Open)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
            <span>Completed Blitz (Past)</span>
          </div>
          <div className="flex items-center gap-1.5 border-l border-slate-800 pl-3">
            <span className="w-2 h-2 rounded-full bg-teal-400 ring-2 ring-teal-400/30"></span>
            <span>My Availability Active</span>
          </div>
        </div>
      </div>

      {/* Main Calendar Grid */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        <div className="w-full overflow-x-auto">
          <div className="min-w-[420px] sm:min-w-[520px] lg:min-w-[620px]">
            {/* Day of Week Header */}
            <div className="grid grid-cols-7 border-b border-slate-800 bg-slate-950/60 text-center py-1.5">
              {daysOfWeek.map((day, idx) => (
                <div
                  key={day}
                  className={`text-[10px] sm:text-xs font-black tracking-wider uppercase ${
                    idx === 0 || idx === 6 ? 'text-slate-500' : 'text-slate-300'
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days Matrix */}
            <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-800/80 bg-slate-950/30">
              {calendarGrid.map((cell, idx) => {
                const isSelected = selectedDate === cell.dateStr;

                return (
                  <div
                    key={`${cell.dateStr}-${idx}`}
                    onClick={() => setSelectedDate(cell.dateStr)}
                    className={`min-h-[52px] sm:min-h-[58px] p-0.5 flex flex-col justify-between cursor-pointer transition-all duration-150 relative group ${
                      !cell.isCurrentMonth ? 'bg-slate-950/70 opacity-40' : 'hover:bg-slate-800/40'
                    } ${isSelected ? 'ring-2 ring-cyan-400 bg-slate-800/50 z-10' : ''}`}
                  >
                    {/* Top Day Number & Availability Badges */}
                    <div className="flex items-start justify-between gap-1">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 text-xs font-black rounded-lg transition-transform ${
                          cell.isToday
                            ? 'bg-gradient-to-tr from-emerald-500 to-teal-600 text-slate-950 shadow-md font-bold scale-105'
                            : cell.isCurrentMonth
                            ? 'text-slate-200'
                            : 'text-slate-600'
                        }`}
                      >
                        {cell.dayNumber}
                      </span>

                      {/* Availability Indicator dot/tag */}
                      {cell.userAvailStatus && (
                        <div
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 ${
                            cell.userAvailStatus === 'booked'
                              ? 'bg-emerald-600/20 text-emerald-200 border border-purple-500/30'
                              : cell.userAvailStatus === 'available'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : cell.userAvailStatus === 'unavailable'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                          title={cell.userAvailNotes || cell.userAvailStatus}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              cell.userAvailStatus === 'booked'
                                ? 'bg-emerald-400'
                                : cell.userAvailStatus === 'available'
                                ? 'bg-emerald-400'
                                : cell.userAvailStatus === 'unavailable'
                                ? 'bg-rose-400'
                                : 'bg-amber-400'
                            }`}
                          ></span>
                          <span className="hidden md:inline">
                            {cell.userAvailStatus === 'booked'
                              ? 'Booked'
                              : cell.userAvailStatus === 'available'
                              ? 'Avail'
                              : cell.userAvailStatus === 'unavailable'
                              ? 'PTO'
                              : 'Tent'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Event Chips Stack inside Day */}
                    <div className="space-y-0.5 mt-0.5 overflow-hidden">
                      {cell.blitzes.slice(0, 2).map((blitz) => {
                        const isBooked = currentUser && blitz.bookedUserIds.includes(currentUser.id);
                        const userReq = getUserJoinRequestForBlitz(blitz.id);

                        return (
                          <button
                            key={blitz.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBlitz(blitz);
                              setSelectedDate(cell.dateStr);
                            }}
                            className={`w-full text-left px-1 py-0.5 rounded-md text-[8px] sm:text-[9px] font-bold truncate flex items-center justify-between transition-all hover:scale-[1.01] shadow-sm ${
                              blitz.status === 'active'
                                ? 'bg-emerald-950/80 hover:bg-emerald-900/90 text-emerald-300 border border-emerald-800/80'
                                : blitz.status === 'upcoming'
                                ? 'bg-indigo-950/80 hover:bg-indigo-900/90 text-indigo-200 border border-indigo-800/80'
                                : 'bg-slate-900/90 hover:bg-slate-800 text-slate-400 border border-slate-800 line-through'
                            }`}
                            title={`${blitz.title} (${blitz.city}, ${blitz.state})`}
                          >
                            <span className="truncate">
                              {blitz.state} • {blitz.city.split('/')[0]}
                            </span>
                            {isBooked && (
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 ml-1 shrink-0" title="Registered"></span>
                            )}
                            {!isBooked && userReq?.status === 'pending' && (
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 ml-1 shrink-0" title="Pending Request"></span>
                            )}
                          </button>
                        );
                      })}

                      {cell.blitzes.length > 2 && (
                        <span className="text-[9px] font-bold text-slate-400 block px-1">
                          +{cell.blitzes.length - 2} more blitzes
                        </span>
                      )}
                    </div>

                    {/* Subtle Day Hover indicator */}
                    <div className="h-1.5" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Selected Date Detail Drawer / Footer View */}
      {selectedDate && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <CalendarIcon className="w-4 h-4" />
                <span>
                  Operations Agenda for {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
                {selectedDate === '2026-09-25' && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                    TODAY
                  </span>
                )}
              </div>
              <h3 className="text-xl font-black text-white">
                {selectedDateEvents.length > 0
                  ? `${selectedDateEvents.length} State Blitz${selectedDateEvents.length > 1 ? 'es' : ''} Running on this Date`
                  : 'No State Blitzes Scheduled on this Day'}
              </h3>
            </div>

            {/* Availability status badge for selected day */}
            <div className="flex items-center gap-2">
              {selectedDateAvailability ? (
                <div
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                    selectedDateAvailability.status === 'booked'
                      ? 'bg-emerald-600/20 text-emerald-200 border-purple-500/40'
                      : selectedDateAvailability.status === 'available'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : selectedDateAvailability.status === 'unavailable'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-current"></span>
                  <span>{selectedDateAvailability.label}</span>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setAvailStartDate(selectedDate);
                    setAvailEndDate(selectedDate);
                    setShowAvailabilityModal(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Set My Availability for this Day</span>
                </button>
              )}
            </div>
          </div>

          {/* List of Blitzes on Selected Date */}
          {selectedDateEvents.length === 0 ? (
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-6 text-center space-y-2">
              <CalendarDays className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">
                There are no open or active blitz operations on this calendar date. You can set this window as your available travel range or browse other months.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
              {selectedDateEvents.map((blitz) => {
                const isBooked = currentUser && blitz.bookedUserIds.includes(currentUser.id);
                const joinReq = getUserJoinRequestForBlitz(blitz.id);
                const spotsRemaining = blitz.maxSpots - blitz.bookedCount;

                return (
                  <div
                    key={blitz.id}
                    className="bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-2.5 flex flex-col justify-between space-y-2 transition-all"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                              blitz.status === 'active'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : blitz.status === 'upcoming'
                                ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {blitz.status}
                          </span>
                          <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold text-xs">
                            {blitz.state}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400 font-medium">{blitz.ispPartner}</span>
                      </div>

                      <h4 className="text-base font-black text-white leading-tight">{blitz.title}</h4>
                      <p className="text-xs text-slate-400 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span>{blitz.city}, {blitz.state}</span>
                      </p>
                      <p className="text-xs text-slate-400 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{blitz.startDate} to {blitz.endDate}</span>
                      </p>

                      <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                        <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800/80">
                          <span className="text-slate-500 block">Daily Per Diem:</span>
                          <span className="text-emerald-400 font-bold">${blitz.dailyPerDiem} / day</span>
                        </div>
                        <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800/80">
                          <span className="text-slate-500 block">Roster Capacity:</span>
                          <span className="text-white font-bold">
                            {blitz.bookedCount} / {blitz.maxSpots} Reps
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions on Blitz */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2">
                      <button
                        onClick={() => setSelectedBlitz(blitz)}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex-1 text-center"
                      >
                        Inspect Details
                      </button>

                      {/* Booking / Join Request Buttons */}
                      {isBooked ? (
                        <div className="px-3 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>Confirmed</span>
                        </div>
                      ) : joinReq?.status === 'pending' ? (
                        <div className="px-3 py-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Request Pending</span>
                        </div>
                      ) : blitz.status !== 'completed' ? (
                        <button
                          onClick={() => setJoinModalBlitz(blitz)}
                          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-all hover:scale-105"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Request to Join</span>
                        </button>
                      ) : (
                        <div className="text-xs text-slate-500 italic py-2">Completed</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: BLITZ FULL DETAILS MODAL */}
      {selectedBlitz && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 max-w-lg w-full space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedBlitz(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase ${
                    selectedBlitz.status === 'active'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : selectedBlitz.status === 'upcoming'
                      ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {selectedBlitz.status}
                </span>
                <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                  {selectedBlitz.state}
                </span>
                <span className="text-xs text-slate-400">{selectedBlitz.ispPartner}</span>
              </div>
              <h3 className="text-xl font-black text-white mt-1.5">{selectedBlitz.title}</h3>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                <span>{selectedBlitz.city}, {selectedBlitz.state}</span>
                <span>•</span>
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>{selectedBlitz.startDate} to {selectedBlitz.endDate}</span>
              </p>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800/80">
              {selectedBlitz.description}
            </p>

            {/* Quota & Sales Status */}
            <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-semibold">Sales Quota Target:</span>
                <span className="text-white font-bold">{selectedBlitz.targetGoal} Orders</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-semibold">Total Orders Logged:</span>
                <span className="text-emerald-400 font-mono font-bold">{selectedBlitz.currentSales} Orders</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-semibold">Verified Installs:</span>
                <span className="text-emerald-400 font-bold">{selectedBlitz.installedCount} Installs</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-semibold">Hotel / HQ Hub:</span>
                <span className="text-slate-200 font-medium truncate max-w-[200px]">{selectedBlitz.hotelHub}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-semibold">Daily Per Diem:</span>
                <span className="text-emerald-400 font-bold">${selectedBlitz.dailyPerDiem} / day direct deposit</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-semibold">Lead Coordinator:</span>
                <span className="text-white font-medium">{selectedBlitz.leadCoordinator}</span>
              </div>
            </div>

            {/* Current User Registration & Request Status */}
            {currentUser && (
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Your Deployment Status
                </span>
                {selectedBlitz.bookedUserIds.includes(currentUser.id) ? (
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      Confirmed Roster Member
                    </span>
                    <button
                      onClick={() => {
                        cancelBlitzBooking(selectedBlitz.id);
                        setSelectedBlitz(null);
                      }}
                      className="text-rose-400 hover:text-rose-300 text-xs font-semibold underline"
                    >
                      Cancel Spot
                    </button>
                  </div>
                ) : getUserJoinRequestForBlitz(selectedBlitz.id) ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                      <Clock className="w-4 h-4" />
                      <span>Join Request Under Leadership Review</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Submitted on: {new Date(getUserJoinRequestForBlitz(selectedBlitz.id)!.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">You have not registered for this blitz.</span>
                    {selectedBlitz.status !== 'completed' && (
                      <button
                        onClick={() => {
                          setJoinModalBlitz(selectedBlitz);
                          setSelectedBlitz(null);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs"
                      >
                        Request to Join
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Manager Dispatch Action */}
            {(canManageTeam || isAdmin || isManager) && (
              <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    onOpenMessagingForBlitz?.(selectedBlitz.id);
                    setSelectedBlitz(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-emerald-300 border border-purple-500/30 text-xs font-bold flex items-center gap-2"
                >
                  <Radio className="w-4 h-4 text-emerald-400" />
                  <span>Send Blitz Push Dispatch</span>
                </button>

                <button
                  onClick={() => setSelectedBlitz(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: SUBMIT REQUEST TO JOIN EXISTING BLITZ */}
      {joinModalBlitz && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 max-w-lg w-full space-y-5 shadow-2xl relative">
            <button
              onClick={() => setJoinModalBlitz(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase">
                  Join Request
                </span>
                <span className="text-xs text-slate-400">{joinModalBlitz.ispPartner}</span>
              </div>
              <h3 className="text-xl font-black text-white mt-1">
                Request to Join {joinModalBlitz.state} Blitz
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {joinModalBlitz.title} • {joinModalBlitz.city} ({joinModalBlitz.startDate} to {joinModalBlitz.endDate})
              </p>
            </div>

            {requestSuccessMsg ? (
              <div className="p-5 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs font-bold text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <p>{requestSuccessMsg}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitJoinRequest} className="space-y-4 text-xs">
                {/* Rep Travel & Credentials Summary */}
                <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Representative Dossier
                  </span>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Representative:</span>
                    <span className="text-white font-bold">{currentUser?.displayName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Home Airport:</span>
                    <span className="text-emerald-400 font-mono font-bold">
                      {currentUser?.travelProfile?.homeAirport || 'DFW - Dallas/Fort Worth'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Per Diem Allocation:</span>
                    <span className="text-emerald-400 font-bold">${joinModalBlitz.dailyPerDiem} / day</span>
                  </div>
                </div>

                {/* Sales Pledge / Expected Installs */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span>Pledged Production Goal:</span>
                    <span className="text-emerald-400 font-bold">{pledgedGoal} Verified Installs</span>
                  </label>
                  <input
                    type="range"
                    min={15}
                    max={60}
                    step={5}
                    value={pledgedGoal}
                    onChange={(e) => setPledgedGoal(Number(e.target.value))}
                    className="w-full accent-cyan-400"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>15 Installs</span>
                    <span>30 Installs (Target)</span>
                    <span>60 Installs (Top Tier)</span>
                  </div>
                </div>

                {/* Flight & Travel Notes */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">
                    Flight / Travel Notes (Arrival Time & Airport preferences):
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Arriving Sunday afternoon, prefer American or Delta flight"
                    value={requestNotes}
                    onChange={(e) => setRequestNotes(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Roommate Preference */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">
                    Roommate Preference (Optional):
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Tyler Chen, or single room upgrade request"
                    value={roommatePref}
                    onChange={(e) => setRoommatePref(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="p-3 bg-cyan-950/30 rounded-xl border border-cyan-800/40 text-slate-300 flex items-center gap-2">
                  <Info className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    Submitting this request notifies the Lead Coordinator ({joinModalBlitz.leadCoordinator}). Upon review, you will receive an in-app confirmation and travel dispatch.
                  </span>
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setJoinModalBlitz(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
                  >
                    <Send className="w-4 h-4" />
                    <span>Submit Request to Join Blitz</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 3: MANAGE REP AVAILABILITY */}
      {showAvailabilityModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 max-w-lg w-full space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowAvailabilityModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase">
                  Field Operations
                </span>
              </div>
              <h3 className="text-xl font-black text-white mt-1">Manage Your Blitz Availability</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Set travel dates, blackout periods, and deployment readiness for state coordinators.
              </p>
            </div>

            {/* Current Active Availability Slots */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300 block">Your Scheduled Availability:</span>
              {userAvailability.length === 0 ? (
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-400 text-center">
                  No availability windows saved yet. Add a window below!
                </div>
              ) : (
                <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                  {userAvailability.map((slot) => (
                    <div
                      key={slot.id}
                      className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                              slot.status === 'available'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : slot.status === 'unavailable'
                                ? 'bg-rose-500/20 text-rose-400'
                                : 'bg-amber-500/20 text-amber-400'
                            }`}
                          >
                            {slot.status}
                          </span>
                          <span className="text-white font-bold">
                            {slot.startDate} to {slot.endDate}
                          </span>
                        </div>
                        {slot.notes && <p className="text-slate-400 text-[11px]">{slot.notes}</p>}
                      </div>
                      <button
                        onClick={() => removeRepAvailabilitySlot(slot.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 rounded-lg"
                        title="Delete slot"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add New Availability Window */}
            <form onSubmit={handleSaveAvailability} className="space-y-3 pt-2 border-t border-slate-800 text-xs">
              <span className="text-xs font-bold text-white block">Add Availability Window:</span>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={availStartDate}
                    onChange={(e) => setAvailStartDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={availEndDate}
                    onChange={(e) => setAvailEndDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Status</label>
                <select
                  value={availStatus}
                  onChange={(e) => setAvailStatus(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="available">🟢 Available for Deployment / Travel</option>
                  <option value="unavailable">⛔ Blackout / Unavailable (PTO / Personal)</option>
                  <option value="tentative">🤔 Tentative (Subject to confirmation)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Notes / Preferences (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Ready for Carolinas or Florida blitzes; preferred departure DFW"
                  value={availNotes}
                  onChange={(e) => setAvailNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAvailabilityModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20"
                >
                  Save Availability Window
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: MANAGER JOIN REQUESTS REVIEW DRAWER */}
      {showRequestsDrawer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 max-w-2xl w-full space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowRequestsDrawer(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-400 text-[10px] font-black uppercase">
                  Leadership Review Console
                </span>
              </div>
              <h3 className="text-xl font-black text-white mt-1">Pending Blitz Join Requests</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Review and approve field representatives requesting assignment to state sales blitzes.
              </p>
            </div>

            {joinRequests.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-950/60 rounded-2xl border border-slate-800">
                No join requests logged in system.
              </div>
            ) : (
              <div className="space-y-3">
                {joinRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 text-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-black text-sm">{req.userName}</span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-bold">
                            {req.userRole}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                              req.status === 'approved'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : req.status === 'rejected'
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {req.status}
                          </span>
                        </div>
                        <p className="text-slate-400 text-[11px]">
                          Target Blitz: <strong className="text-emerald-300">{req.blitzTitle} ({req.blitzState})</strong>
                        </p>
                      </div>

                      <div className="text-right text-[11px] text-slate-400">
                        <span>Submitted {new Date(req.submittedAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1.5 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Home Airport:</span>
                        <span className="text-white font-medium">{req.userHomeAirport}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Pledged Production:</span>
                        <span className="text-emerald-400 font-bold">{req.pledgedInstalls || 25} Verified Installs</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Roommate Request:</span>
                        <span className="text-slate-300">{req.roommatePreference || 'Standard assignment'}</span>
                      </div>
                      <div className="pt-1 text-slate-300">
                        <span className="text-slate-500 block">Rep Notes:</span>
                        <p className="italic">{req.requestNotes}</p>
                      </div>
                    </div>

                    {req.status === 'pending' && (
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          onClick={() => reviewJoinRequest(req.id, 'rejected', 'Roster capacity filled')}
                          className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold"
                        >
                          Decline Request
                        </button>
                        <button
                          onClick={() => reviewJoinRequest(req.id, 'approved', 'Approved for travel dispatch')}
                          className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve & Book Roster Spot</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
