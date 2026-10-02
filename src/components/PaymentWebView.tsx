import { IS_TEST_MODE, PAYMENT_ENABLED } from '../config';
import React, { useState } from 'react';
import { X, ShieldCheck, CheckCircle2, ExternalLink, Copy, Check, RefreshCw } from 'lucide-react';
import { UPI_ID, approvePaymentInFirebase, savePaymentToFirebase } from '../lib/firebase';

interface PaymentWebViewProps {
  isOpen: boolean;
  total: number;
  planName?: string;
  groupId?: string;
  count?: number;
  onClose: () => void;
  onSuccess: (utr: string) => void;
}

export const PaymentWebView: React.FC<PaymentWebViewProps> = ({
  isOpen,
  total,
  planName = 'Safety License',
  groupId,
  count = 1,
  onClose,
  onSuccess
}) => {
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [manualUtr, setManualUtr] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [viewMode, setViewMode] = useState<'gateway' | 'upi'>('gateway');

  if (!isOpen) return null;

  if (IS_TEST_MODE || !PAYMENT_ENABLED) {
    return (
      <div 
        id="payment-webview-modal"
        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
      >
        <div className="bg-[#0A1931] border border-amber-400/50 rounded-2xl w-full max-w-sm p-6 shadow-2xl text-slate-100 text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-amber-400/20 text-amber-400 flex items-center justify-center border border-amber-400/50 text-2xl">
            🧪
          </div>
          <div>
            <h3 className="text-base font-black text-white font-mono">TEST MODE ACTIVE</h3>
            <p className="text-xs text-amber-300 mt-1 font-mono">Payment Gateway Disabled</p>
            <p className="text-[11px] text-slate-400 mt-2">
              All groups and members are 100% free for testing. No real transaction needed.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              onSuccess("TEST-FREE-UTR");
              onClose();
            }}
            className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-black font-black text-xs rounded-xl shadow-lg transition active:scale-95 cursor-pointer font-mono"
          >
            Activate Free (Test Mode) →
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-[11px] text-slate-400 hover:text-white"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  const razorpayUrl = `https://razorpay.me/@bharatmitrainfotech?amount=${total * 100}`;
  const upiLink = `upi://pay?pa=${UPI_ID}&pn=TrackMitra&am=${total}&cu=INR&tn=TrackMitra%20Safety%20License`;

  const handleCopyUpi = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(UPI_ID);
    }
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleConfirmPaid = async () => {
    setIsVerifying(true);
    const generatedUtr = manualUtr.trim() || `UTR${Date.now().toString().slice(-8)}`;
    
    // Save to payments
    await savePaymentToFirebase(generatedUtr, UPI_ID, {
      amount: total,
      count,
      groupId
    });

    // Auto approve for instant activation
    await approvePaymentInFirebase(generatedUtr, {
      amount: total,
      membersCount: count,
      groupId
    });

    setIsVerifying(false);
    onSuccess(generatedUtr);
    onClose();
  };

  return (
    <div 
      id="payment-webview-modal"
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4"
    >
      <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl w-full max-w-lg h-[92vh] max-h-[720px] flex flex-col shadow-2xl overflow-hidden animate-scaleUp text-slate-100">
        {/* Modal Header */}
        <div className="px-4 py-3 bg-[#000066] border-b border-blue-900/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-300">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black text-white uppercase tracking-wider">
                In-App Secure Checkout
              </h3>
              <p className="text-[10px] text-emerald-300 font-mono">
                {planName} • ₹{total}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-900/80 p-0.5 rounded-lg border border-slate-700 text-[10px] font-bold">
              <button 
                type="button"
                onClick={() => setViewMode('gateway')}
                className={`px-2 py-0.5 rounded ${viewMode === 'gateway' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400'}`}
              >
                Card / NetBanking
              </button>
              <button 
                type="button"
                onClick={() => setViewMode('upi')}
                className={`px-2 py-0.5 rounded ${viewMode === 'upi' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400'}`}
              >
                Direct UPI
              </button>
            </div>

            <button 
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 relative bg-slate-950 flex flex-col overflow-hidden">
          {viewMode === 'gateway' ? (
            <div className="w-full h-full flex flex-col relative">
              <iframe
                id="razorpay-webview-frame"
                src={razorpayUrl}
                title="Payment Gateway"
                className="w-full flex-1 border-0 bg-white"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              />

              {/* In-Frame Status Bar & Completion Fallback */}
              <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-2 shrink-0">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-slate-200 truncate">
                    Payment Gateway (Razorpay Secured)
                  </p>
                  <p className="text-[9px] text-slate-400 font-mono">
                    Completed on frame or UPI? Tap to verify
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleConfirmPaid}
                  disabled={isVerifying}
                  className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow flex items-center gap-1.5 shrink-0 active:scale-95 transition"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isVerifying ? 'Confirming...' : 'I Have Paid ₹' + total}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-5 flex-1 flex flex-col items-center justify-center space-y-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg">
                <ShieldCheck className="w-8 h-8" />
              </div>

              <div>
                <h4 className="text-base font-black text-white">Direct UPI Payment</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Transfer ₹{total} to official owner UPI
                </p>
              </div>

              {/* UPI Copy Box */}
              <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                <span className="font-mono text-emerald-400 font-bold text-xs">
                  {UPI_ID}
                </span>
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg flex items-center gap-1 transition"
                >
                  {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedUpi ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Direct UPI Intent Link */}
              <a
                href={upiLink}
                className="w-full max-w-sm py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow transition"
              >
                <span>Launch UPI App (GPay / PhonePe / Paytm)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              {/* UTR Input */}
              <div className="w-full max-w-sm space-y-1.5 text-left">
                <label className="text-[10px] text-slate-400 font-semibold">
                  12-Digit UTR (Optional for instant activation):
                </label>
                <input
                  type="text"
                  maxLength={12}
                  value={manualUtr}
                  onChange={(e) => setManualUtr(e.target.value.replace(/\s+/g, ''))}
                  placeholder="Enter 12-digit UTR"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="button"
                onClick={handleConfirmPaid}
                disabled={isVerifying}
                className="w-full max-w-sm py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isVerifying ? 'Activating...' : 'Confirm & Activate 24h License'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
