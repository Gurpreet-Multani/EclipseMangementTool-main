import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { SmsGroupMessage, SaleOrder } from '../types';
import {
  X,
  Send,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  Zap,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  FileCheck2,
  Smartphone,
  Eye,
  CheckCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface SmsGroupChatModalProps {
  onClose: () => void;
  onNavigateToSale?: (saleId: string) => void;
}

export const SmsGroupChatModal: React.FC<SmsGroupChatModalProps> = ({
  onClose,
  onNavigateToSale,
}) => {
  const { currentUser } = useAuth();
  const {
    smsGroupMessages,
    sendSmsGroupMessage,
    fetchSmsGroupMessages,
    reconcileSmsGroupSales,
  } = useData();

  const [messageText, setMessageText] = useState('');
  const [selectedImageBase64, setSelectedImageBase64] = useState<string | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReconciling, setIsReconciling] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to top when new messages arrive (since chat shows newest first)
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = 0;
    }
  }, [smsGroupMessages.length]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setSelectedImageBase64(base64);
        setImagePreviewUrl(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle paste screenshot from clipboard
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64 = reader.result as string;
              setSelectedImageBase64(base64);
              setImagePreviewUrl(base64);
            };
            reader.readAsDataURL(file);
          }
          break;
        }
      }
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() && !selectedImageBase64) return;

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await sendSmsGroupMessage(messageText.trim(), selectedImageBase64 || undefined);
      if (res.isSale) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
        setFeedback(`🎉 Sale Verified & Uploaded to All Sales Orders! (${res.sale?.orderNumber})`);
      } else if (selectedImageBase64) {
        setFeedback('ℹ️ Image analyzed: Classified as general team chat (not a sale summary).');
      } else {
        setFeedback('Message sent to SMS groupchat.');
      }

      setMessageText('');
      setSelectedImageBase64(null);
      setImagePreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setFeedback(err.message || 'Failed to send message.');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setFeedback(null), 6000);
    }
  };

  const handleReconcileNow = async () => {
    setIsReconciling(true);
    try {
      const res = await reconcileSmsGroupSales();
      setFeedback(`⚡ Fiber Volt Reconciliation Complete: ${res.reconciledCount} orders synchronized with live portal state!`);
    } catch (err: any) {
      setFeedback('Reconciliation notice: ' + err.message);
    } finally {
      setIsReconciling(false);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  // Sample quick drop generators for testing
  const handleDropSampleSale = (type: 'sparklight' | 'dwayne' | 'meme') => {
    if (type === 'sparklight') {
      setMessageText('Just closed another Sparklight 1 Gig order in Tempe! Customer signed on turf.');
      // 1x1 green canvas as mock image
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#064e3b';
        ctx.fillRect(0, 0, 400, 300);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText('SPARKLIGHT FIBER WORK ORDER', 20, 50);
        ctx.font = '14px sans-serif';
        ctx.fillText('Customer: Jordan Mitchell', 20, 90);
        ctx.fillText('Address: 4820 S Mill Ave, Tempe, AZ', 20, 120);
        ctx.fillText('Plan: 1 Gig Fiber ($70.00/mo)', 20, 150);
        ctx.fillText('Order #: SL-2026-98124', 20, 180);
        ctx.fillText('Install: 2026-10-27 (8:00 AM - 12:00 PM)', 20, 210);
        const dataUrl = canvas.toDataURL('image/png');
        setSelectedImageBase64(dataUrl);
        setImagePreviewUrl(dataUrl);
      }
    } else if (type === 'dwayne') {
      setMessageText('New Bootheel sale logged for Kennett, MO! Sparklight 500M.');
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, 400, 300);
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText('SPARKLIGHT BROADBAND ORDER', 20, 50);
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px sans-serif';
        ctx.fillText('Customer: Tyrone Jackson', 20, 90);
        ctx.fillText('Address: 1202 Commercial St, Kennett, MO', 20, 120);
        ctx.fillText('Plan: 500 Mbps Fiber ($55.00/mo)', 20, 150);
        ctx.fillText('Order #: FV-DW-77299', 20, 180);
        ctx.fillText('Status: Scheduled Install', 20, 210);
        const dataUrl = canvas.toDataURL('image/png');
        setSelectedImageBase64(dataUrl);
        setImagePreviewUrl(dataUrl);
      }
    } else {
      setMessageText('Squad lunch after knocking North Scottsdale! Team hitting targets today.');
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(0, 0, 400, 300);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px sans-serif';
        ctx.fillText('TEAM CELEBRATION LUNCH 🍕', 50, 150);
        const dataUrl = canvas.toDataURL('image/png');
        setSelectedImageBase64(dataUrl);
        setImagePreviewUrl(dataUrl);
      }
    }
  };

  // Metrics
  const totalMessages = smsGroupMessages.length;
  const totalSalesDetected = smsGroupMessages.filter((m) => m.isSale).length;
  const totalReconciled = smsGroupMessages.filter((m) => m.fiberVoltStatus === 'matched_installed' || m.fiberVoltStatus === 'matched_scheduled').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-start justify-between gap-4 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20 shrink-0">
              <Smartphone className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">
                  SMS Groupchat • Live Order Vision Ingestion
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  24/7 AI Scanner
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Drop order summary screenshots into the chat. Gemini Vision AI automatically parses sales, adds them to your Sales Book, and reconciles them overtime with Fiber Volt.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReconcileNow}
              disabled={isReconciling}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
              title="Cross-reference all chat sales against Fiber Volt live records"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isReconciling ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sync with Fiber Volt</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-3 gap-2 px-4 py-2.5 bg-slate-950/30 border-b border-slate-800/80 text-center">
          <div className="p-1.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Group Messages</span>
            <span className="text-sm sm:text-base font-black text-white">{totalMessages}</span>
          </div>
          <div className="p-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
            <span className="text-[10px] font-bold text-emerald-400 uppercase block">Sales Ingested</span>
            <span className="text-sm sm:text-base font-black text-emerald-300">{totalSalesDetected}</span>
          </div>
          <div className="p-1.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30">
            <span className="text-[10px] font-bold text-cyan-400 uppercase block">Fiber Volt Reconciled</span>
            <span className="text-sm sm:text-base font-black text-cyan-300">{totalReconciled}</span>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className="mx-4 mt-3 p-3 rounded-2xl bg-slate-800/90 border border-cyan-500/40 text-xs text-cyan-200 flex items-center justify-between">
            <span className="font-medium">{feedback}</span>
            <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Messages Stream */}
        <div
          ref={chatScrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 divide-y divide-slate-800/40"
        >
          {smsGroupMessages.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <MessageSquare className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-300">No chat messages yet</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Paste or drop an order confirmation image below to test the automatic Vision AI recognition and Fiber Volt sync!
              </p>
            </div>
          ) : (
            smsGroupMessages.map((msg) => {
              const isSale = msg.isSale;
              const isMatchedInstalled = msg.fiberVoltStatus === 'matched_installed';
              const isMatchedScheduled = msg.fiberVoltStatus === 'matched_scheduled';
              const isPendingFiberVolt = msg.fiberVoltStatus === 'pending_fibervolt';

              return (
                <div key={msg.id} className="pt-4 first:pt-0 space-y-2">
                  {/* Sender Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={msg.senderAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
                        alt={msg.senderName}
                        className="w-7 h-7 rounded-full object-cover border border-slate-700"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white">{msg.senderName}</span>
                          {msg.senderRole && (
                            <span className="text-[10px] text-slate-400 hidden sm:inline">
                              • {msg.senderRole}
                            </span>
                          )}
                          {msg.senderPhone && (
                            <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
                              ({msg.senderPhone})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Message Text */}
                  {msg.text && (
                    <p className="text-xs text-slate-200 leading-relaxed pl-9">
                      {msg.text}
                    </p>
                  )}

                  {/* Attached Image + AI Analysis Card */}
                  {msg.imageUrl && (
                    <div className="pl-9 space-y-2">
                      <div className="relative inline-block max-w-sm rounded-2xl overflow-hidden border border-slate-800 group bg-slate-950">
                        <img
                          src={msg.imageUrl}
                          alt="Order Summary Screenshot"
                          className="max-h-48 w-auto object-cover cursor-pointer hover:opacity-95 transition-opacity"
                          onClick={() => setLightboxImage(msg.imageUrl || null)}
                        />
                        <button
                          onClick={() => setLightboxImage(msg.imageUrl || null)}
                          className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold gap-1 transition-opacity"
                        >
                          <Eye className="w-4 h-4" /> Expand Receipt
                        </button>
                      </div>

                      {/* AI Vision Detection Result Card */}
                      {msg.isAiAnalyzed && (
                        <div
                          className={`p-3 rounded-2xl border text-xs max-w-xl transition-all ${
                            isSale
                              ? 'bg-slate-950/80 border-emerald-500/40 shadow-md shadow-emerald-950/20'
                              : 'bg-slate-950/50 border-slate-800 text-slate-400'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-1.5">
                              {isSale ? (
                                <>
                                  <Sparkles className="w-4 h-4 text-emerald-400" />
                                  <span className="font-black text-emerald-300">
                                    ISP Order Verified & Uploaded
                                  </span>
                                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                                    {msg.aiConfidence}% match
                                  </span>
                                </>
                              ) : (
                                <>
                                  <span className="font-semibold text-slate-400">
                                    💬 Non-Sale Image Detected
                                  </span>
                                </>
                              )}
                            </div>

                            {/* Fiber Volt Reconciliation Status */}
                            {isSale && (
                              <div>
                                {isMatchedInstalled && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                                    <Zap className="w-3 h-3" /> Fiber Volt Installed
                                  </span>
                                )}
                                {isMatchedScheduled && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> Fiber Volt Scheduled
                                  </span>
                                )}
                                {isPendingFiberVolt && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                                    <Clock className="w-3 h-3 animate-spin" /> Pending Fiber Volt Sync
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Extracted Details if Sale */}
                          {isSale ? (
                            <div className="space-y-1.5 text-slate-300">
                              <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-900/60 p-2 rounded-xl border border-slate-800">
                                <div>
                                  <span className="text-slate-500 block text-[9px] uppercase font-bold">Customer</span>
                                  <span className="font-bold text-white truncate block">{msg.extractedCustomerName}</span>
                                </div>
                                <div>
                                  <span className="text-slate-500 block text-[9px] uppercase font-bold">Program & Tier</span>
                                  <span className="text-emerald-400 font-semibold truncate block">
                                    {msg.extractedIspProgram} ({msg.extractedSpeedTier})
                                  </span>
                                </div>
                                <div>
                                  <span className="text-slate-500 block text-[9px] uppercase font-bold">Address</span>
                                  <span className="text-slate-300 truncate block">{msg.extractedAddress}</span>
                                </div>
                                <div>
                                  <span className="text-slate-500 block text-[9px] uppercase font-bold">Order Number</span>
                                  <span className="font-mono text-cyan-300 font-bold truncate block">{msg.extractedOrderNumber}</span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-1">
                                <span className="text-[11px] text-slate-400 italic">
                                  {msg.aiReasoning}
                                </span>
                                {msg.extractedSaleId && onNavigateToSale && (
                                  <button
                                    onClick={() => onNavigateToSale(msg.extractedSaleId!)}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 font-bold text-[10px] flex items-center gap-1 border border-emerald-500/30 shrink-0"
                                  >
                                    <span>View in All Sales</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ) : (
                            <p className="text-[11px] text-slate-400">{msg.aiReasoning}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Quick Testing Actions for User Convenience */}
        <div className="px-4 py-2 bg-slate-950/40 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase">⚡ 1-Click Test Scenarios:</span>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => handleDropSampleSale('sparklight')}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold border border-slate-700 transition-colors"
            >
              + Drop Sparklight Order
            </button>
            <button
              onClick={() => handleDropSampleSale('dwayne')}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold border border-slate-700 transition-colors"
            >
              + Drop Kennett Order (Dwayne)
            </button>
            <button
              onClick={() => handleDropSampleSale('meme')}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-[10px] font-bold border border-slate-700 transition-colors"
            >
              + Drop Team Photo (Non-Sale)
            </button>
          </div>
        </div>

        {/* Composer Form */}
        <form
          onSubmit={handleSendMessage}
          onPaste={handlePaste}
          className="p-3.5 sm:p-4 bg-slate-950 border-t border-slate-800 space-y-3"
        >
          {/* Image Preview Banner if selected */}
          {imagePreviewUrl && (
            <div className="relative inline-flex items-center gap-3 p-2 rounded-2xl bg-slate-900 border border-slate-800">
              <img
                src={imagePreviewUrl}
                alt="Upload preview"
                className="w-14 h-14 rounded-xl object-cover border border-slate-700"
              />
              <div className="text-xs">
                <span className="font-bold text-white block">Screenshot Ready to Scan</span>
                <span className="text-[10px] text-slate-400">Gemini Vision AI will inspect for sales data</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedImageBase64(null);
                  setImagePreviewUrl(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 ml-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors shrink-0"
              title="Attach order screenshot or image"
            >
              <ImageIcon className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Post a message or paste a screenshot (Ctrl+V / Cmd+V)..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />

            <button
              type="submit"
              disabled={isSubmitting || (!messageText.trim() && !selectedImageBase64)}
              className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20 shrink-0"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Scanning AI...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Post</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={lightboxImage}
              alt="Enlarged screenshot"
              className="max-h-[85vh] max-w-full rounded-2xl object-contain border border-slate-800"
            />
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-slate-900/80 text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
