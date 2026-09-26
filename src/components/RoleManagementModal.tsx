import React, { useState } from 'react';
import { X, Plus, Edit2, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { CustomRole, RolePermissions } from '../types';

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
      title: 'User Management',
      permissions: [
        { key: 'canManageAllUsers' as const, label: 'Manage All Users' },
        { key: 'canManageTeam' as const, label: 'Manage Team Members' },
        { key: 'canChangeUserRolesAndTitles' as const, label: 'Change User Roles & Titles' },
      ],
    },
    {
      title: 'Financial & Payroll',
      permissions: [
        { key: 'canChangePayRates' as const, label: 'Change Pay Rates' },
      ],
    },
    {
      title: 'Training & Content',
      permissions: [
        { key: 'canUploadCoursework' as const, label: 'Upload Coursework' },
        { key: 'canAccessTraining' as const, label: 'Access Training' },
      ],
    },
    {
      title: 'Operations',
      permissions: [
        { key: 'canLaunchStateBlitz' as const, label: 'Launch State Blitz' },
      ],
    },
    {
      title: 'Sales & Reporting',
      permissions: [
        { key: 'canViewAllSales' as const, label: 'View All Sales' },
        { key: 'canViewTeamSales' as const, label: 'View Team Sales' },
        { key: 'canSubmitSales' as const, label: 'Submit Sales' },
      ],
    },
    {
      title: 'Admin Controls',
      permissions: [
        { key: 'canCreateRoles' as const, label: 'Create Roles' },
        { key: 'canEditPermissions' as const, label: 'Edit Permissions' },
        { key: 'canAccessProfile' as const, label: 'Access Profiles' },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 max-w-4xl w-full max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-400"></span>
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
              Admin Controls
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
            Role Management & Permissions Editor
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Create custom roles and manage permissions for your team.
          </p>
        </div>

        {successMsg && (
          <div className="p-3.5 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Role List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Existing Roles</h3>
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
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Role Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Team Lead"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe this role's purpose..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none h-16"
                  />
                </div>

                <div className="space-y-3 max-h-[350px] overflow-y-auto">
                  <h4 className="text-xs font-bold text-white">Permissions</h4>
                  {permissionGroups.map((group) => (
                    <div key={group.title} className="bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                      <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-2">
                        {group.title}
                      </p>
                      <div className="space-y-1.5">
                        {group.permissions.map((perm) => (
                          <label
                            key={perm.key}
                            className="flex items-center gap-2 cursor-pointer hover:bg-slate-900 p-1.5 rounded transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={formData.permissions[perm.key] || false}
                              onChange={() => handlePermissionChange(perm.key)}
                              className="w-4 h-4 rounded border-slate-600 text-indigo-600 cursor-pointer"
                            />
                            <span className="text-xs text-slate-300">{perm.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => {
                      if (isCreating) {
                        handleCreateRole();
                      } else if (editingRoleId) {
                        handleUpdateRole(editingRoleId);
                      }
                    }}
                    className="flex-1 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors"
                  >
                    {isCreating ? 'Create Role' : 'Update Role'}
                  </button>
                  <button
                    onClick={() => {
                      setIsCreating(false);
                      setEditingRoleId(null);
                      setFormData({ name: '', description: '', permissions: { ...DEFAULT_PERMISSIONS } });
                    }}
                    className="flex-1 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}

            {!isCreating && !editingRoleId && (
              <div className="flex items-center justify-center h-[400px] text-center">
                <div>
                  <AlertCircle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">Select a role to edit or create a new one</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
