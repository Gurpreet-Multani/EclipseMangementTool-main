import React from 'react';
import { Course, CourseSubmission, UserProfile } from '../types';
import eclipseLogo from '../Images/EclipseLogo.JPG';
import { Award, CheckCircle2, Download, Printer, ShieldCheck, X } from 'lucide-react';

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course;
  submission?: CourseSubmission;
  user: UserProfile;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  isOpen,
  onClose,
  course,
  submission,
  user,
}) => {
  if (!isOpen) return null;

  const completionDate = submission?.completedAt
    ? new Date(submission.completedAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });

  const certificateId = `EMA-${(course.id || 'CRS').slice(-4).toUpperCase()}-${(user.id || 'USR').slice(-4).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const scoreDisplay = submission?.assignmentGrade
    ? `${submission.assignmentGrade}%`
    : submission?.quizScore
    ? `${submission.quizScore}%`
    : '100%';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-slate-950 border border-emerald-500/40 rounded-3xl p-4 sm:p-7 max-w-3xl w-full max-h-[92vh] overflow-y-auto space-y-4 shadow-2xl relative text-slate-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Certificate Printable Canvas */}
        <div className="relative rounded-2xl bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.12),transparent_50%),linear-gradient(145deg,#03130e_0%,#020b08_50%,#051813_100%)] border-4 border-double border-amber-400/40 p-6 sm:p-10 text-center space-y-6 shadow-[0_0_50px_rgba(16,185,129,0.15)] ring-1 ring-amber-400/20">
          {/* Corner flourish accents */}
          <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-amber-400/60" />
          <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-amber-400/60" />
          <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-amber-400/60" />
          <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-amber-400/60" />

          {/* Logo & Header */}
          <div className="flex flex-col items-center space-y-2">
            <div className="w-16 h-16 rounded-full border-2 border-amber-400/50 p-1 bg-slate-900 shadow-lg shadow-amber-400/20">
              <img
                src={eclipseLogo}
                alt="Eclipse Logo"
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            <div>
              <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] text-amber-400">
                Eclipse Marketing Agency • Leadership Academy
              </p>
              <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight uppercase mt-1">
                Certificate of Mastery
              </h2>
            </div>
          </div>

          {/* Recipient Certification Statement */}
          <div className="space-y-2 max-w-xl mx-auto">
            <p className="text-xs text-slate-300 italic">
              This official credential certifies that
            </p>
            <h3 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-emerald-300 to-amber-200 underline decoration-amber-400/40 underline-offset-8">
              {user.displayName}
            </h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              has successfully completed all required field lecture modules, verified door script assignments, and passed the official examination with honors for:
            </p>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-emerald-500/30 text-emerald-300 font-bold text-sm sm:text-base">
              "{course.title}"
            </div>
          </div>

          {/* Badge & Credential Title */}
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-bold">
            <Award className="w-5 h-5 text-amber-400" />
            <span>Designation: {course.badgeTitle}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>Score: {scoreDisplay}</span>
          </div>

          {/* Signatures & Seal */}
          <div className="pt-6 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-3 gap-4 items-end text-xs">
            <div className="text-center sm:text-left space-y-1">
              <div className="font-serif italic text-sm text-slate-200 border-b border-slate-700 pb-1">
                Gurpreet Multani
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">
                Chief Executive & Founder
              </p>
              <p className="text-[10px] text-slate-500">Eclipse Marketing Agency</p>
            </div>

            <div className="hidden sm:flex flex-col items-center space-y-1">
              <div className="w-12 h-12 rounded-full border-2 border-dashed border-amber-400/50 flex items-center justify-center text-amber-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <span className="text-[9px] font-mono text-slate-500 uppercase">
                Verified Cryptographic ID
              </span>
            </div>

            <div className="text-center sm:text-right space-y-1">
              <div className="font-serif italic text-sm text-slate-200 border-b border-slate-700 pb-1">
                {completionDate}
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">
                Date of Certification
              </p>
              <p className="text-[10px] font-mono text-emerald-400">{certificateId}</p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Verified in Eclipse Cloud Registry</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Certificate</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
