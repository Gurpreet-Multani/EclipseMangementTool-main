import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { InternalMessage, UserRole } from '../types';
import {
  X,
  Send,
  MessageSquare,
  Radio,
  Bell,
  Users,
  User,
  Zap,
  Check,
  CheckCheck,
  Filter,
  Sparkles,
  AlertTriangle,
  Clock,
  ArrowRight,
  Shield,
  Search,
  Plus,
  RefreshCw,
  MapPin,
  ChevronRight
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface InternalMessagingModalProps {
  onClose: () => void;
  initialBlitzId?: string;
  initialRecipientId?: string;
  initialMessageId?: string;
}

export const InternalMessagingModal: React.FC<InternalMessagingModalProps> = ({
  onClose,
  initialBlitzId,
  initialRecipientId,
  initialMessageId,
}) => {
  const { currentUser, allUsers, isAdmin, isManager, isRepresentative, canManageTeam } = useAuth();
  const { messages, blitzes, sendInternalMessage, sendBlitzBroadcast, markMessageAsRead } = useData();

  const canBroadcast = isAdmin || isManager || canManageTeam;

  // Tabs: 'inbox' or 'compose' or 'direct_chat'
  const [activeTab, setActiveTab] = useState<'inbox' | 'compose' | 'direct_chat'>(
    initialRecipientId ? 'direct_chat' : initialBlitzId ? 'compose' : 'inbox'
  );

  // Inbox filter: 'all' | 'blitz' | 'direct' | 'push'
  const [filterType, setFilterType] = useState<'all' | 'blitz' | 'direct' | 'push'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<InternalMessage | null>(() => {
    if (initialMessageId) {
      return messages.find((m) => m.id === initialMessageId) || null;
    }
    return null;
  });
  
  // For direct conversations
  const [selectedConversationId, setSelectedConversationId] = useState<string>(
    initialRecipientId || ''
  );

  // Compose Form State
  const [recipientType, setRecipientType] = useState<'blitz_broadcast' | 'direct' | 'company_broadcast'>(
    initialBlitzId ? 'blitz_broadcast' : initialRecipientId ? 'direct' : 'blitz_broadcast'
  );
  const [selectedBlitzId, setSelectedBlitzId] = useState<string>(
    initialBlitzId || (blitzes[0]?.id || '')
  );
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>(
    initialRecipientId || ''
  );
  const [messageTitle, setMessageTitle] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [isPushAlert, setIsPushAlert] = useState(true);
  const [priority, setPriority] = useState<'normal' | 'urgent' | 'blitz_dispatch'>('blitz_dispatch');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  // Quick Reply State for Reps
  const [replyText, setReplyText] = useState('');

  // Reps list for direct messaging
  const availableRecipients = useMemo(() => {
    if (!currentUser) return [];
    return allUsers.filter((u) => u.id !== currentUser.id);
  }, [allUsers, currentUser]);

  // Get all direct conversations for current user
  const directConversations = useMemo(() => {
    if (!currentUser) return [];
    
    const conversationMap = new Map<string, { userId: string; userName: string; lastMessage: InternalMessage }>();
    
    messages.forEach((msg) => {
      if (msg.recipientType !== 'direct') return;

      const isParticipant =
        msg.senderId === currentUser.id || msg.recipientId === currentUser.id;
      if (!isParticipant) return;

      const otherUserId = msg.senderId === currentUser.id ? msg.recipientId : msg.senderId;
      const knownUser = allUsers.find((u) => u.id === otherUserId);
      const fallbackName = msg.senderId === currentUser.id ? msg.recipientName : msg.senderName;
      const otherUserName = knownUser?.displayName || fallbackName || 'Unknown';

      if (!conversationMap.has(otherUserId) ||
          new Date(msg.createdAt) > new Date(conversationMap.get(otherUserId)!.lastMessage.createdAt)) {
        conversationMap.set(otherUserId, {
          userId: otherUserId,
          userName: otherUserName,
          lastMessage: msg,
        });
      }
    });
    
    return Array.from(conversationMap.values()).sort(
      (a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
    );
  }, [messages, currentUser, allUsers]);

  // Get all messages in selected conversation
  const conversationMessages = useMemo(() => {
    if (!currentUser || !selectedConversationId) return [];
    
    return messages
      .filter((msg) => {
        if (msg.recipientType !== 'direct') return false;
        return (msg.senderId === currentUser.id && msg.recipientId === selectedConversationId) ||
               (msg.senderId === selectedConversationId && msg.recipientId === currentUser.id);
      })
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [messages, currentUser, selectedConversationId]);

  // Quick dispatch templates for managers
  const dispatchTemplates = [
    {
      label: '🚨 Turf Node Live',
      title: '🚨 TURF DISPATCH: Main Fiber Node Live!',
      content:
        'All fiber splitters and terminals are verified green! Technicians are staging in the sector. Knocking starts at 9:00 AM sharp. Focus on the 1 Gig & 2 Gig symmetrical upload promotions today!',
      priority: 'blitz_dispatch' as const,
      isPush: true,
    },
    {
      label: '🚐 Morning Rally & Shuttles',
      title: '🚐 Morning Team Rally & Van Shuttles',
      content:
        'Morning team huddle in the hotel lobby at 8:15 AM for route packet handoffs, turf maps, and badge checks. Vans depart at 8:30 AM to staging zone alpha.',
      priority: 'normal' as const,
      isPush: true,
    },
    {
      label: '⚡ Quota Surge Bonus',
      title: '⚡ MIDDAY ACCELERATOR: $50/Install Surge Bonus Active!',
      content:
        'Regional management has unlocked an additional $50 instant cash bonus per installed fiber order submitted between 2 PM and 7 PM today. Let’s finish strong!',
      priority: 'urgent' as const,
      isPush: true,
    },
    {
      label: '🌧️ Weather / Turf Notice',
      title: '⚠️ Weather Notice: Rain Protocol in Effect',
      content:
        'Rain showers entering the quadrant. Reps may knock covered porches and scheduled callbacks. Stay warm and maintain safety standards.',
      priority: 'normal' as const,
      isPush: false,
    },
  ];

  const handleApplyTemplate = (tmpl: typeof dispatchTemplates[0]) => {
    setMessageTitle(tmpl.title);
    setMessageContent(tmpl.content);
    setPriority(tmpl.priority);
    setIsPushAlert(tmpl.isPush);
  };

  // Filter messages for current user
  const visibleMessages = useMemo(() => {
    return messages.filter((m) => {
      // Direct messages only show to sender or recipient
      if (m.recipientType === 'direct') {
        const isParticipant =
          m.senderId === currentUser?.id || m.recipientId === currentUser?.id;
        if (!isParticipant && !isAdmin) return false;

        // Keep inbox clean: direct chats are handled in the dedicated Direct tab.
        if (filterType === 'all') return false;
      }

      // Filter by tab category
      if (filterType === 'blitz' && m.recipientType !== 'blitz_broadcast') return false;
      if (filterType === 'direct' && m.recipientType !== 'direct') return false;
      if (filterType === 'push' && !m.isPushAlert) return false;

      // Filter by search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = m.title.toLowerCase().includes(q);
        const matchesContent = m.content.toLowerCase().includes(q);
        const matchesSender = m.senderName.toLowerCase().includes(q);
        const matchesBlitz = m.blitzTitle?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesContent && !matchesSender && !matchesBlitz) return false;
      }

      return true;
    });
  }, [messages, currentUser, isAdmin, filterType, searchQuery]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!messageTitle.trim() || !messageContent.trim()) {
      alert('Please enter both a title and message content.');
      return;
    }

    setIsSending(true);

    try {
      if (recipientType === 'blitz_broadcast') {
        await sendBlitzBroadcast(selectedBlitzId, messageTitle, messageContent, priority, isPushAlert);
      } else if (recipientType === 'direct') {
        const recipientUser = allUsers.find((u) => u.id === selectedRecipientId);
        await sendInternalMessage({
          senderId: currentUser.id,
          senderName: currentUser.displayName,
          senderRole: currentUser.role,
          senderBadgePhoto: currentUser.badgePhotoUrl,
          recipientType: 'direct',
          recipientId: selectedRecipientId,
          recipientName: recipientUser ? recipientUser.displayName : 'Representative',
          title: messageTitle,
          content: messageContent,
          isPushAlert,
          priority,
        });
      } else {
        // Company broadcast
        await sendInternalMessage({
          senderId: currentUser.id,
          senderName: currentUser.displayName,
          senderRole: currentUser.role,
          senderBadgePhoto: currentUser.badgePhotoUrl,
          recipientType: 'company_broadcast',
          recipientId: 'all',
          title: messageTitle,
          content: messageContent,
          isPushAlert,
          priority,
        });
      }

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.5 },
      });

      setSendSuccess(true);
      setTimeout(() => {
        setSendSuccess(false);
        setMessageTitle('');
        setMessageContent('');
        if (recipientType === 'direct') {
          setActiveTab('direct_chat');
          setSelectedConversationId(selectedRecipientId);
        } else {
          setActiveTab('inbox');
        }
      }, 1500);
    } catch (err) {
      console.error(err);
      alert('Failed to send internal dispatch.');
    } finally {
      setIsSending(false);
    }
  };

  const handleSendReply = async () => {
    if (!currentUser || !selectedConversationId || !replyText.trim()) return;

    const recipientUser = allUsers.find((u) => u.id === selectedConversationId);
    await sendInternalMessage({
      senderId: currentUser.id,
      senderName: currentUser.displayName,
      senderRole: currentUser.role,
      senderBadgePhoto: currentUser.badgePhotoUrl,
      recipientType: 'direct',
      recipientId: selectedConversationId,
      recipientName: recipientUser?.displayName || 'User',
      title: `Direct Message`,
      content: replyText.trim(),
      isPushAlert: false,
      priority: 'normal',
    });

    setReplyText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 overflow-x-hidden">
      <div className="w-full max-w-4xl h-[95dvh] sm:h-[92vh] max-h-[860px] bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100 ring-1 ring-slate-800">
        {/* Top Header */}
        <div className="px-3 sm:px-5 py-2.5 sm:py-3.5 bg-slate-950/80 border-b border-slate-800 flex flex-col gap-2.5 shrink-0 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-2.5 sm:gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-1 ring-cyan-400/30">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h2 className="text-sm sm:text-base font-extrabold text-white tracking-tight leading-tight">
                  Blitz Communications & Push Dispatch
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
                  Live Sync
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Direct messages, state blitz turf broadcasts & instant push notifications
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto">
            {/* Tab switch between Inbox, Direct Messages, and Compose */}
            <div className="flex flex-1 lg:flex-none bg-slate-950 p-1 rounded-xl border border-slate-800 flex-wrap gap-1 min-w-0">
              <button
                onClick={() => {
                  setActiveTab('inbox');
                  setSelectedMessage(null);
                }}
                className={`flex-1 sm:flex-none px-2.5 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'inbox'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Inbox</span>
                {visibleMessages.length > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      activeTab === 'inbox' ? 'bg-slate-950/30 text-slate-950' : 'bg-slate-800 text-emerald-400'
                    }`}
                  >
                    {visibleMessages.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  setActiveTab('direct_chat');
                  setSelectedMessage(null);
                }}
                className={`flex-1 sm:flex-none px-2.5 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'direct_chat'
                    ? 'bg-purple-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Direct</span>
                {directConversations.length > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      activeTab === 'direct_chat' ? 'bg-white/20 text-white' : 'bg-slate-800 text-emerald-300'
                    }`}
                  >
                    {directConversations.length}
                  </span>
                )}
              </button>

              {canBroadcast && (
                <button
                  onClick={() => setActiveTab('compose')}
                  className={`flex-1 sm:flex-none px-2.5 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'compose'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Dispatch</span>
                </button>
              )}
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Body */}
        {activeTab === 'direct_chat' ? (
          <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
            {/* Left: Conversation List */}
            <div
              className={`w-full lg:w-[38%] border-r border-slate-800 flex flex-col bg-slate-950/40 ${
                selectedConversationId ? 'hidden lg:flex' : 'flex'
              }`}
            >
              {/* Search Bar */}
              <div className="p-2.5 sm:p-3 border-b border-slate-800/60 bg-slate-950/60 shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Conversation List */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-1">
                {directConversations.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs px-4">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-600 stroke-1" />
                    <p className="font-semibold text-slate-400">No direct messages yet</p>
                    <p className="text-[11px] mt-1 text-slate-500">
                      Start a new conversation to connect with your team.
                    </p>
                  </div>
                ) : (
                  directConversations
                    .filter((conv) => {
                      if (!searchQuery.trim()) return true;
                      const q = searchQuery.toLowerCase();
                      return conv.userName.toLowerCase().includes(q) ||
                             conv.lastMessage.content.toLowerCase().includes(q);
                    })
                    .map((conv) => {
                      const isSelected = selectedConversationId === conv.userId;
                      const isRead = currentUser ? conv.lastMessage.readBy?.includes(currentUser.id) : true;

                      return (
                        <button
                          key={conv.userId}
                          onClick={() => {
                            setSelectedConversationId(conv.userId);
                            if (currentUser && !isRead) {
                              markMessageAsRead(conv.lastMessage.id);
                            }
                          }}
                          className={`w-full text-left p-2.5 sm:p-3 rounded-2xl cursor-pointer transition-all text-xs ${
                            isSelected
                              ? 'bg-purple-950/40 border border-purple-500/40 shadow-sm'
                              : isRead
                              ? 'hover:bg-slate-800/50 bg-slate-900/40 border border-transparent'
                              : 'bg-slate-900/90 hover:bg-slate-800/70 border-l-4 border-emerald-400 shadow-sm'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-emerald-400 font-bold shrink-0">
                              {conv.userName.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-slate-200 truncate">{conv.userName}</p>
                              <p className={`mt-0.5 line-clamp-1 ${
                                !isRead ? 'font-bold text-purple-200' : 'text-slate-400'
                              }`}>
                                {conv.lastMessage.content}
                              </p>
                            </div>
                          </div>
                          <p className="text-[10px] text-slate-500 text-right">
                            {new Date(conv.lastMessage.createdAt).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                        </button>
                      );
                    })
                )}
              </div>
            </div>

            {/* Right: Conversation Thread */}
            <div
              className={`w-full lg:w-[62%] flex-1 flex flex-col bg-slate-900/60 min-w-0 ${
                !selectedConversationId ? 'hidden lg:flex' : 'flex'
              }`}
            >
              {selectedConversationId ? (
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                  {/* Header */}
                  <div className="p-3 sm:p-4 border-b border-slate-800 bg-slate-950/60 flex items-start justify-between gap-3 shrink-0">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSelectedConversationId('')}
                        className="lg:hidden p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white mr-1 text-xs"
                      >
                        ← Back
                      </button>

                      <div className="w-11 h-11 rounded-2xl bg-slate-800 flex items-center justify-center text-emerald-400 font-extrabold text-sm shrink-0">
                        {directConversations
                          .find((c) => c.userId === selectedConversationId)
                          ?.userName.slice(0, 2)
                          .toUpperCase()}
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-white">
                          {directConversations.find((c) => c.userId === selectedConversationId)?.userName}
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Conversation History
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Message Thread */}
                  <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5">
                    {conversationMessages.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-center text-slate-500">
                        <div>
                          <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-600 stroke-1" />
                          <p className="text-xs font-semibold text-slate-400">Start a conversation</p>
                        </div>
                      </div>
                    ) : (
                      conversationMessages.map((msg) => {
                        const isSender = msg.senderId === currentUser?.id;
                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[86%] sm:max-w-[78%] px-3.5 py-2.5 rounded-2xl ${
                                isSender
                                  ? 'bg-emerald-600/80 text-white rounded-br-none'
                                  : 'bg-slate-800 text-slate-200 rounded-bl-none'
                              }`}
                            >
                              <p className="text-xs break-words whitespace-pre-wrap">{msg.content}</p>
                              <p className={`text-[10px] mt-1.5 ${
                                isSender ? 'text-purple-100/60' : 'text-slate-400'
                              }`}>
                                {new Date(msg.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Reply Input */}
                  <div className="p-3 bg-slate-950/90 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                    <input
                      type="text"
                      placeholder="Type your message..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendReply();
                        }
                      }}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 w-full"
                    />
                    <button
                      onClick={handleSendReply}
                      disabled={!replyText.trim()}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-purple-500 text-white font-bold text-xs disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-purple-500/20 w-full sm:w-auto"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
                  <div className="w-14 h-14 rounded-3xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center text-slate-400 mb-3 shadow-inner">
                    <MessageSquare className="w-6 h-6 stroke-1" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-300">Select a Conversation</h4>
                  <p className="text-xs text-slate-500 max-w-sm mt-1">
                    Choose a conversation from the left to view the full message history.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (activeTab === 'inbox' ? (
          <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
            {/* Left: Message Feed List */}
            <div
              className={`w-full lg:w-[38%] border-r border-slate-800 flex flex-col bg-slate-950/40 ${
                selectedMessage ? 'hidden lg:flex' : 'flex'
              }`}
            >
              {/* Filter Tabs & Search */}
              <div className="p-2.5 sm:p-3 border-b border-slate-800 space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search dispatches, reps, blitzes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-xs scrollbar-none">
                  <button
                    onClick={() => setFilterType('all')}
                    className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                      filterType === 'all'
                        ? 'bg-slate-800 text-white font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    All ({messages.length})
                  </button>
                  <button
                    onClick={() => setFilterType('blitz')}
                    className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
                      filterType === 'blitz'
                        ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Radio className="w-3 h-3 text-emerald-400" />
                    <span>Blitz Turf</span>
                  </button>
                  <button
                    onClick={() => setFilterType('push')}
                    className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
                      filterType === 'push'
                        ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Bell className="w-3 h-3 text-rose-400" />
                    <span>Push Alerts</span>
                  </button>
                </div>
              </div>

              {/* Message List */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-1">
                {visibleMessages.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs px-4">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-600 stroke-1" />
                    <p className="font-semibold text-slate-400">No dispatches match filter</p>
                    <p className="text-[11px] mt-1 text-slate-500">
                      Managers can use the Dispatch button above to broadcast turf updates or message reps.
                    </p>
                  </div>
                ) : (
                  visibleMessages.map((msg) => {
                    const isSelected = selectedMessage?.id === msg.id;
                    const isRead = currentUser ? msg.readBy?.includes(currentUser.id) : true;
                    const isUrgent = msg.priority === 'urgent' || msg.priority === 'blitz_dispatch';

                    return (
                      <div
                        key={msg.id}
                        onClick={() => {
                          setSelectedMessage(msg);
                          if (currentUser && !isRead) {
                            markMessageAsRead(msg.id);
                          }
                        }}
                        className={`p-2.5 sm:p-3 rounded-2xl cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-cyan-950/40 border border-cyan-500/40 shadow-sm'
                            : isRead
                            ? 'hover:bg-slate-800/50 bg-slate-900/40 border border-transparent'
                            : 'bg-slate-900/90 hover:bg-slate-800/70 border-l-4 border-emerald-400 shadow-sm'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          {msg.senderBadgePhoto ? (
                            <img
                              src={msg.senderBadgePhoto}
                              alt={msg.senderName}
                              className="w-8 h-8 rounded-xl object-cover ring-1 ring-slate-700 shrink-0 mt-0.5"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400 font-bold text-xs shrink-0 mt-0.5">
                              {msg.senderName.slice(0, 2).toUpperCase()}
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-bold text-slate-200 truncate">
                                {msg.senderName}
                              </span>
                              <span className="text-[10px] text-slate-500 shrink-0">
                                {new Date(msg.createdAt).toLocaleDateString([], {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-semibold">
                                {msg.senderRole}
                              </span>

                              {msg.recipientType === 'blitz_broadcast' && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-bold flex items-center gap-1">
                                  <Radio className="w-2.5 h-2.5" />
                                  <span>{msg.blitzTitle || 'State Blitz'}</span>
                                </span>
                              )}

                              {msg.recipientType === 'direct' && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-600/20 text-emerald-200 font-semibold">
                                  Direct {msg.recipientName ? `• ${msg.recipientName}` : ''}
                                </span>
                              )}

                              {msg.isPushAlert && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-bold flex items-center gap-0.5">
                                  <Bell className="w-2.5 h-2.5" />
                                  Push
                                </span>
                              )}
                            </div>

                            <p
                              className={`text-xs mt-1.5 truncate ${
                                !isRead ? 'font-bold text-emerald-200' : 'font-semibold text-slate-300'
                              }`}
                            >
                              {msg.title}
                            </p>
                            <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                              {msg.content}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right: Message Detail View */}
            <div
              className={`w-full lg:w-[62%] flex-1 flex flex-col bg-slate-900/60 min-w-0 ${
                !selectedMessage ? 'hidden lg:flex' : 'flex'
              }`}
            >
              {selectedMessage ? (
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                  {/* Detail Header */}
                  <div className="p-3 sm:p-4 border-b border-slate-800 bg-slate-950/60 flex flex-col gap-2.5 sm:gap-3 shrink-0">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSelectedMessage(null)}
                        className="lg:hidden p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white mr-1 text-xs"
                      >
                        ← Back
                      </button>

                      {selectedMessage.senderBadgePhoto ? (
                        <img
                          src={selectedMessage.senderBadgePhoto}
                          alt={selectedMessage.senderName}
                          className="w-11 h-11 rounded-2xl object-cover ring-2 ring-emerald-500/30 shrink-0"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-2xl bg-slate-800 flex items-center justify-center text-emerald-400 font-extrabold text-sm shrink-0">
                          {selectedMessage.senderName.slice(0, 2).toUpperCase()}
                        </div>
                      )}

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-white">
                            {selectedMessage.senderName}
                          </h3>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              selectedMessage.senderRole === 'Admin'
                                ? 'bg-amber-400/20 text-amber-400'
                                : selectedMessage.senderRole === 'Manager'
                                ? 'bg-emerald-400/20 text-emerald-400'
                                : 'bg-cyan-400/20 text-emerald-400'
                            }`}
                          >
                            {selectedMessage.senderRole}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 flex flex-wrap items-center gap-1.5 mt-0.5">
                          <span>
                            {new Date(selectedMessage.createdAt).toLocaleString([], {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <span>•</span>
                          <span className="capitalize">{selectedMessage.priority.replace('_', ' ')} Priority</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 pl-0 sm:pl-14">
                      {selectedMessage.isPushAlert && (
                        <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-500/20 text-rose-300 text-[10px] font-bold border border-rose-500/30">
                          <Bell className="w-3 h-3 text-rose-400" />
                          <span>Push Alert Sent</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Dispatch Content */}
                  <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-3.5">
                    {/* Meta info card */}
                    <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        {selectedMessage.recipientType === 'blitz_broadcast' ? (
                          <>
                            <Radio className="w-4 h-4 text-emerald-400" />
                            <div className="min-w-0">
                              <span className="text-slate-400">Broadcast Channel: </span>
                              <span className="font-bold text-emerald-300 break-words">
                                {selectedMessage.blitzTitle || 'State Blitz Operations'}
                              </span>
                            </div>
                          </>
                        ) : selectedMessage.recipientType === 'direct' ? (
                          <>
                            <User className="w-4 h-4 text-emerald-400" />
                            <div className="min-w-0">
                              <span className="text-slate-400">Direct Recipient: </span>
                              <span className="font-bold text-emerald-300 break-words">
                                {selectedMessage.recipientName || 'Field Specialist'}
                              </span>
                            </div>
                          </>
                        ) : (
                          <>
                            <Users className="w-4 h-4 text-amber-400" />
                            <div className="min-w-0">
                              <span className="text-slate-400">Target: </span>
                              <span className="font-bold text-amber-300">All Company Personnel</span>
                            </div>
                          </>
                        )}
                      </div>

                      <span className="text-[10px] text-slate-500 font-mono break-all sm:text-right">
                        ID: {selectedMessage.id}
                      </span>
                    </div>

                    {/* Headline */}
                    <div>
                      <h4 className="text-base font-extrabold text-white leading-snug">
                        {selectedMessage.title}
                      </h4>
                    </div>

                    {/* Message Body */}
                    <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800/80 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                      {selectedMessage.content}
                    </div>

                    {/* Quick acknowledgement confirmation */}
                    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between pt-2 text-[11px] text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <CheckCheck className="w-4 h-4 text-emerald-400" />
                        <span>Synchronized through Firebase Cloud Node</span>
                      </div>
                      <span>Status: Verified Delivered</span>
                    </div>
                  </div>

                  {/* Bottom Quick Reply Bar for 1-on-1 or Feedback */}
                  <div className="p-3 bg-slate-950/90 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                    <input
                      type="text"
                      placeholder={`Reply directly to ${selectedMessage.senderName}...`}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSendReply();
                      }}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-full"
                    />
                    <button
                      onClick={handleSendReply}
                      disabled={!replyText.trim()}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 w-full sm:w-auto"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Reply</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
                  <div className="w-14 h-14 rounded-3xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center text-slate-400 mb-3 shadow-inner">
                    <MessageSquare className="w-6 h-6 stroke-1" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-300">Select a Dispatch or Message</h4>
                  <p className="text-xs text-slate-500 max-w-sm mt-1">
                    Choose any field broadcast or direct message from the left to read full dispatch instructions or reply to leadership.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Compose View for Managers and Leadership */
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-3.5 sm:p-6 bg-slate-950/40">
            <form onSubmit={handleSendMessage} className="max-w-2xl w-full mx-auto space-y-4 overflow-x-hidden">
              <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <Send className="w-4 h-4 text-emerald-400" />
                    <span>Create Push Notification & Dispatch</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Broadcasting as <strong className="text-emerald-300">{currentUser?.displayName}</strong> ({currentUser?.role})
                  </p>
                </div>

                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 w-fit">
                  Authorized Manager Node
                </span>
              </div>

              {/* Quick Template Shortcuts */}
              <div className="min-w-0">
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  ⚡ Quick Field Dispatch Templates
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {dispatchTemplates.map((tmpl) => (
                    <button
                      key={tmpl.label}
                      type="button"
                      onClick={() => handleApplyTemplate(tmpl)}
                      className="w-full min-w-0 px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700/80 text-[11px] font-medium text-slate-200 hover:text-white transition-colors flex items-center gap-1.5 text-left"
                    >
                      <Sparkles className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span className="block min-w-0 break-words leading-relaxed">{tmpl.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Recipient Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 min-w-0">
                <button
                  type="button"
                  onClick={() => setRecipientType('blitz_broadcast')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    recipientType === 'blitz_broadcast'
                      ? 'bg-cyan-950/40 border-cyan-500 text-white shadow-md'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Radio className="w-4 h-4 mb-1 text-emerald-400" />
                  <div className="text-xs font-bold text-slate-200">State Blitz Broadcast</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">All reps registered in a blitz</div>
                </button>

                <button
                  type="button"
                  onClick={() => setRecipientType('direct')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    recipientType === 'direct'
                      ? 'bg-purple-950/40 border-purple-500 text-white shadow-md'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <User className="w-4 h-4 mb-1 text-emerald-400" />
                  <div className="text-xs font-bold text-slate-200">Direct Message Rep</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Private 1-on-1 manager message</div>
                </button>

                <button
                  type="button"
                  onClick={() => setRecipientType('company_broadcast')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    recipientType === 'company_broadcast'
                      ? 'bg-amber-950/40 border-amber-500 text-white shadow-md'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Users className="w-4 h-4 mb-1 text-amber-400" />
                  <div className="text-xs font-bold text-slate-200">Company-Wide</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Broadcast to all app users</div>
                </button>
              </div>

              {/* Conditional Recipient Dropdown */}
              {recipientType === 'blitz_broadcast' && (
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Select Target State Blitz
                  </label>
                  <select
                    value={selectedBlitzId}
                    onChange={(e) => setSelectedBlitzId(e.target.value)}
                    className="w-full min-w-0 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    {blitzes.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.state} • {b.title} ({b.ispPartner}) - {b.city}, {b.state} [{b.bookedCount} reps enrolled]
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {recipientType === 'direct' && (
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Select Field Representative
                  </label>
                  <select
                    value={selectedRecipientId}
                    onChange={(e) => setSelectedRecipientId(e.target.value)}
                    className="w-full min-w-0 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="">-- Choose Rep to Message --</option>
                    {availableRecipients.map((rep) => (
                      <option key={rep.id} value={rep.id}>
                        {rep.displayName} ({rep.title || rep.role}) {rep.managerName ? `• Squad of ${rep.managerName}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Priority & Push Switch */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Dispatch Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full min-w-0 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="blitz_dispatch">🚨 Blitz Dispatch (Live Turf Action)</option>
                    <option value="urgent">⚡ Urgent Priority (Time Sensitive)</option>
                    <option value="normal">💬 Normal (General Information)</option>
                  </select>
                </div>

                <div className="flex flex-col justify-end">
                  <div
                    onClick={() => setIsPushAlert(!isPushAlert)}
                    className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                      isPushAlert
                        ? 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Bell className={`w-4 h-4 ${isPushAlert ? 'text-rose-400' : 'text-slate-500'}`} />
                      <div>
                        <div className="text-xs font-bold">Push Notification Toast</div>
                        <div className="text-[10px] text-slate-400">Drops iOS push banner on screens</div>
                      </div>
                    </div>
                    <div
                      className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                        isPushAlert ? 'bg-rose-500' : 'bg-slate-700'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition-transform ${
                          isPushAlert ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Title & Body */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Dispatch Headline / Subject
                </label>
                <input
                  type="text"
                  placeholder="e.g. 🚨 North Fort Worth Node Live - Shuttles Rolling Out"
                  value={messageTitle}
                  onChange={(e) => setMessageTitle(e.target.value)}
                  className="w-full min-w-0 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Dispatch Instructions & Field Notes
                </label>
                <textarea
                  rows={5}
                  placeholder="Provide precise details: energized addresses, staging meeting points, van departure times, carrier technician dispatch contacts..."
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500 leading-relaxed"
                ></textarea>
              </div>

              {/* Send Button */}
              <div className="pt-2 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={() => setActiveTab('inbox')}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-colors w-full sm:w-auto"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSending || sendSuccess || (recipientType === 'direct' && !selectedRecipientId)}
                  className="px-4 sm:px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-extrabold text-[11px] sm:text-xs shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 w-full sm:w-auto"
                >
                  {sendSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-slate-950 stroke-[3px]" />
                      <span>Dispatch Broadcasted!</span>
                    </>
                  ) : isSending ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Transmitting to Cloud...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 text-slate-950" />
                      <span>
                        {isPushAlert ? 'Send & Trigger Push Notification' : 'Broadcast Dispatch'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
};
