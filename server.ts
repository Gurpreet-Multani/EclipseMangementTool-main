import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initMobileReachScheduler, runMobileReachSync, getMobileReachSyncState, handleMobileReachWebhook } from './src/server/mobileReachSync.ts';
import { getChatMessages, handleIncomingGroupChatMessage, reconcileChatSalesWithFiberVolt } from './src/server/smsGroupChat.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Shared server-side Gemini client
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // Lazy server Firestore connection
  let serverDb: any = null;
  try {
    const cfgPath = path.resolve(__dirname, 'firebase-applet-config.json');
    if (fs.existsSync(cfgPath)) {
      const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
      const { initializeApp, getApps } = await import('firebase/app');
      const { getFirestore } = await import('firebase/firestore');
      const serverApp = !getApps().length ? initializeApp(cfg) : getApps()[0];
      serverDb = cfg.firestoreDatabaseId ? getFirestore(serverApp, cfg.firestoreDatabaseId) : getFirestore(serverApp);
    }
  } catch (e) {
    console.warn('[Server Firestore init notice]:', e);
  }

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Fetch all persisted users (excluding any deleted tombstones)
  app.get('/api/users', async (_req, res) => {
    try {
      const dataDir = path.resolve(__dirname, 'data');
      const jsonPath = path.join(dataDir, 'users.json');
      const deletedPath = path.join(dataDir, 'deleted_users.json');

      let deletedIds: string[] = [];
      if (fs.existsSync(deletedPath)) {
        try {
          const rawDel = await fs.promises.readFile(deletedPath, 'utf8');
          deletedIds = JSON.parse(rawDel);
        } catch {
          deletedIds = [];
        }
      }

      if (fs.existsSync(jsonPath)) {
        const raw = await fs.promises.readFile(jsonPath, 'utf8');
        const parsed = JSON.parse(raw);
        const filtered = parsed.filter((u: any) => !deletedIds.includes(u.id) && !deletedIds.includes((u.email || '').toLowerCase()));
        return res.json({ success: true, users: filtered, deletedIds });
      }
      res.json({ success: true, users: [], deletedIds });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Permanently delete user from data store and Cloud Firestore
  app.delete('/api/users/:id', async (req, res) => {
    try {
      const targetId = req.params.id;
      if (!targetId) {
        return res.status(400).json({ success: false, error: 'User ID required' });
      }

      const dataDir = path.resolve(__dirname, 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // 1. Record in data/deleted_users.json so it is never re-seeded
      const deletedPath = path.join(dataDir, 'deleted_users.json');
      let deletedList: string[] = [];
      if (fs.existsSync(deletedPath)) {
        try {
          deletedList = JSON.parse(await fs.promises.readFile(deletedPath, 'utf8'));
        } catch {
          deletedList = [];
        }
      }
      if (!deletedList.includes(targetId)) {
        deletedList.push(targetId);
        await fs.promises.writeFile(deletedPath, JSON.stringify(deletedList, null, 2), 'utf8');
      }

      // 2. Remove from data/users.json
      const jsonPath = path.join(dataDir, 'users.json');
      if (fs.existsSync(jsonPath)) {
        try {
          const raw = await fs.promises.readFile(jsonPath, 'utf8');
          const currentUsers = JSON.parse(raw);
          const filtered = currentUsers.filter((u: any) => u.id !== targetId && (u.email || '').toLowerCase() !== targetId.toLowerCase());
          await fs.promises.writeFile(jsonPath, JSON.stringify(filtered, null, 2), 'utf8');
        } catch (fileErr) {
          console.warn('[JSON Delete notice]:', fileErr);
        }
      }

      // 3. Remove from Cloud Firestore and record tombstone
      if (serverDb) {
        try {
          const { doc, deleteDoc, setDoc } = await import('firebase/firestore');
          await deleteDoc(doc(serverDb, 'users', targetId));
          await setDoc(doc(serverDb, 'deleted_users', targetId), {
            id: targetId,
            deletedAt: new Date().toISOString(),
          }, { merge: true });
          console.log(`[Cloud Firestore Delete] Removed user document ${targetId} and saved tombstone`);
        } catch (cloudErr) {
          console.warn('[Cloud Firestore Delete notice]:', cloudErr);
        }
      }

      console.log(`[User Delete] Successfully deleted user ${targetId}`);
      res.json({ success: true, deletedId: targetId });
    } catch (err: any) {
      console.error('[User Delete Error]:', err);
      res.status(500).json({ success: false, error: err.message || 'Failed to delete user' });
    }
  });

  // Persist created or pre-approved user directly to data store
  app.post('/api/users/persist', async (req, res) => {
    try {
      const { user } = req.body;
      if (!user || !user.id || !user.email) {
        return res.status(400).json({ success: false, error: 'User must have an id and email.' });
      }

      // 1. Persist to data/users.json (Rock-solid JSON store)
      const dataDir = path.resolve(__dirname, 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      const jsonPath = path.join(dataDir, 'users.json');
      let currentUsers: any[] = [];
      if (fs.existsSync(jsonPath)) {
        try {
          const raw = await fs.promises.readFile(jsonPath, 'utf8');
          currentUsers = JSON.parse(raw);
        } catch {
          currentUsers = [];
        }
      }

      const existingIndex = currentUsers.findIndex(
        (u) => u.id === user.id || (u.email && u.email.toLowerCase() === (user.email || '').toLowerCase())
      );
      if (existingIndex !== -1) {
        currentUsers[existingIndex] = { ...currentUsers[existingIndex], ...user };
      } else {
        currentUsers.unshift(user);
      }
      await fs.promises.writeFile(jsonPath, JSON.stringify(currentUsers, null, 2), 'utf8');

      // 2. Persist directly to Cloud Firestore from server
      if (serverDb) {
        try {
          const { doc, setDoc } = await import('firebase/firestore');
          await setDoc(doc(serverDb, 'users', user.id), {
            ...user,
            approvalStatus: user.approvalStatus || 'approved',
            updatedAt: new Date().toISOString(),
          }, { merge: true });
          console.log(`[Cloud Firestore Persist] Saved ${user.id} (${user.email}) to Firestore database`);
        } catch (cloudErr) {
          console.warn('[Cloud Firestore Persist notice]:', cloudErr);
        }
      }

      // 2. Safely sync to src/data/nonVoltData.ts
      try {
        const filePath = path.resolve(__dirname, 'src/data/nonVoltData.ts');
        let fileContent = await fs.promises.readFile(filePath, 'utf8');

        const targetId = user.id;
        const targetEmail = (user.email || '').toLowerCase().trim();

        const idPattern = new RegExp(`id:\\s*['"]${targetId}['"]`);
        const emailPattern = new RegExp(`email:\\s*['"]${targetEmail}['"]`, 'i');

        if (!idPattern.test(fileContent) && !emailPattern.test(fileContent)) {
          const userCode = `  {\n` +
            `    id: ${JSON.stringify(user.id)},\n` +
            `    email: ${JSON.stringify(user.email)},\n` +
            `    firstName: ${JSON.stringify(user.firstName || '')},\n` +
            `    lastName: ${JSON.stringify(user.lastName || '')},\n` +
            `    displayName: ${JSON.stringify(user.displayName || '')},\n` +
            `    role: ${JSON.stringify(user.role || 'Representative')},\n` +
            `    title: ${JSON.stringify(user.title || 'Fiber Field Specialist')},\n` +
            `    approvalStatus: ${JSON.stringify(user.approvalStatus || 'approved')},\n` +
            `    approvedBy: ${JSON.stringify(user.approvedBy || 'Gurpreet Multani (Founder)')},\n` +
            `    approvedAt: ${JSON.stringify(user.approvedAt || new Date().toISOString())},\n` +
            (user.managerId ? `    managerId: ${JSON.stringify(user.managerId)},\n` : '') +
            (user.managerName ? `    managerName: ${JSON.stringify(user.managerName)},\n` : '') +
            `    phone: ${JSON.stringify(user.phone || '(555) 000-0000')},\n` +
            `    dateOfBirth: ${JSON.stringify(user.dateOfBirth || '1998-01-01')},\n` +
            `    shirtSize: ${JSON.stringify(user.shirtSize || 'L')},\n` +
            (user.badgePhotoUrl ? `    badgePhotoUrl: ${JSON.stringify(user.badgePhotoUrl)},\n` : '') +
            (user.idPhotoUrl ? `    idPhotoUrl: ${JSON.stringify(user.idPhotoUrl)},\n` : '') +
            `    emergencyContact: ${JSON.stringify(user.emergencyContact || { name: '', phone: '', relationship: '' }, null, 6).replace(/\\n/g, '\n    ')},\n` +
            `    directDeposit: ${JSON.stringify(user.directDeposit || { bankName: '', accountNumber: '', routingNumber: '', accountType: 'checking', taxIdType: 'SSN', taxIdNumber: '' }, null, 6).replace(/\\n/g, '\n    ')},\n` +
            `    fiberAgreement: ${JSON.stringify(user.fiberAgreement || { status: 'signed', version: 'v2026.2' }, null, 6).replace(/\\n/g, '\n    ')},\n` +
            `    travelProfile: ${JSON.stringify(user.travelProfile || { homeAirport: 'DFW - Dallas/Fort Worth', ableToTravel: true, smsTravelUpdatesConsent: true }, null, 6).replace(/\\n/g, '\n    ')},\n` +
            `    payRates: ${JSON.stringify(user.payRates || { 'Sparklight Fiber': 320, 'T-Mobile Fiber': 320, 'AT&T Fiber': 290, 'Frontier Fiber': 310, 'Quantum Fiber': 280, 'Brightspeed': 260, 'Spectrum Gig': 250, 'Kinetic Fiber': 270 }, null, 6).replace(/\\n/g, '\n    ')},\n` +
            `    stats: ${JSON.stringify(user.stats || { installs: 0, cancels: 0, scheduled: 0, chargebacks: 0, totalSales: 0, installRate: 100, cancelRate: 0, totalCommission: 0 }, null, 6).replace(/\\n/g, '\n    ')},\n` +
            `    createdAt: ${JSON.stringify(user.createdAt || new Date().toISOString())},\n` +
            `    updatedAt: ${JSON.stringify(new Date().toISOString())},\n` +
            `  },\n`;

          const marker = `export const NON_VOLT_BLITZES`;
          if (fileContent.includes(marker)) {
            const parts = fileContent.split(marker);
            const lastBracketIdx = parts[0].lastIndexOf('];');
            if (lastBracketIdx !== -1) {
              let before = parts[0].slice(0, lastBracketIdx).trimEnd();
              if (!before.endsWith(',')) {
                before += ',';
              }
              const after = '\n' + parts[0].slice(lastBracketIdx);
              fileContent = before + '\n' + userCode + after + marker + parts[1];
              await fs.promises.writeFile(filePath, fileContent, 'utf8');
            }
          }
        }
      } catch (fileErr) {
        console.warn('[Sync to nonVoltData notice]:', fileErr);
      }

      console.log(`[User Persist] Successfully persisted user ${user.email} (${user.id})`);
      return res.json({ success: true, user });
    } catch (err: any) {
      console.error('[Persist Error]:', err);
      res.status(500).json({ success: false, error: err.message || 'Failed to persist user' });
    }
  });

  // OCR and AI parsing endpoint for carrier sale confirmation screenshots
  app.post('/api/parse-sale-screenshot', async (req, res) => {
    try {
      const { imageBase64, mimeType = 'image/png' } = req.body;

      if (!imageBase64 || typeof imageBase64 !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Please provide a valid image screenshot in base64 format.',
        });
      }

      // Strip potential data URL prefix
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9.+]+;base64,/, '');

      const prompt = `You are an expert telecommunications and fiber internet sales CRM analyzer.
The user has uploaded a screenshot of a sale confirmation screen, order completion receipt, technician dispatch confirmation, or carrier CRM view.
Because each internet program uses its own CRM (such as AT&T OPUS / MST / BusinessDirect, Frontier Partner Portal, Quantum Fiber / CenturyLink Hub, Brightspeed Portal, Spectrum Gig CRM, Kinetic / Windstream, Google Fiber Portal, Optimum, Ziply Fiber, etc.), the template, styling, terminology, and visual layout varies widely.

Examine the entire image (headers, order numbers, customer block, address, speed tier, line items, appointment dates, billing totals, technician notes) and accurately extract all sale details into this exact JSON structure:

1. customerName: Full name of customer (e.g., "Johnathan Davis"). If first and last name are in separate fields or blocks, combine them cleanly.
2. customerPhone: Customer contact phone formatted as (XXX) XXX-XXXX, or empty string if not found.
3. customerEmail: Customer email address if present, or empty string.
4. address: Street address line (e.g. "1420 Meadow Creek Blvd", "884 NW 2nd Ave Apt 4B").
5. city: City name (e.g. "Dallas", "Fort Worth", "Charlotte", "Columbus").
6. state: Standard 2-letter US State abbreviation (e.g. "TX", "NC", "FL", "OH", "CA").
7. zipCode: 5-digit US Postal Code.
8. ispProgram: The carrier or ISP partner. Pick the closest match from: "AT&T Fiber", "Frontier Fiber", "Quantum Fiber", "Brightspeed", "Spectrum Gig", "Kinetic Fiber", or another recognized ISP name if identified.
9. speedTier: Internet speed tier (e.g. "300 Mbps", "500 Mbps", "1 Gig", "2 Gig", "5 Gig"). Choose the closest standard speed tier.
10. orderNumber: Order confirmation number, BAN (Billing Account Number), Confirmation Code, or Reference ID shown on the confirmation screen (e.g. "ATT-849201", "FR-2026-9912", "QS-7401928").
11. orderDate: Order submission date in YYYY-MM-DD format. If only month/day are visible, use the current year.
12. installDate: Scheduled installation appointment / technician dispatch date in YYYY-MM-DD format. If absent, provide a plausible date 3-5 days after orderDate.
13. monthlyPrice: Recurring monthly billing price for internet service as a number (e.g., 80.00), or 0 if not stated.
14. status: "scheduled", "installed", or "pending". If an install date is scheduled in the future, set to "scheduled".
15. notes: Dispatch or order notes (e.g. appointment arrival window like "8:00 AM - 12:00 PM", ONT placement in garage, gateway serial number, promo details, or technician instructions).
16. detectedCrm: Descriptive name of the detected CRM / carrier portal (e.g., "AT&T OPUS System", "Frontier Partner Portal", "Brightspeed Order Hub", "Quantum Fiber Portal", "Spectrum Mobile/Gig Entry").
17. confidenceScore: Integer from 1 to 100 representing confidence in data extraction accuracy.

If a specific field is not found in the screenshot, return an empty string or null rather than hallucinating random data.`;

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
              confidenceScore: { type: Type.INTEGER },
            },
            required: ['customerName', 'address', 'city', 'ispProgram', 'orderNumber'],
          },
        },
      });

      const parsedText = response.text || '{}';
      const extractedData = JSON.parse(parsedText);

      return res.json({
        success: true,
        data: extractedData,
      });
    } catch (err: any) {
      console.error('OCR Parsing Error in /api/parse-sale-screenshot:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'An error occurred while analyzing the confirmation screenshot.',
      });
    }
  });

  // Cloud SMS Gateway status check
  app.get('/api/sms-gateway-status', (_req, res) => {
    const hasAccountSid = Boolean(process.env.TWILIO_ACCOUNT_SID);
    const hasAuthToken = Boolean(process.env.TWILIO_AUTH_TOKEN);
    const hasPhoneNumber = Boolean(process.env.TWILIO_PHONE_NUMBER);

    res.json({
      configured: hasAccountSid && hasAuthToken && hasPhoneNumber,
      hasAccountSid,
      hasPhoneNumber,
      fromNumber: process.env.TWILIO_PHONE_NUMBER ? process.env.TWILIO_PHONE_NUMBER.replace(/\d(?=\d{4})/g, '*') : null,
    });
  });

  // Real SMS dispatch endpoint (Twilio Cloud Telephony Gateway)
  app.post('/api/send-real-sms', async (req, res) => {
    try {
      const {
        to,
        body,
        customerName,
        orderNumber,
        accountSid = process.env.TWILIO_ACCOUNT_SID,
        authToken = process.env.TWILIO_AUTH_TOKEN,
        fromPhone = process.env.TWILIO_PHONE_NUMBER,
      } = req.body;

      if (!to || !body) {
        return res.status(400).json({
          success: false,
          error: 'Please provide both customer phone number ("to") and message text ("body").',
        });
      }

      // Normalize US phone number: convert "(214) 555-0192" or "2145550192" to "+12145550192"
      let normalizedTo = to.replace(/[^0-9+]/g, '');
      if (!normalizedTo.startsWith('+')) {
        if (normalizedTo.length === 10) {
          normalizedTo = `+1${normalizedTo}`;
        } else if (normalizedTo.length === 11 && normalizedTo.startsWith('1')) {
          normalizedTo = `+${normalizedTo}`;
        } else {
          normalizedTo = `+1${normalizedTo}`;
        }
      }

      // If Twilio credentials are provided (via env or request payload)
      if (accountSid && authToken && fromPhone) {
        let normalizedFrom = fromPhone.replace(/[^0-9+]/g, '');
        if (!normalizedFrom.startsWith('+')) {
          normalizedFrom = `+1${normalizedFrom}`;
        }

        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
        const params = new URLSearchParams();
        params.append('To', normalizedTo);
        params.append('From', normalizedFrom);
        params.append('Body', body);

        const authHeader = `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`;

        const twilioResponse = await fetch(twilioUrl, {
          method: 'POST',
          headers: {
            Authorization: authHeader,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
        });

        const twilioData = await twilioResponse.json();

        if (!twilioResponse.ok) {
          const errMsg = twilioData.message || twilioData.error_message || 'Twilio failed to dispatch message';
          console.error('Twilio SMS error:', twilioData);
          return res.status(400).json({
            success: false,
            error: `Twilio Error (${twilioData.code || twilioResponse.status}): ${errMsg}`,
            details: twilioData,
          });
        }

        return res.json({
          success: true,
          method: 'twilio_cloud_gateway',
          messageSid: twilioData.sid,
          status: twilioData.status || 'sent',
          to: normalizedTo,
          from: normalizedFrom,
          dateCreated: twilioData.date_created || new Date().toISOString(),
        });
      }

      // If Twilio credentials are not configured on server
      return res.status(422).json({
        success: false,
        gatewayConfigured: false,
        error: 'Cloud SMS Gateway credentials (Twilio) are not configured yet. You can send this real text directly via your mobile phone SMS app with 1 click, or configure your Twilio Account SID & Token in Gateway Settings.',
        normalizedTo,
      });
    } catch (err: any) {
      console.error('Real SMS error:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'An unexpected error occurred while dispatching the real SMS.',
      });
    }
  });

  // --- MobileReach 24/7 D2D Automated Sync Endpoints ---
  app.get('/api/mobilereach/status', (_req, res) => {
    const state = getMobileReachSyncState();
    res.json({
      success: true,
      ...state,
    });
  });

  app.get('/api/mobilereach/data', (_req, res) => {
    const state = getMobileReachSyncState();
    res.json({
      success: true,
      orders: state.syncedOrders,
      leaderboard: state.leaderboard,
      statusBreakdown: state.statusBreakdown,
      carrierBreakdown: state.carrierBreakdown,
      lastSyncTime: state.lastSyncTime,
      nextSyncTime: state.nextSyncTime,
      totalDeals: state.totalDeals,
      authenticatedUser: state.authenticatedUser,
    });
  });

  app.post('/api/mobilereach/sync', async (req, res) => {
    try {
      const { email, password } = req.body || {};
      const updatedState = await runMobileReachSync(email, password);
      res.json({
        success: true,
        message: `Successfully synchronized ${updatedState.totalDeals} deals and real leaderboard from d2d.mobilereach.store`,
        ...updatedState,
      });
    } catch (err: any) {
      console.error('[MobileReach API] Sync error:', err);
      res.status(500).json({
        success: false,
        error: err.message || 'MobileReach sync failed. Please verify connection to d2d.mobilereach.store.',
      });
    }
  });

  // Real-time 24/7 Webhook endpoints for Fiber Volt / MobileReach
  const handleIncomingWebhook = async (req: express.Request, res: express.Response) => {
    try {
      const result = await handleMobileReachWebhook(req.body);
      res.json({
        ...result,
        message: `Instantly received and synchronized ${result.count} orders directly to website & Cloud Firestore`,
      });
    } catch (err: any) {
      console.error('[Webhook Error]:', err);
      res.status(500).json({ success: false, error: err.message || 'Failed to process incoming webhook order.' });
    }
  };

  app.post('/api/mobilereach/webhook', handleIncomingWebhook);
  app.post('/api/fibervolt/webhook', handleIncomingWebhook);

  // --- SMS Groupchat AI Image Order Ingestion & Overtime Fiber Volt Sync ---
  app.get('/api/sms-chat/messages', (_req, res) => {
    try {
      const messages = getChatMessages();
      res.json({ success: true, messages });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/sms-chat/send', async (req, res) => {
    try {
      const result = await handleIncomingGroupChatMessage(req.body);
      res.json({
        success: true,
        ...result,
      });
    } catch (err: any) {
      console.error('[SMS Chat Ingest Error]:', err);
      res.status(500).json({ success: false, error: err.message || 'Failed to process chat message' });
    }
  });

  // Carrier / Twilio MMS Webhook for real incoming group texts
  app.post('/api/sms-chat/inbound-mms', async (req, res) => {
    try {
      const from = req.body?.From || req.body?.senderPhone || '';
      const bodyText = req.body?.Body || req.body?.text || '';
      const mediaUrl = req.body?.MediaUrl0 || req.body?.imageUrl || '';
      const senderName = req.body?.senderName || from || 'Field Representative';

      await handleIncomingGroupChatMessage({
        senderName,
        senderPhone: from,
        text: bodyText,
        imageUrl: mediaUrl,
      });

      res.type('text/xml').send('<Response></Response>');
    } catch (err: any) {
      console.error('[Inbound MMS Webhook Error]:', err);
      res.status(500).send('<Response></Response>');
    }
  });

  // Manual or client trigger for overtime reconciliation
  app.post('/api/sms-chat/reconcile', async (_req, res) => {
    try {
      const result = await reconcileChatSalesWithFiberVolt();
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Serve static files or Vite dev server
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.use('/EclipseMangementTool-main', express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Eclipse Dashboard server running at http://0.0.0.0:${PORT}`);
    // Start automated 24/7 sync scheduler with MobileReach
    initMobileReachScheduler();
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
