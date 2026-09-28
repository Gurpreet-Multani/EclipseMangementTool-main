import React, { createContext, useContext, useState, useEffect } from 'react';
import { BlitzBooking, BlitzEvent, BlitzJoinRequest, BlitzNotification, Course, CourseSubmission, InternalMessage, RepAvailabilitySlot, SaleOrder, CourseAssignmentRecord } from '../types';
import { INITIAL_AVAILABILITY, INITIAL_BLITZES, INITIAL_COURSES, INITIAL_JOIN_REQUESTS, INITIAL_MESSAGES, INITIAL_NOTIFICATIONS, INITIAL_SALES } from '../lib/seedData';
import { useAuth } from './AuthContext';
import { db } from '../lib/firebase';
import { collection, doc, setDoc, onSnapshot, updateDoc, deleteDoc } from 'firebase/firestore';

interface DataContextType {
  sales: SaleOrder[];
  blitzes: BlitzEvent[];
  courses: Course[];
  submissions: CourseSubmission[];
  notifications: BlitzNotification[];
  messages: InternalMessage[];
  joinRequests: BlitzJoinRequest[];
  repAvailability: RepAvailabilitySlot[];
  activePushToast: InternalMessage | null;
  dismissPushToast: () => void;
  addSaleOrder: (order: Omit<SaleOrder, 'id' | 'orderNumber' | 'createdAt'>) => Promise<SaleOrder>;
  updateSaleStatus: (orderId: string, newStatus: SaleOrder['status'], notes?: string) => Promise<boolean>;
  deleteSaleOrder: (orderId: string) => Promise<boolean>;
  bookBlitz: (blitzId: string, travelNotes?: string, roommate?: string) => Promise<{ success: boolean; message: string }>;
  cancelBlitzBooking: (blitzId: string) => Promise<boolean>;
  createNewBlitz: (blitz: Omit<BlitzEvent, 'id' | 'currentSales' | 'installedCount' | 'bookedCount' | 'bookedUserIds'>) => Promise<boolean>;
  submitJoinRequest: (data: {
    blitzId: string;
    requestNotes: string;
    roommatePreference?: string;
    pledgedInstalls?: number;
  }) => Promise<{ success: boolean; message: string }>;
  reviewJoinRequest: (requestId: string, status: 'approved' | 'rejected', reviewNotes?: string) => Promise<boolean>;
  setRepAvailabilitySlot: (slot: Omit<RepAvailabilitySlot, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  removeRepAvailabilitySlot: (slotId: string) => Promise<void>;
  getUserJoinRequestForBlitz: (blitzId: string, userId?: string) => BlitzJoinRequest | undefined;
  createCourse: (course: Omit<Course, 'id' | 'enrolledCount' | 'completedCount' | 'createdBy' | 'authorName'>) => Promise<boolean>;
  submitQuiz: (courseId: string, selectedAnswers: Record<string, number>) => Promise<{ score: number; passed: boolean }>;
  submitAssignment: (courseId: string, answerText: string) => Promise<boolean>;
  assignCoursework: (courseId: string, assignedRoles: string[], assignedUserIds: string[], dueDate?: string, priority?: 'low' | 'medium' | 'high' | 'critical', description?: string) => Promise<boolean>;
  reviewCourseSubmission: (submissionId: string, status: 'approved' | 'rejected', feedback?: string, grade?: number) => Promise<boolean>;
  getSubmissionsPendingReview: (courseId: string) => CourseSubmission[];
  getAllSubmissionsPendingReview: () => CourseSubmission[];
  getCompletedSubmissions: (courseId?: string) => CourseSubmission[];
  addCommentToSubmission: (submissionId: string, commentText: string) => Promise<boolean>;
  markNotificationRead: (notifId: string) => void;
  clearAllNotifications: () => void;
  // Internal Messaging & Push Broadcast Functions
  sendInternalMessage: (msgData: Omit<InternalMessage, 'id' | 'createdAt' | 'readBy'>) => Promise<InternalMessage>;
  sendBlitzBroadcast: (
    blitzId: string,
    title: string,
    content: string,
    priority: 'normal' | 'urgent' | 'blitz_dispatch',
    isPushAlert: boolean
  ) => Promise<void>;
  markMessageAsRead: (messageId: string) => Promise<void>;
  // Calculated filters & metrics
  filteredSales: (repId?: string, managerId?: string, isp?: string, state?: string, status?: string) => SaleOrder[];
  getRepStats: (repId: string) => {
    installs: number;
    cancels: number;
    scheduled: number;
    chargebacks: number;
    totalSales: number;
    installRate: number;
    cancelRate: number;
    totalCommission: number;
  };
  getTeamStats: (managerId: string) => {
    teamInstalls: number;
    teamCancels: number;
    teamScheduled: number;
    teamChargebacks: number;
    teamTotalSales: number;
    teamInstallRate: number;
    teamCancelRate: number;
    teamTotalCommission: number;
  };
  isUserBookedForBlitz: (blitzId: string, userId?: string) => boolean;
  refreshData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const LOCAL_SALES_KEY = 'eclipse_sales_cache';
const LOCAL_BLITZES_KEY = 'eclipse_blitzes_cache';
const LOCAL_COURSES_KEY = 'eclipse_courses_cache';
const LOCAL_SUBMISSIONS_KEY = 'eclipse_submissions_cache';
const LOCAL_NOTIFS_KEY = 'eclipse_notifs_cache';
const LOCAL_MESSAGES_KEY = 'eclipse_messages_cache';
const LOCAL_JOIN_REQ_KEY = 'eclipse_join_requests_cache';
const LOCAL_AVAIL_KEY = 'eclipse_rep_availability_cache';

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();

  const [sales, setSales] = useState<SaleOrder[]>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_SALES_KEY);
      if (cached) return JSON.parse(cached);
    } catch (e) {
      console.warn(e);
    }
    return INITIAL_SALES;
  });

  const [blitzes, setBlitzes] = useState<BlitzEvent[]>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_BLITZES_KEY);
      if (cached) return JSON.parse(cached);
    } catch (e) {
      console.warn(e);
    }
    return INITIAL_BLITZES;
  });

  const [courses, setCourses] = useState<Course[]>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_COURSES_KEY);
      if (cached) return JSON.parse(cached);
    } catch (e) {
      console.warn(e);
    }
    return INITIAL_COURSES;
  });

  const [submissions, setSubmissions] = useState<CourseSubmission[]>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_SUBMISSIONS_KEY);
      if (cached) return JSON.parse(cached);
    } catch (e) {
      console.warn(e);
    }
    return [
      {
        id: 'sub_1',
        courseId: 'course_blitz_mastery',
        userId: 'user_rep_jordan',
        userName: 'Jordan Hayes',
        quizScore: 100,
        quizPassed: true,
        assignmentAnswer: 'Step 1: Validate - I completely understand, investing in home tech is a joint decision.\nStep 2: Reserve - Let me put down a provisional dispatch hold so you lock in the free ONT installation fee waiver.\nStep 3: Call & Confirm - If your spouse has any question tonight, call my direct cell or we can cancel with zero penalty.',
        assignmentGrade: 98,
        status: 'completed',
        completedAt: '2026-09-21T18:00:00Z',
      }
    ];
  });

  const [notifications, setNotifications] = useState<BlitzNotification[]>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_NOTIFS_KEY);
      if (cached) return JSON.parse(cached);
    } catch (e) {
      console.warn(e);
    }
    return INITIAL_NOTIFICATIONS;
  });

  const [messages, setMessages] = useState<InternalMessage[]>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_MESSAGES_KEY);
      if (cached) return JSON.parse(cached);
    } catch (e) {
      console.warn(e);
    }
    return INITIAL_MESSAGES;
  });

  const [joinRequests, setJoinRequests] = useState<BlitzJoinRequest[]>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_JOIN_REQ_KEY);
      if (cached) return JSON.parse(cached);
    } catch (e) {
      console.warn(e);
    }
    return INITIAL_JOIN_REQUESTS;
  });

  const [repAvailability, setRepAvailability] = useState<RepAvailabilitySlot[]>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_AVAIL_KEY);
      if (cached) return JSON.parse(cached);
    } catch (e) {
      console.warn(e);
    }
    return INITIAL_AVAILABILITY;
  });

  const [activePushToast, setActivePushToast] = useState<InternalMessage | null>(null);

  // Sync to Local Storage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_SALES_KEY, JSON.stringify(sales));
      localStorage.setItem(LOCAL_BLITZES_KEY, JSON.stringify(blitzes));
      localStorage.setItem(LOCAL_COURSES_KEY, JSON.stringify(courses));
      localStorage.setItem(LOCAL_SUBMISSIONS_KEY, JSON.stringify(submissions));
      localStorage.setItem(LOCAL_NOTIFS_KEY, JSON.stringify(notifications));
      localStorage.setItem(LOCAL_MESSAGES_KEY, JSON.stringify(messages));
      localStorage.setItem(LOCAL_JOIN_REQ_KEY, JSON.stringify(joinRequests));
      localStorage.setItem(LOCAL_AVAIL_KEY, JSON.stringify(repAvailability));
    } catch (e) {
      console.error(e);
    }
  }, [sales, blitzes, courses, submissions, notifications, messages, joinRequests, repAvailability]);

  // Firestore Real-time Subscriptions (attach only when user is authenticated)
  useEffect(() => {
    if (!currentUser) return;

    let unsubSales: (() => void) | undefined;
    let unsubBlitzes: (() => void) | undefined;
    let unsubMessages: (() => void) | undefined;

    try {
      const salesCol = collection(db, 'sales');
      unsubSales = onSnapshot(salesCol, (snapshot) => {
        if (!snapshot.empty) {
          const list: SaleOrder[] = [];
          snapshot.forEach((d) => list.push(d.data() as SaleOrder));
          if (list.length > 0) {
            setSales(list);
          }
        } else {
          INITIAL_SALES.forEach(async (sale) => {
            await setDoc(doc(db, 'sales', sale.id), sale);
          });
        }
      }, (err) => {
        console.warn('Firestore sales sync notice (using local state):', err);
      });

      const blitzesCol = collection(db, 'blitzes');
      unsubBlitzes = onSnapshot(blitzesCol, (snapshot) => {
        if (!snapshot.empty) {
          const bList: BlitzEvent[] = [];
          snapshot.forEach((d) => bList.push(d.data() as BlitzEvent));
          if (bList.length > 0) {
            setBlitzes(bList);
          }
        } else {
          INITIAL_BLITZES.forEach(async (b) => {
            await setDoc(doc(db, 'blitzes', b.id), b);
          });
        }
      }, (err) => {
        console.warn('Firestore blitzes sync notice (using local state):', err);
      });

      const messagesCol = collection(db, 'messages');
      unsubMessages = onSnapshot(messagesCol, (snapshot) => {
        if (!snapshot.empty) {
          const mList: InternalMessage[] = [];
          snapshot.forEach((d) => mList.push(d.data() as InternalMessage));
          if (mList.length > 0) {
            // Sort by createdAt descending
            mList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setMessages(mList);
          }
        } else {
          INITIAL_MESSAGES.forEach(async (m) => {
            await setDoc(doc(db, 'messages', m.id), m);
          });
        }
      }, (err) => {
        console.warn('Firestore messages sync notice (using local state):', err);
      });
    } catch (e) {
      console.warn('Real-time connection initialized with local resilient layer', e);
    }

    return () => {
      if (unsubSales) unsubSales();
      if (unsubBlitzes) unsubBlitzes();
      if (unsubMessages) unsubMessages();
    };
  }, [currentUser?.id]);

  const refreshData = () => {};

  // Send Direct Message or Broadcast
  const sendInternalMessage = async (
    msgData: Omit<InternalMessage, 'id' | 'createdAt' | 'readBy'>
  ): Promise<InternalMessage> => {
    const newId = `msg_${Date.now()}`;
    const createdAt = new Date().toISOString();

    const newMsg: InternalMessage = {
      ...msgData,
      id: newId,
      createdAt,
      readBy: [],
    };

    setMessages((prev) => [newMsg, ...prev]);

    // If message is marked as push alert, display active push toast
    if (newMsg.isPushAlert) {
      setActivePushToast(newMsg);
    }

    // Also inject into notifications feed
    const notif: BlitzNotification = {
      id: `notif_${Date.now()}`,
      title: `${newMsg.isPushAlert ? '🔔 PUSH ALERT: ' : '💬 '}${newMsg.title}`,
      message: `${newMsg.senderName} (${newMsg.senderRole}): ${newMsg.content.slice(0, 100)}...`,
      type: 'blitz',
      timestamp: createdAt,
      read: false,
      linkTab: 'blitz',
    };
    setNotifications((prev) => [notif, ...prev]);

    try {
      await setDoc(doc(db, 'messages', newId), newMsg);
    } catch (e) {
      console.warn('Firestore message setDoc notice', e);
    }

    return newMsg;
  };

  // Broadcast blitz update to all reps in a state blitz
  const sendBlitzBroadcast = async (
    blitzId: string,
    title: string,
    content: string,
    priority: 'normal' | 'urgent' | 'blitz_dispatch',
    isPushAlert: boolean
  ): Promise<void> => {
    if (!currentUser) return;
    const targetBlitz = blitzes.find((b) => b.id === blitzId);

    await sendInternalMessage({
      senderId: currentUser.id,
      senderName: currentUser.displayName,
      senderRole: currentUser.role,
      senderBadgePhoto: currentUser.badgePhotoUrl,
      recipientType: 'blitz_broadcast',
      recipientId: blitzId,
      blitzId,
      blitzTitle: targetBlitz?.title || 'State Blitz Update',
      title,
      content,
      isPushAlert,
      priority,
    });
  };

  const markMessageAsRead = async (messageId: string): Promise<void> => {
    if (!currentUser) return;

    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === messageId && !m.readBy.includes(currentUser.id)) {
          return {
            ...m,
            readBy: [...m.readBy, currentUser.id],
          };
        }
        return m;
      })
    );

    try {
      const msgRef = doc(db, 'messages', messageId);
      const target = messages.find((m) => m.id === messageId);
      if (target && !target.readBy.includes(currentUser.id)) {
        await updateDoc(msgRef, {
          readBy: [...target.readBy, currentUser.id],
        });
      }
    } catch (e) {
      console.warn('Firestore update message readBy fallback', e);
    }
  };

  const dismissPushToast = () => {
    setActivePushToast(null);
  };

  // Add Sale Order
  const addSaleOrder = async (orderData: Omit<SaleOrder, 'id' | 'orderNumber' | 'createdAt'>): Promise<SaleOrder> => {
    const newId = `sale_${Date.now()}`;
    const orderNumber = `FB-${Math.floor(10000 + Math.random() * 90000)}`;
    const createdAt = new Date().toISOString();

    const newSale: SaleOrder = {
      ...orderData,
      id: newId,
      orderNumber,
      createdAt,
    };

    setSales((prev) => [newSale, ...prev]);

    const newNotif: BlitzNotification = {
      id: `notif_${Date.now()}`,
      title: `New Sale Logged: ${newSale.ispProgram} (${newSale.speedTier})`,
      message: `${newSale.repName} registered an order for ${newSale.customerName} in ${newSale.city}, ${newSale.state}. Status: ${newSale.status.toUpperCase()}`,
      type: 'sale',
      timestamp: createdAt,
      read: false,
      linkTab: 'my-sales',
    };
    setNotifications((prev) => [newNotif, ...prev]);

    if (newSale.blitzId) {
      setBlitzes((prev) =>
        prev.map((b) => {
          if (b.id === newSale.blitzId) {
            return {
              ...b,
              currentSales: b.currentSales + 1,
              installedCount: newSale.status === 'installed' ? b.installedCount + 1 : b.installedCount,
            };
          }
          return b;
        })
      );
    }

    try {
      await setDoc(doc(db, 'sales', newId), newSale);
    } catch (e) {
      console.warn('Firestore sale setDoc fallback', e);
    }

    return newSale;
  };

  const updateSaleStatus = async (orderId: string, newStatus: SaleOrder['status'], notes?: string): Promise<boolean> => {
    let customerName = '';

    setSales((prev) =>
      prev.map((order) => {
        if (order.id === orderId) {
          customerName = order.customerName;
          return {
            ...order,
            status: newStatus,
            notes: notes !== undefined ? notes : order.notes,
          };
        }
        return order;
      })
    );

    if (newStatus === 'installed') {
      const notif: BlitzNotification = {
        id: `notif_${Date.now()}`,
        title: `Installation Verified! ⚡`,
        message: `Customer ${customerName}'s install was confirmed by technician dispatch!`,
        type: 'sale',
        timestamp: new Date().toISOString(),
        read: false,
        linkTab: 'my-sales',
      };
      setNotifications((prev) => [notif, ...prev]);
    }

    try {
      const saleRef = doc(db, 'sales', orderId);
      await updateDoc(saleRef, {
        status: newStatus,
        ...(notes !== undefined ? { notes } : {}),
      });
    } catch (e) {
      console.warn('Firestore updateDoc sale notice', e);
    }

    return true;
  };

  const deleteSaleOrder = async (orderId: string): Promise<boolean> => {
    setSales((prev) => prev.filter((o) => o.id !== orderId));
    try {
      await deleteDoc(doc(db, 'sales', orderId));
    } catch (e) {
      console.warn('Firestore deleteDoc notice', e);
    }
    return true;
  };

  const bookBlitz = async (
    blitzId: string,
    flightNotes?: string,
    roommate?: string
  ): Promise<{ success: boolean; message: string }> => {
    if (!currentUser) return { success: false, message: 'Please sign in first.' };

    const targetBlitz = blitzes.find((b) => b.id === blitzId);
    if (!targetBlitz) return { success: false, message: 'Blitz not found.' };

    if (targetBlitz.bookedUserIds.includes(currentUser.id)) {
      return { success: false, message: 'You are already registered for this state blitz!' };
    }

    if (targetBlitz.bookedCount >= targetBlitz.maxSpots) {
      return { success: false, message: 'This blitz has reached maximum capacity.' };
    }

    setBlitzes((prev) =>
      prev.map((b) => {
        if (b.id === blitzId) {
          return {
            ...b,
            bookedCount: b.bookedCount + 1,
            bookedUserIds: [...b.bookedUserIds, currentUser.id],
          };
        }
        return b;
      })
    );

    const bookingRecord: BlitzBooking = {
      id: `booking_${Date.now()}`,
      blitzId,
      userId: currentUser.id,
      userName: currentUser.displayName,
      userHomeAirport: currentUser.travelProfile?.homeAirport || 'Airport Pending',
      state: targetBlitz.state,
      bookedAt: new Date().toISOString(),
      status: 'confirmed',
      flightNotes,
      roommatePreference: roommate,
    };

    try {
      await setDoc(doc(db, 'blitz_bookings', bookingRecord.id), bookingRecord);
      const bRef = doc(db, 'blitzes', blitzId);
      await updateDoc(bRef, {
        bookedCount: targetBlitz.bookedCount + 1,
        bookedUserIds: [...targetBlitz.bookedUserIds, currentUser.id],
      });
    } catch (e) {
      console.warn('Firestore booking notice', e);
    }

    const notif: BlitzNotification = {
      id: `notif_${Date.now()}`,
      title: `Blitz Booking Confirmed: ${targetBlitz.state} ✈️`,
      message: `${currentUser.displayName} reserved a spot for "${targetBlitz.title}" in ${targetBlitz.city}, ${targetBlitz.state}!`,
      type: 'blitz',
      timestamp: new Date().toISOString(),
      read: false,
      linkTab: 'blitz-booking',
    };
    setNotifications((prev) => [notif, ...prev]);

    return {
      success: true,
      message: `Successfully booked your spot for the ${targetBlitz.state} Blitz in ${targetBlitz.city}!`,
    };
  };

  const cancelBlitzBooking = async (blitzId: string): Promise<boolean> => {
    if (!currentUser) return false;

    setBlitzes((prev) =>
      prev.map((b) => {
        if (b.id === blitzId) {
          return {
            ...b,
            bookedCount: Math.max(0, b.bookedCount - 1),
            bookedUserIds: b.bookedUserIds.filter((id) => id !== currentUser.id),
          };
        }
        return b;
      })
    );

    try {
      const bRef = doc(db, 'blitzes', blitzId);
      const b = blitzes.find((item) => item.id === blitzId);
      if (b) {
        await updateDoc(bRef, {
          bookedCount: Math.max(0, b.bookedCount - 1),
          bookedUserIds: b.bookedUserIds.filter((id) => id !== currentUser.id),
        });
      }
    } catch (e) {
      console.warn('Firestore blitz cancel notice', e);
    }

    return true;
  };

  const createNewBlitz = async (
    blitzData: Omit<BlitzEvent, 'id' | 'currentSales' | 'installedCount' | 'bookedCount' | 'bookedUserIds'>
  ): Promise<boolean> => {
    const newId = `blitz_${Date.now()}`;
    const newBlitz: BlitzEvent = {
      ...blitzData,
      id: newId,
      currentSales: 0,
      installedCount: 0,
      bookedCount: 0,
      bookedUserIds: [],
    };

    setBlitzes((prev) => [newBlitz, ...prev]);

    try {
      await setDoc(doc(db, 'blitzes', newId), newBlitz);
    } catch (e) {
      console.warn('Firestore create blitz notice', e);
    }

    const notif: BlitzNotification = {
      id: `notif_${Date.now()}`,
      title: `New State Blitz Announced! 📍`,
      message: `"${newBlitz.title}" in ${newBlitz.city}, ${newBlitz.state} (${newBlitz.ispPartner}) is now open for bookings!`,
      type: 'blitz',
      timestamp: new Date().toISOString(),
      read: false,
      linkTab: 'blitz-booking',
    };
    setNotifications((prev) => [notif, ...prev]);

    return true;
  };

  const submitJoinRequest = async (data: {
    blitzId: string;
    requestNotes: string;
    roommatePreference?: string;
    pledgedInstalls?: number;
  }): Promise<{ success: boolean; message: string }> => {
    if (!currentUser) return { success: false, message: 'Please sign in first.' };
    const targetBlitz = blitzes.find((b) => b.id === data.blitzId);
    if (!targetBlitz) return { success: false, message: 'Blitz not found.' };

    if (targetBlitz.bookedUserIds.includes(currentUser.id)) {
      return { success: false, message: 'You are already confirmed and registered for this blitz!' };
    }

    const existingPending = joinRequests.find(
      (r) => r.blitzId === data.blitzId && r.userId === currentUser.id && r.status === 'pending'
    );
    if (existingPending) {
      return { success: false, message: 'You already have an active pending request for this blitz.' };
    }

    const newReq: BlitzJoinRequest = {
      id: `req_${Date.now()}`,
      blitzId: targetBlitz.id,
      blitzTitle: targetBlitz.title,
      blitzState: targetBlitz.state,
      blitzCity: targetBlitz.city,
      blitzDates: `${targetBlitz.startDate} to ${targetBlitz.endDate}`,
      userId: currentUser.id,
      userName: currentUser.displayName,
      userEmail: currentUser.email,
      userRole: currentUser.role,
      userHomeAirport: currentUser.travelProfile?.homeAirport || 'Home Airport Pending',
      requestNotes: data.requestNotes,
      roommatePreference: data.roommatePreference,
      pledgedInstalls: data.pledgedInstalls || 25,
      status: 'pending',
      submittedAt: new Date().toISOString(),
    };

    setJoinRequests((prev) => [newReq, ...prev]);

    // Send notification
    const notif: BlitzNotification = {
      id: `notif_${Date.now()}`,
      title: `Blitz Join Request Submitted: ${targetBlitz.state} 📋`,
      message: `${currentUser.displayName} submitted a request to join "${targetBlitz.title}" in ${targetBlitz.city}, ${targetBlitz.state}.`,
      type: 'blitz',
      timestamp: new Date().toISOString(),
      read: false,
      linkTab: 'blitz',
    };
    setNotifications((prev) => [notif, ...prev]);

    return {
      success: true,
      message: `Your request to join "${targetBlitz.title}" was submitted to coordinators for approval!`,
    };
  };

  const reviewJoinRequest = async (
    requestId: string,
    status: 'approved' | 'rejected',
    reviewNotes?: string
  ): Promise<boolean> => {
    if (!currentUser) return false;

    let targetReq: BlitzJoinRequest | undefined;

    setJoinRequests((prev) =>
      prev.map((r) => {
        if (r.id === requestId) {
          targetReq = {
            ...r,
            status,
            reviewedBy: currentUser.displayName,
            reviewedAt: new Date().toISOString(),
            reviewNotes,
          };
          return targetReq;
        }
        return r;
      })
    );

    if (targetReq) {
      if (status === 'approved') {
        // Automatically book rep into blitz
        setBlitzes((prev) =>
          prev.map((b) => {
            if (b.id === targetReq!.blitzId && !b.bookedUserIds.includes(targetReq!.userId)) {
              return {
                ...b,
                bookedCount: b.bookedCount + 1,
                bookedUserIds: [...b.bookedUserIds, targetReq!.userId],
              };
            }
            return b;
          })
        );

        const notif: BlitzNotification = {
          id: `notif_${Date.now()}`,
          userId: targetReq.userId,
          title: `Blitz Request Approved! 🚀`,
          message: `Your request to join "${targetReq.blitzTitle}" (${targetReq.blitzState}) was approved by ${currentUser.displayName}! Check your calendar for deployment details.`,
          type: 'blitz',
          timestamp: new Date().toISOString(),
          read: false,
          linkTab: 'blitz',
        };
        setNotifications((prev) => [notif, ...prev]);
      } else {
        const notif: BlitzNotification = {
          id: `notif_${Date.now()}`,
          userId: targetReq.userId,
          title: `Blitz Request Update`,
          message: `Your request to join "${targetReq.blitzTitle}" was reviewed. ${reviewNotes ? `Notes: ${reviewNotes}` : 'Capacity reached or conflict noted.'}`,
          type: 'blitz',
          timestamp: new Date().toISOString(),
          read: false,
          linkTab: 'blitz',
        };
        setNotifications((prev) => [notif, ...prev]);
      }
    }

    return true;
  };

  const setRepAvailabilitySlot = async (
    slot: Omit<RepAvailabilitySlot, 'id' | 'userId' | 'createdAt'>
  ): Promise<void> => {
    if (!currentUser) return;
    const newSlot: RepAvailabilitySlot = {
      ...slot,
      id: `avail_${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.displayName,
      createdAt: new Date().toISOString(),
    };
    setRepAvailability((prev) => [newSlot, ...prev]);
  };

  const removeRepAvailabilitySlot = async (slotId: string): Promise<void> => {
    setRepAvailability((prev) => prev.filter((s) => s.id !== slotId));
  };

  const getUserJoinRequestForBlitz = (blitzId: string, userId?: string) => {
    const uId = userId || currentUser?.id;
    if (!uId) return undefined;
    return joinRequests.find((r) => r.blitzId === blitzId && r.userId === uId);
  };

  const createCourse = async (
    courseData: Omit<Course, 'id' | 'enrolledCount' | 'completedCount' | 'createdBy' | 'authorName'>
  ): Promise<boolean> => {
    if (!currentUser) return false;
    const newId = `course_${Date.now()}`;
    const newCourse: Course = {
      ...courseData,
      id: newId,
      createdBy: currentUser.id,
      authorName: `${currentUser.displayName} (${currentUser.title || currentUser.role})`,
      enrolledCount: 1,
      completedCount: 0,
    };

    setCourses((prev) => [newCourse, ...prev]);

    try {
      await setDoc(doc(db, 'courses', newId), newCourse);
    } catch (e) {
      console.warn('Firestore create course notice', e);
    }

    const notif: BlitzNotification = {
      id: `notif_${Date.now()}`,
      title: `New Course Published: ${newCourse.title} 🎓`,
      message: `Complete this training module to earn your "${newCourse.badgeTitle}" credential.`,
      type: 'course',
      timestamp: new Date().toISOString(),
      read: false,
      linkTab: 'training',
    };
    setNotifications((prev) => [notif, ...prev]);

    return true;
  };

  const submitQuiz = async (
    courseId: string,
    selectedAnswers: Record<string, number>
  ): Promise<{ score: number; passed: boolean }> => {
    if (!currentUser) return { score: 0, passed: false };
    const course = courses.find((c) => c.id === courseId);
    if (!course || !course.quiz || course.quiz.length === 0) return { score: 100, passed: true };

    let correctCount = 0;
    const reviewRequiredQuestions = course.quiz.filter((q) => q.questionType === 'review_required');
    
    course.quiz.forEach((q) => {
      if (q.questionType === 'multiple_choice' && selectedAnswers[q.id] === q.correctAnswerIndex) {
        correctCount++;
      }
    });

    const score = course.quiz.filter((q) => q.questionType === 'multiple_choice').length > 0
      ? Math.round((correctCount / course.quiz.filter((q) => q.questionType === 'multiple_choice').length) * 100)
      : 100;
    const passed = score >= 70;
    
    // Check if there are review-required questions or course requires submission review
    const requiresReview = reviewRequiredQuestions.length > 0 || course.requiresSubmissionReview === true;

    const subId = `sub_${courseId}_${currentUser.id}`;
    const newSub: CourseSubmission = {
      id: subId,
      courseId,
      userId: currentUser.id,
      userName: currentUser.displayName,
      quizScore: score,
      quizPassed: passed && !requiresReview,
      status: requiresReview ? 'pending_review' : passed ? 'completed' : 'in_progress',
      completedAt: !requiresReview && passed ? new Date().toISOString() : undefined,
      requiresOwnerReview: requiresReview,
      allReviewsApproved: false,
    };

    setSubmissions((prev) => {
      const filtered = prev.filter((s) => s.courseId !== courseId || s.userId !== currentUser.id);
      return [...filtered, newSub];
    });

    try {
      await setDoc(doc(db, 'course_submissions', subId), newSub);
    } catch (e) {
      console.warn('Firestore quiz submit notice', e);
    }

    if (passed && !requiresReview) {
      const notif: BlitzNotification = {
        id: `notif_${Date.now()}`,
        title: `Course Certification Earned! 🏆`,
        message: `Congratulations! You scored ${score}% on "${course.title}".`,
        type: 'course',
        timestamp: new Date().toISOString(),
        read: false,
        linkTab: 'training',
      };
      setNotifications((prev) => [notif, ...prev]);
    } else if (requiresReview) {
      const notif: BlitzNotification = {
        id: `notif_${Date.now()}`,
        title: `Submission Pending Review ⏳`,
        message: `Your answers for "${course.title}" are awaiting instructor approval.`,
        type: 'course',
        timestamp: new Date().toISOString(),
        read: false,
        linkTab: 'training',
      };
      setNotifications((prev) => [notif, ...prev]);
    }

    return { score, passed: passed && !requiresReview };
  };

  const submitAssignment = async (courseId: string, answerText: string): Promise<boolean> => {
    if (!currentUser) return false;
    const course = courses.find((c) => c.id === courseId);
    const subId = `sub_${courseId}_${currentUser.id}`;

    // Check if course requires review - either by flag OR if it has written questions
    const hasWrittenQuestions = course?.quiz?.some(
      (q) => q.questionType === 'essay' || q.questionType === 'short_answer'
    ) || course?.assignment ? true : false;
    const requiresReview = course?.requiresSubmissionReview === true || hasWrittenQuestions;

    setSubmissions((prev) => {
      const existing = prev.find((s) => s.courseId === courseId && s.userId === currentUser.id);
      const updated: CourseSubmission = {
        id: subId,
        courseId,
        userId: currentUser.id,
        userName: currentUser.displayName,
        quizScore: existing?.quizScore,
        quizPassed: existing?.quizPassed,
        assignmentAnswer: answerText,
        assignmentGrade: requiresReview ? undefined : 95,
        assignmentFeedback: requiresReview ? undefined : 'Reviewed: Great objection handling and clear alternative-of-choice close.',
        status: requiresReview ? 'pending_review' : 'completed',
        completedAt: !requiresReview ? new Date().toISOString() : undefined,
        requiresOwnerReview: requiresReview,
      };
      return [...prev.filter((s) => s.id !== subId), updated];
    });

    return true;
  };

  const assignCoursework = async (
    courseId: string,
    assignedRoles: string[],
    assignedUserIds: string[],
    dueDate?: string,
    priority: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    description: string = ''
  ): Promise<boolean> => {
    if (!currentUser) return false;

    const assignmentRecord: CourseAssignmentRecord = {
      id: `assign_${courseId}_${Date.now()}`,
      courseId,
      assignedByUserId: currentUser.id,
      assignedByName: currentUser.displayName,
      assignedRoles,
      assignedUserIds,
      dueDate,
      priority,
      isRequired: true,
      description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Update the course with the new assignment record
    setCourses((prev) =>
      prev.map((course) => {
        if (course.id === courseId) {
          return {
            ...course,
            assignmentRecords: [...(course.assignmentRecords || []), assignmentRecord],
          };
        }
        return course;
      })
    );

    // Create course submissions for all assigned users
    // Users are either those matching the assigned roles or specifically selected users
    const allUsers = JSON.parse(localStorage.getItem('eclipse_users_cache') || '[]');
    let targetUserIds = [...assignedUserIds];

    if (assignedRoles.length > 0) {
      const usersWithRoles = allUsers.filter((user: any) =>
        assignedRoles.includes(user.role)
      );
      targetUserIds = [...new Set([...targetUserIds, ...usersWithRoles.map((u: any) => u.id)])];
    }

    // Create submissions for each target user
    setSubmissions((prev) => {
      const newSubmissions: CourseSubmission[] = targetUserIds.map((userId) => {
        const existingSubmission = prev.find(
          (s) => s.courseId === courseId && s.userId === userId
        );
        if (existingSubmission) return existingSubmission;

        return {
          id: `sub_${courseId}_${userId}`,
          courseId,
          userId,
          userName: allUsers.find((u: any) => u.id === userId)?.displayName || 'Unknown User',
          status: 'in_progress',
          assignmentId: assignmentRecord.id,
          assignedAt: new Date().toISOString(),
          dueDate,
          isOverdue: dueDate ? new Date(dueDate) < new Date() : false,
        };
      });

      return [...prev, ...newSubmissions];
    });

    return true;
  };

  const reviewCourseSubmission = async (
    submissionId: string,
    status: 'approved' | 'rejected',
    feedback: string = '',
    grade?: number
  ): Promise<boolean> => {
    if (!currentUser) return false;

    setSubmissions((prev) =>
      prev.map((sub) => {
        if (sub.id === submissionId) {
          const course = courses.find((c) => c.id === sub.courseId);
          const passingGrade = course?.passingGrade ?? 70;
          
          // Determine final status based on grade if provided
          let finalStatus: 'completed' | 'rejected' = status === 'approved' ? 'completed' : 'rejected';
          if (grade !== undefined && status === 'approved') {
            finalStatus = grade >= passingGrade ? 'completed' : 'rejected';
          }
          
          return {
            ...sub,
            assignmentGrade: grade ?? sub.assignmentGrade,
            status: finalStatus,
            reviewedByUserId: currentUser.id,
            reviewedByName: currentUser.displayName,
            reviewedAt: new Date().toISOString(),
            reviewFeedback: feedback,
            allReviewsApproved: finalStatus === 'completed',
          };
        }
        return sub;
      })
    );

    return true;
  };

  const getSubmissionsPendingReview = (courseId: string): CourseSubmission[] => {
    return submissions.filter(
      (sub) => sub.courseId === courseId && sub.status === 'pending_review'
    );
  };

  const getAllSubmissionsPendingReview = (): CourseSubmission[] => {
    return submissions.filter((sub) => sub.status === 'pending_review');
  };

  const getCompletedSubmissions = (courseId?: string): CourseSubmission[] => {
    return submissions.filter((sub) => {
      const isCompleted = sub.status === 'completed' || sub.status === 'rejected';
      if (courseId) {
        return isCompleted && sub.courseId === courseId;
      }
      return isCompleted;
    });
  };

  const addCommentToSubmission = async (submissionId: string, commentText: string): Promise<boolean> => {
    if (!currentUser || !commentText.trim()) return false;

    setSubmissions((prev) =>
      prev.map((sub) => {
        if (sub.id === submissionId) {
          const newComment = {
            id: `comment_${Date.now()}`,
            commentedBy: currentUser.id,
            commentedByName: currentUser.displayName,
            commentedAt: new Date().toISOString(),
            text: commentText.trim(),
          };
          return {
            ...sub,
            ownerComments: [...(sub.ownerComments || []), newComment],
          };
        }
        return sub;
      })
    );

    return true;
  };

  const markNotificationRead = (notifId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
    );
  };

  const clearAllNotifications = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const getRepStats = (repId: string) => {
    const repOrders = sales.filter((o) => {
      if (o.repId === repId) return true;
      if (
        currentUser &&
        currentUser.id === repId &&
        currentUser.email.toLowerCase().includes('gurpreet') &&
        o.repId === 'user_owner_gurpreet'
      ) {
        return true;
      }
      return false;
    });
    const installs = repOrders.filter((o) => o.status === 'installed').length;
    const cancels = repOrders.filter((o) => o.status === 'cancelled').length;
    const scheduled = repOrders.filter((o) => o.status === 'scheduled').length;
    const chargebacks = repOrders.filter((o) => o.status === 'chargeback').length;
    const totalSales = repOrders.length;

    const installRate = totalSales > 0 ? parseFloat(((installs / (installs + cancels || 1)) * 100).toFixed(1)) : 100;
    const cancelRate = totalSales > 0 ? parseFloat(((cancels / totalSales) * 100).toFixed(1)) : 0;

    const totalCommission = repOrders.reduce((sum, order) => {
      if (order.status === 'installed' || order.status === 'scheduled') {
        return sum + (order.payout || 0);
      }
      if (order.status === 'chargeback') {
        return sum - Math.abs(order.payout || 0);
      }
      return sum;
    }, 0);

    return {
      installs,
      cancels,
      scheduled,
      chargebacks,
      totalSales,
      installRate,
      cancelRate,
      totalCommission,
    };
  };

  const getTeamStats = (managerId: string) => {
    const teamOrders = sales.filter((o) => {
      if (o.uplineManagerId === managerId || o.repId === managerId) return true;
      if (
        currentUser &&
        currentUser.id === managerId &&
        currentUser.email.toLowerCase().includes('gurpreet') &&
        (o.uplineManagerId === 'user_owner_gurpreet' || o.repId === 'user_owner_gurpreet')
      ) {
        return true;
      }
      return false;
    });
    const teamInstalls = teamOrders.filter((o) => o.status === 'installed').length;
    const teamCancels = teamOrders.filter((o) => o.status === 'cancelled').length;
    const teamScheduled = teamOrders.filter((o) => o.status === 'scheduled').length;
    const teamChargebacks = teamOrders.filter((o) => o.status === 'chargeback').length;
    const teamTotalSales = teamOrders.length;

    const teamInstallRate = teamTotalSales > 0
      ? parseFloat(((teamInstalls / (teamInstalls + teamCancels || 1)) * 100).toFixed(1))
      : 100;
    const teamCancelRate = teamTotalSales > 0
      ? parseFloat(((teamCancels / teamTotalSales) * 100).toFixed(1))
      : 0;

    const teamTotalCommission = teamOrders.reduce((sum, order) => {
      if (order.status === 'installed') return sum + (order.payout || 0);
      return sum;
    }, 0);

    return {
      teamInstalls,
      teamCancels,
      teamScheduled,
      teamChargebacks,
      teamTotalSales,
      teamInstallRate,
      teamCancelRate,
      teamTotalCommission,
    };
  };

  const isUserBookedForBlitz = (blitzId: string, userId?: string) => {
    const uId = userId || currentUser?.id;
    if (!uId) return false;
    const blitz = blitzes.find((b) => b.id === blitzId);
    return !!(
      blitz?.bookedUserIds?.includes(uId) ||
      (currentUser?.email?.toLowerCase().includes('gurpreet') && blitz?.bookedUserIds?.includes('user_owner_gurpreet'))
    );
  };

  const filteredSales = (
    repId?: string,
    managerId?: string,
    isp?: string,
    state?: string,
    status?: string
  ) => {
    return sales.filter((order) => {
      if (repId) {
        const matchesRep = order.repId === repId || (
          currentUser &&
          currentUser.id === repId &&
          currentUser.email.toLowerCase().includes('gurpreet') &&
          order.repId === 'user_owner_gurpreet'
        );
        if (!matchesRep) return false;
      }
      if (managerId) {
        const matchesMgr = order.uplineManagerId === managerId || order.repId === managerId || (
          currentUser &&
          currentUser.id === managerId &&
          currentUser.email.toLowerCase().includes('gurpreet') &&
          (order.uplineManagerId === 'user_owner_gurpreet' || order.repId === 'user_owner_gurpreet')
        );
        if (!matchesMgr) return false;
      }
      if (isp && order.ispProgram !== isp) return false;
      if (state && order.state !== state) return false;
      if (status && order.status !== status) return false;
      return true;
    });
  };

  return (
    <DataContext.Provider
      value={{
        sales,
        blitzes,
        courses,
        submissions,
        notifications,
        messages,
        joinRequests,
        repAvailability,
        activePushToast,
        dismissPushToast,
        addSaleOrder,
        updateSaleStatus,
        deleteSaleOrder,
        bookBlitz,
        cancelBlitzBooking,
        createNewBlitz,
        submitJoinRequest,
        reviewJoinRequest,
        setRepAvailabilitySlot,
        removeRepAvailabilitySlot,
        getUserJoinRequestForBlitz,
        createCourse,
        submitQuiz,
        submitAssignment,
        assignCoursework,
        reviewCourseSubmission,
        getSubmissionsPendingReview,
        getAllSubmissionsPendingReview,
        getCompletedSubmissions,
        addCommentToSubmission,
        markNotificationRead,
        clearAllNotifications,
        sendInternalMessage,
        sendBlitzBroadcast,
        markMessageAsRead,
        filteredSales,
        getRepStats,
        getTeamStats,
        isUserBookedForBlitz,
        refreshData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
