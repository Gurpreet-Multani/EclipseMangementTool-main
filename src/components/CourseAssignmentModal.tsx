import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Course, UserProfile } from '../types';
import {
  X,
  Send,
  Users,
  Shield,
  Calendar,
  AlertCircle,
  Zap,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  GraduationCap,
} from 'lucide-react';

interface CourseAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  courses: Course[];
  allUsers: UserProfile[];
  onAssignCourse: (courseId: string, assignedRoles: string[], assignedUserIds: string[], dueDate?: string, priority?: 'low' | 'medium' | 'high' | 'critical', description?: string) => Promise<boolean | void>;
}

export const CourseAssignmentModal: React.FC<CourseAssignmentModalProps> = ({
  isOpen,
  onClose,
  courses,
  allUsers,
  onAssignCourse,
}) => {
  const { currentUser, customRoles } = useAuth();
  
  // Form state
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState<string>('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Get all available roles (default + custom)
  const allRoles = ['Representative', 'Manager', 'Admin', ...customRoles.map(r => r.name)];

  // Get users matching selected roles
  const usersWithSelectedRoles = allUsers.filter(user => 
    selectedRoles.includes(user.role as string)
  );

  const handleToggleRole = (role: string) => {
    setSelectedRoles(prev => 
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const handleToggleUser = (userId: string) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) {
      alert('Please select a course');
      return;
    }
    if (selectedRoles.length === 0 && selectedUserIds.length === 0) {
      alert('Please select at least one role or user');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAssignCourse(
        selectedCourseId,
        selectedRoles,
        selectedUserIds,
        dueDate || undefined,
        priority,
        description
      );
      
      setSuccessMessage('Coursework assigned successfully!');
      setTimeout(() => {
        // Reset form
        setSelectedCourseId('');
        setSelectedRoles([]);
        setSelectedUserIds([]);
        setDueDate('');
        setPriority('medium');
        setDescription('');
        setSuccessMessage('');
        onClose();
      }, 1500);
    } catch (error) {
      alert('Failed to assign coursework');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCourse = courses.find(c => c.id === selectedCourseId);
  const totalAssignees = selectedRoles.length + selectedUserIds.length;
  const estimatedAssignedUsers = selectedRoles.length > 0 
    ? usersWithSelectedRoles.length
    : selectedUserIds.length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 max-w-3xl w-full max-h-[90vh] overflow-y-auto space-y-5 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
            Course Management
          </span>
          <h3 className="text-xl font-black text-white mt-0.5">
            Assign Coursework to Team Members
          </h3>
          <p className="text-xs text-slate-400">
            Distribute training courses to specific roles or users with optional due dates and priorities.
          </p>
        </div>

        {successMessage && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-sm font-bold text-emerald-400">{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Select Course */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-2 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-emerald-400" />
              Select Course to Assign
            </label>
            <select
              required
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 transition-colors"
            >
              <option value="">-- Choose a course --</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.title} ({course.estimatedHours}h - {course.level})
                </option>
              ))}
            </select>
            {selectedCourse && (
              <div className="mt-2 p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                <p className="text-xs text-slate-300">
                  <span className="font-bold text-emerald-300">{selectedCourse.title}</span>
                  <br />
                  {selectedCourse.description}
                </p>
              </div>
            )}
          </div>

          {/* Assign to Roles */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-400" />
              Assign to Roles (or select specific users below)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {allRoles.map(role => (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleToggleRole(role)}
                  className={`p-2.5 rounded-lg text-xs font-semibold transition-all border ${
                    selectedRoles.includes(role)
                      ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {selectedRoles.includes(role) && <Plus className="w-3 h-3 inline mr-1" />}
                  {role}
                </button>
              ))}
            </div>
            {selectedRoles.length > 0 && (
              <div className="mt-2 p-2.5 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                <p className="text-xs text-indigo-300">
                  Will assign to <span className="font-bold">{usersWithSelectedRoles.length}</span> user(s) with selected role(s)
                </p>
              </div>
            )}
          </div>

          {/* Assign to Specific Users */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              Or Assign to Specific Users
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto bg-slate-950/30 p-3 rounded-xl border border-slate-800">
              {allUsers.length === 0 ? (
                <p className="text-xs text-slate-500">No users available</p>
              ) : (
                allUsers.map(user => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleToggleUser(user.id)}
                    className={`w-full p-2.5 rounded-lg text-left text-xs transition-all border flex items-center justify-between ${
                      selectedUserIds.includes(user.id)
                        ? 'bg-emerald-500/20 border-cyan-500 text-emerald-200'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-900'
                    }`}
                  >
                    <div>
                      <span className="font-semibold">{user.displayName}</span>
                      <span className="text-slate-500 ml-2">({user.role})</span>
                    </div>
                    {selectedUserIds.includes(user.id) && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>
            {selectedUserIds.length > 0 && (
              <div className="mt-2 p-2.5 bg-emerald-500/10 rounded-lg border border-cyan-500/20">
                <p className="text-xs text-emerald-300">
                  <span className="font-bold">{selectedUserIds.length}</span> user(s) selected
                </p>
              </div>
            )}
          </div>

          {/* Priority & Due Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-2 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Priority Level
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 transition-colors"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                Due Date (Optional)
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* Additional Instructions */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              Additional Instructions (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add any special context or requirements for completing this course..."
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-rose-500 transition-colors resize-none"
            />
          </div>

          {/* Assignment Summary */}
          {(selectedRoles.length > 0 || selectedUserIds.length > 0) && (
            <div className="bg-gradient-to-r from-slate-950 to-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Assignment Summary</span>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <Shield className="w-4 h-4 text-indigo-400" />
                  <span>Roles: <span className="font-bold">{selectedRoles.length}</span></span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span>Users: <span className="font-bold">{selectedUserIds.length}</span></span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span>Estimated: <span className="font-bold">{estimatedAssignedUsers || 0}</span> people</span>
                </div>
                {priority && (
                  <div className="flex items-center gap-2 text-slate-300">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>Priority: <span className="font-bold capitalize">{priority}</span></span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-900 font-bold text-xs transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedCourseId || (selectedRoles.length === 0 && selectedUserIds.length === 0)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Assigning...' : 'Assign Coursework'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
