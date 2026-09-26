import React, { useState } from 'react';
import { CourseSubmission, Course } from '../types';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { X, CheckCircle2, Clock, AlertCircle, ChevronLeft, BookOpen } from 'lucide-react';

interface PendingReviewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingSubmissions: CourseSubmission[];
  courses: Course[];
}

export const PendingReviewsModal: React.FC<PendingReviewsModalProps> = ({
  isOpen,
  onClose,
  pendingSubmissions,
  courses,
}) => {
  const { reviewCourseSubmission } = useData();
  const { users } = useAuth();
  const [selectedSubmission, setSelectedSubmission] = useState<CourseSubmission | null>(null);
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [reviewGrade, setReviewGrade] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleApprove = async () => {
    if (!selectedSubmission) return;
    setIsSubmitting(true);
    try {
      const grade = typeof reviewGrade === 'number' ? reviewGrade : undefined;
      await reviewCourseSubmission(selectedSubmission.id, 'approved', reviewFeedback, grade);
      setSelectedSubmission(null);
      setReviewFeedback('');
      setReviewGrade('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedSubmission) return;
    setIsSubmitting(true);
    try {
      const grade = typeof reviewGrade === 'number' ? reviewGrade : undefined;
      await reviewCourseSubmission(selectedSubmission.id, 'rejected', reviewFeedback, grade);
      setSelectedSubmission(null);
      setReviewFeedback('');
      setReviewGrade('');
    } finally {
      setIsSubmitting(false);
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
                <h3 className="font-bold text-white">Review Submission</h3>
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
                  <p className="text-[10px] uppercase font-bold text-slate-400">Submitted</p>
                  <p className="text-sm font-semibold text-slate-200 mt-1">
                    {new Date(selectedSubmission.submittedAt || '').toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Status</p>
                  <p className="text-sm font-semibold text-amber-400 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Pending
                  </p>
                </div>
              </div>
            </div>

            {/* Quiz Answers */}
            {selectedSubmission.quizAnswers && Object.keys(selectedSubmission.quizAnswers).length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-white mb-3">Quiz Responses</h4>
                <div className="space-y-3">
                  {Object.entries(selectedSubmission.quizAnswers).map(([questionId, answer], idx) => (
                    <div key={questionId} className="bg-slate-800/30 rounded-lg border border-slate-700 p-4">
                      <p className="text-xs font-bold text-slate-400 mb-2">Question {idx + 1}</p>
                      <p className="text-sm text-slate-200">
                        {typeof answer === 'number' ? `Answer: Option ${answer + 1}` : answer}
                      </p>
                    </div>
                  ))}
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

            {/* Grade Input */}
            <div>
              <label className="block text-sm font-bold text-white mb-2">
                Assignment Grade (0-100)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={reviewGrade}
                  onChange={(e) => setReviewGrade(e.target.value === '' ? '' : parseInt(e.target.value))}
                  placeholder="Enter grade"
                  className="flex-1 px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-emerald-500/20 text-sm"
                />
                {typeof reviewGrade === 'number' && (
                  <div className={`px-3 py-2 rounded-lg text-sm font-bold whitespace-nowrap ${
                    reviewGrade >= 70
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {reviewGrade >= 70 ? '✓ PASS' : '✗ FAIL'}
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Passing grade: 70 or higher
              </p>
            </div>

            {/* Review Feedback Input */}
            <div>
              <label className="block text-sm font-bold text-white mb-2">
                Feedback & Review Notes
              </label>
              <textarea
                value={reviewFeedback}
                onChange={(e) => setReviewFeedback(e.target.value)}
                placeholder="Enter your feedback, suggestions, or reasons for rejection..."
                className="w-full h-24 px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-emerald-500/20 resize-none text-sm"
              />
              <p className="text-xs text-slate-400 mt-2">
                This feedback will be sent to the student
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleReject}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 hover:text-red-300 font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Reject & Request Revision</span>
              </button>
              <button
                onClick={handleApprove}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-400 hover:text-emerald-300 font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve</span>
              </button>
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
            <h2 className="text-xl font-bold text-white">Pending Course Reviews</h2>
            <p className="text-sm text-slate-400 mt-1">
              {pendingSubmissions.length} submission{pendingSubmissions.length !== 1 ? 's' : ''} awaiting your approval
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
          {pendingSubmissions.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-12 px-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-500/40 mb-3" />
              <p className="text-slate-400 font-medium">All caught up!</p>
              <p className="text-sm text-slate-500 mt-1">No submissions pending review</p>
            </div>
          ) : (
            pendingSubmissions.map((submission) => {
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
                      <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-amber-400" />
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
                        <span className="text-xs font-bold uppercase text-amber-400 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20 whitespace-nowrap">
                          Pending
                        </span>
                      </div>

                      {/* Meta Info */}
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
                        <span>Submitted {new Date(submission.submittedAt || '').toLocaleDateString()}</span>
                        {submission.dueDate && (
                          <>
                            <span>•</span>
                            <span>Due {new Date(submission.dueDate).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>

                      {/* Preview */}
                      {submission.assignmentAnswer && (
                        <p className="text-sm text-slate-400 mt-2 line-clamp-2">
                          {submission.assignmentAnswer}
                        </p>
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
