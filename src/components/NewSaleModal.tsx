import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { OrderStatus } from '../types';
import {
  X,
  Plus,
  DollarSign,
  Calendar,
  MapPin,
  Zap,
  CheckCircle2,
  Camera,
  UploadCloud,
  FileImage,
  Sparkles,
  Loader2,
  AlertCircle,
  Eye,
  RefreshCw,
  HelpCircle,
  ChevronRight,
  ShieldCheck,
  Check,
  ArrowRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { US_STATES } from '../lib/states';

interface NewSaleModalProps {
  onClose: () => void;
  initialMode?: 'manual' | 'scan';
}

interface ParsedSaleResult {
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  ispProgram?: string;
  speedTier?: string;
  orderNumber?: string;
  orderDate?: string;
  installDate?: string;
  monthlyPrice?: number;
  status?: string;
  notes?: string;
  detectedCrm?: string;
  confidenceScore?: number;
}

export const NewSaleModal: React.FC<NewSaleModalProps> = ({ onClose, initialMode = 'manual' }) => {
  const { currentUser } = useAuth();
  const { addSaleOrder, blitzes } = useData();

  const todayStr = new Date().toISOString().split('T')[0];
  const nextWeekStr = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [activeTab, setActiveTab] = useState<'manual' | 'scan'>(initialMode);

  // Form Fields
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('TX');
  const [zipCode, setZipCode] = useState('');
  const [ispProgram, setIspProgram] = useState('AT&T Fiber');
  const [speedTier, setSpeedTier] = useState('1 Gig');
  const [orderNumber, setOrderNumber] = useState('');
  const [orderDate, setOrderDate] = useState(todayStr);
  const [installDate, setInstallDate] = useState(nextWeekStr);
  const [status, setStatus] = useState<OrderStatus>('scheduled');
  const [monthlyPrice, setMonthlyPrice] = useState<number | undefined>(undefined);
  const [blitzId, setBlitzId] = useState<string>('');
  const [notes, setNotes] = useState('');

  // Screenshot Upload & OCR States
  const [screenshotDataUrl, setScreenshotDataUrl] = useState<string | null>(null);
  const [screenshotFileName, setScreenshotFileName] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [detectedCrm, setDetectedCrm] = useState<string | null>(null);
  const [confidenceScore, setConfidenceScore] = useState<number | null>(null);
  const [autofilledFields, setAutofilledFields] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [showScreenshotPreview, setShowScreenshotPreview] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Calculate estimated commission payout based on rep's pay rate
  const estimatedPayout = currentUser?.payRates?.[ispProgram] || 250;

  // Global paste listener so reps can press Ctrl+V / Cmd+V with a screenshot anywhere in modal
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            handleImageFile(file, `Pasted_Screenshot_${Date.now()}.png`);
            e.preventDefault();
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  // Process image file to base64 and trigger parse
  const handleImageFile = (file: File, customName?: string) => {
    setAnalyzeError(null);
    setScreenshotFileName(customName || file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      if (base64) {
        setScreenshotDataUrl(base64);
        parseScreenshotWithAI(base64, file.type || 'image/png');
      }
    };
    reader.readAsDataURL(file);
  };

  // Call backend API /api/parse-sale-screenshot
  const parseScreenshotWithAI = async (base64DataUrl: string, mimeType: string) => {
    setIsAnalyzing(true);
    setAnalyzeError(null);

    try {
      const response = await fetch('/api/parse-sale-screenshot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: base64DataUrl,
          mimeType,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to extract sale confirmation details.');
      }

      const data: ParsedSaleResult = result.data;

      // Track which fields were extracted and autofilled
      const extractedSet = new Set<string>();

      if (data.customerName) {
        setCustomerName(data.customerName);
        extractedSet.add('customerName');
      }
      if (data.customerPhone) {
        setCustomerPhone(data.customerPhone);
        extractedSet.add('customerPhone');
      }
      if (data.customerEmail) {
        setCustomerEmail(data.customerEmail);
        extractedSet.add('customerEmail');
      }
      if (data.address) {
        setAddress(data.address);
        extractedSet.add('address');
      }
      if (data.city) {
        setCity(data.city);
        extractedSet.add('city');
      }
      if (data.state) {
        // Match state against known list
        const matchedState = US_STATES.find(
          (s) => s.code.toUpperCase() === data.state?.toUpperCase() || s.name.toLowerCase() === data.state?.toLowerCase()
        );
        if (matchedState) {
          setState(matchedState.code);
          extractedSet.add('state');
        }
      }
      if (data.zipCode) {
        setZipCode(data.zipCode);
        extractedSet.add('zipCode');
      }
      if (data.ispProgram) {
        // Map carrier names cleanly to known dropdown options
        const p = data.ispProgram.toLowerCase();
        let matchedIsp = 'AT&T Fiber';
        if (p.includes('att') || p.includes('at&t')) matchedIsp = 'AT&T Fiber';
        else if (p.includes('frontier')) matchedIsp = 'Frontier Fiber';
        else if (p.includes('quantum') || p.includes('centurylink')) matchedIsp = 'Quantum Fiber';
        else if (p.includes('brightspeed')) matchedIsp = 'Brightspeed';
        else if (p.includes('spectrum')) matchedIsp = 'Spectrum Gig';
        else if (p.includes('kinetic') || p.includes('windstream')) matchedIsp = 'Kinetic Fiber';
        else matchedIsp = data.ispProgram;

        setIspProgram(matchedIsp);
        extractedSet.add('ispProgram');
      }
      if (data.speedTier) {
        const s = data.speedTier.toLowerCase();
        let matchedSpeed = '1 Gig';
        if (s.includes('300')) matchedSpeed = '300 Mbps';
        else if (s.includes('500')) matchedSpeed = '500 Mbps';
        else if (s.includes('2 gig') || s.includes('2000')) matchedSpeed = '2 Gig';
        else if (s.includes('5 gig') || s.includes('5000')) matchedSpeed = '5 Gig';
        else matchedSpeed = '1 Gig';

        setSpeedTier(matchedSpeed);
        extractedSet.add('speedTier');
      }
      if (data.orderNumber) {
        setOrderNumber(data.orderNumber);
        extractedSet.add('orderNumber');
      }
      if (data.orderDate) {
        setOrderDate(data.orderDate);
        extractedSet.add('orderDate');
      }
      if (data.installDate) {
        setInstallDate(data.installDate);
        extractedSet.add('installDate');
      }
      if (typeof data.monthlyPrice === 'number' && data.monthlyPrice > 0) {
        setMonthlyPrice(data.monthlyPrice);
        extractedSet.add('monthlyPrice');
      }
      if (data.notes) {
        setNotes(data.notes);
        extractedSet.add('notes');
      }
      if (data.detectedCrm) {
        setDetectedCrm(data.detectedCrm);
      }
      if (typeof data.confidenceScore === 'number') {
        setConfidenceScore(data.confidenceScore);
      }

      setAutofilledFields(extractedSet);
    } catch (err: any) {
      console.error('Screenshot parse error:', err);
      setAnalyzeError(err.message || 'Unable to parse screenshot. You can enter details manually.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        handleImageFile(file);
      } else {
        setAnalyzeError('Please upload an image file (PNG, JPG, or WebP).');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!customerName || !address || !city) {
      alert('Please fill out customer name, address, and city.');
      return;
    }

    const selectedBlitz = blitzes.find((b) => b.id === blitzId);

    await addSaleOrder({
      repId: currentUser.id,
      repName: currentUser.displayName,
      repRole: currentUser.role,
      uplineManagerId: currentUser.managerId,
      uplineManagerName: currentUser.managerName,
      customerName,
      customerPhone,
      customerEmail: customerEmail || undefined,
      address,
      city,
      state,
      zipCode,
      ispProgram,
      speedTier,
      orderNumber: orderNumber || undefined,
      confirmationCode: orderNumber || undefined,
      orderDate,
      installDate,
      status,
      monthlyPrice: monthlyPrice || undefined,
      payout: estimatedPayout,
      blitzId: blitzId || undefined,
      blitzName: selectedBlitz?.title,
      notes: notes || undefined,
      detectedCrm: detectedCrm || undefined,
      screenshotPreviewUrl: screenshotDataUrl || undefined,
    });

    confetti({
      particleCount: 90,
      spread: 75,
      origin: { y: 0.6 },
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center pt-[max(env(safe-area-inset-top,0px),0.75rem)] pb-[max(env(safe-area-inset-bottom,0px),0.75rem)] px-2.5 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-4 sm:space-y-5 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800/60 hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Mode Toggles */}
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
              Field Order Dispatch
            </span>
            {detectedCrm && (
              <span className="text-[10px] font-bold bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                {detectedCrm}
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-0.5">
            Log New Fiber Sale
          </h2>
          <p className="text-xs text-slate-400">
            Enter order details manually or upload any carrier confirmation screenshot for instant AI autofill.
          </p>
        </div>

        {/* Tab Buttons: Manual Entry vs. Scan Screenshot */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'manual'
                ? 'bg-slate-800 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Manual Entry</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('scan')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'scan'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-emerald-400 hover:text-emerald-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>📸 Scan Screenshot (Autofill)</span>
          </button>
        </div>

        {/* ======================================================== */}
        {/* SCREENSHOT SCAN & UPLOAD ZONE (Visible in scan mode or always toggleable) */}
        {/* ======================================================== */}
        {activeTab === 'scan' && (
          <div className="space-y-3 p-4 bg-slate-950/90 rounded-2xl border border-emerald-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">
                    Carrier Confirmation Code & Order Screenshot
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Works across all CRMs (AT&T OPUS, Frontier, Quantum, Brightspeed, Spectrum, etc.)
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                Ctrl+V / Paste Supported
              </span>
            </div>

            {/* Dropzone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-emerald-400 bg-emerald-500/10 scale-[1.01]'
                  : screenshotDataUrl
                  ? 'border-emerald-500/40 bg-emerald-950/10 hover:border-emerald-500'
                  : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageFile(file);
                }}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageFile(file);
                }}
              />

              {isAnalyzing ? (
                <div className="py-4 space-y-2.5 flex flex-col items-center">
                  <div className="relative">
                    <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                    <Sparkles className="w-4 h-4 text-cyan-300 absolute -top-1 -right-1 animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-white">
                      Analyzing Carrier CRM Layout & Extracting Data...
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Reading Confirmation Code, Customer Details, Address, Speed & Dispatch Schedule
                    </p>
                  </div>
                </div>
              ) : screenshotDataUrl ? (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
                  <div className="flex items-center gap-3">
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-800 border border-slate-700 flex-shrink-0">
                      <img
                        src={screenshotDataUrl}
                        alt="Screenshot thumbnail"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white truncate max-w-[200px] sm:max-w-[280px]">
                          {screenshotFileName || 'Confirmation Screenshot'}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Parsed
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {detectedCrm || 'Carrier CRM'} • {confidenceScore ? `${confidenceScore}% confidence` : 'Extracted'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => setShowScreenshotPreview(!showScreenshotPreview)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{showScreenshotPreview ? 'Hide Image' : 'View Image'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Change</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-2 space-y-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">
                      Drop confirmation screenshot here, paste from clipboard, or click to browse
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Supports mobile receipts, desktop portal views, and iPad order screens (PNG, JPG, WebP)
                    </p>
                  </div>
                  <div className="pt-1 flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700"
                    >
                      <Camera className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Take Photo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 border border-emerald-500/40"
                    >
                      <FileImage className="w-3.5 h-3.5" />
                      <span>Choose File</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Expanded Screenshot Preview */}
            {showScreenshotPreview && screenshotDataUrl && (
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span>Screenshot Reference:</span>
                  <button
                    type="button"
                    onClick={() => setShowScreenshotPreview(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    Close
                  </button>
                </div>
                <div className="max-h-60 overflow-y-auto rounded-lg border border-slate-800 bg-black/50 p-1">
                  <img
                    src={screenshotDataUrl}
                    alt="Carrier Confirmation Preview"
                    className="w-full object-contain rounded"
                  />
                </div>
              </div>
            )}

            {/* Error Message */}
            {analyzeError && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 flex items-start gap-2 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-bold">Extraction Notice:</span> {analyzeError}
                </div>
              </div>
            )}

            {/* Detection Summary Banner when fields are autofilled */}
            {autofilledFields.size > 0 && !isAnalyzing && (
              <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-950/50 via-slate-900 to-emerald-950/50 border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-extrabold text-white block">
                      Autofilled {autofilledFields.size} fields from {detectedCrm || 'confirmation screenshot'}!
                    </span>
                    <span className="text-[11px] text-emerald-300/80">
                      Check and fine-tune any details below before submitting.
                    </span>
                  </div>
                </div>
                {confidenceScore && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0 self-start sm:self-auto">
                    {confidenceScore}% AI Confidence
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* SALE FORM (Autofilled or Manual Entry)                   */}
        {/* ======================================================== */}
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          {/* Order Confirmation Code / BAN */}
          <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <span>Confirmation Code / Order # / BAN</span>
                {autofilledFields.has('orderNumber') && (
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    ✨ Autofilled
                  </span>
                )}
              </label>
              <span className="text-[10px] text-slate-500">Carrier Reference ID</span>
            </div>
            <input
              type="text"
              placeholder="e.g. ATT-894210-TX, FR-993214, QF-7401928"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              className={`w-full bg-slate-900 border rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none ${
                autofilledFields.has('orderNumber')
                  ? 'border-emerald-500/50 bg-emerald-950/10'
                  : 'border-slate-800 focus:border-cyan-500'
              }`}
            />
          </div>

          {/* Customer Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-300">Customer Full Name</label>
                {autofilledFields.has('customerName') && (
                  <span className="text-[9px] font-bold text-emerald-400">✨ Extracted</span>
                )}
              </div>
              <input
                type="text"
                required
                placeholder="First & Last Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className={`w-full bg-slate-950 border rounded-xl px-3 py-2 text-xs text-white focus:outline-none ${
                  autofilledFields.has('customerName')
                    ? 'border-emerald-500/50 bg-emerald-950/10'
                    : 'border-slate-800 focus:border-cyan-500'
                }`}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-300">Customer Phone Number</label>
                {autofilledFields.has('customerPhone') && (
                  <span className="text-[9px] font-bold text-emerald-400">✨ Extracted</span>
                )}
              </div>
              <input
                type="tel"
                required
                placeholder="(555) 000-0000"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className={`w-full bg-slate-950 border rounded-xl px-3 py-2 text-xs text-white focus:outline-none ${
                  autofilledFields.has('customerPhone')
                    ? 'border-emerald-500/50 bg-emerald-950/10'
                    : 'border-slate-800 focus:border-cyan-500'
                }`}
              />
            </div>
          </div>

          {/* Customer Email */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-300">Customer Email (Optional)</label>
              {autofilledFields.has('customerEmail') && (
                <span className="text-[9px] font-bold text-emerald-400">✨ Extracted</span>
              )}
            </div>
            <input
              type="email"
              placeholder="customer@email.com"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className={`w-full bg-slate-950 border rounded-xl px-3 py-2 text-xs text-white focus:outline-none ${
                autofilledFields.has('customerEmail')
                  ? 'border-emerald-500/50 bg-emerald-950/10'
                  : 'border-slate-800 focus:border-cyan-500'
              }`}
            />
          </div>

          {/* Address Details */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-300">Street Address</label>
              {autofilledFields.has('address') && (
                <span className="text-[9px] font-bold text-emerald-400">✨ Extracted</span>
              )}
            </div>
            <input
              type="text"
              required
              placeholder="1234 Fiber Optic Trail"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className={`w-full bg-slate-950 border rounded-xl px-3 py-2 text-xs text-white focus:outline-none ${
                autofilledFields.has('address')
                  ? 'border-emerald-500/50 bg-emerald-950/10'
                  : 'border-slate-800 focus:border-cyan-500'
              }`}
            />
          </div>

          <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
            <div className="col-span-1">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-300">City</label>
                {autofilledFields.has('city') && (
                  <span className="text-[9px] font-bold text-emerald-400">✨</span>
                )}
              </div>
              <input
                type="text"
                required
                placeholder="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className={`w-full bg-slate-950 border rounded-xl px-3 py-2 text-xs text-white focus:outline-none ${
                  autofilledFields.has('city')
                    ? 'border-emerald-500/50 bg-emerald-950/10'
                    : 'border-slate-800 focus:border-cyan-500'
                }`}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">State</label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                {US_STATES.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.code} - {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-300">Zip Code</label>
                {autofilledFields.has('zipCode') && (
                  <span className="text-[9px] font-bold text-emerald-400">✨</span>
                )}
              </div>
              <input
                type="text"
                required
                placeholder="75001"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                className={`w-full bg-slate-950 border rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none ${
                  autofilledFields.has('zipCode')
                    ? 'border-emerald-500/50 bg-emerald-950/10'
                    : 'border-slate-800 focus:border-cyan-500'
                }`}
              />
            </div>
          </div>

          {/* ISP Program & Speed Tier & Monthly Price */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-300">Carrier / ISP Program</label>
                {autofilledFields.has('ispProgram') && (
                  <span className="text-[9px] font-bold text-emerald-400">✨ Detected</span>
                )}
              </div>
              <select
                value={ispProgram}
                onChange={(e) => setIspProgram(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="AT&T Fiber">AT&T Fiber</option>
                <option value="Frontier Fiber">Frontier Fiber</option>
                <option value="Quantum Fiber">Quantum Fiber</option>
                <option value="Brightspeed">Brightspeed</option>
                <option value="Spectrum Gig">Spectrum Gig</option>
                <option value="Kinetic Fiber">Kinetic Fiber</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-300">Speed Tier</label>
                {autofilledFields.has('speedTier') && (
                  <span className="text-[9px] font-bold text-emerald-400">✨</span>
                )}
              </div>
              <select
                value={speedTier}
                onChange={(e) => setSpeedTier(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="300 Mbps">300 Mbps Symmetrical</option>
                <option value="500 Mbps">500 Mbps Symmetrical</option>
                <option value="1 Gig">1 Gig Symmetrical (Recommended)</option>
                <option value="2 Gig">2 Gig Hyper-Gig</option>
                <option value="5 Gig">5 Gig Ultra-Fiber</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-300">Monthly Plan Rate</label>
                {autofilledFields.has('monthlyPrice') && (
                  <span className="text-[9px] font-bold text-emerald-400">✨</span>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="80.00"
                  value={monthlyPrice !== undefined ? monthlyPrice : ''}
                  onChange={(e) => setMonthlyPrice(e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-7 pr-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Dates & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-300">Order Date</label>
                {autofilledFields.has('orderDate') && (
                  <span className="text-[9px] font-bold text-emerald-400">✨</span>
                )}
              </div>
              <input
                type="date"
                required
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-300">Install Dispatch Date</label>
                {autofilledFields.has('installDate') && (
                  <span className="text-[9px] font-bold text-emerald-400">✨</span>
                )}
              </div>
              <input
                type="date"
                required
                value={installDate}
                onChange={(e) => setInstallDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Initial Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as OrderStatus)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="scheduled">Scheduled (Pending)</option>
                <option value="jeopardy">Jeopardy (Action Required)</option>
                <option value="installed">Installed (Completed Today)</option>
              </select>
            </div>
          </div>

          {/* Link to Blitz */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              Link to State Blitz (Optional)
            </label>
            <select
              value={blitzId}
              onChange={(e) => setBlitzId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="">Independent Local Market Sale</option>
              {blitzes.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title} ({b.state} - {b.ispPartner})
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-300">Dispatch Notes</label>
              {autofilledFields.has('notes') && (
                <span className="text-[9px] font-bold text-emerald-400">✨ Extracted</span>
              )}
            </div>
            <input
              type="text"
              placeholder="e.g. Customer wants ONT in garage. Arrival window: 8 AM - 12 PM."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Commission Calculation Display */}
          <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Estimated Rep Commission
              </span>
              <span className="text-xs text-slate-400">
                Rate for {ispProgram} (set by management)
              </span>
            </div>
            <div className="text-right">
              <span className="text-xl font-black text-amber-400 font-mono">
                ${estimatedPayout}.00
              </span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm & Submit Order</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
