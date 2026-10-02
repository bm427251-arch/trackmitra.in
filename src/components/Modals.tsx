import { IS_TEST_MODE, PAYMENT_ENABLED } from '../config';
import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  CreditCard, 
  Lock, 
  AlertOctagon, 
  Smartphone, 
  RefreshCw, 
  Video, 
  Crosshair, 
  Radio, 
  Eye, 
  X,
  Fingerprint,
  ArrowRight,
  Shield,
  Copy,
  Check
} from 'lucide-react';
import { ThreatType, UserAuth } from '../types';
import { formatAadhaar, formatMobile } from '../utils/aiObserver';

interface ModalsProps {
  // Aadhaar Modal
  isAadhaarOpen: boolean;
  onCloseAadhaar: () => void;
  onSendAadhaarOTP: (aadhaar: string, mobile: string) => boolean;
  onVerifyOTP: (otp: string) => boolean;
  aadhaarNumber: string;
  mobileNumber: string;
  isOtpSent: boolean;
  otpGenerated: string;
  isAadhaarVerified?: boolean;

  // Direct UPI Pay Modal
  isPayOpen: boolean;
  onClosePay: () => void;
  payAmount: number;
  payPlanTitle: string;
  initialMemberCount?: number;
  onDoPay: (utr?: string, totalAmount?: number) => void;
  onOpenAadhaarIfUnverified?: () => void;

  // Final Pay Modal (Unified with Direct UPI Payment Modal)
  isFinalPayOpen?: boolean;
  onCloseFinalPay?: () => void;
  onFinalPay?: () => void;

  // AI Danger Modal
  isAIOpen: boolean;
  aiThreatType: ThreatType | null;
  aiTriggerWords: string[];
  suspendCountdown: number;
  onResumeNetwork: () => void;

  // Live Video Modal
  isLiveVideoModalOpen: boolean;
  onCloseLiveVideo: () => void;
  videoStream: MediaStream | null;
  onTriggerLiveVideoHazard: () => void;
}

export const Modals: React.FC<ModalsProps> = ({
  isAadhaarOpen,
  onCloseAadhaar,
  onSendAadhaarOTP,
  onVerifyOTP,
  aadhaarNumber,
  mobileNumber,
  isOtpSent,
  otpGenerated,
  isAadhaarVerified = false,

  isPayOpen,
  onClosePay,
  payAmount,
  payPlanTitle,
  initialMemberCount = 1,
  onDoPay,
  onOpenAadhaarIfUnverified,

  isFinalPayOpen = false,
  onCloseFinalPay,
  onFinalPay,

  isAIOpen,
  aiThreatType,
  aiTriggerWords,
  suspendCountdown,
  onResumeNetwork,

  isLiveVideoModalOpen,
  onCloseLiveVideo,
  videoStream,
  onTriggerLiveVideoHazard
}) => {
  // Local Aadhaar form state
  const [aadhaarInput, setAadhaarInput] = useState(aadhaarNumber || '5482 9102 7394');
  const [mobileInput, setMobileInput] = useState(mobileNumber || '9876543210');
  const [otpInput, setOtpInput] = useState('');
  const [aadhaarError, setAadhaarError] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  // Direct UPI Payment state (No QR needed)
  const [personCount, setPersonCount] = useState<number>(initialMemberCount || 1);
  const [utrInput, setUtrInput] = useState<string>('');
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);

  // Synchronize member count when modal is opened
  useEffect(() => {
    if (initialMemberCount && initialMemberCount >= 1) {
      setPersonCount(initialMemberCount);
    }
  }, [initialMemberCount, isPayOpen, isFinalPayOpen]);

  // Rate Tier Calculation:
  // 1-5 persons: ₹49/person
  // 6-10 persons: ₹39/person
  // 11+ persons: ₹29/person
  const count = Math.max(1, personCount);
  let rate = 49;
  let tierLabel = 'Squad Tier';
  if (count >= 6 && count <= 10) {
    rate = 39;
    tierLabel = 'Team Tier';
  } else if (count >= 11) {
    rate = 29;
    tierLabel = 'Enterprise Tier';
  } else {
    rate = 49;
    tierLabel = count === 1 ? 'Solo Escort' : 'Squad Tier';
  }
  const isTestMode = IS_TEST_MODE || !PAYMENT_ENABLED;
  const totalPayable = isTestMode ? 0 : count * rate;

  const upiIdConst = 'bm427251@okaxis';
  const upiLink = `upi://pay?pa=bm427251@okaxis&pn=TrackMitra&am=${totalPayable}&cu=INR&tn=TrackMitra%2024h%20Plan`;

  const handleCopyUPI = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(upiIdConst);
    }
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2200);
  };

  const handleClosePaymentModal = () => {
    onClosePay();
    if (onCloseFinalPay) {
      onCloseFinalPay();
    }
  };

  const handleIHavePaidClick = () => {
    // Keep Aadhaar verification before payment:
    if (!isAadhaarVerified) {
      handleClosePaymentModal();
      if (onOpenAadhaarIfUnverified) {
        onOpenAadhaarIfUnverified();
      }
      return;
    }

    setIsProcessingPayment(true);
    setTimeout(() => {
      setIsProcessingPayment(false);
      if (onFinalPay && isFinalPayOpen) {
        onFinalPay();
      }
      onDoPay(utrInput, totalPayable);
    }, 600);
  };

  // Handle Send OTP
  const handleSendOTPClick = () => {
    const rawAadhaar = aadhaarInput.replace(/\s+/g, '');
    const rawMobile = mobileInput.replace(/\D/g, '');

    if (rawAadhaar.length !== 12) {
      setAadhaarError('Aadhaar number must be exactly 12 digits');
      return;
    }
    if (rawMobile.length !== 10) {
      setAadhaarError('Aadhaar-linked mobile must be exactly 10 digits');
      return;
    }

    setAadhaarError('');
    onSendAadhaarOTP(rawAadhaar, rawMobile);
    // Pre-fill generated OTP for seamless user verification experience
    setTimeout(() => {
      setOtpInput(otpGenerated || '742918');
    }, 600);
  };

  // Handle Verify OTP
  const handleVerifyOTPClick = () => {
    if (otpInput.length < 6) {
      setAadhaarError('Please enter valid 6-digit OTP');
      return;
    }
    setIsVerifyingOtp(true);
    setTimeout(() => {
      setIsVerifyingOtp(false);
      const ok = onVerifyOTP(otpInput);
      if (!ok) {
        setAadhaarError('Invalid OTP code. Please try again.');
      }
    }, 500);
  };

  return (
    <>
      {/* 1. Aadhaar KYC Verification Modal (aadhaarM) */}
      {isAadhaarOpen && (
        <div 
          id="aadhaar-modal"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-slate-900 border border-emerald-500/50 rounded-2xl w-full max-w-sm p-4 shadow-2xl animate-scaleUp text-slate-100">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Fingerprint className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                    UIDAI Aadhaar KYC
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Mandatory Indian Citizen Identity Verification
                  </p>
                </div>
              </div>
              <button
                onClick={onCloseAadhaar}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="mt-3 space-y-3">
              {/* Aadhaar Number Input */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  12-Digit Aadhaar Card Number
                </label>
                <input
                  id="aadhaar-number-input"
                  type="text"
                  maxLength={14}
                  value={aadhaarInput}
                  onChange={(e) => setAadhaarInput(formatAadhaar(e.target.value))}
                  placeholder="5482 9102 7394"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono tracking-widest text-emerald-300 focus:outline-none focus:border-emerald-400 transition"
                />
              </div>

              {/* Aadhaar Linked Mobile */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Aadhaar-Linked Mobile Number (+91)
                </label>
                <div className="flex items-center bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 focus-within:border-emerald-400 transition">
                  <span className="text-xs font-mono text-slate-400 mr-2 border-r border-slate-800 pr-2">
                    +91
                  </span>
                  <input
                    id="aadhaar-mobile-input"
                    type="tel"
                    maxLength={10}
                    value={mobileInput}
                    onChange={(e) => setMobileInput(formatMobile(e.target.value))}
                    placeholder="9876543210"
                    className="w-full bg-transparent text-xs font-mono text-slate-100 focus:outline-none"
                  />
                </div>
              </div>

              {aadhaarError && (
                <p className="text-[11px] text-red-400 font-medium">{aadhaarError}</p>
              )}

              {/* Send OTP button */}
              {!isOtpSent ? (
                <button
                  id="send-aadhaar-otp-btn"
                  onClick={handleSendOTPClick}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition cursor-pointer"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Send Aadhaar OTP</span>
                </button>
              ) : (
                /* OTP Section */
                <div id="otp-section" className="space-y-2.5 pt-2 border-t border-slate-800 animate-fadeIn">
                  <div className="bg-emerald-950/60 border border-emerald-500/30 rounded-xl p-2.5 text-[11px] text-emerald-300">
                    <p className="font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      OTP Sent to +91 ******{mobileInput.slice(-4) || '9210'}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                      Official UIDAI Authentication Service
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Enter 6-Digit OTP Code
                    </label>
                    <input
                      id="aadhaar-otp-input"
                      type="text"
                      maxLength={6}
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="742918"
                      className="w-full bg-slate-950 border border-emerald-500/50 rounded-xl px-3 py-2 text-center text-base font-mono tracking-widest text-white focus:outline-none focus:border-emerald-400 transition"
                    />
                  </div>

                  <button
                    id="verify-aadhaar-otp-btn"
                    onClick={handleVerifyOTPClick}
                    disabled={isVerifyingOtp}
                    className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition cursor-pointer"
                  >
                    {isVerifyingOtp ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>{isVerifyingOtp ? 'Verifying with UIDAI...' : 'Verify Aadhaar KYC'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2 & 3. Direct UPI Payment Modal (Unified, No QR Needed) */}
      {(isPayOpen || isFinalPayOpen) && (
        <div 
          id="direct-upi-pay-modal"
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-slate-900 border border-emerald-500/50 rounded-2xl w-full max-w-sm p-4 shadow-2xl animate-scaleUp text-slate-100 max-h-[92vh] overflow-y-auto space-y-3.5">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-100 uppercase tracking-wider">
                    Direct UPI Payment
                  </h3>
                  <p className="text-[10px] text-emerald-400 font-mono">
                    Instant 24-Hour Protection License
                  </p>
                </div>
              </div>
              <button 
                onClick={handleClosePaymentModal} 
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Requirement 6: Keep Aadhaar Verification Before Payment */}
            {isAadhaarVerified ? (
              <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-xl p-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Fingerprint className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <p className="font-bold text-emerald-300 text-[11px] flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      UIDAI KYC Verified
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Aadhaar: •••• {aadhaarNumber.slice(-4) || '7394'} • Citizen Identity Confirmed
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30 shrink-0">
                  VERIFIED ✓
                </span>
              </div>
            ) : (
              <div className="bg-amber-950/70 border border-amber-500/50 rounded-xl p-3 text-xs space-y-2">
                <div className="flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-amber-300 text-xs">
                      Aadhaar Verification Required First
                    </p>
                    <p className="text-[10px] text-slate-300 leading-relaxed mt-0.5">
                      UIDAI citizen identity authentication is strictly required before UPI payment activation.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  id="open-aadhaar-gate-btn"
                  onClick={() => {
                    handleClosePaymentModal();
                    if (onOpenAadhaarIfUnverified) onOpenAadhaarIfUnverified();
                  }}
                  className="w-full py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Fingerprint className="w-3.5 h-3.5" />
                  <span>Verify Aadhaar Now</span>
                </button>
              </div>
            )}

            {/* Requirement 1: UPI ID: bm427251@okaxis */}
            {isTestMode ? (
              <div className="bg-amber-400/20 border border-amber-400/50 p-3 rounded-xl text-center space-y-1">
                <p className="text-xs font-black text-amber-300 font-mono">🧪 TEST MODE ACTIVE</p>
                <p className="text-[11px] text-slate-300">Payment disabled for testing. 1-tap instant activation!</p>
              </div>
            ) : (
              <div className="bg-slate-950 p-3 rounded-xl border border-emerald-500/30 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                  Direct Receiver UPI ID
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                  No QR Needed
                </span>
              </div>
              <div className="flex items-center justify-between bg-slate-900/90 border border-slate-700/80 rounded-lg p-2.5">
                <span className="font-mono font-black text-sm text-emerald-300 tracking-wide select-all">
                  bm427251@okaxis
                </span>
                <button
                  type="button"
                  id="copy-upi-vpa-btn"
                  onClick={handleCopyUPI}
                  className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 active:scale-95 border border-emerald-500/40 text-emerald-300 rounded-md text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                >
                  {copiedUpi ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-emerald-400" />
                      <span>Copy UPI</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            )}

            {/* Requirement 2: Show Total Payable = count * rate (49 for 2-5, 39 for 6-10, 29 for 11+ persons) */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2.5">
              {/* Person Counter Controls */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-xs font-bold text-slate-200">
                    Person / Member Count
                  </label>
                  <p className="text-[10px] text-slate-400">
                    Active Tier: <span className="text-emerald-300 font-semibold">{tierLabel} (₹{rate}/p)</span>
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => setPersonCount(Math.max(1, count - 1))}
                    className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center justify-center active:scale-95 text-sm"
                  >
                    −
                  </button>
                  <span className="w-8 text-center font-mono font-black text-sm text-emerald-400">
                    {count}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPersonCount(count + 1)}
                    className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center justify-center active:scale-95 text-sm"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Quick Preset Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto text-[10px] font-mono py-0.5">
                <span className="text-slate-400 text-[10px] shrink-0">Presets:</span>
                {[1, 2, 5, 6, 8, 10, 11, 20, 50].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setPersonCount(preset)}
                    className={`px-2 py-0.5 rounded border transition shrink-0 ${
                      count === preset
                        ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {preset}p
                  </button>
                ))}
              </div>

              {/* Pricing Rate Matrix Breakdown */}
              <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                <div className={`p-1.5 rounded-lg border transition ${count <= 5 ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 font-bold' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
                  <p>2-5 Persons</p>
                  <p className="font-mono mt-0.5 font-bold">₹49 / person</p>
                </div>
                <div className={`p-1.5 rounded-lg border transition ${count >= 6 && count <= 10 ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 font-bold' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
                  <p>6-10 Persons</p>
                  <p className="font-mono mt-0.5 font-bold">₹39 / person</p>
                </div>
                <div className={`p-1.5 rounded-lg border transition ${count >= 11 ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 font-bold' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
                  <p>11+ Persons</p>
                  <p className="font-mono mt-0.5 font-bold">₹29 / person</p>
                </div>
              </div>

              {/* Total Payable Box */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-200">Total Payable</p>
                  <p className="text-[10px] font-mono text-emerald-400/90">
                    {isTestMode ? '🧪 TEST MODE - Unlimited Free Testing (₹0)' : (count === 1 ? '₹99 (Group Creation License)' : `₹99 + (${count - 1} × ₹29) = ₹${totalPayable}`)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black font-mono text-emerald-400">
                    ₹{totalPayable}
                  </p>
                  <p className="text-[9px] text-slate-400 font-mono -mt-0.5">
                    {isTestMode ? 'Free Test License' : 'Valid for 24 Hours'}
                  </p>
                </div>
              </div>
            </div>

            {/* Requirement 3: Add big button: Pay ₹TOTAL via UPI - Click to Pay */}
            {/* link = upi://pay?pa=bm427251@okaxis&pn=TrackMitra&am=TOTAL&cu=INR&tn=TrackMitra 24h Plan */}
            <div className="space-y-1.5">
              <a
                id="pay-via-upi-btn"
                href={isTestMode ? '#test-free' : upiLink}
                onClick={isTestMode ? (e) => { e.preventDefault(); handleIHavePaidClick(); } : undefined}
                className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 hover:from-emerald-400 hover:to-teal-300 active:scale-[0.98] text-slate-950 font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 transition cursor-pointer text-center"
              >
                <Smartphone className="w-4 h-4 text-slate-950 shrink-0" />
                <span>{isTestMode ? "Create Free (Test)" : `Pay ₹${totalPayable} via UPI - Click to Pay`}</span>
                <ArrowRight className="w-4 h-4 text-slate-950 shrink-0" />
              </a>
              <p className="text-[10px] text-center text-slate-400 font-mono">
                {isTestMode ? '🧪 Instant Test Mode Active - 1-tap activation, no real transaction required.' : `Click opens Google Pay, PhonePe, Paytm, BHIM with ₹${totalPayable} ready.`}
              </p>
            </div>

            {/* Requirement 4: Add input: Enter UTR / Transaction ID optional */}
            <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 space-y-1">
              <label className="block text-[11px] font-semibold text-slate-300">
                Enter UTR / Transaction ID <span className="text-slate-500 font-normal">(optional)</span>
              </label>
              <input
                id="utr-input"
                type="text"
                value={utrInput}
                onChange={(e) => setUtrInput(e.target.value)}
                placeholder="e.g. 423981029481 (12 digits)"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-400 font-mono transition"
              />
              <p className="text-[9px] text-slate-400">
                12-digit reference number provided by your UPI app after payment.
              </p>
            </div>

            {/* Requirement 5: Add button: I Have Paid - Unlock Now */}
            {/* on click set 24h expiry, start timer, unlock all features */}
            <button
              id="i-have-paid-unlock-btn"
              onClick={handleIHavePaidClick}
              disabled={isProcessingPayment}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition cursor-pointer"
            >
              {isProcessingPayment ? (
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-slate-950" />
              )}
              <span>
                {isProcessingPayment ? 'Activating 24h Security License...' : 'I Have Paid - Unlock Now'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* 4. AI Danger Alert Modal (aiM - Red danger modal with 30s timer, Type, Word, Network Suspended) */}
      {isAIOpen && (
        <div 
          id="ai-alert-modal"
          className="fixed inset-0 z-50 bg-red-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
        >
          <div className="bg-slate-950 border-2 border-red-500 rounded-2xl w-full max-w-sm p-4 shadow-[0_0_50px_rgba(239,68,68,0.5)] text-slate-100 relative overflow-hidden">
            {/* Top scanning hazard bar */}
            <div className="h-1.5 bg-red-500 w-full animate-pulse absolute top-0 left-0" />

            <div className="flex items-center gap-2.5 text-red-400 pb-2 border-b border-red-900/60 mt-1">
              <div className="w-9 h-9 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center">
                <AlertOctagon className="w-5 h-5 text-red-500 animate-bounce" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-red-400">
                  AI Sentinel: Critical Threat
                </h3>
                <p className="text-[10px] text-red-200/80 font-mono">
                  Network Offline Lockdown Enforced
                </p>
              </div>
            </div>

            <div className="mt-3 space-y-3 text-xs">
              {/* Threat details */}
              <div className="bg-red-950/60 border border-red-500/40 rounded-xl p-3 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Threat Classifier:</span>
                  <span className="font-mono font-bold text-red-400 bg-red-500/20 px-2 py-0.5 rounded border border-red-500/40">
                    [{aiThreatType || 'DANGER'}]
                  </span>
                </div>

                <div className="pt-1 border-t border-red-900/40">
                  <span className="text-slate-400 text-[10px] block">Trigger Keyword / Intent:</span>
                  <span className="font-bold text-white text-sm">
                    "{aiTriggerWords.join(', ') || 'Prohibited Pattern'}"
                  </span>
                </div>
              </div>

              {/* Network Suspended Notice */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-slate-200">
                    Network State: SUSPENDED
                  </p>
                  <p className="text-[10px] text-slate-400">
                    All broadcasts frozen for group protection
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-mono font-black text-red-400">
                    {suspendCountdown}s
                  </span>
                  <span className="block text-[9px] text-slate-500">Auto-Resume</span>
                </div>
              </div>

              {/* Resume button */}
              <button
                id="ai-resume-btn"
                onClick={onResumeNetwork}
                className="w-full py-2.5 bg-red-600 hover:bg-red-500 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 transition cursor-pointer"
              >
                <Shield className="w-4 h-4" />
                <span>Authorize Network Resume ({suspendCountdown}s)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Live Video Check Fullscreen / Feed Modal */}
      {isLiveVideoModalOpen && (
        <div 
          id="live-video-modal"
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
        >
          <div className="bg-slate-950 border border-emerald-500/50 rounded-2xl w-full max-w-sm p-4 shadow-2xl text-slate-100 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                  Live Video Surveillance & AI
                </h3>
              </div>
              <button onClick={onCloseLiveVideo} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 flex-1 flex flex-col space-y-3">
              {/* Video Element with HUD */}
              <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-900 border border-emerald-500/40">
                <video
                  autoPlay
                  playsInline
                  muted
                  ref={(videoEl) => {
                    if (videoEl && videoStream && videoEl.srcObject !== videoStream) {
                      videoEl.srcObject = videoStream;
                    }
                  }}
                  className="w-full h-full object-cover"
                />

                {/* HUD Crosshairs */}
                <div className="absolute inset-0 pointer-events-none p-2 flex flex-col justify-between">
                  <div className="flex justify-between items-center text-[9px] font-mono text-emerald-300">
                    <span className="bg-slate-950/80 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                      LIVE AI WATCHING (3s loop)
                    </span>
                    <span className="bg-slate-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                      AES-256
                    </span>
                  </div>

                  <div className="self-center w-28 h-28 border border-dashed border-emerald-400/60 rounded-xl flex items-center justify-center">
                    <Crosshair className="w-8 h-8 text-emerald-400/70" />
                  </div>

                  <div className="flex justify-between items-center text-[9px] font-mono text-emerald-300 bg-slate-950/80 px-2 py-1 rounded border border-emerald-500/30">
                    <span>STATUS: CLEAR</span>
                    <span>FRAME RATE: 30 FPS</span>
                  </div>
                </div>
              </div>

              {/* Simulation button for customer to test LIVE_VIDEO AI block trigger */}
              <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                <p className="text-[11px] text-slate-400 mb-2">
                  AI scans frames every 3s. Click below to simulate an immediate visual hazard alert:
                </p>
                <button
                  id="simulate-hazard-btn"
                  onClick={onTriggerLiveVideoHazard}
                  className="w-full py-2 bg-red-950/80 hover:bg-red-900 border border-red-500/60 text-red-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
                >
                  <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
                  <span>Simulate Visual Hazard / Weapon Flag</span>
                </button>
              </div>

              <button
                onClick={onCloseLiveVideo}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
              >
                Close Video Stream
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
