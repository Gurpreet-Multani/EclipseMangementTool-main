import React, { useState } from 'react';
import {
  X,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  GitFork,
  Sliders,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Shield,
  Layers,
  Sparkles,
  RotateCcw,
  PlayCircle,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import {
  CustomRole,
  RolePermissions,
  ButtonActionId,
  ButtonVisibilityState,
  AppTabId,
  PanelSectionId,
  UserRole
} from '../types';
import { useAuth } from '../context/AuthContext';
import { VisualHierarchyTree } from './VisualHierarchyTree';
import {
  ALL_BUTTON_ACTIONS,
  ALL_TABS,
  ALL_PANELS,
  getDefaultUiConfigForRole
} from '../lib/roleUiDefaults';

interface RoleManagementModalProps {
  onClose: () => void;
  roles: CustomRole[];
  onCreateRole: (role: CustomRole) => void;
  onUpdateRole: (role: CustomRole) => void;
  onDeleteRole: (roleId: string) => void;
}

const DEFAULT_PERMISSIONS: RolePermissions = {
  canManageAllUsers: false,
  canManageTeam: false,
  canChangeUserRolesAndTitles: false,
  canChangePayRates: false,
  canUploadCoursework: false,
  canLaunchStateBlitz: false,
  canViewAllSales: false,
  canViewTeamSales: false,
  canSubmitSales: false,
  canAccessTraining: false,
  canAccessProfile: false,
  canCutTurf: false,
  canManageLogisticsAndBadging: false,
  canNegotiateMasterAgreements: false,
  canManageAgencyCashFlow: false,
  canCreateRoles: false,
  canEditPermissions: false,
};

const STANDARD_ROLE_NAMES: string[] = [
  'Admin',
  'Regional Director',
  'Blitz Manager',
  'Team Lead',
  'Corporate Trainer',
  'Field Sales Representative',
];

export const RoleManagementModal: React.FC<RoleManagementModalProps> = ({
  onClose,
  roles,
  onCreateRole,
  onUpdateRole,
  onDeleteRole,
}) => {
  const {
    allUsers,
    currentUser,
    roleUiConfigs,
    setButtonStateForRole,
    toggleTabForRole,
    togglePanelForRole,
    resetRoleUiConfig,
    setSimulatedRole,
    simulatedRole,
    isSimulating
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'hierarchy' | 'custom_roles' | 'ui_visibility' | 'simulator'>('ui_visibility');
  const [selectedRoleForUi, setSelectedRoleForUi] = useState<string>('Field Sales Representative');
  const [isCreating, setIsCreating] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: { ...DEFAULT_PERMISSIONS },
  });
  const [successMsg, setSuccessMsg] = useState('');

  // Combined roles list
  const allRoleNames = Array.from(new Set([...STANDARD_ROLE_NAMES, ...roles.map((r) => r.name)]));

  const currentUiConfig = roleUiConfigs[selectedRoleForUi] || getDefaultUiConfigForRole(selectedRoleForUi);

  const handleCreateRole = () => {
    if (!formData.name.trim()) {
      alert('Role name is required');
      return;
    }

    const newRole: CustomRole = {
      id: `role_${Date.now()}`,
      name: formData.name.trim(),
      description: formData.description.trim(),
      permissions: formData.permissions,
      isCustom: true,
      createdAt: new Date().toISOString(),
      createdBy: currentUser?.displayName || 'Admin',
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser?.displayName || 'Admin',
    };

    onCreateRole(newRole);
    setSelectedRoleForUi(newRole.name);
    setActiveTab('ui_visibility');
    setSuccessMsg(`Custom Role "${formData.name}" created! You can now configure what it is allowed to see.`);
    setFormData({ name: '', description: '', permissions: { ...DEFAULT_PERMISSIONS } });
    setIsCreating(false);

    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleUpdateRole = (roleId: string) => {
    if (!formData.name.trim()) {
      alert('Role name is required');
      return;
    }

    const existing = roles.find((r) => r.id === roleId);
    if (!existing) return;

    const updatedRole: CustomRole = {
      ...existing,
      name: formData.name.trim(),
      description: formData.description.trim(),
      permissions: formData.permissions,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser?.displayName || 'Admin',
    };

    onUpdateRole(updatedRole);
    setSuccessMsg(`Role "${formData.name}" updated successfully!`);
    setFormData({ name: '', description: '', permissions: { ...DEFAULT_PERMISSIONS } });
    setEditingRoleId(null);

    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleEditClick = (role: CustomRole) => {
    setEditingRoleId(role.id);
    setIsCreating(false);
    setFormData({
      name: role.name,
      description: role.description,
      permissions: role.permissions,
    });
  };

  const handlePermissionChange = (key: keyof RolePermissions) => {
    setFormData({
      ...formData,
      permissions: {
        ...formData.permissions,
        [key]: !formData.permissions[key],
      },
    });
  };

  const handleButtonStateChange = (buttonId: ButtonActionId, state: ButtonVisibilityState) => {
    setButtonStateForRole(selectedRoleForUi, buttonId, state);
    setSuccessMsg(`Updated "${buttonId}" to ${state.toUpperCase()} for ${selectedRoleForUi}`);
    setTimeout(() => setSuccessMsg(''), 2500);
  };

  const handleTabToggle = (tabId: AppTabId) => {
    const isCurrentlyVisible = currentUiConfig.visibleTabs?.includes(tabId);
    toggleTabForRole(selectedRoleForUi, tabId, !isCurrentlyVisible);
  };

  const handlePanelToggle = (panelId: PanelSectionId) => {
    const isCurrentlyHidden = currentUiConfig.hiddenPanels?.includes(panelId);
    togglePanelForRole(selectedRoleForUi, panelId, !isCurrentlyHidden);
  };

  const handleResetDefaults = () => {
    if (confirm(`Reset UI & button visibility for "${selectedRoleForUi}" to system defaults?`)) {
      resetRoleUiConfig(selectedRoleForUi);
      setSuccessMsg(`Reset "${selectedRoleForUi}" to default permissions and view configurations.`);
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const handleSimulateRole = (roleToSimulate: string) => {
    setSimulatedRole(roleToSimulate);
    setSuccessMsg(`Now simulating live website as: ${roleToSimulate}. Close modal to test!`);
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const permissionGroups = [
    {
      title: 'Executive & Financial',
      permissions: [
        { key: 'canManageAgencyCashFlow' as const, label: 'Manage Agency Cash Flow' },
        { key: 'canNegotiateMasterAgreements' as const, label: 'Negotiate Master Carrier Agreements' },
        { key: 'canChangePayRates' as const, label: 'Change Commission Pay Rates' },
      ],
    },
    {
      title: 'Blitz & Turf Operations',
      permissions: [
        { key: 'canLaunchStateBlitz' as const, label: 'Launch State Blitz Deployments' },
        { key: 'canCutTurf' as const, label: 'Cut Turf Grids & Street Maps' },
        { key: 'canManageLogisticsAndBadging' as const, label: 'Hotel Lodging & Security Badges' },
      ],
    },
    {
      title: 'Team & User Governance',
      permissions: [
        { key: 'canManageAllUsers' as const, label: 'Manage & Edit All Rep Profiles' },
        { key: 'canManageTeam' as const, label: 'Manage Direct Squad (2-4 reps)' },
        { key: 'canChangeUserRolesAndTitles' as const, label: 'Assign Roles & Promote Reps' },
      ],
    },
    {
      title: 'Training & Content Academy',
      permissions: [
        { key: 'canUploadCoursework' as const, label: 'Author Video Lessons & Quizzes' },
        { key: 'canAccessTraining' as const, label: 'Access Training Academy Library' },
      ],
    },
    {
      title: 'Sales & Reporting',
      permissions: [
        { key: 'canViewAllSales' as const, label: 'View All Agency Sales Orders' },
        { key: 'canViewTeamSales' as const, label: 'View Squad/Team Sales Orders' },
        { key: 'canSubmitSales' as const, label: 'Log & Submit Fiber Sales' },
      ],
    },
    {
      title: 'System Role Architecture',
      permissions: [
        { key: 'canCreateRoles' as const, label: 'Create Custom Roles' },
        { key: 'canEditPermissions' as const, label: 'Modify Security Permissions' },
        { key: 'canAccessProfile' as const, label: 'Access Own User Profile' },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-7 max-w-6xl w-full max-h-[94vh] overflow-y-auto space-y-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4 pr-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                Owner & Executive Master Control Room
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-0.5">
              Role Architecture & UI Visibility Controls
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Create custom roles, customize what each role is allowed to see, disable or hide buttons, and test via Live Simulator.
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800 shadow-inner flex-wrap gap-1">
            <button
              onClick={() => setActiveTab('ui_visibility')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'ui_visibility'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Button & View Controls</span>
            </button>
            <button
              onClick={() => setActiveTab('custom_roles')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'custom_roles'
                  ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Custom Roles & Permissions</span>
            </button>
            <button
              onClick={() => setActiveTab('hierarchy')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'hierarchy'
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <GitFork className="w-3.5 h-3.5" />
              <span>Visual Hierarchy</span>
            </button>
            <button
              onClick={() => setActiveTab('simulator')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'simulator'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <PlayCircle className="w-3.5 h-3.5" />
              <span>Live Role Simulator</span>
            </button>
          </div>
        </div>

        {/* Status Toast */}
        {successMsg && (
          <div className="p-3.5 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* TAB 1: UI VISIBILITY & BUTTON CONTROLS */}
        {activeTab === 'ui_visibility' && (
          <div className="space-y-6">
            {/* Role Switcher Bar */}
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-300">Select Role to Configure:</span>
                <select
                  value={selectedRoleForUi}
                  onChange={(e) => setSelectedRoleForUi(e.target.value)}
                  className="px-3 py-1.5 bg-slate-900 border border-emerald-500/40 rounded-xl text-xs font-bold text-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                >
                  {allRoleNames.map((r) => (
                    <option key={r} value={r}>
                      {r} {roles.some((cr) => cr.name === r) ? '(Custom Role)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3 text-slate-400" />
                  <span>Reset to Defaults</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSimulateRole(selectedRoleForUi)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  <Eye className="w-3 h-3" />
                  <span>Preview as {selectedRoleForUi}</span>
                </button>
              </div>
            </div>

            {/* Section A: Action Buttons Control (Enable / Disable / Hide) */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-3xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    Action Buttons & Clickable Triggers
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Choose whether buttons are fully active (Enable), visible but locked with a restriction tooltip (Disable), or completely removed (Hide).
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-3 text-[10px] font-mono text-slate-400">
                  <span className="flex items-center gap-1 text-emerald-400"><Unlock className="w-3 h-3" /> Enabled</span>
                  <span className="flex items-center gap-1 text-amber-400"><Lock className="w-3 h-3" /> Disabled</span>
                  <span className="flex items-center gap-1 text-rose-400"><EyeOff className="w-3 h-3" /> Hidden</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {ALL_BUTTON_ACTIONS.map((btn) => {
                  const state: ButtonVisibilityState =
                    currentUiConfig.buttonStates?.[btn.id] ?? 'enabled';

                  return (
                    <div
                      key={btn.id}
                      className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white truncate">{btn.label}</span>
                          <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                            {btn.category}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{btn.description}</p>
                      </div>

                      {/* 3-Way Selector */}
                      <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => handleButtonStateChange(btn.id, 'enabled')}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                            state === 'enabled'
                              ? 'bg-emerald-500 text-slate-950 shadow-sm'
                              : 'text-slate-500 hover:text-slate-300'
                          }`}
                          title="Button is active and usable"
                        >
                          Enable
                        </button>
                        <button
                          type="button"
                          onClick={() => handleButtonStateChange(btn.id, 'disabled')}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                            state === 'disabled'
                              ? 'bg-amber-500 text-slate-950 shadow-sm'
                              : 'text-slate-500 hover:text-slate-300'
                          }`}
                          title="Button is visible but locked and disabled"
                        >
                          Disable
                        </button>
                        <button
                          type="button"
                          onClick={() => handleButtonStateChange(btn.id, 'hidden')}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                            state === 'hidden'
                              ? 'bg-rose-500 text-white shadow-sm'
                              : 'text-slate-500 hover:text-slate-300'
                          }`}
                          title="Button is completely removed from UI"
                        >
                          Hide
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section B: Navigation Tabs Visibility */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-3xl p-5 space-y-4">
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-teal-400" />
                  Navigation Tabs Visibility
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Check which main navigation tabs appear in the bottom tab bar and header for users in this role.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {ALL_TABS.map((tab) => {
                  const isVisible = currentUiConfig.visibleTabs?.includes(tab.id);

                  return (
                    <div
                      key={tab.id}
                      onClick={() => handleTabToggle(tab.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isVisible
                          ? 'bg-teal-950/30 border-teal-500/40 text-teal-200'
                          : 'bg-slate-900/60 border-slate-800 text-slate-500 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <span className="text-xs font-bold block">{tab.label}</span>
                        <span className="text-[10px] text-slate-400 line-clamp-1">{tab.description}</span>
                      </div>
                      <div className="flex-shrink-0">
                        {isVisible ? (
                          <span className="text-xs font-bold text-teal-400 flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5" />
                            Show
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                            <EyeOff className="w-3.5 h-3.5" />
                            Hide
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section C: Information Panels & Modules */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-3xl p-5 space-y-4">
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-400" />
                  Information Panels & Data Cards
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Toggle specific dashboards cards and financial panels on or off for this role.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {ALL_PANELS.map((panel) => {
                  const isHidden = currentUiConfig.hiddenPanels?.includes(panel.id);

                  return (
                    <div
                      key={panel.id}
                      onClick={() => handlePanelToggle(panel.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        !isHidden
                          ? 'bg-indigo-950/30 border-indigo-500/40 text-indigo-200'
                          : 'bg-slate-900/60 border-slate-800 text-slate-500 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <span className="text-xs font-bold block">{panel.label}</span>
                        <span className="text-[10px] text-slate-400 line-clamp-1">{panel.description}</span>
                      </div>
                      <div className="flex-shrink-0">
                        {!isHidden ? (
                          <span className="text-xs font-bold text-indigo-400 flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5" />
                            Active
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-rose-400 flex items-center gap-1">
                            <EyeOff className="w-3.5 h-3.5" />
                            Hidden
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CUSTOM ROLES & PERMISSIONS */}
        {activeTab === 'custom_roles' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Role List */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Configured Roles</h3>
                {!isCreating && !editingRoleId && (
                  <button
                    onClick={() => {
                      setIsCreating(true);
                      setEditingRoleId(null);
                      setFormData({ name: '', description: '', permissions: { ...DEFAULT_PERMISSIONS } });
                    }}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create New Role</span>
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {/* Standard System Roles */}
                <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800/80 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Core System Roles
                  </span>
                  <div className="space-y-1.5">
                    {STANDARD_ROLE_NAMES.map((sr) => (
                      <div
                        key={sr}
                        className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between"
                      >
                        <span className="text-xs font-bold text-slate-200">{sr}</span>
                        <span className="text-[9px] font-mono uppercase bg-slate-800 px-2 py-0.5 rounded text-slate-400">
                          Built-in
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Custom User Roles */}
                <div className="p-3 bg-slate-950/80 rounded-2xl border border-indigo-500/30 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
                    Custom Created Roles ({roles.length})
                  </span>
                  {roles.length === 0 ? (
                    <p className="text-xs text-slate-500 py-3 text-center">
                      No custom roles created yet. Click "Create New Role" above.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {roles.map((role) => (
                        <div
                          key={role.id}
                          className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/40 flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-white truncate">{role.name}</h4>
                            <p className="text-[11px] text-slate-400 line-clamp-1">{role.description}</p>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => handleEditClick(role)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white"
                              title="Edit Role"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Delete custom role "${role.name}"?`)) {
                                  onDeleteRole(role.id);
                                }
                              }}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-400"
                              title="Delete Role"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Role Creator / Editor Form */}
            <div className="lg:col-span-7 bg-slate-950/60 border border-slate-800/80 rounded-3xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-400" />
                {editingRoleId ? 'Edit Custom Role & Permissions' : isCreating ? 'Define New Custom Role' : 'Role Security Specs'}
              </h3>

              {(isCreating || editingRoleId) ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Role Title / Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Senior Lead Trainer, Blitz Logistics Specialist..."
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Role Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Explain reporting responsibilities, field purview, and authority level..."
                      rows={2}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-2">Authority Permissions</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-2">
                      {permissionGroups.map((group) => (
                        <div key={group.title} className="p-3 bg-slate-900/70 border border-slate-800/60 rounded-xl space-y-2">
                          <span className="text-[10px] uppercase font-bold text-indigo-400 block tracking-wider">
                            {group.title}
                          </span>
                          {group.permissions.map((perm) => (
                            <label
                              key={perm.key}
                              className="flex items-center gap-2 text-xs text-slate-300 hover:text-white cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={!!formData.permissions[perm.key]}
                                onChange={() => handlePermissionChange(perm.key)}
                                className="w-3.5 h-3.5 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-950"
                              />
                              <span className="text-[11px]">{perm.label}</span>
                            </label>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreating(false);
                        setEditingRoleId(null);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (editingRoleId) {
                          handleUpdateRole(editingRoleId);
                        } else {
                          handleCreateRole();
                        }
                      }}
                      className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-lg"
                    >
                      {editingRoleId ? 'Save Role Changes' : 'Create Custom Role'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Sliders className="w-6 h-6" />
                  </div>
                  <p className="text-xs max-w-sm">
                    Select a custom role on the left to edit its permissions, or click <strong>"Create New Role"</strong> to define custom responsibilities.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: VISUAL HIERARCHY TREE */}
        {activeTab === 'hierarchy' && (
          <VisualHierarchyTree
            users={allUsers}
            currentUserId={currentUser?.id}
          />
        )}

        {/* TAB 4: LIVE ROLE SIMULATOR */}
        {activeTab === 'simulator' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-amber-950/40 via-slate-950 to-slate-900 border border-amber-500/30 rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                  <PlayCircle className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-white">Live Role Experience Simulator</h3>
                  <p className="text-xs text-slate-300">
                    Instantly experience and test the website through the exact eyes and permissions of any role.
                  </p>
                </div>
              </div>

              {isSimulating && (
                <div className="p-3.5 bg-amber-500/20 border border-amber-500/40 rounded-2xl flex items-center justify-between text-xs text-amber-200 font-bold">
                  <span>Currently Simulating: {simulatedRole}</span>
                  <button
                    onClick={() => setSimulatedRole(null)}
                    className="px-3 py-1 rounded-xl bg-amber-500 text-slate-950 font-black hover:bg-amber-400 transition-colors"
                  >
                    Exit Simulator
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                {allRoleNames.map((roleName) => {
                  const isCurrentSim = simulatedRole === roleName;
                  return (
                    <div
                      key={roleName}
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                        isCurrentSim
                          ? 'bg-amber-950/40 border-amber-500/60 ring-1 ring-amber-500'
                          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <span className="text-xs font-bold text-white block">{roleName}</span>
                        <span className="text-[10px] text-slate-400">
                          {roles.some((cr) => cr.name === roleName) ? 'Custom User Role' : 'Core Hierarchy Tier'}
                        </span>
                      </div>
                      <button
                        onClick={() => handleSimulateRole(roleName)}
                        className={`w-full py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isCurrentSim
                            ? 'bg-amber-400 text-slate-950'
                            : 'bg-slate-950 hover:bg-amber-500 hover:text-slate-950 border border-slate-800 text-slate-300'
                        }`}
                      >
                        {isCurrentSim ? 'Active Preview' : `Test View as ${roleName}`}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
