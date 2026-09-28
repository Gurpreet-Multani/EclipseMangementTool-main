import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { BlitzEvent } from '../types';
import { BlitzCalendarView } from './BlitzCalendarView';
import {
  MapPin,
  Calendar,
  Building,
  DollarSign,
  Users,
  CheckCircle,
  PlusCircle,
  Plane,
  AlertCircle,
  Filter,
  Check,
  X,
  ChevronRight,
  Flame,
  Award,
  Radio,
  Send,
  CalendarDays,
  LayoutGrid
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { US_STATES } from '../lib/states';

interface BlitzBookingViewProps {
  onOpenMessagingForBlitz?: (blitzId: string) => void;
}

export const BlitzBookingView: React.FC<BlitzBookingViewProps> = ({ onOpenMessagingForBlitz }) => {
  const { currentUser, isAdmin, isManager, isRepresentative, canManageTeam, allUsers } = useAuth();
  const {
    blitzes,
    bookBlitz,
    cancelBlitzBooking,
    createNewBlitz,
    isUserBookedForBlitz,
    submitJoinRequest,
    getUserJoinRequestForBlitz,
  } = useData();

  // View Mode: 'calendar' (requested component) or 'cards'
  const [viewMode, setViewMode] = useState<'calendar' | 'cards'>('calendar');

  // Filters
  const [selectedState, setSelectedState] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Booking Modal State
  const [bookingBlitz, setBookingBlitz] = useState<BlitzEvent | null>(null);
  const [flightNotes, setFlightNotes] = useState<string>('');
  const [roommatePref, setRoommatePref] = useState<string>('');
  const [bookingSuccessMsg, setBookingSuccessMsg] = useState<string>('');

  // Join Request Modal from Card View
  const [joinRequestBlitz, setJoinRequestBlitz] = useState<BlitzEvent | null>(null);
  const [joinNotes, setJoinNotes] = useState<string>('');
  const [joinRoommate, setJoinRoommate] = useState<string>('');
  const [joinPledgedInstalls, setJoinPledgedInstalls] = useState<number>(25);
  const [joinRequestMsg, setJoinRequestMsg] = useState<string>('');

  // New Blitz Creation Modal (Owner / Manager)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBlitzTitle, setNewBlitzTitle] = useState('');
  const [newBlitzState, setNewBlitzState] = useState('TX');
  const [newBlitzCity, setNewBlitzCity] = useState('');
  const [newBlitzIsp, setNewBlitzIsp] = useState('AT&T Fiber');
  const [newBlitzStart, setNewBlitzStart] = useState('2026-10-25');
  const [newBlitzEnd, setNewBlitzEnd] = useState('2026-11-08');
  const [newBlitzTarget, setNewBlitzTarget] = useState(300);
  const [newBlitzSpots, setNewBlitzSpots] = useState(30);
  const [newBlitzHotel, setNewBlitzHotel] = useState('');
  const [newBlitzPerDiem, setNewBlitzPerDiem] = useState(75);
  const [newBlitzDesc, setNewBlitzDesc] = useState('');

  // Filter blitz list
  const filteredBlitzes = blitzes.filter((b) => {
    if (selectedState !== 'all' && b.state !== selectedState) return false;
    if (selectedStatus !== 'all' && b.status !== selectedStatus) return false;
    return true;
  });

  const activeBlitzes = filteredBlitzes.filter((b) => b.status === 'active');
  const upcomingBlitzes = filteredBlitzes.filter((b) => b.status === 'upcoming');
  const completedBlitzes = filteredBlitzes.filter((b) => b.status === 'completed');

  const handleConfirmBooking = async () => {
    if (!bookingBlitz) return;
    const res = await bookBlitz(bookingBlitz.id, flightNotes, roommatePref);
    if (res.success) {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
      });
      setBookingSuccessMsg(res.message);
      setTimeout(() => {
        setBookingBlitz(null);
        setBookingSuccessMsg('');
        setFlightNotes('');
        setRoommatePref('');
      }, 1800);
    } else {
      alert(res.message);
    }
  };

  const handleCardSubmitJoinRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinRequestBlitz) return;
    const res = await submitJoinRequest({
      blitzId: joinRequestBlitz.id,
      requestNotes: joinNotes || 'Standard field deployment request.',
      roommatePreference: joinRoommate || 'Standard assignment',
      pledgedInstalls: joinPledgedInstalls,
    });
    if (res.success) {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
      });
      setJoinRequestMsg(res.message);
      setTimeout(() => {
        setJoinRequestBlitz(null);
        setJoinRequestMsg('');
        setJoinNotes('');
        setJoinRoommate('');
      }, 1800);
    } else {
      alert(res.message);
    }
  };

  const handleCreateBlitz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlitzTitle || !newBlitzCity) {
      alert('Please fill out blitz title and city.');
      return;
    }

    await createNewBlitz({
      title: newBlitzTitle,
      state: newBlitzState,
      city: newBlitzCity,
      ispPartner: newBlitzIsp,
      startDate: newBlitzStart,
      endDate: newBlitzEnd,
      status: 'upcoming',
      targetGoal: Number(newBlitzTarget),
      maxSpots: Number(newBlitzSpots),
      hotelHub: newBlitzHotel || 'HQ Hotel Pending Contract',
      dailyPerDiem: Number(newBlitzPerDiem),
      description: newBlitzDesc || 'High-velocity fiber territory rollout.',
      leadCoordinator: currentUser?.displayName || 'Regional Lead',
    });

    setShowCreateModal(false);
    // Reset form
    setNewBlitzTitle('');
    setNewBlitzCity('');
  };

  return (
    <div className="p-2.5 sm:p-3 max-w-7xl mx-auto space-y-2.5 pb-16 overflow-x-hidden">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(11,35,31,0.72),rgba(15,23,42,0.96))] p-3 sm:p-3.5 rounded-2xl border border-emerald-500/20 shadow-[0_14px_32px_rgba(2,6,23,0.28)] ring-1 ring-emerald-500/10">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="text-[10px] sm:text-xs font-bold text-emerald-400 uppercase tracking-widest">
              State Operations & Deployment
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
            Fiber Blitz Hub & Field Schedule
          </h1>
          <p className="text-[11px] text-slate-300 max-w-2xl leading-relaxed">
            Manage your blitz availability, view live calendar deployments across upcoming, active, and completed operations, or submit requests to join state blitzes.
          </p>
        </div>

        {/* View Switcher & Action Buttons */}
        <div className="flex w-full flex-col items-stretch gap-2.5 sm:flex-row sm:items-center lg:w-auto lg:justify-end">
          {/* Segmented View Switcher */}
          <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800 shadow-inner w-full sm:w-auto min-w-0">
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                viewMode === 'calendar'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CalendarDays className="w-4 h-4 stroke-[2.5px]" />
              <span>Calendar View</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                viewMode === 'cards'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-4 h-4 stroke-[2.5px]" />
              <span>Territory Cards</span>
            </button>
          </div>

          {/* Action Button for Admins / Managers */}
          {(isAdmin || isManager) && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-[11px] flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 w-full sm:w-auto shrink-0 whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4 stroke-[2.5px]" />
              <span>Launch State Blitz</span>
            </button>
          )}
        </div>
      </div>

      {/* RENDER VIEW: CALENDAR VIEW OR CARDS VIEW */}
      {viewMode === 'calendar' ? (
        <BlitzCalendarView onOpenMessagingForBlitz={onOpenMessagingForBlitz} />
      ) : (
        <div className="space-y-4">
          {/* State & Status Filter Bar */}
          <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Filter className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold text-slate-300">Filter Markets:</span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              {/* All 52 States Filter Dropdown */}
              <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[10px] sm:text-xs font-semibold">State:</span>
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="bg-transparent text-emerald-400 font-bold text-[10px] sm:text-xs focus:outline-none cursor-pointer"
                >
                  <option value="all" className="bg-slate-900 text-white">All 52 States & Territories</option>
                  {US_STATES.map((st) => (
                    <option key={st.code} value={st.code} className="bg-slate-900 text-white">
                      {st.code} - {st.name}
                    </option>
                  ))}
                </select>
              </div>

              <span className="text-slate-700 hidden sm:inline">|</span>

              {/* Status Pills */}
              {['all', 'active', 'upcoming', 'completed'].map((status) => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`px-2.5 sm:px-3 py-1 rounded-xl text-[10px] sm:text-xs font-semibold capitalize transition-all ${
                    selectedStatus === status
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {status === 'all' ? 'All Blitzes' : `${status} Only`}
                </button>
              ))}
            </div>
          </div>

          {/* SECTION 1: ACTIVE BLITZES GOING ON RIGHT NOW */}
          {(selectedStatus === 'all' || selectedStatus === 'active') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></div>
                  <h2 className="text-xl font-black text-white">Active State Blitzes in the Field</h2>
                </div>
                <span className="text-xs text-slate-400 font-medium">
                  Live turf execution and daily dispatch
                </span>
              </div>

              {activeBlitzes.length === 0 ? (
                <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 text-center text-xs text-slate-400">
                  No active blitzes matching filters.
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {activeBlitzes.map((blitz) => {
                    const percentGoal = Math.min(100, Math.round((blitz.currentSales / blitz.targetGoal) * 100));
                    const isBooked = isUserBookedForBlitz(blitz.id);
                    const joinReq = getUserJoinRequestForBlitz(blitz.id);

                    return (
                      <div
                        key={blitz.id}
                        className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-3 sm:p-3.5 space-y-2.5 relative overflow-hidden transition-all shadow-lg shadow-black/40"
                      >
                        {/* Top Status & State Badge */}
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                              Active in Field
                            </span>
                            <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 font-black text-xs border border-emerald-500/30">
                              {blitz.state}
                            </span>
                            <span className="text-[11px] text-slate-300 font-semibold">{blitz.ispPartner}</span>
                          </div>

                          {isBooked ? (
                            <span className="px-2.5 py-1 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold flex items-center gap-1">
                              <Check className="w-3.5 h-3.5 text-indigo-400" />
                              <span>Registered</span>
                            </span>
                          ) : joinReq?.status === 'pending' ? (
                            <span className="px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1">
                              <span>Request Pending</span>
                            </span>
                          ) : null}
                        </div>

                        {/* Title & Location */}
                        <div>
                          <h3 className="text-base sm:text-lg font-black text-white leading-snug">{blitz.title}</h3>
                          <p className="text-[11px] text-slate-400 flex flex-wrap items-center gap-1.5 mt-1">
                            <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            <span>{blitz.city}, {blitz.state}</span>
                            <span className="text-slate-600">•</span>
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{blitz.startDate} to {blitz.endDate}</span>
                          </p>
                        </div>

                        <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-2">
                          {blitz.description}
                        </p>

                        {/* Quota Progress Bar */}
                        <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80 space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-1 text-[11px]">
                            <span className="font-bold text-slate-300">Sales Quota Progress:</span>
                            <span className="font-mono font-bold text-emerald-400">
                              {blitz.currentSales} / {blitz.targetGoal} Orders ({percentGoal}%)
                            </span>
                          </div>
                          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500 transition-all duration-500"
                              style={{ width: `${percentGoal}%` }}
                            ></div>
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] text-slate-400">
                            <span>Verified Installs: {blitz.installedCount}</span>
                            <span>Coordinator: {blitz.leadCoordinator}</span>
                          </div>
                        </div>

                        {/* Logistics Pill Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                          <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2">
                            <Building className="w-4 h-4 text-emerald-400 shrink-0" />
                            <div className="truncate">
                              <span className="text-[10px] text-slate-500 block">Hotel / HQ Hub</span>
                              <span className="text-slate-200 font-medium truncate block">{blitz.hotelHub}</span>
                            </div>
                          </div>
                          <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-emerald-400 shrink-0" />
                            <div>
                              <span className="text-[10px] text-slate-500 block">Daily Per Diem</span>
                              <span className="text-slate-200 font-bold">${blitz.dailyPerDiem}/day</span>
                            </div>
                          </div>
                        </div>

                        {/* Bottom Rep Capacity & Action */}
                        <div className="flex flex-col gap-2.5 pt-2 border-t border-slate-800/80 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <Users className="w-4 h-4 text-slate-400" />
                            <span className="text-[11px] text-slate-300 font-medium truncate">
                              {blitz.bookedCount} / {blitz.maxSpots} Reps Deployed
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center justify-end gap-2 w-full sm:w-auto">
                            {(canManageTeam || isAdmin || isManager) && (
                              <button
                                type="button"
                                onClick={() => onOpenMessagingForBlitz?.(blitz.id)}
                                className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 text-[11px] font-semibold transition-colors w-full sm:w-auto"
                                title="Broadcast Push Notification or Turf Dispatch to this Blitz"
                              >
                                <Radio className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Dispatch</span>
                              </button>
                            )}

                            {isBooked ? (
                              <button
                                onClick={() => cancelBlitzBooking(blitz.id)}
                                className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold underline w-full sm:w-auto text-center"
                              >
                                Cancel My Spot
                              </button>
                            ) : joinReq?.status === 'pending' ? (
                              <span className="text-[11px] text-amber-400 font-semibold w-full sm:w-auto text-center">
                                Request Pending
                              </span>
                            ) : (
                              <div className="flex flex-col gap-1.5 w-full sm:flex-row sm:w-auto">
                                <button
                                  onClick={() => setJoinRequestBlitz(blitz)}
                                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] transition-colors min-w-[120px]"
                                >
                                  Request to Join
                                </button>
                                <button
                                  onClick={() => setBookingBlitz(blitz)}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-cyan-400 text-slate-950 font-bold text-[11px] transition-colors min-w-[120px]"
                                >
                                  Instant Book
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* SECTION 2: FUTURE BLITZES (BOOK OUT BY STATE) */}
          {(selectedStatus === 'all' || selectedStatus === 'upcoming') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-400" />
                  <h2 className="text-xl font-black text-white">Future State Blitzes (Open for Booking & Requests)</h2>
                </div>
                <span className="text-xs text-slate-400">
                  Select and reserve spots or submit requests for planned state expansions
                </span>
              </div>

              {upcomingBlitzes.length === 0 ? (
                <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 text-center text-xs text-slate-400">
                  No upcoming state blitzes found for this filter.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {upcomingBlitzes.map((blitz) => {
                    const isBooked = isUserBookedForBlitz(blitz.id);
                    const joinReq = getUserJoinRequestForBlitz(blitz.id);
                    const spotsLeft = blitz.maxSpots - blitz.bookedCount;

                    return (
                      <div
                        key={blitz.id}
                        className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-3 sm:p-3.5 space-y-2.5 flex flex-col justify-between transition-all"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-wider">
                                Upcoming
                              </span>
                              <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold text-xs">
                                {blitz.state}
                              </span>
                            </div>
                            <span className="text-[11px] font-semibold text-slate-300">
                              {blitz.ispPartner}
                            </span>
                          </div>

                          <div>
                            <h3 className="text-base font-bold text-white">{blitz.title}</h3>
                            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-rose-400" />
                              <span>{blitz.city}, {blitz.state}</span>
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                              <span>{blitz.startDate} to {blitz.endDate}</span>
                            </p>
                          </div>

                          <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-3">
                            {blitz.description}
                          </p>

                          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                            <div className="flex justify-between text-slate-300">
                              <span className="text-slate-500">Target Goal:</span>
                              <span className="font-bold text-white">{blitz.targetGoal} Installs</span>
                            </div>
                            <div className="flex justify-between text-slate-300">
                              <span className="text-slate-500">Daily Per Diem:</span>
                              <span className="font-bold text-emerald-400">${blitz.dailyPerDiem} / day</span>
                            </div>
                            <div className="flex justify-between text-slate-300">
                              <span className="text-slate-500">HQ Hotel Hub:</span>
                              <span className="truncate max-w-[170px] text-right font-medium">
                                {blitz.hotelHub}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-2.5 border-t border-slate-800/80 space-y-2">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">Available Spots:</span>
                            <span
                              className={`font-bold ${
                                spotsLeft <= 5 ? 'text-amber-400' : 'text-emerald-400'
                              }`}
                            >
                              {spotsLeft} / {blitz.maxSpots} Remaining
                            </span>
                          </div>

                          <div className="flex flex-col gap-2 w-full sm:flex-row sm:items-center">
                            {(canManageTeam || isAdmin || isManager) && (
                              <button
                                type="button"
                                onClick={() => onOpenMessagingForBlitz?.(blitz.id)}
                                className="px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 text-[11px] font-semibold transition-colors flex items-center justify-center gap-1 w-full sm:w-auto"
                                title="Broadcast update to this blitz"
                              >
                                <Radio className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Dispatch</span>
                              </button>
                            )}

                            {isBooked ? (
                              <div className="w-full py-2 px-3 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-[11px] font-bold text-center flex items-center justify-center gap-2 sm:flex-1">
                                <Check className="w-4 h-4 text-indigo-400" />
                                <span>You Are Booked!</span>
                              </div>
                            ) : joinReq?.status === 'pending' ? (
                              <div className="w-full py-2 px-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-bold text-center flex items-center justify-center gap-2 sm:flex-1">
                                <span>Request Pending Review</span>
                              </div>
                            ) : (
                              <div className="w-full flex flex-col gap-1.5 sm:flex-row sm:flex-1">
                                <button
                                  onClick={() => setJoinRequestBlitz(blitz)}
                                  className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] text-center transition-all"
                                >
                                  Request to Join
                                </button>
                                <button
                                  onClick={() => setBookingBlitz(blitz)}
                                  disabled={spotsLeft <= 0}
                                  className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50 text-slate-950 font-bold text-[11px] shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-1"
                                >
                                  <Plane className="w-3.5 h-3.5" />
                                  <span>Book Out</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* SECTION 3: COMPLETED BLITZ OPERATIONS */}
          {(selectedStatus === 'all' || selectedStatus === 'completed') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-slate-400" />
                  <h2 className="text-xl font-black text-white">Completed State Blitzes (Past Operations)</h2>
                </div>
                <span className="text-xs text-slate-400">
                  Archived performance and verified install totals
                </span>
              </div>

              {completedBlitzes.length === 0 ? (
                <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 text-center text-xs text-slate-400">
                  No completed blitzes matching this filter.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {completedBlitzes.map((blitz) => {
                    const percentGoal = Math.min(100, Math.round((blitz.currentSales / blitz.targetGoal) * 100));

                    return (
                      <div
                        key={blitz.id}
                        className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 space-y-2.5 opacity-90 hover:opacity-100 transition-all"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-400 text-[10px] font-black uppercase tracking-wider">
                                Completed
                              </span>
                              <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 font-bold text-xs">
                                {blitz.state}
                              </span>
                            </div>
                            <span className="text-[11px] font-semibold text-slate-400">
                              {blitz.ispPartner}
                            </span>
                          </div>

                          <div>
                            <h3 className="text-base font-bold text-white">{blitz.title}</h3>
                            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-500" />
                              <span>{blitz.city}, {blitz.state}</span>
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-500" />
                              <span>{blitz.startDate} to {blitz.endDate}</span>
                            </p>
                          </div>

                          <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                            {blitz.description}
                          </p>

                          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 space-y-2 text-xs">
                            <div className="flex justify-between items-center">
                              <span className="text-slate-400">Final Orders:</span>
                              <span className="font-mono font-bold text-emerald-400">
                                {blitz.currentSales} / {blitz.targetGoal} ({percentGoal}%)
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-400">Verified Installs:</span>
                              <span className="font-bold text-white">{blitz.installedCount} Installs</span>
                            </div>
                            <div className="flex justify-between items-center text-[11px] text-slate-500">
                              <span>Coordinator: {blitz.leadCoordinator}</span>
                              <span>{blitz.bookedCount} Reps Deployed</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODAL: REGULAR REP SUBMIT REQUEST TO JOIN BLITZ (CARD VIEW) */}
      {joinRequestBlitz && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 max-w-lg w-full space-y-5 shadow-2xl relative">
            <button
              onClick={() => setJoinRequestBlitz(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase">
                  Join Request
                </span>
                <span className="text-xs text-slate-400">{joinRequestBlitz.ispPartner}</span>
              </div>
              <h3 className="text-xl font-black text-white mt-1">
                Request to Join {joinRequestBlitz.state} Blitz
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {joinRequestBlitz.title} • {joinRequestBlitz.city} ({joinRequestBlitz.startDate} to {joinRequestBlitz.endDate})
              </p>
            </div>

            {joinRequestMsg ? (
              <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs font-bold text-center space-y-1">
                <CheckCircle className="w-6 h-6 text-emerald-400 mx-auto" />
                <p>{joinRequestMsg}</p>
              </div>
            ) : (
              <form onSubmit={handleCardSubmitJoinRequest} className="space-y-4 text-xs">
                <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Representative Credentials
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
                    <span className="text-slate-400">Per Diem:</span>
                    <span className="text-emerald-400 font-bold">${joinRequestBlitz.dailyPerDiem} / day</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span>Pledged Production Goal:</span>
                    <span className="text-emerald-400 font-bold">{joinPledgedInstalls} Installs</span>
                  </label>
                  <input
                    type="range"
                    min={15}
                    max={60}
                    step={5}
                    value={joinPledgedInstalls}
                    onChange={(e) => setJoinPledgedInstalls(Number(e.target.value))}
                    className="w-full accent-cyan-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">
                    Flight / Travel Notes:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Arriving Sunday afternoon on flight #892"
                    value={joinNotes}
                    onChange={(e) => setJoinNotes(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">
                    Roommate Preference (Optional):
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Jordan Hayes or single upgrade"
                    value={joinRoommate}
                    onChange={(e) => setJoinRoommate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setJoinRequestBlitz(null)}
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

      {/* MODAL: BOOK OUT A STATE BLITZ */}
      {bookingBlitz && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 max-w-lg w-full space-y-5 shadow-2xl relative">
            <button
              onClick={() => setBookingBlitz(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase">
                  {bookingBlitz.state} Blitz
                </span>
                <span className="text-xs text-slate-400">{bookingBlitz.ispPartner}</span>
              </div>
              <h3 className="text-xl font-black text-white mt-1">{bookingBlitz.title}</h3>
              <p className="text-xs text-slate-400 mt-1">
                Dates: {bookingBlitz.startDate} - {bookingBlitz.endDate} • {bookingBlitz.city}
              </p>
            </div>

            {bookingSuccessMsg ? (
              <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs font-bold text-center space-y-1">
                <CheckCircle className="w-6 h-6 text-emerald-400 mx-auto" />
                <p>{bookingSuccessMsg}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Rep Travel Profile Confirmation */}
                <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 space-y-2 text-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Travel Profile Auto-Verification
                  </span>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Rep Name:</span>
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
                    <span className="text-emerald-400 font-bold">
                      ${bookingBlitz.dailyPerDiem} / day direct deposit
                    </span>
                  </div>
                </div>

                {/* Additional Travel Notes */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">
                    Flight / Travel Notes (Optional):
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Arriving Sunday afternoon on American Airlines flight #1240"
                    value={flightNotes}
                    onChange={(e) => setFlightNotes(e.target.value)}
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
                    placeholder="e.g. Jordan Hayes, or single room upgrade requested"
                    value={roommatePref}
                    onChange={(e) => setRoommatePref(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="flex items-center gap-2 p-3 bg-cyan-950/30 rounded-xl border border-cyan-800/40 text-slate-300 text-xs">
                  <input type="checkbox" defaultChecked className="rounded accent-cyan-500" />
                  <span>I agree to receive SMS flight & dispatch updates for this blitz.</span>
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    onClick={() => setBookingBlitz(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmBooking}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
                  >
                    <Plane className="w-4 h-4" />
                    <span>Confirm {bookingBlitz.state} Blitz Spot</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: LAUNCH NEW STATE BLITZ (OWNER / MANAGER ONLY) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 max-w-xl w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl relative">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                Leadership Console
              </span>
              <h3 className="text-xl font-black text-white mt-0.5">Launch New State Blitz</h3>
              <p className="text-xs text-slate-400">
                Create and publish a new blitz market for reps to book out.
              </p>
            </div>

            <form onSubmit={handleCreateBlitz} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Blitz Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nashville Music City Fiber Offensive"
                  value={newBlitzTitle}
                  onChange={(e) => setNewBlitzTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Target State</label>
                  <select
                    value={newBlitzState}
                    onChange={(e) => setNewBlitzState(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    {US_STATES.map((st) => (
                      <option key={st.code} value={st.code}>
                        {st.code} - {st.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">City / Metro</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Nashville & Franklin"
                    value={newBlitzCity}
                    onChange={(e) => setNewBlitzCity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Carrier / ISP</label>
                  <select
                    value={newBlitzIsp}
                    onChange={(e) => setNewBlitzIsp(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="AT&T Fiber">AT&T Fiber</option>
                    <option value="Frontier Fiber">Frontier Fiber</option>
                    <option value="Quantum Fiber">Quantum Fiber</option>
                    <option value="Brightspeed">Brightspeed</option>
                    <option value="Spectrum Gig">Spectrum Gig</option>
                    <option value="Kinetic Fiber">Kinetic Fiber</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Per Diem ($/day)</label>
                  <input
                    type="number"
                    value={newBlitzPerDiem}
                    onChange={(e) => setNewBlitzPerDiem(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Start Date</label>
                  <input
                    type="date"
                    value={newBlitzStart}
                    onChange={(e) => setNewBlitzStart(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">End Date</label>
                  <input
                    type="date"
                    value={newBlitzEnd}
                    onChange={(e) => setNewBlitzEnd(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Sales Goal</label>
                  <input
                    type="number"
                    value={newBlitzTarget}
                    onChange={(e) => setNewBlitzTarget(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Max Spots</label>
                  <input
                    type="number"
                    value={newBlitzSpots}
                    onChange={(e) => setNewBlitzSpots(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Hotel / Team HQ Hub</label>
                <input
                  type="text"
                  placeholder="e.g. Renaissance Nashville Hotel Downtown"
                  value={newBlitzHotel}
                  onChange={(e) => setNewBlitzHotel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Market Notes / Turf Strategy</label>
                <textarea
                  rows={3}
                  placeholder="Describe address counts, carrier promotions, transport shuttles..."
                  value={newBlitzDesc}
                  onChange={(e) => setNewBlitzDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500"
                ></textarea>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold text-xs"
                >
                  Publish State Blitz
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
