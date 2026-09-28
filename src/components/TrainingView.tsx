import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Course, CourseLesson, CourseSubmission } from '../types';
import { CourseAssignmentModal } from './CourseAssignmentModal';
import { PendingReviewsModal } from './PendingReviewsModal';
import { CompletedCoursesModal } from './CompletedCoursesModal';
import { CertificateModal } from './CertificateModal';
import {
  GraduationCap,
  Play,
  CheckCircle,
  CheckCircle2,
  Award,
  BookOpen,
  PlusCircle,
  Send,
  Video,
  FileText,
  HelpCircle,
  X,
  ChevronRight,
  ChevronLeft,
  Clock,
  Sparkles,
  Check,
  RotateCcw,
  Users,
  Search,
  Filter,
  Eye,
  Mic,
  AlertCircle,
  Flame,
  ArrowRight,
  Layers,
  Trash2,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const TrainingView: React.FC = () => {
  const { currentUser, isAdmin, isManager, canUploadCoursework, users } = useAuth();
  const {
    courses,
    submissions,
    createCourse,
    submitQuiz,
    submitAssignment,
    assignCoursework,
    getAllSubmissionsPendingReview,
    getCompletedSubmissions,
  } = useData();

  // Active view: 'list' or 'course_details'
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [activeLessonIdx, setActiveLessonIdx] = useState<number>(0);

  // Active tab inside course: 'lessons' | 'assignment' | 'quiz'
  const [courseTab, setCourseTab] = useState<'lessons' | 'assignment' | 'quiz'>('lessons');

  // Search & Filters for Course List
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'assigned' | 'in_progress' | 'completed'>('all');

  // Completed lessons tracking
  const [completedLessonIds, setCompletedLessonIds] = useState<Record<string, string[]>>(() => {
    try {
      const saved = localStorage.getItem('eclipse_completed_lessons_map');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Assignment text state
  const [assignmentText, setAssignmentText] = useState<string>('');
  const [assignmentSubmitted, setAssignmentSubmitted] = useState<boolean>(false);
  const [voicePracticeActive, setVoicePracticeActive] = useState<boolean>(false);
  const [practiceSeconds, setPracticeSeconds] = useState<number>(0);

  // Quiz state
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizResult, setQuizResult] = useState<{ score: number; passed: boolean } | null>(null);
  const [showExamReview, setShowExamReview] = useState<boolean>(false);

  // Modals
  const [showAssignmentModal, setShowAssignmentModal] = useState<boolean>(false);
  const [showPendingReviewsModal, setShowPendingReviewsModal] = useState<boolean>(false);
  const [showCompletedCoursesModal, setShowCompletedCoursesModal] = useState<boolean>(false);
  const [selectedCertCourse, setSelectedCertCourse] = useState<Course | null>(null);

  // Create Course Modal State
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Field Sales & Closing');
  const [newBadgeTitle, setNewBadgeTitle] = useState('Fiber Specialist Certification');
  const [newDesc, setNewDesc] = useState('');
  const [newLevel, setNewLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced' | 'Master'>('Beginner');
  const [newHours, setNewHours] = useState(2);
  const [requiresSubmissionReview, setRequiresSubmissionReview] = useState(false);

  // Multi-Lesson builder state
  const [newLessons, setNewLessons] = useState<
    { title: string; durationMinutes: number; videoUrl?: string; content: string; keyTakeaways: string[] }[]
  >([
    {
      title: 'Module 1: Opening Script & Neighborhood Notice',
      durationMinutes: 15,
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      content: 'Master the 7-second curb opening and step back 2 paces to eliminate door resistance.',
      keyTakeaways: ['Step back 2 paces at 45 degrees', 'Disrupt with infrastructure update language'],
    },
  ]);

  // Assignment builder
  const [newAssignTitle, setNewAssignTitle] = useState('Field Pitch Roleplay Response');
  const [newAssignInstructions, setNewAssignInstructions] = useState(
    'Submit your verbatim 45-second pitch overcoming the legacy cable speed objection.'
  );

  // Multi-Question Quiz builder
  const [newQuizQuestions, setNewQuizQuestions] = useState<
    {
      questionType: 'multiple_choice';
      question: string;
      options: string[];
      correctAnswerIndex: number;
      explanation: string;
    }[]
  >([
    {
      questionType: 'multiple_choice',
      question: 'What makes Fiber download/upload speeds unique compared to coaxial cable?',
      options: [
        'Fiber is purely wireless',
        'Fiber offers 100% symmetrical upload speeds via glass laser strands',
        'Coaxial cable uses less electricity',
        'No difference',
      ],
      correctAnswerIndex: 1,
      explanation: 'Symmetrical uploads allow smooth Zoom calls, fast security cam backups, and zero lag.',
    },
  ]);

  // Voice practice timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (voicePracticeActive) {
      interval = setInterval(() => {
        setPracticeSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [voicePracticeActive]);

  // Save completed lessons to localStorage
  const markLessonComplete = (courseId: string, lessonId: string) => {
    setCompletedLessonIds((prev) => {
      const current = prev[courseId] || [];
      if (!current.includes(lessonId)) {
        const updated = { ...prev, [courseId]: [...current, lessonId] };
        localStorage.setItem('eclipse_completed_lessons_map', JSON.stringify(updated));
        return updated;
      }
      return prev;
    });
  };

  // Check user submission for active course
  const userSubmission = submissions.find(
    (s) => s.courseId === activeCourse?.id && s.userId === currentUser?.id
  );

  const pendingReviewsList = getAllSubmissionsPendingReview();
  const completedSubmissionsList = getCompletedSubmissions();

  const handleOpenCourse = (c: Course) => {
    setActiveCourse(c);
    setActiveLessonIdx(0);
    setCourseTab('lessons');
    setQuizResult(null);
    setShowExamReview(false);
    setQuizAnswers({});

    const sub = submissions.find((s) => s.courseId === c.id && s.userId === currentUser?.id);
    if (sub?.assignmentAnswer) {
      setAssignmentText(sub.assignmentAnswer);
      setAssignmentSubmitted(true);
    } else {
      setAssignmentText('');
      setAssignmentSubmitted(false);
    }
  };

  const handleQuizSubmit = async () => {
    if (!activeCourse) return;
    const res = await submitQuiz(activeCourse.id, quizAnswers);
    setQuizResult(res);
    setShowExamReview(true);

    if (res.passed) {
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.6 },
      });
    }
  };

  const handleAssignmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCourse || !assignmentText.trim()) return;
    await submitAssignment(activeCourse.id, assignmentText);
    setAssignmentSubmitted(true);

    if (activeCourse.requiresSubmissionReview !== true) {
      confetti({
        particleCount: 70,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  // Convert raw YouTube or video URLs to safe embed links
  const getEmbedVideoUrl = (rawUrl?: string): string | null => {
    if (!rawUrl) return null;
    try {
      if (rawUrl.includes('youtube.com/watch')) {
        const v = new URL(rawUrl).searchParams.get('v');
        if (v) return `https://www.youtube-nocookie.com/embed/${v}?rel=0&modestbranding=1`;
      }
      if (rawUrl.includes('youtu.be/')) {
        const id = rawUrl.split('youtu.be/')[1]?.split(/[?#]/)[0];
        if (id) return `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1`;
      }
      if (rawUrl.includes('youtube.com/embed/')) {
        return rawUrl;
      }
      return rawUrl;
    } catch {
      return rawUrl;
    }
  };

  const handleCreateCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      alert('Please provide a course title.');
      return;
    }

    await createCourse({
      title: newTitle,
      category: newCategory,
      badgeTitle: newBadgeTitle,
      description: newDesc || 'In-house sales and operations training module.',
      estimatedHours: newHours,
      level: newLevel,
      lessons: newLessons.map((l, i) => ({
        id: `lesson_${Date.now()}_${i}`,
        ...l,
      })),
      assignment: {
        id: `assign_${Date.now()}`,
        title: newAssignTitle,
        instructions: newAssignInstructions,
        deliverableType: 'pitch_script',
        maxPoints: 100,
      },
      quiz: newQuizQuestions.map((q, i) => ({
        id: `quiz_${Date.now()}_${i}`,
        ...q,
      })),
      requiresSubmissionReview,
      published: true,
    });

    setShowCreateModal(false);
    setNewTitle('');
    setNewDesc('');
  };

  // Course Filtering
  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.badgeTitle.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' || course.category.toLowerCase() === selectedCategory.toLowerCase();

    const sub = submissions.find((s) => s.courseId === course.id && s.userId === currentUser?.id);
    const isCompleted = sub?.status === 'completed' || sub?.quizPassed;

    if (statusFilter === 'completed') {
      return matchesSearch && matchesCategory && isCompleted;
    }
    if (statusFilter === 'in_progress') {
      return matchesSearch && matchesCategory && sub && !isCompleted;
    }
    if (statusFilter === 'assigned') {
      const isAssigned =
        course.assignmentRecords?.some(
          (rec) =>
            rec.assignedUserIds.includes(currentUser?.id || '') ||
            rec.assignedRoles.includes(currentUser?.role || '')
        ) || false;
      return matchesSearch && matchesCategory && isAssigned;
    }

    return matchesSearch && matchesCategory;
  });

  // Calculate course completion percentage
  const getCourseProgress = (course: Course) => {
    const sub = submissions.find((s) => s.courseId === course.id && s.userId === currentUser?.id);
    if (sub?.status === 'completed' || sub?.quizPassed) return 100;

    const completedLessons = completedLessonIds[course.id] || [];
    const totalLessons = course.lessons?.length || 1;
    const lessonScore = (completedLessons.length / totalLessons) * 50;
    const assignmentScore = sub?.assignmentAnswer ? 25 : 0;
    const quizScore = sub?.quizScore ? 25 : 0;

    return Math.min(95, Math.round(lessonScore + assignmentScore + quizScore));
  };

  return (
    <div className="p-2.5 sm:p-4 max-w-7xl mx-auto space-y-4 pb-24 text-slate-100">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(6,44,38,0.7),rgba(15,23,42,0.96))] p-4 sm:p-5 rounded-3xl border border-emerald-500/25 shadow-xl ring-1 ring-emerald-500/10">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] sm:text-xs font-bold text-emerald-400 uppercase tracking-widest">
              Eclipse Leadership Academy & Schooling
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-emerald-400" />
            <span>Field Training & Certification Platform</span>
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Proprietary video modules, interactive door objection roleplay scripts, and official field credential exams crafted by agency leadership.
          </p>
        </div>

        {/* Action Controls for Admin/Manager & Reps */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Review Queue Badge for Admins & Managers */}
          {(isAdmin || isManager) && (
            <button
              onClick={() => setShowPendingReviewsModal(true)}
              className="relative px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-amber-500/10"
              title="Grading Queue"
            >
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Review Queue</span>
              {pendingReviewsList.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 animate-pulse">
                  {pendingReviewsList.length}
                </span>
              )}
            </button>
          )}

          {/* Completed Submissions Registry */}
          <button
            onClick={() => setShowCompletedCoursesModal(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Award className="w-4 h-4 text-amber-400" />
            <span>Certificates Archive</span>
          </button>

          {/* Course Assignment Modal for Admins */}
          {isAdmin && (
            <button
              onClick={() => setShowAssignmentModal(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-200 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
            >
              <Users className="w-4 h-4 text-indigo-400" />
              <span>Assign Coursework</span>
            </button>
          )}

          {/* Upload Coursework Button */}
          {canUploadCoursework && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Upload Coursework</span>
            </button>
          )}
        </div>
      </div>

      {/* VIEW 1: COURSE DIRECTORY / BROWSER */}
      {!activeCourse ? (
        <div className="space-y-4">
          {/* Search & Filters */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-4 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search courses, field scripts, or certifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Status Selector */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                    statusFilter === 'all'
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  All ({courses.length})
                </button>
                <button
                  onClick={() => setStatusFilter('assigned')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                    statusFilter === 'assigned'
                      ? 'bg-indigo-500 text-white font-bold'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  Assigned
                </button>
                <button
                  onClick={() => setStatusFilter('in_progress')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                    statusFilter === 'in_progress'
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  In Progress
                </button>
                <button
                  onClick={() => setStatusFilter('completed')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                    statusFilter === 'completed'
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  Certified
                </button>
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pt-1 border-t border-slate-800/80 pb-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 shrink-0">Category:</span>
              {[
                { id: 'all', label: 'All Modules' },
                { id: 'field sales & execution', label: 'Field Sales & Closing' },
                { id: 'operations & compliance', label: 'Operations & Dispatch' },
                { id: 'technical fiber knowledge', label: 'Fiber Science' },
                { id: 'leadership & team culture', label: 'Culture & Leadership' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] whitespace-nowrap transition-colors ${
                    selectedCategory.toLowerCase() === cat.id.toLowerCase()
                      ? 'bg-slate-800 text-emerald-300 font-bold border border-emerald-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Courses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCourses.map((course) => {
              const sub = submissions.find(
                (s) => s.courseId === course.id && s.userId === currentUser?.id
              );
              const isCompleted = sub?.status === 'completed' || sub?.quizPassed;
              const progress = getCourseProgress(course);
              const isAssigned =
                course.assignmentRecords?.some(
                  (rec) =>
                    rec.assignedUserIds.includes(currentUser?.id || '') ||
                    rec.assignedRoles.includes(currentUser?.role || '')
                ) || false;

              return (
                <div
                  key={course.id}
                  className="bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 rounded-3xl p-4 sm:p-5 space-y-4 shadow-xl transition-all hover:scale-[1.01] flex flex-col justify-between group relative overflow-hidden"
                >
                  <div className="space-y-3">
                    {/* Top Badges & Meta */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 text-[10px] font-bold uppercase tracking-wider">
                          {course.category}
                        </span>
                        {isAssigned && (
                          <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-bold flex items-center gap-1">
                            <Flame className="w-3 h-3 text-amber-400" />
                            <span>Assigned</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{course.estimatedHours}h</span>
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[10px] font-bold text-slate-300">
                          {course.level}
                        </span>
                      </div>
                    </div>

                    {/* Course Title & Description */}
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-white group-hover:text-emerald-400 transition-colors">
                        {course.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {course.description}
                      </p>
                    </div>

                    {/* Curriculum Highlights Box */}
                    <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2 text-xs">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>{course.lessons.length} Modules & Video Lectures</span>
                        <span>Assignment + Exam Included</span>
                      </div>

                      {/* Earnable Credential Badge */}
                      <div className="flex items-center gap-2 text-emerald-300 font-semibold text-xs">
                        <Award className="w-4 h-4 text-amber-400 shrink-0" />
                        <span className="truncate">Earns: "{course.badgeTitle}"</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Your Progress</span>
                        <span className="font-bold text-emerald-400">
                          {isCompleted ? '100% Completed' : `${progress}%`}
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isCompleted ? 'bg-emerald-400' : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Controls */}
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
                    <span className="text-[11px] text-slate-500 truncate">
                      Instructor: {course.authorName}
                    </span>

                    <div className="flex items-center gap-2 shrink-0">
                      {isCompleted && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCertCourse(course);
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 text-amber-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Award className="w-3.5 h-3.5 text-amber-400" />
                          <span>View Certificate</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleOpenCourse(course)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          isCompleted
                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                            : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20'
                        }`}
                      >
                        <span>{isCompleted ? 'Review Modules' : 'Start Course'}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredCourses.length === 0 && (
            <div className="p-8 text-center rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
              <BookOpen className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-sm font-bold text-slate-300">No matching training modules found</p>
              <p className="text-xs text-slate-500">
                Try adjusting your search terms or category filter.
              </p>
            </div>
          )}
        </div>
      ) : (
        /* VIEW 2: ACTIVE COURSE ROOM */
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Back button & Course Heading */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={() => setActiveCourse(null)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Course Directory</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-xl bg-indigo-500/20 text-indigo-300 text-xs font-bold">
                {activeCourse.category}
              </span>
              <span className="px-2 py-1 rounded-xl bg-slate-900 text-slate-400 text-xs">
                {activeCourse.estimatedHours} hrs
              </span>
            </div>
          </div>

          {/* Active Course Banner */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-6 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white">{activeCourse.title}</h2>
                <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
                  {activeCourse.description}
                </p>
              </div>

              {/* Certificate Quick Button if Completed */}
              {(userSubmission?.status === 'completed' || userSubmission?.quizPassed) && (
                <button
                  type="button"
                  onClick={() => setSelectedCertCourse(activeCourse)}
                  className="px-4 py-2 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/40 text-amber-300 text-xs font-bold flex items-center gap-2 shrink-0 transition-colors cursor-pointer"
                >
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>View Official Certificate</span>
                </button>
              )}
            </div>

            {/* Course Room Navigation Tabs */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setCourseTab('lessons')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  courseTab === 'lessons'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Video className="w-4 h-4" />
                <span>Video Modules ({activeCourse.lessons.length})</span>
              </button>

              {activeCourse.assignment && (
                <button
                  onClick={() => setCourseTab('assignment')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    courseTab === 'assignment'
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Written Pitch Assignment</span>
                  {assignmentSubmitted && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  )}
                </button>
              )}

              {activeCourse.quiz && activeCourse.quiz.length > 0 && (
                <button
                  onClick={() => setCourseTab('quiz')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    courseTab === 'quiz'
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>Certification Exam ({activeCourse.quiz.length} Qs)</span>
                  {userSubmission?.quizPassed && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* TAB 1: LESSONS & VIDEO PLAYER */}
          {courseTab === 'lessons' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Left Column: Lesson Selector & Progress */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Course Modules
                  </span>
                  <span className="text-[11px] text-emerald-400 font-semibold">
                    {(completedLessonIds[activeCourse.id] || []).length} / {activeCourse.lessons.length} Done
                  </span>
                </div>

                <div className="space-y-2">
                  {activeCourse.lessons.map((lesson, idx) => {
                    const isCompleted = (completedLessonIds[activeCourse.id] || []).includes(lesson.id);
                    const isActive = activeLessonIdx === idx;

                    return (
                      <button
                        key={lesson.id}
                        onClick={() => setActiveLessonIdx(idx)}
                        className={`w-full p-3 rounded-2xl text-left transition-all flex items-start gap-2.5 text-xs cursor-pointer ${
                          isActive
                            ? 'bg-emerald-950/50 border border-emerald-500/50 text-emerald-300 font-bold'
                            : 'bg-slate-950/60 hover:bg-slate-800/60 text-slate-300 border border-slate-800'
                        }`}
                      >
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono shrink-0 ${
                            isCompleted
                              ? 'bg-emerald-500 text-slate-950 font-bold'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {isCompleted ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="line-clamp-1">{lesson.title}</p>
                          <span className="text-[10px] text-slate-500 font-normal">
                            {lesson.durationMinutes} mins
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: In-Platform Video Player & Lecture Notes */}
              <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-3xl p-4 sm:p-6 space-y-5">
                {activeCourse.lessons[activeLessonIdx] && (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                          Module {activeLessonIdx + 1} of {activeCourse.lessons.length}
                        </span>
                        <h3 className="text-lg sm:text-xl font-black text-white mt-0.5">
                          {activeCourse.lessons[activeLessonIdx].title}
                        </h3>
                      </div>

                      {/* Lesson Completion Status Button */}
                      <button
                        type="button"
                        onClick={() =>
                          markLessonComplete(activeCourse.id, activeCourse.lessons[activeLessonIdx].id)
                        }
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                          (completedLessonIds[activeCourse.id] || []).includes(
                            activeCourse.lessons[activeLessonIdx].id
                          )
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>
                          {(completedLessonIds[activeCourse.id] || []).includes(
                            activeCourse.lessons[activeLessonIdx].id
                          )
                            ? 'Completed'
                            : 'Mark as Completed'}
                        </span>
                      </button>
                    </div>

                    {/* Real Video Player Embed / Responsive Theater Container */}
                    <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl">
                      {activeCourse.lessons[activeLessonIdx].videoUrl ? (
                        <iframe
                          src={getEmbedVideoUrl(activeCourse.lessons[activeLessonIdx].videoUrl) || ''}
                          title={activeCourse.lessons[activeLessonIdx].title}
                          className="w-full h-full border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-3 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/30">
                          <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                            <BookOpen className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white">Lecture Script & Study Notes</h4>
                            <p className="text-xs text-slate-400 mt-1 max-w-sm">
                              Review the field notes and scripts below to master this topic before taking the exam.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Lesson Notes & Script */}
                    <div className="bg-slate-950/80 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-3">
                      <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                        Field Scripts & Lecture Notes
                      </span>
                      <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-line font-normal">
                        {activeCourse.lessons[activeLessonIdx].content}
                      </div>

                      {activeCourse.lessons[activeLessonIdx].keyTakeaways?.length > 0 && (
                        <div className="pt-3 border-t border-slate-800/80 space-y-2">
                          <span className="text-[11px] font-bold text-emerald-400 uppercase">
                            Key Rules for the Turf:
                          </span>
                          <ul className="space-y-1.5">
                            {activeCourse.lessons[activeLessonIdx].keyTakeaways.map((point, i) => (
                              <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Next / Previous Module Navigation */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                      <button
                        type="button"
                        disabled={activeLessonIdx === 0}
                        onClick={() => setActiveLessonIdx((prev) => Math.max(0, prev - 1))}
                        className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Previous Module</span>
                      </button>

                      {activeLessonIdx < activeCourse.lessons.length - 1 ? (
                        <button
                          type="button"
                          onClick={() => {
                            markLessonComplete(activeCourse.id, activeCourse.lessons[activeLessonIdx].id);
                            setActiveLessonIdx((prev) => prev + 1);
                          }}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
                        >
                          <span>Complete & Next Module</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      ) : activeCourse.assignment ? (
                        <button
                          type="button"
                          onClick={() => {
                            markLessonComplete(activeCourse.id, activeCourse.lessons[activeLessonIdx].id);
                            setCourseTab('assignment');
                          }}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
                        >
                          <span>Proceed to Written Assignment</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            markLessonComplete(activeCourse.id, activeCourse.lessons[activeLessonIdx].id);
                            setCourseTab('quiz');
                          }}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
                        >
                          <span>Proceed to Certification Exam</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: WRITTEN ASSIGNMENT */}
          {courseTab === 'assignment' && activeCourse.assignment && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 max-w-3xl mx-auto space-y-6">
              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                  Course Assignment
                </span>
                <h3 className="text-xl font-black text-white mt-1">
                  {activeCourse.assignment.title}
                </h3>
                <div className="text-xs text-slate-300 mt-2 bg-slate-950 p-4 rounded-2xl border border-slate-800 leading-relaxed">
                  {activeCourse.assignment.instructions}
                </div>
              </div>

              {/* Status Display if Submitted */}
              {assignmentSubmitted ? (
                <div
                  className={`rounded-2xl p-5 space-y-3 ${
                    userSubmission?.status === 'pending_review'
                      ? 'bg-amber-500/10 border border-amber-500/30'
                      : userSubmission?.status === 'rejected'
                      ? 'bg-rose-500/10 border border-rose-500/30'
                      : 'bg-emerald-500/10 border border-emerald-500/30'
                  }`}
                >
                  <div
                    className={`flex items-center gap-2 ${
                      userSubmission?.status === 'pending_review'
                        ? 'text-amber-400'
                        : userSubmission?.status === 'rejected'
                        ? 'text-rose-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-sm font-bold">
                      {userSubmission?.status === 'pending_review'
                        ? 'Submission Pending Leadership Review ⏳'
                        : userSubmission?.status === 'rejected'
                        ? 'Needs Revision ❌'
                        : 'Assignment Approved & Verified! 🎉'}
                    </span>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 font-mono whitespace-pre-line">
                    {assignmentText}
                  </div>

                  {userSubmission?.status === 'pending_review' && (
                    <p className="text-xs text-amber-300 italic">
                      Your door script has been submitted and is waiting for instructor review. You will be notified when it is approved.
                    </p>
                  )}

                  {userSubmission?.status === 'rejected' && (
                    <div className="space-y-2">
                      {userSubmission.assignmentGrade !== undefined && (
                        <p className="text-xs text-rose-300 font-bold">
                          Current Score: {userSubmission.assignmentGrade}/100 (Passing: 70+)
                        </p>
                      )}
                      {userSubmission.reviewFeedback && (
                        <p className="text-xs text-rose-200 italic">
                          Instructor Notes: {userSubmission.reviewFeedback}
                        </p>
                      )}
                    </div>
                  )}

                  {userSubmission?.status === 'completed' && userSubmission.assignmentGrade && (
                    <p className="text-xs text-emerald-300 font-bold">
                      Score: {userSubmission.assignmentGrade}/100 • Feedback: {userSubmission.assignmentFeedback || 'Excellent objection handling.'}
                    </p>
                  )}

                  <div className="pt-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setAssignmentSubmitted(false)}
                      className="text-xs text-emerald-400 hover:underline font-semibold cursor-pointer"
                    >
                      {userSubmission?.status === 'rejected' ? 'Edit & Resubmit Pitch' : 'Update Response'}
                    </button>

                    {activeCourse.quiz && activeCourse.quiz.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setCourseTab('quiz')}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <span>Continue to Certification Exam</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleAssignmentSubmit} className="space-y-4">
                  {/* Quick-Insert Pitch Framework Templates */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-400 block">
                      Quick Pitch Framework Presets:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setAssignmentText(
                            'Step 1: Validate - I completely understand, choosing home tech is a joint family decision.\nStep 2: Reserve - Let me place a courtesy 48-hour dispatch hold on your address so your household locks in the free ONT installation fee waiver.\nStep 3: Direct Line - If your spouse has any technical questions tonight, they can call my direct cell or we can cancel with zero obligation.'
                          )
                        }
                        className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] text-emerald-400 font-medium transition-colors cursor-pointer"
                      >
                        + Spouse Objection Framework
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setAssignmentText(
                            'Step 1: Disrupt - That makes sense! Most people on the block have cable coax right now. All we are checking is whether your drop line was marked for the glass laser terminal.\nStep 2: Compare - Cable gives you decent download, but throttles your upload to 15 Mbps. Fiber gives you 1,000 Mbps symmetrical.\nStep 3: Close - We have two slots open for technician setup: Thursday morning or Friday afternoon?'
                          )
                        }
                        className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] text-emerald-400 font-medium transition-colors cursor-pointer"
                      >
                        + Cable Comparison Framework
                      </button>
                    </div>
                  </div>

                  {/* Textarea */}
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Your Written Door Pitch / Objection Script:
                    </label>
                    <textarea
                      rows={7}
                      required
                      placeholder="Type your verbatim door pitch response here..."
                      value={assignmentText}
                      onChange={(e) => setAssignmentText(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono leading-relaxed"
                    />
                    <div className="flex justify-between items-center text-[11px] text-slate-500 mt-1">
                      <span>{assignmentText.trim().split(/\s+/).filter(Boolean).length} words</span>
                      <span>Passing score: 70/100</span>
                    </div>
                  </div>

                  {/* Voice Practice Simulator Mode */}
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <Mic className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Voice Pitch Practice Mode</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setVoicePracticeActive(!voicePracticeActive)}
                        className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                          voicePracticeActive
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-slate-900 text-slate-400 hover:text-white'
                        }`}
                      >
                        {voicePracticeActive ? `Stop Timer (${practiceSeconds}s)` : 'Start Pitch Rehearsal'}
                      </button>
                    </div>
                    {voicePracticeActive && (
                      <p className="text-[11px] text-emerald-300 animate-pulse">
                        Rehearsing live pitch: aim to deliver your script with natural cadence in 30-45 seconds!
                      </p>
                    )}
                  </div>

                  {/* Submission Button */}
                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer active:scale-95"
                    >
                      <Send className="w-4 h-4" />
                      <span>Submit Assignment for Review</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 3: INTERACTIVE QUIZ & EXAM */}
          {courseTab === 'quiz' && activeCourse.quiz && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 max-w-3xl mx-auto space-y-6">
              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                  Official School Examination
                </span>
                <h3 className="text-xl font-black text-white mt-1">
                  Certification Exam: {activeCourse.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  70%+ required to unlock your official "{activeCourse.badgeTitle}" credential.
                </p>
              </div>

              {/* Exam Result Banner */}
              {quizResult && (
                <div
                  className={`p-5 rounded-2xl border text-center space-y-2 ${
                    quizResult.passed
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/40 text-rose-300'
                  }`}
                >
                  <div className="text-3xl font-black">{quizResult.score}%</div>
                  <h4 className="text-sm font-bold">
                    {quizResult.passed ? '🎉 Congratulations! You Passed!' : 'Need Review. Try Again!'}
                  </h4>
                  <p className="text-xs max-w-md mx-auto">
                    {quizResult.passed
                      ? `You have officially earned the "${activeCourse.badgeTitle}" credential!`
                      : 'Review the explanations below and retake the questions to reach 70%.'}
                  </p>

                  <div className="pt-2 flex justify-center gap-3">
                    {quizResult.passed ? (
                      <button
                        type="button"
                        onClick={() => setSelectedCertCourse(activeCourse)}
                        className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-400/20 flex items-center gap-2 cursor-pointer"
                      >
                        <Award className="w-4 h-4" />
                        <span>View Certificate of Completion</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setQuizResult(null);
                          setShowExamReview(false);
                          setQuizAnswers({});
                        }}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Retake Exam</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Questions List */}
              <div className="space-y-5">
                {activeCourse.quiz.map((q, qIndex) => {
                  const selectedOpt = quizAnswers[q.id];
                  const isCorrect = selectedOpt === q.correctAnswerIndex;

                  return (
                    <div
                      key={q.id}
                      className="bg-slate-950/80 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-3"
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-slate-800 text-emerald-400 text-xs font-mono font-bold flex items-center justify-center shrink-0">
                          {qIndex + 1}
                        </span>
                        <div className="flex-1">
                          <h4 className="text-xs sm:text-sm font-bold text-white leading-relaxed">
                            {q.question}
                          </h4>
                        </div>
                      </div>

                      <div className="space-y-2 pt-1">
                        {q.options?.map((opt, optIndex) => {
                          const isSelected = selectedOpt === optIndex;
                          const isTheCorrectOption = q.correctAnswerIndex === optIndex;

                          let buttonStyle =
                            'bg-slate-900 hover:bg-slate-800/80 border border-slate-800 text-slate-300';
                          if (showExamReview) {
                            if (isTheCorrectOption) {
                              buttonStyle = 'bg-emerald-500/20 border border-emerald-500 text-emerald-200 font-bold';
                            } else if (isSelected && !isTheCorrectOption) {
                              buttonStyle = 'bg-rose-500/20 border border-rose-500 text-rose-200 line-through';
                            }
                          } else if (isSelected) {
                            buttonStyle =
                              'bg-emerald-500/20 border border-emerald-500 text-emerald-200 font-semibold';
                          }

                          return (
                            <button
                              key={optIndex}
                              type="button"
                              onClick={() => {
                                if (!showExamReview) {
                                  setQuizAnswers((prev) => ({
                                    ...prev,
                                    [q.id]: optIndex,
                                  }));
                                }
                              }}
                              className={`w-full p-3 rounded-xl text-left text-xs transition-all flex items-center justify-between cursor-pointer ${buttonStyle}`}
                            >
                              <span>{opt}</span>
                              {isSelected && !showExamReview && (
                                <Check className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />
                              )}
                              {showExamReview && isTheCorrectOption && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {showExamReview && (
                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-1">
                          <span className="font-bold text-emerald-400 block">Explanation:</span>
                          <p className="text-[11px] leading-relaxed text-slate-400">{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {!showExamReview && (
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleQuizSubmit}
                    disabled={Object.keys(quizAnswers).length < activeCourse.quiz.length}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Grade My Exam & Submit
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODAL: UPLOAD & AUTHOR COURSEWORK (OWNER / MANAGER ONLY) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 max-w-3xl w-full max-h-[92vh] overflow-y-auto space-y-5 shadow-2xl relative text-slate-100">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                Leadership Academy Authoring Studio
              </span>
              <h3 className="text-xl font-black text-white mt-0.5">
                Upload & Publish In-House Coursework
              </h3>
              <p className="text-xs text-slate-400">
                Author complete video lectures, field scripts, homework assignments, and certification quizzes.
              </p>
            </div>

            <form onSubmit={handleCreateCourseSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Course Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Symmetrical Speeds & Objection Neutralization"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Field Sales & Closing">Field Sales & Closing</option>
                    <option value="Operations & Compliance">Operations & Compliance</option>
                    <option value="Technical Fiber Knowledge">Technical Fiber Knowledge</option>
                    <option value="Leadership & Team Culture">Leadership & Team Culture</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Badge Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Master Fiber Closer"
                    value={newBadgeTitle}
                    onChange={(e) => setNewBadgeTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Difficulty Level</label>
                  <select
                    value={newLevel}
                    onChange={(e) => setNewLevel(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Master">Master</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Course Summary</label>
                <textarea
                  rows={2}
                  placeholder="Explain what field specialists will learn in this coursework..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Multi-Lesson Module Creator */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    Lecture Modules ({newLessons.length})
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setNewLessons([
                        ...newLessons,
                        {
                          title: `Module ${newLessons.length + 1}: Field Lecture`,
                          durationMinutes: 15,
                          videoUrl: '',
                          content: '',
                          keyTakeaways: ['Key field rule 1'],
                        },
                      ])
                    }
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold hover:bg-emerald-500/30 transition-colors cursor-pointer"
                  >
                    + Add Another Module
                  </button>
                </div>

                {newLessons.map((lesson, lIdx) => (
                  <div
                    key={lIdx}
                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 relative"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Module {lIdx + 1}</span>
                      {newLessons.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setNewLessons(newLessons.filter((_, i) => i !== lIdx))}
                          className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="sm:col-span-2">
                        <label className="text-[11px] font-bold text-slate-400 block mb-1">
                          Lesson Title
                        </label>
                        <input
                          type="text"
                          required
                          value={lesson.title}
                          onChange={(e) => {
                            const updated = [...newLessons];
                            updated[lIdx].title = e.target.value;
                            setNewLessons(updated);
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-400 block mb-1">
                          Duration (Mins)
                        </label>
                        <input
                          type="number"
                          required
                          min={1}
                          value={lesson.durationMinutes}
                          onChange={(e) => {
                            const updated = [...newLessons];
                            updated[lIdx].durationMinutes = parseInt(e.target.value) || 10;
                            setNewLessons(updated);
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">
                        Video Lecture URL (YouTube or MP4 embed link)
                      </label>
                      <input
                        type="text"
                        value={lesson.videoUrl || ''}
                        onChange={(e) => {
                          const updated = [...newLessons];
                          updated[lIdx].videoUrl = e.target.value;
                          setNewLessons(updated);
                        }}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">
                        Lecture Script & Notes
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={lesson.content}
                        onChange={(e) => {
                          const updated = [...newLessons];
                          updated[lIdx].content = e.target.value;
                          setNewLessons(updated);
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Assignment Prompt */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                  Written Assignment Prompt
                </span>
                <input
                  type="text"
                  required
                  value={newAssignTitle}
                  onChange={(e) => setNewAssignTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white mb-2"
                />
                <textarea
                  rows={2}
                  required
                  value={newAssignInstructions}
                  onChange={(e) => setNewAssignInstructions(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white"
                />
              </div>

              {/* Review Requirement Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                <div>
                  <span className="text-xs font-bold text-white block">
                    Require Instructor Review Before Certification
                  </span>
                  <p className="text-[11px] text-slate-400">
                    If enabled, assignments enter the review queue for instructor grading before the student passes.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setRequiresSubmissionReview(!requiresSubmissionReview)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    requiresSubmissionReview
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {requiresSubmissionReview ? 'Review Required' : 'Auto-Certify'}
                </button>
              </div>

              {/* Multi-Question Quiz Builder */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    Certification Exam Questions ({newQuizQuestions.length})
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setNewQuizQuestions([
                        ...newQuizQuestions,
                        {
                          questionType: 'multiple_choice',
                          question: '',
                          options: ['', '', '', ''],
                          correctAnswerIndex: 0,
                          explanation: '',
                        },
                      ])
                    }
                    className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-xs font-bold hover:bg-indigo-500/30 transition-colors cursor-pointer"
                  >
                    + Add Question
                  </button>
                </div>

                {newQuizQuestions.map((q, qIndex) => (
                  <div
                    key={qIndex}
                    className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Question {qIndex + 1}</span>
                      {newQuizQuestions.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setNewQuizQuestions(newQuizQuestions.filter((_, i) => i !== qIndex))
                          }
                          className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>

                    <div>
                      <input
                        type="text"
                        required
                        placeholder="Enter the examination question..."
                        value={q.question}
                        onChange={(e) => {
                          const updated = [...newQuizQuestions];
                          updated[qIndex].question = e.target.value;
                          setNewQuizQuestions(updated);
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400 block">
                        4 Multiple Choice Options:
                      </label>
                      {q.options.map((opt, optIndex) => (
                        <input
                          key={optIndex}
                          type="text"
                          required
                          value={opt}
                          onChange={(e) => {
                            const updated = [...newQuizQuestions];
                            updated[qIndex].options[optIndex] = e.target.value;
                            setNewQuizQuestions(updated);
                          }}
                          placeholder={`Option ${optIndex + 1}`}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
                        />
                      ))}

                      <div className="pt-1">
                        <label className="text-[11px] font-bold text-emerald-400 block mb-1">
                          Correct Answer Selection:
                        </label>
                        <select
                          value={q.correctAnswerIndex}
                          onChange={(e) => {
                            const updated = [...newQuizQuestions];
                            updated[qIndex].correctAnswerIndex = parseInt(e.target.value);
                            setNewQuizQuestions(updated);
                          }}
                          className="w-full bg-slate-900 border border-emerald-500/40 rounded-xl px-3 py-1.5 text-xs text-emerald-300 font-bold"
                        >
                          {q.options.map((_, optIndex) => (
                            <option key={optIndex} value={optIndex}>
                              Option {optIndex + 1} is Correct
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">
                        Explanation of Correct Answer
                      </label>
                      <textarea
                        rows={2}
                        required
                        value={q.explanation}
                        onChange={(e) => {
                          const updated = [...newQuizQuestions];
                          updated[qIndex].explanation = e.target.value;
                          setNewQuizQuestions(updated);
                        }}
                        placeholder="Explain why this answer is correct in the field..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Form Controls */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 cursor-pointer"
                >
                  Publish Course to Academy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN COURSEWORK MODAL */}
      <CourseAssignmentModal
        isOpen={showAssignmentModal}
        onClose={() => setShowAssignmentModal(false)}
        courses={courses}
        allUsers={users}
        onAssignCourse={assignCoursework}
      />

      {/* PENDING REVIEWS MODAL */}
      <PendingReviewsModal
        isOpen={showPendingReviewsModal}
        onClose={() => setShowPendingReviewsModal(false)}
        pendingSubmissions={pendingReviewsList}
        courses={courses}
      />

      {/* COMPLETED SUBMISSIONS ARCHIVE */}
      <CompletedCoursesModal
        isOpen={showCompletedCoursesModal}
        onClose={() => setShowCompletedCoursesModal(false)}
        completedSubmissions={completedSubmissionsList}
        courses={courses}
      />

      {/* CERTIFICATE MODAL */}
      {selectedCertCourse && currentUser && (
        <CertificateModal
          isOpen={!!selectedCertCourse}
          onClose={() => setSelectedCertCourse(null)}
          course={selectedCertCourse}
          submission={submissions.find(
            (s) => s.courseId === selectedCertCourse.id && s.userId === currentUser.id
          )}
          user={currentUser}
        />
      )}
    </div>
  );
};
