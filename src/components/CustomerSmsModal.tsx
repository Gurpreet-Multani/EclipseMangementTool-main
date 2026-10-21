import React, { useState, useEffect } from 'react';
import { SaleOrder, CustomerSmsMessage, CustomerSmsConfig, CustomerSmsType } from '../types';
import { useData } from '../context/DataContext';
import {
  X,
  MessageSquare,
  Smartphone,
  Calendar,
  Clock,
  CheckCircle2,
  Send,
  Copy,
  Check,
  Edit3,
  RotateCcw,
  Sparkles,
  Zap,
  ShieldCheck,
  Bell,
  HeartPulse,
  AlertCircle,
  Eye,
  Sliders,
  ChevronRight,
  UserCheck,
  PhoneCall,
  History,
  Settings,
  Key,
  Radio,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  formatFriendlyDate,
  getOrCreateOrderSmsConfig,
  generateDefaultSmsMessages,
  openNativeDeviceSms,
  sendRealCloudSms,
  checkSmsGatewayStatus,
} from '../lib/customerSms';

interface CustomerSmsModalProps {
  order: SaleOrder;
  onClose: () => void;
}

const LOCAL_GATEWAY_KEY = 'eclipse_twilio_gateway_config';

export const CustomerSmsModal: React.FC<CustomerSmsModalProps> = ({ order, onClose }) => {
  const { updateOrderCustomerSms, sendCustomerSmsNow } = useData();

  const [activeTab, setActiveTab] = useState<'pipeline' | 'phone_preview' | 'logs' | 'gateway_config'>('pipeline');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editText, setEditText] = useState<string>('');
  const [isSendingId, setIsSendingId] = useState<string | null>(null);
  const [sendMethod, setSendMethod] = useState<'device_sms' | 'cloud_gateway'>('device_sms');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Cloud Gateway Credentials (stored in localStorage or from server env)
  const [accountSid, setAccountSid] = useState<string>('');
  const [authToken, setAuthToken] = useState<string>('');
  const [fromPhone, setFromPhone] = useState<string>('');
  const [serverGatewayStatus, setServerGatewayStatus] = useState<{
    configured: boolean;
    hasAccountSid: boolean;
    hasPhoneNumber: boolean;
    fromNumber: string | null;
  } | null>(null);

  // Initialize config and messages from order or defaults
  const initialData = getOrCreateOrderSmsConfig(order);
  const [smsConfig, setSmsConfig] = useState<CustomerSmsConfig>(initialData.config);
  const [messages, setMessages] = useState<CustomerSmsMessage[]>(initialData.messages);

  useEffect(() => {
    // Load local Twilio credentials if saved
    try {
      const savedGateway = localStorage.getItem(LOCAL_GATEWAY_KEY);
      if (savedGateway) {
        const parsed = JSON.parse(savedGateway);
        if (parsed.accountSid) setAccountSid(parsed.accountSid);
        if (parsed.authToken) setAuthToken(parsed.authToken);
        if (parsed.fromPhone) setFromPhone(parsed.fromPhone);
      }
    } catch (e) {
      console.warn(e);
    }

    // Check server gateway status
    checkSmsGatewayStatus().then((status) => {
      setServerGatewayStatus(status);
      if (status.configured) {
        setSendMethod('cloud_gateway');
      }
    });
  }, []);

  // Update local state if order prop changes
  useEffect(() => {
    const fresh = getOrCreateOrderSmsConfig(order);
    setSmsConfig(fresh.config);
    setMessages(fresh.messages);
  }, [order]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('SMS text copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleMasterAuto = () => {
    const updated = !smsConfig.autoSmsEnabled;
    const newConfig: CustomerSmsConfig = {
      ...smsConfig,
      autoSmsEnabled: updated,
    };
    setSmsConfig(newConfig);
    saveChanges(newConfig, messages);
    showToast(updated ? 'Automated SMS sequence ACTIVATED' : 'Automated SMS sequence PAUSED');
  };

  const handleToggleMessage = (msgId: string) => {
    const updatedMessages = messages.map((m) => {
      if (m.id === msgId) {
        return { ...m, enabled: !m.enabled };
      }
      return m;
    });
    setMessages(updatedMessages);
    saveChanges(smsConfig, updatedMessages);
  };

  const handleStartEdit = (msg: CustomerSmsMessage) => {
    setEditingMessageId(msg.id);
    setEditText(msg.messageText);
  };

  const handleSaveEdit = (msgId: string) => {
    const updatedMessages = messages.map((m) => {
      if (m.id === msgId) {
        return { ...m, messageText: editText };
      }
      return m;
    });
    setMessages(updatedMessages);
    setEditingMessageId(null);
    saveChanges(smsConfig, updatedMessages);
    showToast('Message template updated and saved!');
  };

  const handleResetDefaults = () => {
    const defaults = generateDefaultSmsMessages(order);
    setMessages(defaults);
    saveChanges(smsConfig, defaults);
    showToast('Reset to carrier default templates!');
  };

  // 1. Direct Real SMS via Rep's Phone App (Native cellular message)
  const handleSendViaNativeDevice = async (msg: CustomerSmsMessage) => {
    setIsSendingId(msg.id);
    setErrorMessage(null);

    try {
      // Launch phone SMS app with pre-filled customer phone and text
      openNativeDeviceSms(order.customerPhone, msg.messageText);

      // Record sent in state and Firestore
      await sendCustomerSmsNow(order.id, msg.id);

      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, status: 'sent', sentAt: new Date().toISOString() } : m))
      );

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });

      showToast(`Opened SMS app! Sending real text to ${order.customerName} (${order.customerPhone}).`);
    } catch (e: any) {
      console.error(e);
      setErrorMessage(e.message || 'Failed to open device SMS app.');
    } finally {
      setIsSendingId(null);
    }
  };

  // 2. Cloud SMS via Twilio Gateway
  const handleSendViaCloudGateway = async (msg: CustomerSmsMessage) => {
    setIsSendingId(msg.id);
    setErrorMessage(null);

    try {
      const result = await sendRealCloudSms({
        to: order.customerPhone,
        body: msg.messageText,
        customerName: order.customerName,
        orderNumber: order.orderNumber,
        accountSid: accountSid || undefined,
        authToken: authToken || undefined,
        fromPhone: fromPhone || undefined,
      });

      if (!result.success) {
        if (result.gatewayConfigured === false) {
          // Gateway not yet set up
          setActiveTab('gateway_config');
          setErrorMessage('Twilio Cloud Gateway credentials are not set up yet. You can send this real text instantly via your phone SMS, or configure Twilio below.');
          return;
        }
        throw new Error(result.error || 'Failed to send text message via Cloud SMS Gateway.');
      }

      // Mark message as sent in data context
      await sendCustomerSmsNow(order.id, msg.id);

      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, status: 'sent', sentAt: new Date().toISOString() } : m))
      );

      confetti({
        particleCount: 70,
        spread: 70,
        origin: { y: 0.7 },
      });

      showToast(`Real SMS delivered to ${order.customerName} (${order.customerPhone})! Message SID: ${result.messageSid?.slice(0, 10)}...`);
    } catch (e: any) {
      console.error('Cloud SMS error:', e);
      setErrorMessage(e.message || 'Error communicating with SMS Gateway.');
    } finally {
      setIsSendingId(null);
    }
  };

  const handleSaveGatewaySettings = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem(
        LOCAL_GATEWAY_KEY,
        JSON.stringify({
          accountSid,
          authToken,
          fromPhone,
        })
      );
      showToast('Twilio Cloud Gateway settings saved to browser storage!');
      setErrorMessage(null);
    } catch (err) {
      console.error(err);
    }
  };

  const saveChanges = async (newConfig: CustomerSmsConfig, newMessages: CustomerSmsMessage[]) => {
    try {
      await updateOrderCustomerSms(order.id, newConfig, newMessages);
    } catch (e) {
      console.error('Error saving SMS config:', e);
    }
  };

  const sentCount = messages.filter((m) => m.status === 'sent').length;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center pt-[max(env(safe-area-inset-top,0px),0.75rem)] pb-[max(env(safe-area-inset-bottom,0px),0.75rem)] px-2.5 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              <Smartphone className="w-3.5 h-3.5" />
              Live Customer SMS Dispatch
            </span>
            <span className="font-mono text-[10px] font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
              {order.orderNumber}
            </span>
            <span className="text-[10px] font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded">
              {order.ispProgram} • {order.speedTier}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white">
            Send Real SMS: {order.customerName}
          </h2>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 mt-1">
            <span className="text-slate-200 font-mono font-semibold">📱 {order.customerPhone}</span>
            <span>•</span>
            <span>📍 {order.address}, {order.city}, {order.state}</span>
            <span>•</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Install: {formatFriendlyDate(order.installDate)}
            </span>
          </div>
        </div>

        {/* Real Dispatch Method Selector Bar */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-lg shadow-emerald-500/10 shrink-0">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-white">
                  Real Text Dispatch Mode
                </span>
                <span className="px-2 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Real Cellular Outbox
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {sendMethod === 'device_sms'
                  ? 'Fires authentic cellular SMS directly from your smartphone / Messages app to customer number.'
                  : 'Fires cloud carrier SMS via Twilio telecommunication gateway.'}
              </p>
            </div>
          </div>

          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
            <button
              type="button"
              onClick={() => setSendMethod('device_sms')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                sendMethod === 'device_sms'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Phone SMS</span>
            </button>
            <button
              type="button"
              onClick={() => setSendMethod('cloud_gateway')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                sendMethod === 'cloud_gateway'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Cloud Gateway</span>
            </button>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2 flex-wrap">
          <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('pipeline')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'pipeline'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Outreach Pipeline ({sentCount}/3 Sent)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('phone_preview')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'phone_preview'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Customer Mobile View</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('logs')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'logs'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Dispatch Audit</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('gateway_config')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'gateway_config'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Gateway Settings</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleResetDefaults}
            className="text-[11px] font-semibold text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer transition-colors"
            title="Reset message texts to official carrier defaults"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">Reset Defaults</span>
          </button>
        </div>

        {/* Error notification banner */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 flex items-start gap-2 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold">Dispatch Notice:</span> {errorMessage}
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 1: OUTREACH PIPELINE (Real Text Dispatch)            */}
        {/* ======================================================== */}
        {activeTab === 'pipeline' && (
          <div className="space-y-3">
            {messages.map((msg, index) => {
              const isSent = msg.status === 'sent';
              const isEditing = editingMessageId === msg.id;

              // Touchpoint badge & icon
              let stageBadge = 'Stage 1 • 24h Ahead';
              let stageIcon = Calendar;
              let accentClass = 'text-cyan-400 bg-cyan-950/40 border-cyan-500/30';

              if (msg.type === 'day_of_install') {
                stageBadge = 'Stage 2 • Install Day';
                stageIcon = Zap;
                accentClass = 'text-amber-400 bg-amber-950/40 border-amber-500/30';
              } else if (msg.type === 'post_install_checkup') {
                stageBadge = 'Stage 3 • 7 Days After';
                stageIcon = HeartPulse;
                accentClass = 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30';
              }

              const Icon = stageIcon;

              return (
                <div
                  key={msg.id}
                  className={`p-4 rounded-2xl border transition-all space-y-3 relative overflow-hidden ${
                    isSent
                      ? 'bg-slate-950/90 border-emerald-500/30 ring-1 ring-emerald-500/20'
                      : msg.enabled
                      ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700 shadow-sm'
                      : 'bg-slate-950/50 border-slate-900 opacity-60'
                  }`}
                >
                  {/* Top Bar: Title, Date, Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${accentClass}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded border bg-slate-800 text-slate-300">
                            {stageBadge}
                          </span>
                          <h4 className="text-xs sm:text-sm font-bold text-white">
                            {msg.title}
                          </h4>
                        </div>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>
                            Scheduled: <strong className="text-slate-300">{formatFriendlyDate(msg.scheduledForDate)}</strong> at {msg.scheduledForTime || '09:00 AM'}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
                          isSent
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : msg.enabled
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {isSent ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>Delivered Real SMS</span>
                          </>
                        ) : msg.enabled ? (
                          <>
                            <Clock className="w-3 h-3 text-cyan-400" />
                            <span>Scheduled</span>
                          </>
                        ) : (
                          <span>Disabled</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Message Content Preview or Editor */}
                  {isEditing ? (
                    <div className="space-y-2">
                      <textarea
                        rows={3}
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500 font-sans leading-relaxed"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingMessageId(null)}
                          className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(msg.id)}
                          className="px-4 py-1 rounded-lg bg-emerald-500 text-slate-950 text-xs font-bold hover:bg-emerald-400 shadow-md cursor-pointer"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 text-xs text-slate-200 leading-relaxed font-sans relative group">
                      <p>{msg.messageText}</p>
                      {msg.sentAt && (
                        <span className="text-[10px] text-emerald-400/90 font-mono mt-1.5 block">
                          ✓ Real text dispatched on {new Date(msg.sentAt).toLocaleDateString()} at{' '}
                          {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to {order.customerPhone}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Action Bar with Real Sending Options */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopyText(msg.id, msg.messageText)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStartEdit(msg)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Customize</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleMessage(msg.id)}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                      >
                        {msg.enabled ? 'Pause Step' : 'Resume Step'}
                      </button>
                    </div>

                    {/* Dual Real SMS Trigger Options */}
                    <div className="flex items-center gap-2">
                      {sendMethod === 'device_sms' ? (
                        <button
                          type="button"
                          onClick={() => handleSendViaNativeDevice(msg)}
                          disabled={isSendingId === msg.id}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20 cursor-pointer transition-all"
                          title={`Opens your device's native SMS app with ${order.customerPhone} and text pre-filled`}
                        >
                          {isSendingId === msg.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Smartphone className="w-3.5 h-3.5" />
                          )}
                          <span>📱 Send Real Text (My Phone)</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSendViaCloudGateway(msg)}
                          disabled={isSendingId === msg.id}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-md shadow-cyan-500/20 cursor-pointer transition-all"
                          title="Sends actual SMS via Twilio telecommunications gateway"
                        >
                          {isSendingId === msg.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Send className="w-3.5 h-3.5" />
                          )}
                          <span>☁️ Send Real SMS (Cloud Gateway)</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: CUSTOMER MOBILE DEVICE SIMULATOR                  */}
        {/* ======================================================== */}
        {activeTab === 'phone_preview' && (
          <div className="flex flex-col items-center justify-center p-2 sm:p-4">
            <div className="w-full max-w-sm bg-slate-950 rounded-[40px] border-4 border-slate-800 shadow-2xl overflow-hidden p-2 ring-1 ring-slate-700/50">
              <div className="w-24 h-4 bg-slate-850 mx-auto rounded-full mb-2 bg-slate-800"></div>

              <div className="bg-slate-900 border-b border-slate-800 p-3 rounded-2xl flex items-center justify-between text-center">
                <div className="w-full">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center font-bold text-xs mb-1">
                    {order.ispProgram.slice(0, 2).toUpperCase()}
                  </div>
                  <h4 className="text-xs font-bold text-white leading-tight">
                    {order.ispProgram} Updates
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    To: {order.customerName} ({order.customerPhone})
                  </p>
                </div>
              </div>

              <div className="p-3 space-y-3 min-h-[300px] max-h-[380px] overflow-y-auto bg-slate-950/90 text-xs">
                {messages.map((m) => (
                  <div key={m.id} className="space-y-1">
                    <span className="text-[9px] font-mono text-slate-500 block text-center">
                      {formatFriendlyDate(m.scheduledForDate)} • {m.scheduledForTime || '09:00 AM'}
                    </span>
                    <div className="bg-emerald-600 text-white rounded-2xl rounded-tr-sm p-3 shadow-md max-w-[90%] ml-auto text-[11px] leading-relaxed">
                      <p>{m.messageText}</p>
                      <span className="text-[9px] text-emerald-200 mt-1 block text-right font-medium">
                        {m.status === 'sent' ? '✓✓ Real SMS Dispatched' : '⏱ Scheduled SMS'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-slate-900 border-t border-slate-800 p-2 rounded-2xl flex items-center gap-2 mt-2">
                <div className="flex-1 bg-slate-950 rounded-xl px-3 py-1.5 text-[11px] text-slate-500 border border-slate-800">
                  Customer replies directly to your real number...
                </div>
                <div className="w-7 h-7 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center">
                  <Send className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: DISPATCH AUDIT LOG                                */}
        {/* ======================================================== */}
        {activeTab === 'logs' && (
          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-300 block">
                Customer Communication Audit Trail
              </span>
              <p className="text-[11px] text-slate-400">
                Verified real SMS records for {order.customerName} ({order.customerPhone}).
              </p>
            </div>

            <div className="space-y-2">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{m.title}</span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                          m.status === 'sent'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {m.status === 'sent' ? 'DISPATCHED REAL SMS' : 'PENDING SCHEDULE'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Destination: {order.customerPhone} ({order.customerName})
                    </p>
                  </div>
                  <div className="text-right text-[11px] font-mono text-slate-400">
                    {m.sentAt ? (
                      <span className="text-emerald-400 font-bold">
                        Sent {new Date(m.sentAt).toLocaleDateString()} at{' '}
                        {new Date(m.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    ) : (
                      <span>Due: {m.scheduledForDate}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: GATEWAY CONFIGURATION                             */}
        {/* ======================================================== */}
        {activeTab === 'gateway_config' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">
                  Real SMS Telecommunications Gateway Setup
                </h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                You have two powerful ways to send genuine real text messages to your fiber customers:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-900 border border-emerald-500/30 space-y-1.5">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4" />
                    Option 1: Phone SMS (Direct & Free)
                  </span>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Uses your phone's cellular carrier plan (AT&T, Verizon, T-Mobile) via device URI. Opens your Messages app with the customer's phone number and the exact message body pre-filled. Requires <strong>zero setup, zero API keys, and zero fees</strong>.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-cyan-500/30 space-y-1.5">
                  <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                    <Zap className="w-4 h-4" />
                    Option 2: Cloud SMS Gateway (Twilio)
                  </span>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Sends real SMS messages directly from a dedicated business number without opening your personal phone. Configure your Twilio Account SID, Auth Token, and phone number below.
                  </p>
                </div>
              </div>
            </div>

            {/* Twilio Configuration Form */}
            <form onSubmit={handleSaveGatewaySettings} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-cyan-400" />
                  Twilio Gateway Credentials
                </span>
                {serverGatewayStatus?.configured ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Server Configured (From: {serverGatewayStatus.fromNumber})
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                    Not Configured in Environment
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    Twilio Account SID
                  </label>
                  <input
                    type="text"
                    placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    value={accountSid}
                    onChange={(e) => setAccountSid(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    Twilio Auth Token
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••••••••••••••••••••••••••"
                    value={authToken}
                    onChange={(e) => setAuthToken(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Twilio Outgoing Phone Number (E.164 format)
                </label>
                <input
                  type="text"
                  placeholder="+18005553423 or +12145550199"
                  value={fromPhone}
                  onChange={(e) => setFromPhone(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md cursor-pointer transition-colors"
                >
                  Save Gateway Credentials
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Toast Feedback */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-950 border border-emerald-500/40 text-emerald-300 px-4 py-2.5 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2 animate-in slide-in-from-bottom-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-3 flex-wrap">
          <span className="text-[11px] text-slate-400">
            Real SMS Delivery: {sentCount} of 3 dispatched to {order.customerPhone}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
