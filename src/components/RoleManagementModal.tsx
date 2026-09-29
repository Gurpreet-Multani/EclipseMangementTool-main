import React, { useState } from 'react';
import { X, Plus, Edit2, Trash2, CheckCircle2, AlertCircle, GitFork, Sliders } from 'lucide-react';
import { CustomRole, RolePermissions } from '../types';
import { useAuth } from '../context/AuthContext';
import { VisualHierarchyTree } from './VisualHierarchyTree';

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

export const RoleManagementModal: React.FC<RoleManagementModalProps> = ({
  onClose,
  roles,
  onCreateRole,
  onUpdateRole,
  onDeleteRole,
}) => {
  const { allUsers, currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'hierarchy' | 'custom_roles'>('hierarchy');
  const [isCreating, setIsCreating] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: { ...DEFAULT_PERMISSIONS },
  });
  const [successMsg, setSuccessMsg] = useState('');

  const handleCreateRole = () => {
    if (!formData.name.trim()) {
      alert('Role name is required');
      return;
    }

    const newRole: CustomRole = {
      id: `role_${Date.now()}`,
      name: formData.name,
      description: formData.description,
      permissions: formData.permissions,
      isCustom: true,
      createdAt: new Date().toISOString(),
      createdBy: 'admin',
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin',
    };

    onCreateRole(newRole);
    setSuccessMsg(`Role "${formData.name}" created successfully!`);
    setFormData({ name: '', description: '', permissions: { ...DEFAULT_PERMISSIONS } });
    setIsCreating(false);

    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleUpdateRole = (roleId: string) => {
    if (!formData.name.trim()) {
      alert('Role name is required');
      return;
    }

    const updatedRole: CustomRole = {
      ...roles.find((r) => r.id === roleId)!,
      name: formData.name,
      description: formData.description,
      permissions: formData.permissions,
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin',
    };

    onUpdateRole(updatedRole);
    setSuccessMsg(`Role "${formData.name}" updated successfully!`);
    setFormData({ name: '', description: '', permissions: { ...DEFAULT_PERMISSIONS } });
    setEditingRoleId(null);

    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleEditClick = (role: CustomRole) => {
    setEditingRoleId(role.id);
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

  const permissionGroups = [
    {
      title: 'Executive & Financial',
      permissions: [
        { key: 'canManageAgencyCashFlow' as const, label: 'Manage Agency Cash Flow' },
        { key: 'canNegotiateMasterAgreements' as const, label: 'Negotiate Master Agreements' },
        { key: 'canChangePayRates' as const, label: 'Change Commission Pay Rates' },
      ],
    },
    {
      title: 'Blitz & Turf Operations',
      permissions: [
        { key: 'canLaunchStateBlitz' as const, label: 'Launch State Blitzes' },
        { key: 'canCutTurf' as const, label: 'Cut Turf & Street Grids' },
        { key: 'canManageLogisticsAndBadging' as const, label: 'Hotel Logistics & Vendor Badging' },
      ],
    },
    {
      title: 'Team & User Governance',
      permissions: [
        { key: 'canManageAllUsers' as const, label: 'Manage All Users' },
        { key: 'canManageTeam' as const, label: 'Manage Squad & Team' },
        { key: 'canChangeUserRolesAndTitles' as const, label: 'Assign Roles & Titles' },
      ],
    },
    {
      title: 'Training & Content Academy',
      permissions: [
        { key: 'canUploadCoursework' as const, label: 'Upload & Author Coursework' },
        { key: 'canAccessTraining' as const, label: 'Access Training Academy' },
      ],
    },
    {
      title: 'Sales & Reporting',
      permissions: [
        { key: 'canViewAllSales' as const, label: 'View All Sales Orders' },
        { key: 'canViewTeamSales' as const, label: 'View Team Sales Orders' },
        { key: 'canSubmitSales' as const, label: 'Submit Sales Orders' },
      ],
    },
    {
      title: 'Admin Governance',
      permissions: [
        { key: 'canCreateRoles' as const, label: 'Create Custom Roles' },
        { key: 'canEditPermissions' as const, label: 'Edit Permissions' },
        { key: 'canAccessProfile' as const, label: 'Access Profiles' },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 max-w-5xl w-full max-h-[92vh] overflow-y-auto space-y-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4 pr-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400"></span>
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                Governance & Team Architecture
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-0.5">
              Role & Hierarchy Management
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Visualize reporting structures across Regional Directors, Blitz Managers, Team Leads, and Representatives.
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800 shadow-inner">
            <button
              onClick={() => setActiveTab('hierarchy')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'hierarchy'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <GitFork className="w-3.5 h-3.5" />
              <span>Visual Hierarchy Tree</span>
            </button>
            <button
              onClick={() => setActiveTab('custom_roles')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'custom_roles'
                  ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Permissions & Roles</span>
            </button>
          </div>
        </div>

        {successMsg && (
          <div className="p-3.5 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* TAB 1: VISUAL HIERARCHY TREE */}
        {activeTab === 'hierarchy' && (
          <VisualHierarchyTree
            users={allUsers}
            currentUserId={currentUser?.id}
          />
        )}

        {/* TAB 2: CUSTOM ROLES & PERMISSIONS EDITOR */}
        {activeTab === 'custom_roles' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Role List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Configured Roles</h3>
                {!isCreating && !editingRoleId && (
                  <button
                    onClick={() => setIsCreating(true)}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    New Role
                  </button>
                )}
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {roles.map((role) => (
                  <div
                    key={role.id}
                    className={`p-3 rounded-xl border transition-all ${
                      editingRoleId === role.id
                        ? 'bg-slate-950 border-indigo-500'
                        : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex-1">
                        <h4 className="text-xs font-bold text-white">{role.name}</h4>
                        <p className="text-[10px] text-slate-400">{role.description}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleEditClick(role)}
                          className="p-1.5 rounded text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteRole(role.id)}
                          className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    {role.isCustom && (
                      <span className="inline-block text-[8px] font-bold text-indigo-300 bg-indigo-950 px-2 py-0.5 rounded">
                        CUSTOM
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Permission Editor */}
            <div className="space-y-4">
              {(isCreating || editingRoleId) && (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white">
                      {isCreating ? 'Create Role' : 'Edit Role'}
                    </h3>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-bold text-slate-400 block mb-1">Role Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Regional Vice President"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-400 block mb-1">Description</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Brief summary of duties..."
                        rows={2}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="space-y-3 max-h-[300px] overflow-y-auto">
                      <label className="text-xs font-bold text-slate-400 block">Permissions</label>
                      {permissionGroups.map((group) => (
                        <div key={group.title} className="p-3 bg-slate-950/50 rounded-xl border border-slate-800/80 space-y-2">
                          <h4 className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">{group.title}</h4>
                          <div className="space-y-1.5">
                            {group.permissions.map((perm) => (
                              <label
                                key={perm.key}
                                className="flex items-center gap-2 text-xs text-slate-300 hover:text-white cursor-pointer select-none"
                              >
                                <input
                                  type="checkbox"
                                  checked={formData.permissions[perm.key] || false}
                                  onChange={() => handlePermissionChange(perm.key)}
                                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span>{perm.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => {
                          if (isCreating) {
                            handleCreateRole();
                          } else if (editingRoleId) {
                            handleUpdateRole(editingRoleId);
                          }
                        }}
                        className="flex-1 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors cursor-pointer"
                      >
                        {isCreating ? 'Create Role' : 'Save Role'}
                      </button>
                      <button
                        onClick={() => {
                          setIsCreating(false);
                          setEditingRoleId(null);
                          setFormData({ name: '', description: '', permissions: { ...DEFAULT_PERMISSIONS } });
                        }}
                        className="flex-1 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </>
              )}

              {!isCreating && !editingRoleId && (
                <div className="flex items-center justify-center h-[350px] text-center bg-slate-950/40 rounded-2xl border border-slate-800/60 p-6">
                  <div>
                    <AlertCircle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-xs text-slate-400">Select a custom role on the left to edit permissions or create a new one.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
          >
            Close View
          </button>
        </div>
      </div>
    </div>
  );
};
