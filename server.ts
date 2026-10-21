import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

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

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
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

  // Serve static files or Vite dev server
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
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
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
