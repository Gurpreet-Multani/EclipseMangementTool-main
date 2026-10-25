import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import type { SaleOrder, SmsGroupMessage } from '../types/index.ts';
import { getServerFirestore } from './mobileReachSync.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const CHAT_FILE = path.join(DATA_DIR, 'sms_group_chat.json');
const FIBERVOLT_CACHE_FILE = path.join(DATA_DIR, 'mobilereach_sync.json');

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Seed sample group chat history with real telecommunications context
const SEED_MESSAGES: SmsGroupMessage[] = [
  {
    id: 'msg_seed_001',
    senderId: 'user_rep_isaac_garza',
    senderName: 'Isaac Garza',
    senderPhone: '(480) 612-4918',
    senderRole: 'Team Lead',
    senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    text: 'Good morning squad! Bootheel and Phoenix corridors are active today. Make sure to post your work order receipts or carrier confirmation screens as soon as you close.',
    createdAt: '2026-10-25T08:15:00Z',
    isAiAnalyzed: false,
    isSale: false,
    fiberVoltStatus: 'not_a_sale',
  },
  {
    id: 'msg_seed_002',
    senderId: 'user_rep_dwayne_williams',
    senderName: 'Dwayne Michael Williams',
    senderPhone: '(573) 489-3281',
    senderRole: 'Field Sales Representative',
    senderAvatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=600&q=80',
    text: 'Locked in a 1 Gig Sparklight Fiber upgrade on Floyd St in Kennett! Customer is thrilled for the install.',
    imageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
    createdAt: '2026-10-25T09:20:00Z',
    isAiAnalyzed: true,
    isSale: true,
    aiConfidence: 98,
    extractedSaleId: 'mr_dw_mo_inst_1',
    extractedOrderNumber: 'FV-DW-77211',
    extractedCustomerName: 'Kimberly Stewart',
    extractedIspProgram: 'Sparklight Fiber',
    extractedSpeedTier: '1 Gig Fiber',
    extractedMonthlyPrice: 70,
    extractedInstallDate: '2026-10-08',
    extractedAddress: '319 Floyd St, Kennett, MO 63857',
    fiberVoltStatus: 'matched_installed',
    fiberVoltMatchId: 'mr_dw_mo_inst_1',
    fiberVoltMatchedAt: '2026-10-25T09:22:00Z',
    aiReasoning: 'Verified Sparklight technician installation order confirmation with 1 Gig fiber tier and address match.',
  },
  {
    id: 'msg_seed_003',
    senderId: 'user_mr_1792824343893_aria',
    senderName: 'Aria Hossein',
    senderPhone: '(480) 555-0891',
    senderRole: 'Regional Director',
    senderAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
    text: 'Just wrapped appointment verification in Tempe corridor. Sparklight 2 Gig upgrade installed & speed test verified 1940 Mbps down! 🚀',
    imageUrl: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=800&q=80',
    createdAt: '2026-10-25T10:05:00Z',
    isAiAnalyzed: true,
    isSale: true,
    aiConfidence: 99,
    extractedSaleId: 'mr_ah_inst_86',
    extractedOrderNumber: 'FV-AH-99086',
    extractedCustomerName: 'Eduardo Navarro',
    extractedIspProgram: 'Sparklight Fiber',
    extractedSpeedTier: '2 Gig Fiber',
    extractedMonthlyPrice: 85,
    extractedInstallDate: '2026-10-24',
    extractedAddress: '3032 E Baseline Rd, Tempe, AZ 85283',
    fiberVoltStatus: 'matched_installed',
    fiberVoltMatchId: 'mr_ah_inst_86',
    fiberVoltMatchedAt: '2026-10-25T10:07:00Z',
    aiReasoning: 'Official work order completion screenshot displaying 2 Gig fiber ONT installation and ONT test green lights.',
  },
];

let chatMessages: SmsGroupMessage[] = [];

// Load persisted chat messages or initialize with seed
try {
  if (fs.existsSync(CHAT_FILE)) {
    const raw = fs.readFileSync(CHAT_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      chatMessages = parsed;
    } else {
      chatMessages = [...SEED_MESSAGES];
    }
  } else {
    chatMessages = [...SEED_MESSAGES];
    fs.writeFileSync(CHAT_FILE, JSON.stringify(chatMessages, null, 2), 'utf-8');
  }
} catch (err) {
  console.warn('[SMS Group Chat] Notice loading chat file:', err);
  chatMessages = [...SEED_MESSAGES];
}

function persistChatMessages() {
  try {
    fs.writeFileSync(CHAT_FILE, JSON.stringify(chatMessages, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[SMS Group Chat] Error persisting messages:', err);
  }
}

/**
 * Returns all chat messages
 */
export function getChatMessages(): SmsGroupMessage[] {
  return chatMessages;
}

/**
 * AI Vision Analyzer using Gemini 3.8 Flash:
 * Evaluates whether an image dropped in the text SMS groupchat is a sale order summary,
 * and extracts all fields with structured schema.
 */
export async function analyzeImageForSale(
  imageBase64: string,
  mimeType = 'image/png',
  senderName = 'Sales Representative',
  senderPhone = ''
): Promise<{
  isSale: boolean;
  confidenceScore: number;
  aiReasoning: string;
  extractedOrder?: Partial<SaleOrder>;
}> {
  try {
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9.+]+;base64,/, '');

    const prompt = `You are an automated telecommunications sales order verification assistant for an ISP sales agency.
Sales reps frequently drop photos or screenshots into their team SMS group chat.
Some images are order summaries, work orders, carrier CRM screenshots, technician completion notices, or contract receipts.
Other images are NOT sales (for example: selfies, street photos, team memes, chat screenshots, map pins, payment receipts, or random documents).

Examine this image carefully:
1. Determine whether this image represents a valid internet/fiber telecommunications sale order or work order summary.
2. If it is NOT a sale, set isSale to false and explain why in aiReasoning.
3. If it IS a sale, extract the customer details, order confirmation number, address, carrier, plan, and dates accurately into JSON.

Known ISP Carriers: Sparklight Fiber, T-Mobile Fiber, AT&T Fiber, Frontier Fiber, Quantum Fiber, Brightspeed, Spectrum Gig, Kinetic Fiber, Google Fiber, Optimum Fiber, Ziply Fiber.
If the carrier name differs slightly, normalize it to the closest known carrier.
If customer first and last name are separated, combine them cleanly.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType,
                data: cleanBase64,
              },
            },
            { text: prompt },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isSale: { type: Type.BOOLEAN },
            confidenceScore: { type: Type.INTEGER },
            aiReasoning: { type: Type.STRING },
            customerName: { type: Type.STRING },
            customerPhone: { type: Type.STRING },
            customerEmail: { type: Type.STRING },
            address: { type: Type.STRING },
            city: { type: Type.STRING },
            state: { type: Type.STRING },
            zipCode: { type: Type.STRING },
            ispProgram: { type: Type.STRING },
            speedTier: { type: Type.STRING },
            orderNumber: { type: Type.STRING },
            orderDate: { type: Type.STRING },
            installDate: { type: Type.STRING },
            monthlyPrice: { type: Type.NUMBER },
            status: { type: Type.STRING },
            notes: { type: Type.STRING },
            detectedCrm: { type: Type.STRING },
          },
          required: ['isSale', 'confidenceScore', 'aiReasoning'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    const isSale = Boolean(parsed.isSale && parsed.confidenceScore >= 60);

    if (!isSale) {
      return {
        isSale: false,
        confidenceScore: parsed.confidenceScore || 0,
        aiReasoning: parsed.aiReasoning || 'Image does not contain a recognized telecommunications order summary or carrier receipt.',
      };
    }

    const todayIso = new Date().toISOString().split('T')[0];
    const orderDate = parsed.orderDate || todayIso;
    const installDate = parsed.installDate || orderDate;

    let eclipseStatus: SaleOrder['status'] = 'scheduled';
    const sLower = (parsed.status || '').toLowerCase();
    if (sLower.includes('install') || sLower.includes('complete') || sLower.includes('active')) {
      eclipseStatus = 'installed';
    } else if (sLower.includes('cancel')) {
      eclipseStatus = 'cancelled';
    }

    const extractedOrder: Partial<SaleOrder> = {
      orderNumber: parsed.orderNumber || `FV-SMS-${Math.floor(100000 + Math.random() * 900000)}`,
      customerName: parsed.customerName || 'Valued Customer',
      customerPhone: parsed.customerPhone || '',
      customerEmail: parsed.customerEmail || `${(parsed.customerName || 'customer').toLowerCase().replace(/\s+/g, '.')}@gmail.com`,
      address: parsed.address || 'Field Address',
      city: parsed.city || 'Phoenix',
      state: parsed.state || 'AZ',
      zipCode: parsed.zipCode || '85001',
      ispProgram: parsed.ispProgram || 'Sparklight Fiber',
      speedTier: parsed.speedTier || '1 Gig Fiber',
      orderDate,
      installDate,
      monthlyPrice: Number(parsed.monthlyPrice) || 70,
      status: eclipseStatus,
      notes: parsed.notes || `Ingested via SMS Groupchat from ${senderName}`,
      detectedCrm: parsed.detectedCrm || 'Carrier Screenshot OCR (SMS Groupchat)',
    };

    return {
      isSale: true,
      confidenceScore: parsed.confidenceScore || 90,
      aiReasoning: parsed.aiReasoning || 'Valid carrier sales confirmation receipt detected.',
      extractedOrder,
    };
  } catch (err: any) {
    console.error('[SMS AI Analyzer Error]:', err);
    return {
      isSale: false,
      confidenceScore: 0,
      aiReasoning: `Analysis error: ${err.message || 'Could not parse image with vision AI.'}`,
    };
  }
}

/**
 * Ingests a new message dropped into the SMS group chat:
 * 1. Checks if it includes an image.
 * 2. Runs AI Vision inspection to verify if it's an order summary.
 * 3. If it is a sale, uploads it immediately to Cloud Firestore and local Sales Orders.
 * 4. Reconciles with Fiber Volt records immediately and overtime.
 */
export async function handleIncomingGroupChatMessage(data: {
  senderId?: string;
  senderName?: string;
  senderPhone?: string;
  senderRole?: string;
  senderAvatar?: string;
  text?: string;
  imageBase64?: string;
  imageUrl?: string;
}): Promise<{
  message: SmsGroupMessage;
  uploadedSale?: SaleOrder | null;
  fiberVoltReconciled?: boolean;
}> {
  const messageId = `sms_msg_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const senderName = data.senderName || 'Field Sales Rep';
  const senderId = data.senderId || `user_rep_${senderName.toLowerCase().replace(/\s+/g, '_')}`;

  const newMessage: SmsGroupMessage = {
    id: messageId,
    senderId,
    senderName,
    senderPhone: data.senderPhone || '',
    senderRole: data.senderRole || 'Field Sales Representative',
    senderAvatar: data.senderAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    text: data.text || '',
    imageUrl: data.imageUrl || (data.imageBase64 ? data.imageBase64 : undefined),
    createdAt: new Date().toISOString(),
    isAiAnalyzed: false,
    isSale: false,
    fiberVoltStatus: 'unmatched',
  };

  let uploadedSale: SaleOrder | null = null;
  let fiberVoltReconciled = false;

  // If message contains an image, perform Gemini Vision Analysis
  const imageSource = data.imageBase64 || data.imageUrl;
  if (imageSource) {
    const analysis = await analyzeImageForSale(
      imageSource,
      'image/png',
      senderName,
      data.senderPhone
    );

    newMessage.isAiAnalyzed = true;
    newMessage.isSale = analysis.isSale;
    newMessage.aiConfidence = analysis.confidenceScore;
    newMessage.aiReasoning = analysis.aiReasoning;

    if (analysis.isSale && analysis.extractedOrder) {
      const ext = analysis.extractedOrder;
      const saleId = `mr_chat_${Date.now()}`;
      newMessage.extractedSaleId = saleId;
      newMessage.extractedOrderNumber = ext.orderNumber;
      newMessage.extractedCustomerName = ext.customerName;
      newMessage.extractedIspProgram = ext.ispProgram;
      newMessage.extractedSpeedTier = ext.speedTier;
      newMessage.extractedMonthlyPrice = ext.monthlyPrice;
      newMessage.extractedInstallDate = ext.installDate;
      newMessage.extractedAddress = `${ext.address}, ${ext.city}, ${ext.state} ${ext.zipCode}`;
      newMessage.fiberVoltStatus = 'pending_fibervolt';

      // Determine rep attribution
      let repId = senderId;
      let repName = senderName;
      let repRole = (data.senderRole || 'Field Sales Representative') as any;

      const senderLower = senderName.toLowerCase();
      if (senderLower.includes('dwayne') || senderLower.includes('williams')) {
        repId = 'user_rep_dwayne_williams';
        repName = 'Dwayne Michael Williams';
        repRole = 'Field Sales Representative';
      } else if (senderLower.includes('aria') || senderLower.includes('hossein')) {
        repId = 'user_mr_1792824343893_aria';
        repName = 'Aria Hossein';
        repRole = 'Regional Director';
      } else if (senderLower.includes('isaac') || senderLower.includes('garza')) {
        repId = 'user_rep_isaac_garza';
        repName = 'Isaac Garza';
        repRole = 'Team Lead';
      }

      const newSaleOrder: SaleOrder = {
        id: saleId,
        orderNumber: ext.orderNumber || `FV-SMS-${Math.floor(100000 + Math.random() * 900000)}`,
        repId,
        repName,
        repRole,
        customerName: ext.customerName || 'Valued Customer',
        customerPhone: ext.customerPhone || data.senderPhone || '',
        customerEmail: ext.customerEmail,
        address: ext.address || '',
        city: ext.city || '',
        state: ext.state || 'AZ',
        zipCode: ext.zipCode || '85001',
        ispProgram: ext.ispProgram || 'Sparklight Fiber',
        speedTier: ext.speedTier || '1 Gig Fiber',
        orderDate: ext.orderDate || new Date().toISOString().split('T')[0],
        installDate: ext.installDate || new Date().toISOString().split('T')[0],
        status: ext.status || 'scheduled',
        payout: ext.ispProgram?.includes('Sparklight') ? 320 : 300,
        monthlyPrice: ext.monthlyPrice || 70,
        notes: `[📱 Dropped in SMS Groupchat by ${senderName}] ${ext.notes || ''}`,
        detectedCrm: ext.detectedCrm || 'SMS Groupchat Photo (Pending Fiber Volt Match)',
        screenshotPreviewUrl: imageSource.startsWith('data:') ? imageSource : imageSource,
        sourceChannel: 'sms_groupchat',
        chatMessageId: messageId,
        chatSenderPhone: data.senderPhone,
        chatSenderName: senderName,
        isSaleVerified: true,
        fiberVoltMatched: false,
        createdAt: new Date().toISOString(),
      };

      // 1. Check for immediate Fiber Volt match in cached deals
      try {
        if (fs.existsSync(FIBERVOLT_CACHE_FILE)) {
          const rawFv = fs.readFileSync(FIBERVOLT_CACHE_FILE, 'utf-8');
          const fvData = JSON.parse(rawFv);
          const fvOrders: any[] = fvData.syncedOrders || [];

          const match = fvOrders.find((fv) => {
            const cleanFvNum = (fv.orderNumber || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
            const cleanChatNum = (newSaleOrder.orderNumber || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
            if (cleanFvNum && cleanChatNum && (cleanFvNum.includes(cleanChatNum) || cleanChatNum.includes(cleanFvNum))) return true;

            const fvName = (fv.customerName || '').toLowerCase().trim();
            const chatName = (newSaleOrder.customerName || '').toLowerCase().trim();
            if (fvName && chatName && fvName === chatName && fvName !== 'valued customer') return true;

            const fvPhone = (fv.customerPhone || '').replace(/\D/g, '');
            const chatPhone = (newSaleOrder.customerPhone || '').replace(/\D/g, '');
            if (fvPhone && chatPhone && fvPhone.length >= 7 && fvPhone === chatPhone) return true;

            return false;
          });

          if (match) {
            newSaleOrder.fiberVoltMatched = true;
            newSaleOrder.fiberVoltMatchId = match.id;
            newSaleOrder.lastReconciledAt = new Date().toISOString();
            if (match.status === 'installed') {
              newSaleOrder.status = 'installed';
              newMessage.fiberVoltStatus = 'matched_installed';
            } else {
              newMessage.fiberVoltStatus = 'matched_scheduled';
            }
            newSaleOrder.notes += ` | ⚡ Reconciled with Fiber Volt (${match.orderNumber})`;
            fiberVoltReconciled = true;
            console.log(`[SMS Group Chat] Immediate Fiber Volt match found for order ${newSaleOrder.orderNumber}!`);
          }
        }
      } catch (matchErr) {
        console.warn('[SMS Group Chat] Error matching with Fiber Volt cache:', matchErr);
      }

      // 2. Persist newly created sale order into Cloud Firestore sales collection
      try {
        const fsDb = await getServerFirestore();
        if (fsDb) {
          const { doc, setDoc } = await import('firebase/firestore');
          await setDoc(doc(fsDb, 'sales', newSaleOrder.id), newSaleOrder, { merge: true });
          console.log(`[SMS Group Chat] Successfully uploaded sale order ${newSaleOrder.orderNumber} to Cloud Firestore.`);
        }
      } catch (fsWriteErr) {
        console.warn('[SMS Group Chat] Firestore sale write warning:', fsWriteErr);
      }

      uploadedSale = newSaleOrder;
    } else {
      newMessage.fiberVoltStatus = 'not_a_sale';
    }
  }

  // Prepend new message to chat feed
  chatMessages.unshift(newMessage);
  persistChatMessages();

  // Also push message to Cloud Firestore sms_chat_messages collection
  try {
    const fsDb = await getServerFirestore();
    if (fsDb) {
      const { doc, setDoc } = await import('firebase/firestore');
      await setDoc(doc(fsDb, 'sms_chat_messages', newMessage.id), newMessage, { merge: true });
    }
  } catch (fsMsgErr) {
    console.warn('[SMS Group Chat] Firestore message write warning:', fsMsgErr);
  }

  return {
    message: newMessage,
    uploadedSale,
    fiberVoltReconciled,
  };
}

/**
 * Continuous Overtime Reconciliation:
 * Compares all orders ingested via SMS Groupchat against the latest Fiber Volt (MobileReach) data.
 * When a deal appears on Fiber Volt, it updates the order status, verified dates, and flags it as reconciled.
 */
export async function reconcileChatSalesWithFiberVolt(): Promise<{
  checkedCount: number;
  reconciledCount: number;
  updatedOrderIds: string[];
}> {
  console.log('[SMS Reconcile] Running overtime reconciliation between SMS Groupchat sales and Fiber Volt...');

  if (!fs.existsSync(FIBERVOLT_CACHE_FILE)) {
    return { checkedCount: 0, reconciledCount: 0, updatedOrderIds: [] };
  }

  let fvOrders: any[] = [];
  try {
    const raw = fs.readFileSync(FIBERVOLT_CACHE_FILE, 'utf-8');
    const fvData = JSON.parse(raw);
    fvOrders = fvData.syncedOrders || [];
  } catch (e) {
    console.warn('[SMS Reconcile] Could not read Fiber Volt cache:', e);
    return { checkedCount: 0, reconciledCount: 0, updatedOrderIds: [] };
  }

  const fsDb = await getServerFirestore();
  const updatedOrderIds: string[] = [];
  let reconciledCount = 0;

  // Scan through all chat messages with sales
  for (const msg of chatMessages) {
    if (!msg.isSale || !msg.extractedSaleId) continue;

    // Check if already reconciled to installed
    if (msg.fiberVoltStatus === 'matched_installed') continue;

    // Search for match in Fiber Volt
    const match = fvOrders.find((fv) => {
      const cleanFvNum = (fv.orderNumber || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      const cleanChatNum = (msg.extractedOrderNumber || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      if (cleanFvNum && cleanChatNum && (cleanFvNum.includes(cleanChatNum) || cleanChatNum.includes(cleanFvNum))) return true;

      const fvName = (fv.customerName || '').toLowerCase().trim();
      const chatName = (msg.extractedCustomerName || '').toLowerCase().trim();
      if (fvName && chatName && fvName === chatName && fvName !== 'valued customer') return true;

      const fvAddr = (fv.address || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const chatAddr = (msg.extractedAddress || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      if (fvAddr && chatAddr && fvAddr.length >= 8 && chatAddr.includes(fvAddr.slice(0, 10))) return true;

      return false;
    });

    if (match) {
      const newStatus = match.status === 'installed' ? 'matched_installed' : 'matched_scheduled';
      msg.fiberVoltStatus = newStatus;
      msg.fiberVoltMatchId = match.id;
      msg.fiberVoltMatchedAt = new Date().toISOString();
      reconciledCount++;
      updatedOrderIds.push(msg.extractedSaleId);

      // Update Firestore sale order document
      if (fsDb) {
        try {
          const { doc, updateDoc } = await import('firebase/firestore');
          await updateDoc(doc(fsDb, 'sales', msg.extractedSaleId), {
            fiberVoltMatched: true,
            fiberVoltMatchId: match.id,
            status: match.status,
            installDate: match.installDate || msg.extractedInstallDate,
            lastReconciledAt: new Date().toISOString(),
            notes: `[📱 Verified via SMS Groupchat + ⚡ Fiber Volt Cloud (${match.orderNumber})]`,
          });
        } catch (updateErr) {
          console.warn('[SMS Reconcile] Firestore update notice:', updateErr);
        }
      }
    }
  }

  if (reconciledCount > 0) {
    persistChatMessages();
    console.log(`[SMS Reconcile] Overtime sync updated ${reconciledCount} chat orders with live Fiber Volt state!`);
  }

  return {
    checkedCount: chatMessages.filter((m) => m.isSale).length,
    reconciledCount,
    updatedOrderIds,
  };
}
