import { SaleOrder, CustomerSmsMessage, CustomerSmsConfig, CustomerSmsType } from '../types';

/**
 * Calculates a date offset from an ISO or YYYY-MM-DD date string.
 */
export function addDaysToDate(dateString: string, days: number): string {
  try {
    const parts = dateString.split('T')[0].split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      d.setDate(d.getDate() + days);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const da = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${da}`;
    }
  } catch (e) {
    console.error('Date calculation error:', e);
  }
  return dateString;
}

/**
 * Formats a YYYY-MM-DD date into friendly text (e.g., "Friday, Oct 24, 2026").
 */
export function formatFriendlyDate(dateString: string): string {
  try {
    const parts = dateString.split('T')[0].split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
  } catch (e) {
    console.error('Date format error:', e);
  }
  return dateString;
}

/**
 * Generates the three automated customer SMS messages for any submitted sale order:
 * 1. A day before install: letting them know their install ahead of time date and time
 * 2. On day of install: texting them as a heads up
 * 3. 1 week after install: to check up on customer
 */
export function generateDefaultSmsMessages(order: SaleOrder): CustomerSmsMessage[] {
  const installDate = order.installDate || new Date().toISOString().split('T')[0];
  const dayBeforeDate = addDaysToDate(installDate, -1);
  const oneWeekAfterDate = addDaysToDate(installDate, 7);

  const firstName = order.customerName.trim().split(' ')[0] || order.customerName;
  const friendlyInstall = formatFriendlyDate(installDate);
  const isp = order.ispProgram || 'Fiber Internet';
  const speed = order.speedTier || 'High-Speed';

  // Extract arrival window from notes if present (e.g. 8:00 AM - 12:00 PM)
  let arrivalWindowText = 'morning or afternoon arrival window';
  if (order.notes && /([0-9]{1,2}:[0-9]{2}\s*(?:AM|PM|am|pm)\s*-\s*[0-9]{1,2}:[0-9]{2}\s*(?:AM|PM|am|pm))/i.test(order.notes)) {
    const match = order.notes.match(/([0-9]{1,2}:[0-9]{2}\s*(?:AM|PM|am|pm)\s*-\s*[0-9]{1,2}:[0-9]{2}\s*(?:AM|PM|am|pm))/i);
    if (match && match[0]) {
      arrivalWindowText = match[0];
    }
  }

  const messages: CustomerSmsMessage[] = [
    {
      id: `${order.id}_sms_pre_install`,
      orderId: order.id,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      type: 'pre_install',
      title: '1 Day Before Install Reminder',
      messageText: `Hi ${firstName}! This is your ${isp} specialist team at Eclipse. Just a quick reminder that your technician installation is confirmed for tomorrow, ${friendlyInstall}! Arrival window: ${arrivalWindowText}. Please make sure an adult (18+) is present at ${order.address}. Reply to this text if you need to adjust anything!`,
      scheduledForDate: dayBeforeDate,
      scheduledForTime: '09:00 AM',
      status: 'scheduled',
      enabled: true,
      notes: 'Automated 24-hour advance dispatch heads up',
    },
    {
      id: `${order.id}_sms_day_of`,
      orderId: order.id,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      type: 'day_of_install',
      title: 'Day of Install Heads Up',
      messageText: `Good morning ${firstName}! Today is your ${isp} fiber installation day! Your field technician is on schedule. They will give you a call 15-30 minutes prior to arrival. We are excited to get your ${speed} fiber connection activated today!`,
      scheduledForDate: installDate,
      scheduledForTime: '07:30 AM',
      status: 'scheduled',
      enabled: true,
      notes: 'Morning-of dispatch alert & phone call reminder',
    },
    {
      id: `${order.id}_sms_post_install`,
      orderId: order.id,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      type: 'post_install_checkup',
      title: '1-Week Customer Quality Checkup',
      messageText: `Hi ${firstName}, hope you are enjoying your new fiber service! It has been one week since your ${isp} setup at ${order.address}. How is your ${speed} speed performing? If you need any Wi-Fi optimization or have billing questions, please reply directly to this text. Thank you for choosing Eclipse!`,
      scheduledForDate: oneWeekAfterDate,
      scheduledForTime: '10:00 AM',
      status: 'scheduled',
      enabled: true,
      notes: '7-day post-install retention & customer satisfaction checkup',
    },
  ];

  return messages;
}

/**
 * Returns or initializes the customer SMS config for an order.
 */
export function getOrCreateOrderSmsConfig(order: SaleOrder): {
  config: CustomerSmsConfig;
  messages: CustomerSmsMessage[];
} {
  const defaultMessages = generateDefaultSmsMessages(order);

  if (order.customerSmsConfig && order.smsMessages && order.smsMessages.length > 0) {
    return {
      config: order.customerSmsConfig,
      messages: order.smsMessages,
    };
  }

  // Generate clean initial configuration
  const initialConfig: CustomerSmsConfig = {
    autoSmsEnabled: true,
    preInstallEnabled: true,
    dayOfInstallEnabled: true,
    postInstallEnabled: true,
    messages: defaultMessages,
  };

  return {
    config: initialConfig,
    messages: defaultMessages,
  };
}

/**
 * Opens the native SMS application on the representative's mobile device or computer
 * with the recipient customer phone number and the message body pre-filled, so
 * clicking Send fires an authentic cellular carrier text message from the rep's SIM!
 */
export function openNativeDeviceSms(phoneNumber: string, bodyText: string): void {
  const cleanNumber = phoneNumber.replace(/[^0-9+]/g, '');
  const encodedBody = encodeURIComponent(bodyText);

  // Modern cross-platform URI: use &body= for iOS devices, ?body= for standard Android/Web
  const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
  const separator = isIOS ? '&' : '?';
  const smsUri = `sms:${cleanNumber}${separator}body=${encodedBody}`;

  window.location.href = smsUri;
}

/**
 * Dispatches a real SMS message via the server-side Cloud SMS Gateway (Twilio).
 */
export async function sendRealCloudSms(options: {
  to: string;
  body: string;
  customerName?: string;
  orderNumber?: string;
  accountSid?: string;
  authToken?: string;
  fromPhone?: string;
}): Promise<{
  success: boolean;
  messageSid?: string;
  status?: string;
  error?: string;
  gatewayConfigured?: boolean;
}> {
  try {
    const res = await fetch('/api/send-real-sms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });

    const data = await res.json();
    return data;
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Network error communicating with Cloud SMS Gateway.',
    };
  }
}

/**
 * Checks server SMS gateway configuration status.
 */
export async function checkSmsGatewayStatus(): Promise<{
  configured: boolean;
  hasAccountSid: boolean;
  hasPhoneNumber: boolean;
  fromNumber: string | null;
}> {
  try {
    const res = await fetch('/api/sms-gateway-status');
    const data = await res.json();
    return data;
  } catch (e) {
    return { configured: false, hasAccountSid: false, hasPhoneNumber: false, fromNumber: null };
  }
}

