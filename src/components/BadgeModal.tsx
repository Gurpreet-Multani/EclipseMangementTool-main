import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, ShieldCheck, QrCode, Download, Share2, Smartphone, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

interface BadgeModalProps {
  onClose: () => void;
}

export const BadgeModal: React.FC<BadgeModalProps> = ({ onClose }) => {
  const { currentUser } = useAuth();
  const [walletAdded, setWalletAdded] = useState(false);

  const handleAddToAppleWallet = () => {
    setWalletAdded(true);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="relative max-w-sm w-full space-y-4">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-11 right-0 text-slate-400 hover:text-white bg-slate-900/80 p-2 rounded-full border border-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        {/* PHYSICAL / APPLE WALLET STYLE SECURITY BADGE */}
        <div className="w-full bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-2 border-cyan-500/50 rounded-3xl p-6 shadow-[0_20px_60px_-15px_rgba(6,182,212,0.3)] relative overflow-hidden text-center space-y-4 ring-1 ring-cyan-400/20">
          {/* Lanyard Clip Slot Hole */}
          <div className="w-16 h-3 bg-slate-800 rounded-full mx-auto border border-slate-700 shadow-inner"></div>

          {/* Header Banner */}
          <div className="border-b border-slate-800/80 pb-3">
            <div className="flex items-center justify-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              <span className="text-xs font-black tracking-widest uppercase text-emerald-400">
                Eclipse Operations
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase mt-0.5">
              Authorized Field Sales Credential
            </p>
          </div>

          {/* Rep Professional Front Shot Image */}
          <div className="relative inline-block mx-auto">
            <img
              src={
                currentUser?.badgePhotoUrl ||
                currentUser?.idPhotoUrl ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
              }
              alt={currentUser?.displayName}
              className="w-28 h-28 rounded-2xl object-cover ring-4 ring-emerald-500/60 shadow-2xl mx-auto"
            />
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black text-[9px] uppercase tracking-wider shadow">
              Verified
            </div>
          </div>

          {/* Name & Title */}
          <div>
            <h2 className="text-xl font-black text-white">{currentUser?.displayName}</h2>
            <p className="text-xs font-bold text-emerald-300 mt-0.5">{currentUser?.title}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Agent ID: <strong className="font-mono text-slate-200">FB-{currentUser?.id.slice(-6).toUpperCase()}</strong>
            </p>
          </div>

          {/* Authorized Carriers Strip */}
          <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-[10px] text-slate-400 space-y-1">
            <span className="font-bold text-slate-300 uppercase tracking-wider block">
              Certified Infrastructure Access:
            </span>
            <div className="flex flex-wrap items-center justify-center gap-1 text-[9px] text-emerald-300 font-semibold">
              <span className="bg-slate-900 px-1.5 py-0.5 rounded">AT&T Fiber</span>
              <span className="bg-slate-900 px-1.5 py-0.5 rounded">Frontier</span>
              <span className="bg-slate-900 px-1.5 py-0.5 rounded">Quantum</span>
              <span className="bg-slate-900 px-1.5 py-0.5 rounded">Brightspeed</span>
            </div>
          </div>

          {/* Barcode & Security Hologram simulation */}
          <div className="pt-2 flex flex-col items-center justify-center space-y-1.5">
            {/* SVG Barcode */}
            <div className="flex items-center gap-0.5 h-7">
              {[3, 1, 4, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 4, 2, 1, 3, 1, 4, 2, 1, 3, 2].map((w, i) => (
                <div
                  key={i}
                  className="bg-slate-300 h-full rounded-xs"
                  style={{ width: `${w * 1.5}px` }}
                ></div>
              ))}
            </div>
            <span className="font-mono text-[9px] text-slate-500 tracking-widest">
              *FB-{currentUser?.id.slice(-6).toUpperCase()}*
            </span>
          </div>

          {/* Bottom security microtext */}
          <p className="text-[9px] text-slate-500 leading-tight border-t border-slate-800/80 pt-2">
            Property of Eclipse Operations. If found, please return to Regional Operations Dispatch.
          </p>
        </div>

        {/* Action Button: Apple Wallet */}
        {walletAdded ? (
          <div className="space-y-2">
            <div className="w-full py-3 px-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 shadow-xl">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Added to Apple Wallet Pass!</span>
            </div>
            <button
              onClick={onClose}
              className="w-full py-3 px-4 rounded-2xl bg-slate-800 border border-slate-700 hover:border-slate-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <span>Close</span>
            </button>
          </div>
        ) : (
          <button
            onClick={handleAddToAppleWallet}
            className="w-full py-3 px-4 rounded-2xl bg-black border border-slate-700 hover:border-slate-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xl transition-all"
          >
            <Smartphone className="w-4 h-4 text-slate-300" />
            <span>Add to Apple Wallet (iOS Pass)</span>
          </button>
        )}
      </div>
    </div>
  );
};
