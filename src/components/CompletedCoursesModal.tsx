import React, { useState } from 'react';
import { CourseSubmission, Course } from '../types';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { X, ChevronLeft, CheckCircle2, AlertCircle, MessageSquare } from 'lucide-react';

interface CompletedCoursesModalProps {
  isOpen: boolean;
  onClose: () => void;
  completedSubmissions: CourseSubmission[];
  courses: Course[];
}

export const CompletedCoursesModal: React.FC<CompletedCoursesModalProps> = ({
  isOpen,
  onClose,
  completedSubmissions: initialSubmissions,
  courses,
}) => {
  const { addCommentToSubmission, getCompletedSubmissions } = useData();
  const { users } = useAuth();
  const [selectedSubmission, setSelectedSubmission] = useState<CourseSubmission | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [completedSubmissions, setCompletedSubmissions] = useState<CourseSubmission[]>(initialSubmissions);

  if (!isOpen) return null;

  const handleAddComment = async () => {
    if (!selectedSubmission || !newComment.trim()) return;
    setIsSubmittingComment(true);
    try {
      await addCommentToSubmission(selectedSubmission.id, newComment);
      setNewComment('');
      // Refresh submissions to show the new comment
      const refreshed = getCompletedSubmissions();
      setCompletedSubmissions(refreshed);
      // Update selected submission with fresh data
      const updatedSub = refreshed.find((s) => s.id === selectedSubmission.id);
      if (updatedSub) {
        setSelectedSubmission(updatedSub);
      }
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const getCourseTitle = (courseId: string) => {
    return courses.find((c) => c.id === courseId)?.title || 'Unknown Course';
  };

  const getStudentName = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : 'Unknown Student';
  };

  if (selectedSubmission) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-slate-900 rounded-2xl border border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
          {/* Header */}
          <div className="sticky top-0 bg-slate-950/90 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedSubmission(null)}
                className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-slate-400" />
              </button>
              <div>
                <h3 className="font-bold text-white">Submission Review</h3>
                <p className="text-xs text-slate-400">
                  {getStudentName(selectedSubmission.userId)} • {getCourseTitle(selectedSubmission.courseId)}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Submission Info */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Student</p>
                  <p className="text-sm font-semibold text-slate-200 mt-1">
                    {getStudentName(selectedSubmission.userId)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Course</p>
                  <p className="text-sm font-semibold text-slate-200 mt-1">
                    {getCourseTitle(selectedSubmission.courseId)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Status</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    {selectedSubmission.status === 'completed' ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm font-semibold text-emerald-400">Completed</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-red-400" />
                        <span className="text-sm font-semibold text-red-400">Rejected</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Grade */}
            {selectedSubmission.assignmentGrade !== undefined && (
              <div className="bg-gradient-to-r from-slate-800/50 to-slate-800/30 rounded-xl border border-slate-700 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-300">Assignment Grade</span>
                  <span className={`text-lg font-bold px-3 py-1.5 rounded-lg ${
                    selectedSubmission.assignmentGrade >= 70
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {selectedSubmission.assignmentGrade}/100
                  </span>
                </div>
              </div>
            )}

            {/* Quiz Score */}
            {selectedSubmission.quizScore !== undefined && (
              <div className="bg-gradient-to-r from-slate-800/50 to-slate-800/30 rounded-xl border border-slate-700 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-300">Quiz Score</span>
                  <span className={`text-lg font-bold px-3 py-1.5 rounded-lg ${
                    selectedSubmission.quizPassed
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {selectedSubmission.quizScore}%
                  </span>
                </div>
              </div>
            )}

            {/* Assignment Answer */}
            {selectedSubmission.assignmentAnswer && (
              <div>
                <h4 className="text-sm font-bold text-white mb-3">Written Response</h4>
                <div className="bg-slate-800/30 rounded-lg border border-slate-700 p-4">
                  <p className="text-sm text-slate-200 whitespace-pre-wrap">
                    {selectedSubmission.assignmentAnswer}
                  </p>
                </div>
              </div>
            )}

            {/* Instructor Feedback */}
            {selectedSubmission.reviewFeedback && (
              <div>
                <h4 className="text-sm font-bold text-white mb-3">Instructor Feedback</h4>
                <div className="bg-amber-500/10 rounded-lg border border-amber-500/30 p-4">
                  <p className="text-sm text-amber-100 whitespace-pre-wrap">
                    {selectedSubmission.reviewFeedback}
                  </p>
                </div>
              </div>
            )}

            {/* Owner Comments Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <h4 className="text-sm font-bold text-white">
                  Owner Comments ({selectedSubmission.ownerComments?.length || 0})
                </h4>
              </div>

              {/* Existing Comments */}
              {selectedSubmission.ownerComments && selectedSubmission.ownerComments.length > 0 && (
                <div className="space-y-2">
                  {selectedSubmission.ownerComments.map((comment) => (
                    <div key={comment.id} className="bg-slate-800/30 rounded-lg border border-slate-700 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold text-emerald-400">{comment.commentedByName}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(comment.commentedAt).toLocaleDateString()} {new Date(comment.commentedAt).toLocaleTimeString()}
                        </p>
                      </div>
                      <p className="text-sm text-slate-200">{comment.text}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Comment Form */}
              <div className="space-y-2 mt-4">
                <label className="text-xs font-bold text-slate-300 block">Add Your Comment</label>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share feedback, observations, or notes about this submission..."
                  className="w-full h-20 px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-emerald-500/20 resize-none text-sm"
                />
                <button
                  onClick={handleAddComment}
                  disabled={isSubmittingComment || !newComment.trim()}
                  className="w-full px-4 py-2.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-cyan-500/50 text-emerald-400 hover:text-emerald-300 font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingComment ? 'Adding Comment...' : 'Add Comment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl border border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="bg-slate-950/90 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Completed Coursework</h2>
            <p className="text-sm text-slate-400 mt-1">
              {completedSubmissions.length} submission{completedSubmissions.length !== 1 ? 's' : ''} completed or reviewed
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50">
          {completedSubmissions.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-12 px-4">
              <CheckCircle2 className="w-12 h-12 text-slate-500/40 mb-3" />
              <p className="text-slate-400 font-medium">No completed submissions yet</p>
              <p className="text-sm text-slate-500 mt-1">Completed coursework will appear here</p>
            </div>
          ) : (
            completedSubmissions.map((submission) => {
              const course = courses.find((c) => c.id === submission.courseId);
              const student = users.find((u) => u.id === submission.userId);

              return (
                <button
                  key={submission.id}
                  onClick={() => setSelectedSubmission(submission)}
                  className="w-full text-left p-4 hover:bg-slate-800/50 transition-colors focus:outline-none focus:bg-slate-800/70"
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="mt-1.5">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
                        submission.status === 'completed'
                          ? 'bg-emerald-500/20 border-emerald-500/30'
                          : 'bg-red-500/20 border-red-500/30'
                      }`}>
                        {submission.status === 'completed' ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-400" />
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <p className="font-semibold text-slate-200">
                            {student ? `${student.firstName} ${student.lastName}` : 'Unknown Student'}
                          </p>
                          <p className="text-sm text-slate-400 mt-0.5">
                            {course?.title || 'Unknown Course'}
                          </p>
                        </div>
                        <span className={`text-xs font-bold uppercase px-2 py-1 rounded border whitespace-nowrap ${
                          submission.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                          {submission.status === 'completed' ? 'Completed' : 'Rejected'}
                        </span>
                      </div>

                      {/* Meta Info and Grade */}
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
                        <span>Submitted {new Date(submission.completedAt || '').toLocaleDateString()}</span>
                        {submission.assignmentGrade !== undefined && (
                          <>
                            <span>•</span>
                            <span className={submission.assignmentGrade >= 70 ? 'text-emerald-400' : 'text-red-400'}>
                              Grade: {submission.assignmentGrade}/100
                            </span>
                          </>
                        )}
                        {submission.quizScore !== undefined && (
                          <>
                            <span>•</span>
                            <span className={submission.quizPassed ? 'text-emerald-400' : 'text-red-400'}>
                              Quiz: {submission.quizScore}%
                            </span>
                          </>
                        )}
                      </div>

                      {/* Comments Badge */}
                      {submission.ownerComments && submission.ownerComments.length > 0 && (
                        <div className="flex items-center gap-1 text-xs text-emerald-400 mt-2">
                          <MessageSquare className="w-3 h-3" />
                          <span>{submission.ownerComments.length} comment{submission.ownerComments.length !== 1 ? 's' : ''}</span>
                        </div>
                      )}
                    </div>

                    {/* Chevron */}
                    <div className="mt-1.5">
                      <ChevronLeft className="w-5 h-5 text-slate-600 rotate-180" />
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
