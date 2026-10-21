/**
 * Generates realistic carrier confirmation screenshot images via HTML5 Canvas
 * to allow 1-click demonstration of screenshot OCR and AI autofill for various ISP CRMs.
 */

export interface SampleReceipt {
  id: string;
  carrierName: string;
  crmName: string;
  accentColor: string;
  orderNumber: string;
  customerName: string;
  description: string;
  generateDataUrl: () => string;
}

export const generateSampleReceiptImage = (type: 'att' | 'frontier' | 'quantum'): string => {
  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 700;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const dispatchDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  if (type === 'att') {
    // AT&T OPUS Portal Style
    // Background
    ctx.fillStyle = '#0a192f';
    ctx.fillRect(0, 0, 900, 700);

    // Top Navigation Bar
    ctx.fillStyle = '#0057b8';
    ctx.fillRect(0, 0, 900, 60);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText('AT&T OPUS Partner Portal  |  Order Summary', 30, 38);

    ctx.fillStyle = '#64ffda';
    ctx.font = 'bold 13px monospace';
    ctx.fillText('SYSTEM STATUS: ORDER COMMITTED & DISPATCHED', 520, 38);

    // Main Card
    ctx.fillStyle = '#112240';
    ctx.strokeStyle = '#233554';
    ctx.lineWidth = 2;
    ctx.fillRect(30, 80, 840, 580);
    ctx.strokeRect(30, 80, 840, 580);

    // Order Header Banner
    ctx.fillStyle = '#1d3557';
    ctx.fillRect(30, 80, 840, 70);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.fillText('Order Confirmation # ATT-894210-TX', 50, 115);

    ctx.fillStyle = '#a8b2d1';
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillText(`Order Date: ${todayStr}  •  Billing Account (BAN): 9820-4102-192`, 50, 138);

    // Customer & Service Address Block
    ctx.fillStyle = '#1b2d4f';
    ctx.fillRect(50, 170, 380, 200);
    ctx.strokeStyle = '#2d4670';
    ctx.strokeRect(50, 170, 380, 200);

    ctx.fillStyle = '#00a3e0';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.fillText('SUBSCRIBER INFORMATION', 70, 200);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.fillText('Customer: Johnathan Davis', 70, 230);
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillStyle = '#ccd6f6';
    ctx.fillText('Contact Phone: (214) 555-0198', 70, 255);
    ctx.fillText('Email: jdavis.fiber@gmail.com', 70, 280);
    ctx.fillText('Address: 1420 Meadow Creek Blvd', 70, 305);
    ctx.fillText('City/State/Zip: Dallas, TX 75001', 70, 330);

    // Plan & Equipment Block
    ctx.fillStyle = '#1b2d4f';
    ctx.fillRect(470, 170, 380, 200);
    ctx.strokeStyle = '#2d4670';
    ctx.strokeRect(470, 170, 380, 200);

    ctx.fillStyle = '#00a3e0';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.fillText('SERVICES & SPEED TIER', 490, 200);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.fillText('AT&T Fiber 1 Gig Symmetrical', 490, 230);

    ctx.fillStyle = '#64ffda';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText('$80.00 / month', 490, 265);

    ctx.fillStyle = '#ccd6f6';
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillText('• 1000 Mbps Download / 1000 Mbps Upload', 490, 295);
    ctx.fillText('• Wi-Fi 6 BGW320 Optical Network Gateway included', 490, 320);
    ctx.fillText('• Unlimited Internet Data with No Annual Contract', 490, 345);

    // Dispatch & Install Appointment Block
    ctx.fillStyle = '#0f2942';
    ctx.fillRect(50, 390, 800, 130);
    ctx.strokeStyle = '#0057b8';
    ctx.strokeRect(50, 390, 800, 130);

    ctx.fillStyle = '#00a3e0';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.fillText('TECHNICIAN DISPATCH & INSTALLATION APPOINTMENT', 70, 420);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.fillText(`Scheduled Install Date: ${dispatchDate}`, 70, 450);

    ctx.fillStyle = '#ccd6f6';
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillText('Arrival Window: 8:00 AM - 12:00 PM (Technician will call 30 min ahead)', 70, 475);
    ctx.fillText('Special Technician Notes: ONT installation requested in garage. Exterior splice box verified.', 70, 500);

    // Footer Bar
    ctx.fillStyle = '#0b1d33';
    ctx.fillRect(50, 540, 800, 90);
    ctx.fillStyle = '#8892b0';
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText('Dealer Code: ECLIPSE-DLS-98  •  Selling Agent: Field Representative  •  Portal: OPUS v24.8.2', 70, 575);
    ctx.fillText('Sales Order Status: SCHEDULED_PENDING_INSTALLATION  •  Transaction ID: TX-ATT-98214-OK', 70, 600);

  } else if (type === 'frontier') {
    // Frontier Fiber Partner Portal Style
    ctx.fillStyle = '#18181b';
    ctx.fillRect(0, 0, 900, 700);

    // Top Navigation Bar
    ctx.fillStyle = '#e11d48';
    ctx.fillRect(0, 0, 900, 60);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText('Frontier Fiber Partner Portal | Order Receipt', 30, 38);

    ctx.fillStyle = '#fecdd3';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.fillText('REF #: FR-993214  •  STATUS: VERIFIED', 560, 38);

    // Main Card
    ctx.fillStyle = '#27272a';
    ctx.strokeStyle = '#3f3f46';
    ctx.lineWidth = 2;
    ctx.fillRect(30, 80, 840, 580);
    ctx.strokeRect(30, 80, 840, 580);

    // Order Header
    ctx.fillStyle = '#f43f5e';
    ctx.fillRect(50, 100, 800, 6);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText('Frontier Fiber Order Confirmation', 50, 140);

    ctx.fillStyle = '#a1a1aa';
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillText(`Confirmation Code: FR-993214  |  Order Timestamp: ${todayStr} 14:22 EST`, 50, 165);

    // Customer Info Card
    ctx.fillStyle = '#18181b';
    ctx.fillRect(50, 190, 380, 210);
    ctx.strokeStyle = '#3f3f46';
    ctx.strokeRect(50, 190, 380, 210);

    ctx.fillStyle = '#fb7185';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.fillText('SUBSCRIBER SERVICE PROFILE', 70, 220);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.fillText('Customer Name: Elena Vance', 70, 250);
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillStyle = '#e4e4e7';
    ctx.fillText('Phone: (813) 555-0144', 70, 275);
    ctx.fillText('Email: elena.vance@outlook.com', 70, 300);
    ctx.fillText('Street Address: 842 Cypress Point Dr', 70, 325);
    ctx.fillText('City/State/Zip: Tampa, FL 33601', 70, 350);
    ctx.fillText('Billing Preference: Paperless / Autopay', 70, 375);

    // Internet Plan Info Card
    ctx.fillStyle = '#18181b';
    ctx.fillRect(470, 190, 380, 210);
    ctx.strokeStyle = '#3f3f46';
    ctx.strokeRect(470, 190, 380, 210);

    ctx.fillStyle = '#fb7185';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.fillText('FRONTIER BROADBAND PROGRAM', 490, 220);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.fillText('Frontier Fiber 500 Mbps', 490, 250);

    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 24px system-ui, sans-serif';
    ctx.fillText('$59.99 / mo', 490, 285);

    ctx.fillStyle = '#d4d4d8';
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillText('• 500 Mbps Symmetrical High-Speed Fiber', 490, 315);
    ctx.fillText('• Eero Pro 6E Wi-Fi Router Included', 490, 340);
    ctx.fillText('• Standard Free Professional Installation', 490, 365);

    // Install Appointment
    ctx.fillStyle = '#3f3f46';
    ctx.fillRect(50, 420, 800, 120);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.fillText(`Technician Dispatch Scheduled: ${dispatchDate}`, 70, 455);

    ctx.fillStyle = '#e4e4e7';
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillText('Arrival Window: 8:00 AM - 11:00 AM EST', 70, 485);
    ctx.fillText('Tech Instructions: Pre-wired aerial drop from pole #41. Free activation promo applied.', 70, 510);

    // Footer info
    ctx.fillStyle = '#71717a';
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText('Channel: D2D Authorized Agent Eclipse  •  Partner ID: 940122  •  Order ID: FR-FL-8931', 70, 580);
    ctx.fillText('Status: SCHEDULED  •  All fiber provisioning flags verified green.', 70, 605);

  } else {
    // Quantum Fiber / CenturyLink Style
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, 900, 700);

    // Top Navigation Bar
    ctx.fillStyle = '#7c3aed';
    ctx.fillRect(0, 0, 900, 60);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText('Quantum Fiber | Customer Order Confirmation', 30, 38);

    ctx.fillStyle = '#e9d5ff';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.fillText('BAN: QF-7401928  •  STATUS: BOOKED', 560, 38);

    // Main Card
    ctx.fillStyle = '#18181b';
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 2;
    ctx.fillRect(30, 80, 840, 580);
    ctx.strokeRect(30, 80, 840, 580);

    // Header Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.fillText('Quantum Fiber Service Order Agreement', 50, 125);

    ctx.fillStyle = '#a1a1aa';
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillText(`Order Number: QF-7401928  |  Date: ${todayStr}`, 50, 150);

    // Customer Info Card
    ctx.fillStyle = '#27272a';
    ctx.fillRect(50, 175, 380, 210);
    ctx.strokeStyle = '#3f3f46';
    ctx.strokeRect(50, 175, 380, 210);

    ctx.fillStyle = '#c084fc';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.fillText('ACCOUNT HOLDER DETAILS', 70, 205);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.fillText('Customer: Marcus Sterling', 70, 235);
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillStyle = '#e4e4e7';
    ctx.fillText('Phone: (303) 555-0177', 70, 260);
    ctx.fillText('Email: msterling.denver@gmail.com', 70, 285);
    ctx.fillText('Service Address: 2100 Broadway St Apt 4B', 70, 310);
    ctx.fillText('City, State, Zip: Denver, CO 80205', 70, 335);
    ctx.fillText('Account Type: Residential Multi-Dwelling Unit (MDU)', 70, 360);

    // Plan Card
    ctx.fillStyle = '#27272a';
    ctx.fillRect(470, 175, 380, 210);
    ctx.strokeStyle = '#3f3f46';
    ctx.strokeRect(470, 175, 380, 210);

    ctx.fillStyle = '#c084fc';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.fillText('SELECTED FIBER PACKAGE', 490, 205);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.fillText('Quantum Fiber 2 Gig', 490, 235);

    ctx.fillStyle = '#4ade80';
    ctx.font = 'bold 24px system-ui, sans-serif';
    ctx.fillText('$100.00 / month', 490, 270);

    ctx.fillStyle = '#d4d4d8';
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillText('• 2000 Mbps Multi-Gig Symmetrical Stream', 490, 300);
    ctx.fillText('• 360 WiFi Mesh Pods (x2) Included', 490, 325);
    ctx.fillText('• Price For Life Guarantee - No Contracts', 490, 350);

    // Install Appointment
    ctx.fillStyle = '#241442';
    ctx.fillRect(50, 410, 800, 120);
    ctx.strokeStyle = '#7c3aed';
    ctx.strokeRect(50, 410, 800, 120);

    ctx.fillStyle = '#c084fc';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.fillText('TECHNICIAN DISPATCH APPOINTMENT', 70, 440);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.fillText(`Date: ${dispatchDate}  |  Arrival Window: 1:00 PM - 5:00 PM`, 70, 470);

    ctx.fillStyle = '#e4e4e7';
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillText('Technician Dispatch Notes: Customer requested SmartNID inside living room media closet.', 70, 498);

    // Footer
    ctx.fillStyle = '#71717a';
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText('Eclipse Sales Agent Authorized Entry  •  Hub: CO-DEN-02  •  Order Status: SCHEDULED', 70, 580);
    ctx.fillText('Quantum Fiber Portal v4.12.0  •  FSA ID: 8829419  •  Drop Type: Fiber to the Home (FTTH)', 70, 605);
  }

  return canvas.toDataURL('image/png');
};

export const SAMPLE_RECEIPTS: SampleReceipt[] = [
  {
    id: 'att',
    carrierName: 'AT&T Fiber',
    crmName: 'AT&T OPUS Portal',
    accentColor: '#00a3e0',
    orderNumber: 'ATT-894210-TX',
    customerName: 'Johnathan Davis (Dallas, TX)',
    description: '1 Gig Fiber Symmetrical ($80/mo) - OPUS Direct Order Screen',
    generateDataUrl: () => generateSampleReceiptImage('att'),
  },
  {
    id: 'frontier',
    carrierName: 'Frontier Fiber',
    crmName: 'Frontier Partner Hub',
    accentColor: '#f43f5e',
    orderNumber: 'FR-993214',
    customerName: 'Elena Vance (Tampa, FL)',
    description: '500 Mbps Fiber ($59.99/mo) - Partner Portal Receipt',
    generateDataUrl: () => generateSampleReceiptImage('frontier'),
  },
  {
    id: 'quantum',
    carrierName: 'Quantum Fiber',
    crmName: 'Quantum Fiber Hub',
    accentColor: '#c084fc',
    orderNumber: 'QF-7401928',
    customerName: 'Marcus Sterling (Denver, CO)',
    description: '2 Gig Hyper-Gig ($100/mo) - Fulfillment Screen',
    generateDataUrl: () => generateSampleReceiptImage('quantum'),
  },
];
