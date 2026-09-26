import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { OrderStatus } from '../types';
import { X, Plus, DollarSign, Calendar, MapPin, Zap, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface NewSaleModalProps {
  onClose: () => void;
}

export const NewSaleModal: React.FC<NewSaleModalProps> = ({ onClose }) => {
  const { currentUser } = useAuth();
  const { addSaleOrder, blitzes } = useData();

  const todayStr = new Date().toISOString().split('T')[0];
  const nextWeekStr = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('TX');
  const [zipCode, setZipCode] = useState('');
  const [ispProgram, setIspProgram] = useState('AT&T Fiber');
  const [speedTier, setSpeedTier] = useState('1 Gig');
  const [orderDate, setOrderDate] = useState(todayStr);
  const [installDate, setInstallDate] = useState(nextWeekStr);
  const [status, setStatus] = useState<OrderStatus>('scheduled');
  const [blitzId, setBlitzId] = useState<string>('');
  const [notes, setNotes] = useState('');

  // Calculate estimated commission payout based on rep's pay rate
  const estimatedPayout = currentUser?.payRates?.[ispProgram] || 250;

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
      orderDate,
      installDate,
      status,
      payout: estimatedPayout,
      blitzId: blitzId || undefined,
      blitzName: selectedBlitz?.title,
      notes: notes || undefined,
    });

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto space-y-4 sm:space-y-5 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div>
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
            Field Order Entry
          </span>
          <h2 className="text-xl font-black text-white mt-0.5">Log New Fiber Sale</h2>
          <p className="text-xs text-slate-400">
            Record customer details, assign dispatch schedule, and calculate commission.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          {/* Customer Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Customer Full Name</label>
              <input
                type="text"
                required
                placeholder="First & Last Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Customer Phone Number</label>
              <input
                type="tel"
                required
                placeholder="(555) 000-0000"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Customer Email */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Customer Email (Optional)</label>
            <input
              type="email"
              placeholder="customer@email.com"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Address Details */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Street Address</label>
            <input
              type="text"
              required
              placeholder="1234 Fiber Optic Trail"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
            <div className="col-span-1">
              <label className="text-xs font-bold text-slate-300 block mb-1">City</label>
              <input
                type="text"
                required
                placeholder="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">State</label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                {['TX', 'FL', 'NC', 'AZ', 'OH', 'GA', 'TN', 'SC', 'IN', 'NV'].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Zip Code</label>
              <input
                type="text"
                required
                placeholder="75001"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* ISP Program & Speed Tier */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Carrier / ISP Program</label>
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
              <label className="text-xs font-bold text-slate-300 block mb-1">Speed Tier</label>
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
          </div>

          {/* Dates & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Order Date</label>
              <input
                type="date"
                required
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Install Dispatch Date</label>
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
            <label className="text-xs font-bold text-slate-300 block mb-1">Dispatch Notes</label>
            <input
              type="text"
              placeholder="e.g. Customer wants ONT in garage. Free install confirmed."
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
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20"
            >
              Confirm & Submit Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
