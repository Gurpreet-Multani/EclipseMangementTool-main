import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import {
  X,
  UserCheck,
  UserX,
  Clock,
  Mail,
  UserPlus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Users,
  CheckSquare,
  Square,
  MinusSquare,
  Shield,
  Trash2,
  RefreshCw,
} from 'lucide-react';

interface AccessApprovalsModalProps {
  onClose: () => void;
}

export const AccessApprovalsModal: React.FC<AccessApprovalsModalProps> = ({ onClose }) => {
  const { users, approveUser, rejectUser, preApproveEmail, currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'pending' | 'preapprove' | 'active'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);

  // Bulk Selection States
  const [selectedPendingIds, setSelectedPendingIds] = useState<Set<string>>(new Set());
  const [selectedActiveIds, setSelectedActiveIds] = useState<Set<string>>(new Set());

  // Per-user role selection state in pending list
  const [selectedRoles, setSelectedRoles] = useState<Record<string, UserRole>>({});

  // Bulk role for pending batch approval
  const [bulkPendingRole, setBulkPendingRole] = useState<UserRole>('Representative');

  // Pre-approve form state
  const [preApproveForm, setPreApproveForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'Representative' as UserRole,
    title: 'Fiber Field Specialist',
  });
  const [submittingPreApprove, setSubmittingPreApprove] = useState(false);

  // Separate users by approval status
  const pendingUsers = users.filter((u) => u.approvalStatus === 'pending');
  const approvedUsers = users.filter((u) => (u.approvalStatus || 'approved') === 'approved');

  const filteredPending = pendingUsers.filter(
    (u) =>
      u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredApproved = approvedUsers.filter(
    (u) =>
      u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- Bulk Checkbox Handlers for Pending Requests ---
  const isAllPendingSelected =
    filteredPending.length > 0 && filteredPending.every((u) => selectedPendingIds.has(u.id));
  const isSomePendingSelected =
    filteredPending.some((u) => selectedPendingIds.has(u.id)) && !isAllPendingSelected;

  const handleToggleSelectAllPending = () => {
    if (isAllPendingSelected) {
      setSelectedPendingIds(new Set());
    } else {
      const newSet = new Set(selectedPendingIds);
      filteredPending.forEach((u) => newSet.add(u.id));
      setSelectedPendingIds(newSet);
    }
  };

  const handleTogglePendingUser = (userId: string) => {
    setSelectedPendingIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  // --- Bulk Checkbox Handlers for Active Directory ---
  // Founder / Current User cannot have access revoked in bulk
  const revokableActiveUsers = filteredApproved.filter(
    (u) => !u.email.toLowerCase().includes('gurpreet') && u.id !== currentUser?.id
  );

  const isAllActiveSelected =
    revokableActiveUsers.length > 0 && revokableActiveUsers.every((u) => selectedActiveIds.has(u.id));
  const isSomeActiveSelected =
    revokableActiveUsers.some((u) => selectedActiveIds.has(u.id)) && !isAllActiveSelected;

  const handleToggleSelectAllActive = () => {
    if (isAllActiveSelected) {
      setSelectedActiveIds(new Set());
    } else {
      const newSet = new Set(selectedActiveIds);
      revokableActiveUsers.forEach((u) => newSet.add(u.id));
      setSelectedActiveIds(newSet);
    }
  };

  const handleToggleActiveUser = (userId: string) => {
    setSelectedActiveIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  // --- Single User Actions ---
  const handleApprove = async (userId: string) => {
    setActionNotice(null);
    const roleToAssign = selectedRoles[userId] || 'Representative';
    const titleToAssign =
      roleToAssign === 'Admin'
        ? 'Executive Administrator'
        : roleToAssign === 'Manager'
        ? 'Regional Operations Director'
        : 'Fiber Field Specialist';

    const success = await approveUser(userId, roleToAssign, titleToAssign);
    if (success) {
      setSelectedPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
      setActionNotice({ type: 'success', message: `User approved successfully as ${roleToAssign}.` });
    } else {
      setActionNotice({ type: 'error', message: 'Failed to approve user. Check permissions.' });
    }
  };

  const handleReject = async (userId: string) => {
    setActionNotice(null);
    const success = await rejectUser(userId, 'Declined by Administrator');
    if (success) {
      setSelectedPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
      setSelectedActiveIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
      setActionNotice({ type: 'success', message: 'Access status updated.' });
    } else {
      setActionNotice({ type: 'error', message: 'Failed to update user status.' });
    }
  };

  // --- Bulk Actions for Pending Tab ---
  const handleBulkApprovePending = async () => {
    if (selectedPendingIds.size === 0) return;
    setActionNotice(null);
    setIsProcessingBulk(true);

    const titleToAssign =
      bulkPendingRole === 'Admin'
        ? 'Executive Administrator'
        : bulkPendingRole === 'Manager'
        ? 'Regional Operations Director'
        : 'Fiber Field Specialist';

    let successCount = 0;
    const ids = Array.from(selectedPendingIds);

    for (const userId of ids) {
      const role = selectedRoles[userId] || bulkPendingRole;
      const title =
        role === 'Admin'
          ? 'Executive Administrator'
          : role === 'Manager'
          ? 'Regional Operations Director'
          : titleToAssign;

      const ok = await approveUser(userId, role, title);
      if (ok) successCount++;
    }

    setSelectedPendingIds(new Set());
    setIsProcessingBulk(false);
    setActionNotice({
      type: 'success',
      message: `Bulk Approved: Granted dashboard access to ${successCount} user${successCount === 1 ? '' : 's'}.`,
    });
  };

  const handleBulkDenyPending = async () => {
    if (selectedPendingIds.size === 0) return;
    if (!window.confirm(`Are you sure you want to deny access to ${selectedPendingIds.size} pending applicants?`)) {
      return;
    }

    setActionNotice(null);
    setIsProcessingBulk(true);

    let successCount = 0;
    const ids = Array.from(selectedPendingIds);

    for (const userId of ids) {
      const ok = await rejectUser(userId, 'Bulk declined by Administrator');
      if (ok) successCount++;
    }

    setSelectedPendingIds(new Set());
    setIsProcessingBulk(false);
    setActionNotice({
      type: 'success',
      message: `Bulk Denied: Declined access for ${successCount} applicant${successCount === 1 ? '' : 's'}.`,
    });
  };

  // --- Bulk Action for Active Directory Tab ---
  const handleBulkRevokeActive = async () => {
    if (selectedActiveIds.size === 0) return;
    if (
      !window.confirm(
        `Are you sure you want to immediately revoke access for ${selectedActiveIds.size} team member(s)? They will be locked out of the dashboard immediately.`
      )
    ) {
      return;
    }

    setActionNotice(null);
    setIsProcessingBulk(true);

    let successCount = 0;
    const ids = Array.from(selectedActiveIds);

    for (const userId of ids) {
      const ok = await rejectUser(userId, 'Bulk access revoked by Administrator');
      if (ok) successCount++;
    }

    setSelectedActiveIds(new Set());
    setIsProcessingBulk(false);
    setActionNotice({
      type: 'success',
      message: `Bulk Revoked: Successfully locked out ${successCount} member${successCount === 1 ? '' : 's'}.`,
    });
  };

  const handlePreApproveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionNotice(null);
    setSubmittingPreApprove(true);

    const success = await preApproveEmail(
      preApproveForm.email,
      preApproveForm.role,
      preApproveForm.title,
      preApproveForm.firstName,
      preApproveForm.lastName
    );

    if (success) {
      setActionNotice({
        type: 'success',
        message: `Account for ${preApproveForm.email} is pre-authorized! When they sign in with Google, they will get instant access.`,
      });
      setPreApproveForm({
        email: '',
        firstName: '',
        lastName: '',
        role: 'Representative',
        title: 'Fiber Field Specialist',
      });
    } else {
      setActionNotice({ type: 'error', message: 'Failed to pre-authorize account.' });
    }

    setSubmittingPreApprove(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 max-w-3xl w-full max-h-[92vh] overflow-y-auto space-y-5 shadow-2xl relative text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
              Access Governance & Whitelist
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
            Google Account Access & Approval Control
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Control exactly who can log into the Eclipse platform. Unapproved users are blocked at the gate.
          </p>
        </div>

        {/* Action Notice */}
        {actionNotice && (
          <div
            className={`p-3.5 rounded-2xl text-xs flex items-center gap-2.5 ${
              actionNotice.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
            }`}
          >
            {actionNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span className="font-medium">{actionNotice.message}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 gap-2">
          <button
            onClick={() => setActiveTab('pending')}
            className={`pb-3 px-3 text-xs font-bold transition-all relative flex items-center gap-2 cursor-pointer ${
              activeTab === 'pending'
                ? 'text-amber-400 border-b-2 border-amber-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Requests</span>
            {pendingUsers.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-400 text-slate-950">
                {pendingUsers.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('preapprove')}
            className={`pb-3 px-3 text-xs font-bold transition-all relative flex items-center gap-2 cursor-pointer ${
              activeTab === 'preapprove'
                ? 'text-emerald-400 border-b-2 border-emerald-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Pre-Approve Google Email</span>
          </button>

          <button
            onClick={() => setActiveTab('active')}
            className={`pb-3 px-3 text-xs font-bold transition-all relative flex items-center gap-2 cursor-pointer ${
              activeTab === 'active'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Active Team Directory ({approvedUsers.length})</span>
          </button>
        </div>

        {/* TAB 1: PENDING APPROVAL REQUESTS */}
        {activeTab === 'pending' && (
          <div className="space-y-3.5">
            {/* Search Bar & Header */}
            <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter pending by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <span className="text-[11px] text-amber-400 font-semibold self-end sm:self-center">
                {pendingUsers.length} Awaiting Authorization
              </span>
            </div>

            {/* Bulk Selection Action Bar for Pending Requests */}
            {filteredPending.length > 0 && (
              <div className="bg-slate-950 p-3 rounded-2xl border border-amber-500/30 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleToggleSelectAllPending}
                    className="flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer select-none"
                  >
                    {isAllPendingSelected ? (
                      <CheckSquare className="w-4 h-4 text-amber-400" />
                    ) : isSomePendingSelected ? (
                      <MinusSquare className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-500" />
                    )}
                    <span>
                      {selectedPendingIds.size > 0
                        ? `${selectedPendingIds.size} Selected`
                        : 'Select All'}
                    </span>
                  </button>

                  {selectedPendingIds.size > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedPendingIds(new Set())}
                      className="text-[11px] text-slate-500 hover:text-slate-300 underline cursor-pointer"
                    >
                      Deselect
                    </button>
                  )}
                </div>

                {/* Bulk Actions Controls */}
                {selectedPendingIds.size > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-2 py-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Role:</span>
                      <select
                        value={bulkPendingRole}
                        onChange={(e) => setBulkPendingRole(e.target.value as UserRole)}
                        className="bg-transparent text-xs text-white font-bold focus:outline-none cursor-pointer"
                      >
                        <option value="Representative" className="bg-slate-900 text-white">Representative</option>
                        <option value="Manager" className="bg-slate-900 text-white">Manager</option>
                        <option value="Admin" className="bg-slate-900 text-white">Admin</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      disabled={isProcessingBulk}
                      onClick={handleBulkDenyPending}
                      className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      <span>Bulk Deny ({selectedPendingIds.size})</span>
                    </button>

                    <button
                      type="button"
                      disabled={isProcessingBulk}
                      onClick={handleBulkApprovePending}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
                    >
                      {isProcessingBulk ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <UserCheck className="w-3.5 h-3.5" />
                      )}
                      <span>Bulk Approve ({selectedPendingIds.size})</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {filteredPending.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="text-xs font-semibold text-slate-200">No pending access requests</p>
                <p className="text-[11px] text-slate-500">
                  All accounts attempting to sign in have been reviewed or pre-authorized.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPending.map((user) => {
                  const roleValue = selectedRoles[user.id] || 'Representative';
                  const isChecked = selectedPendingIds.has(user.id);

                  return (
                    <div
                      key={user.id}
                      className={`p-4 rounded-2xl bg-slate-950 border transition-all space-y-3 ${
                        isChecked ? 'border-amber-400/70 bg-amber-950/10' : 'border-amber-500/25'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {/* Checkbox */}
                          <button
                            type="button"
                            onClick={() => handleTogglePendingUser(user.id)}
                            className="cursor-pointer text-slate-400 hover:text-white"
                          >
                            {isChecked ? (
                              <CheckSquare className="w-5 h-5 text-amber-400" />
                            ) : (
                              <Square className="w-5 h-5 text-slate-600 hover:text-slate-400" />
                            )}
                          </button>

                          <img
                            src={
                              user.badgePhotoUrl ||
                              user.idPhotoUrl ||
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
                            }
                            alt=""
                            className="w-10 h-10 rounded-xl object-cover ring-2 ring-amber-400/40"
                          />
                          <div>
                            <p className="text-xs font-bold text-white">{user.displayName}</p>
                            <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3 text-slate-500" />
                              <span>{user.email}</span>
                            </p>
                          </div>
                        </div>

                        <div className="text-right text-[11px] text-slate-400">
                          <span className="text-[10px] text-slate-500 uppercase font-bold block">
                            Requested:
                          </span>
                          <span>
                            {user.requestedAt
                              ? new Date(user.requestedAt).toLocaleDateString([], {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : 'Recently'}
                          </span>
                        </div>
                      </div>

                      {/* Role selection & approval actions */}
                      <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <label className="text-[11px] font-semibold text-slate-400">
                            Assign Role:
                          </label>
                          <select
                            value={roleValue}
                            onChange={(e) =>
                              setSelectedRoles((prev) => ({
                                ...prev,
                                [user.id]: e.target.value as UserRole,
                              }))
                            }
                            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-amber-400"
                          >
                            <option value="Representative">Representative</option>
                            <option value="Manager">Manager</option>
                            <option value="Admin">Admin</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleReject(user.id)}
                            className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <UserX className="w-3.5 h-3.5" />
                            <span>Deny Access</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleApprove(user.id)}
                            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Approve & Grant Access</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PRE-APPROVE GOOGLE EMAIL */}
        {activeTab === 'preapprove' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 space-y-1 text-xs text-emerald-200">
              <p className="font-bold">How Pre-Approval Works:</p>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Add your team member's Google email here in advance. When they click "Continue with Google" or type their email on the login screen, they are automatically recognized as an authorized team member and bypass the pending gate.
              </p>
            </div>

            <form onSubmit={handlePreApproveSubmit} className="space-y-3.5 p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John"
                    value={preApproveForm.firstName}
                    onChange={(e) =>
                      setPreApproveForm((prev) => ({ ...prev, firstName: e.target.value }))
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Doe"
                    value={preApproveForm.lastName}
                    onChange={(e) =>
                      setPreApproveForm((prev) => ({ ...prev, lastName: e.target.value }))
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  Google Workspace / Account Email
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="rep@eclipsemarketingagency.org or rep@gmail.com"
                    value={preApproveForm.email}
                    onChange={(e) =>
                      setPreApproveForm((prev) => ({ ...prev, email: e.target.value }))
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">
                    Platform Role
                  </label>
                  <select
                    value={preApproveForm.role}
                    onChange={(e) =>
                      setPreApproveForm((prev) => ({
                        ...prev,
                        role: e.target.value as UserRole,
                      }))
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Representative">Representative</option>
                    <option value="Manager">Manager</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">
                    Job Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Fiber Specialist"
                    value={preApproveForm.title}
                    onChange={(e) =>
                      setPreApproveForm((prev) => ({ ...prev, title: e.target.value }))
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingPreApprove}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4" />
                <span>Pre-Approve & Whitelist Account</span>
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: ACTIVE DIRECTORY & REVOCATION */}
        {activeTab === 'active' && (
          <div className="space-y-3.5">
            {/* Search Bar */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search approved team members by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Bulk Selection Bar for Active Directory */}
            {revokableActiveUsers.length > 0 && (
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleToggleSelectAllActive}
                    className="flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer select-none"
                  >
                    {isAllActiveSelected ? (
                      <CheckSquare className="w-4 h-4 text-cyan-400" />
                    ) : isSomeActiveSelected ? (
                      <MinusSquare className="w-4 h-4 text-cyan-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-500" />
                    )}
                    <span>
                      {selectedActiveIds.size > 0
                        ? `${selectedActiveIds.size} Selected`
                        : 'Select All Team'}
                    </span>
                  </button>

                  {selectedActiveIds.size > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedActiveIds(new Set())}
                      className="text-[11px] text-slate-500 hover:text-slate-300 underline cursor-pointer"
                    >
                      Deselect
                    </button>
                  )}
                </div>

                {/* Bulk Revoke Button */}
                {selectedActiveIds.size > 0 && (
                  <button
                    type="button"
                    disabled={isProcessingBulk}
                    onClick={handleBulkRevokeActive}
                    className="px-3.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-500/10 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isProcessingBulk ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    )}
                    <span>Bulk Revoke Access ({selectedActiveIds.size})</span>
                  </button>
                )}
              </div>
            )}

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {filteredApproved.map((u) => {
                const isMe = u.id === currentUser?.id;
                const isFounder = u.email.toLowerCase().includes('gurpreet');
                const isChecked = selectedActiveIds.has(u.id);

                return (
                  <div
                    key={u.id}
                    className={`p-3 rounded-xl bg-slate-950 border flex items-center justify-between gap-3 transition-all ${
                      isChecked ? 'border-cyan-500/60 bg-cyan-950/10' : 'border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Checkbox only for revokable users */}
                      {!isFounder && !isMe ? (
                        <button
                          type="button"
                          onClick={() => handleToggleActiveUser(u.id)}
                          className="cursor-pointer text-slate-400 hover:text-white shrink-0"
                        >
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-cyan-400" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-600 hover:text-slate-400" />
                          )}
                        </button>
                      ) : (
                        <div className="w-4 h-4 shrink-0" />
                      )}

                      <img
                        src={
                          u.badgePhotoUrl ||
                          u.idPhotoUrl ||
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
                        }
                        alt=""
                        className="w-9 h-9 rounded-lg object-cover ring-1 ring-emerald-500/40 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-white truncate">{u.displayName}</p>
                          {isFounder && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-amber-400/20 text-amber-400">
                              Owner
                            </span>
                          )}
                          {isMe && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-emerald-500/20 text-emerald-400">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">{u.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-semibold text-slate-300 capitalize px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800">
                        {u.role}
                      </span>

                      {!isFounder && !isMe && (
                        <button
                          type="button"
                          onClick={() => handleReject(u.id)}
                          className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-semibold transition-colors cursor-pointer"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
