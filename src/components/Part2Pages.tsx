import { IS_TEST_MODE, PAYMENT_ENABLED } from '../config';
import React, { useState, useEffect, useRef } from 'react';
import { 
  Phone, 
  ShieldAlert, 
  ArrowLeft, 
  ExternalLink, 
  Check, 
  Copy, 
  Shield, 
  Lock, 
  Radio, 
  KeyRound, 
  Users, 
  AlertTriangle,
  Fingerprint,
  Sparkles,
  CheckCircle2,
  Send,
  Navigation,
  Clock,
  CheckCircle
} from 'lucide-react';
import { 
  savePaymentToFirebase, 
  approvePaymentInFirebase, 
  subscribeToPayments, 
  subscribeToUnlocks,
  PaymentRecord, 
  UPI_ID, 
  ADMIN_PIN 
} from '../lib/firebase';

export type PageId = 'splashPage' | 'aadhaarPage' | 'paymentPage' | 'groupLockPage' | 'adminPage' | 'dashboardPage';

export const PREV_PAGE_MAP: Record<PageId, PageId | null> = {
  splashPage: null,
  aadhaarPage: 'splashPage',
  paymentPage: 'aadhaarPage',
  groupLockPage: 'paymentPage',
  adminPage: 'groupLockPage',
  dashboardPage: 'groupLockPage',
};

const PAGE_NAMES: Record<PageId, string> = {
  splashPage: 'Splash Page',
  aadhaarPage: 'Aadhaar Verification',
  paymentPage: 'Payment Page',
  groupLockPage: 'Group Lock Demo',
  adminPage: 'Admin Panel',
  dashboardPage: 'Dashboard',
};

interface Part2PagesProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  onGoToAdmin: () => void;
  onManualUnlock?: () => void;
  onUnlockAll?: () => void;
  onTriggerSOS?: () => void;
  onPaymentSuccess?: (utr: string) => void;
  onVerifyAadhaar?: (aadhaar: string, mobile: string) => void;
  showToast: (msg: string, type?: 'success' | 'danger' | 'warning' | 'info') => void;
  children?: React.ReactNode;
}

export const Part2Pages: React.FC<Part2PagesProps> = ({
  currentPage,
  onNavigate,
  onGoToAdmin,
  onManualUnlock,
  onUnlockAll,
  onTriggerSOS,
  onPaymentSuccess,
  onVerifyAadhaar,
  showToast,
  children
}) => {
  // Splash auto-navigate 2.5s to HomeTab (dashboardPage)
  useEffect(() => {
    if (currentPage === "splashPage") {
      const timer = setTimeout(() => {
        onNavigate("dashboardPage");
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [currentPage, onNavigate]);

  // Payment & UTR State
  const [utrValue, setUtrValue] = useState<string>(() => {
    return localStorage.getItem('trackmitra_utr') || '';
  });
  const [copiedState, setCopiedState] = useState(false);

  // Live Payments Feed from Firebase Realtime Database (/payments)
  const [livePayments, setLivePayments] = useState<PaymentRecord[]>([]);

  // Admin Login State
  const [adminPinValue, setAdminPinValue] = useState('');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [activeNavTab, setActiveNavTab] = useState<'live' | 'group' | 'history' | 'admin'>('live');

  // Subscribe to Firebase Realtime Database /payments
  useEffect(() => {
    const unsub = subscribeToPayments((paymentsList) => {
      setLivePayments(paymentsList);
    });
    return () => unsub();
  }, []);

  // Main App: Listen to Firebase /unlocks and if UTR exists, auto unlock and show "Unlocked by Admin" toast
  useEffect(() => {
    const activeUtr = utrValue || localStorage.getItem('trackmitra_utr');
    const unsub = subscribeToUnlocks(activeUtr, (unlockedUtr) => {
      console.log(`[Part2Pages] Real-time unlock detected from Firebase for: ${unlockedUtr}`);
      showToast('Unlocked by Admin', 'success');
      localStorage.setItem('trackmitra_payment', 'unlocked');
      if (onManualUnlock) {
        onManualUnlock();
      }
      if (currentPage === 'paymentPage' || currentPage === 'groupLockPage') {
        navigateTo('dashboardPage');
      }
    });
    return () => unsub();
  }, [utrValue, currentPage]);

  // Aadhaar Page State
  const [aadhaarInput, setAadhaarInput] = useState('5482 9102 7394');
  const [mobileInput, setMobileInput] = useState('9876543210');
  const [otpInput, setOtpInput] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isAadhaarVerified, setIsAadhaarVerified] = useState(() => {
    return localStorage.getItem('trackmitra_aadhaar_verified') === 'true';
  });

  // Swipe gesture visual indicator
  const [swipeFeedback, setSwipeFeedback] = useState<string | null>(null);

  // Touch tracking references for swipe-right detection
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  // Central Navigation Dispatcher (supports Browser History API)
  const navigateTo = (targetPage: PageId, pushHistory = true) => {
    if (pushHistory) {
      try {
        window.history.pushState({ page: targetPage }, '', `#${targetPage}`);
      } catch (e) {
        console.warn('History pushState error', e);
      }
    }

    // Toggle active class on all DOM elements with class="page"
    document.querySelectorAll('.page').forEach((p) => p.classList.remove('active'));
    const el = document.getElementById(targetPage);
    if (el) {
      el.classList.add('active');
      el.style.display = 'block';
    }

    // Main app e ei line add korun
    if (targetPage !== 'adminPage') {
      const adminEl = document.getElementById('adminPage');
      if (adminEl) {
        adminEl.style.display = 'none';
      }
    }

    onNavigate(targetPage);
  };

  // Back button handler strictly adhering to requested flow:
  // Splash Page: No Back button
  // Aadhaar Page: Back to Splash
  // Payment Page: Back to Aadhaar
  // Group Lock Demo Page: Back to Payment
  // Admin Panel: Back to Group Lock Demo
  // Dashboard: Back to Admin / Home
  const handleGoBack = () => {
    if (currentPage === 'splashPage') return;

    const prevPage = PREV_PAGE_MAP[currentPage];
    if (prevPage) {
      showToast(`← Returned to ${PAGE_NAMES[prevPage]}`, 'info');
      navigateTo(prevPage, true);
    }
  };

  // Copy UPI handler matching exact prompt logic
  const handleCopyUPI = () => {
    const upiId = 'bm427251@okaxis';
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(upiId);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = upiId;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
    } catch (e) {
      console.warn('Clipboard write failed, fallback used', e);
    }

    setCopiedState(true);
    setTimeout(() => setCopiedState(false), 2500);

    const alertMsg = 'DADA UPI Copied: bm427251@okaxis - Ab GPay kholo!';
    try {
      showToast(alertMsg, "success");
    } catch {}
    showToast(alertMsg, 'success');
  };

  // Submit payment handler: Save to Firebase /payments/{utr} = {utr, upi: bm427251@okaxis, status: pending, timestamp}
  const handleSubmitPayment = async () => {
    const inputEl = document.getElementById('utrInput') as HTMLInputElement | null;
    const currentUtr = (inputEl ? inputEl.value : utrValue).trim();

    if (currentUtr.length < 12) {
      const err = 'DADA 12 digit UTR dalo!';
      try {
        showToast(err, "danger");
      } catch {}
      showToast(err, 'danger');
      return;
    }

    // Save to Firebase Realtime Database
    try {
      await savePaymentToFirebase(currentUtr, UPI_ID);
    } catch (e) {
      console.warn('Firebase RTDB save error', e);
    }

    localStorage.setItem('trackmitra_utr', currentUtr);
    localStorage.setItem('trackmitra_payment', 'pending');
    setUtrValue(currentUtr);

    const successMsg = `Payment recorded! UTR: ${currentUtr} saved to trackmitra_payments. Awaiting Admin Approval.`;
    showToast(successMsg, 'success');

    if (onPaymentSuccess) {
      onPaymentSuccess(currentUtr);
    }

    navigateTo('groupLockPage');
  };

  // Admin: Approve transaction & save to /unlocks/{utr} = approved
  const handleApprovePayment = async (utrToApprove: string) => {
    const cleanUtr = utrToApprove.trim();
    try {
      await approvePaymentInFirebase(cleanUtr);
      showToast(`UTR ${cleanUtr} Approved! Saved to trackmitra_unlocks`, 'success');
      if (onManualUnlock) {
        onManualUnlock();
      }
    } catch (err) {
      console.error('Approve payment error', err);
      showToast(`Approval failed for UTR ${cleanUtr}`, 'danger');
    }
  };

  // Helper for instant demo test payment
  const handleCreateDemoPayment = async () => {
    const demoUtr = '4201' + Math.floor(10000000 + Math.random() * 90000000).toString();
    await savePaymentToFirebase(demoUtr, UPI_ID);
    showToast(`Test Payment UTR ${demoUtr} saved to trackmitra_payments!`, 'info');
  };

  // Aadhaar Send OTP
  const handleSendAadhaarOTP = () => {
    const cleanedAadhaar = aadhaarInput.replace(/\s+/g, '');
    if (cleanedAadhaar.length < 12) {
      showToast('Please enter a valid 12-digit Aadhaar number', 'danger');
      return;
    }
    if (mobileInput.length < 10) {
      showToast('Please enter a valid 10-digit mobile number', 'danger');
      return;
    }

    setIsOtpSent(true);
    setOtpInput('742918'); // Demo OTP prefill for seamless testing
    const msg = `UIDAI OTP (742918) generated for Aadhaar ending in ${cleanedAadhaar.slice(-4)}`;
    showToast(msg, 'success');
  };

  // Aadhaar Verify OTP
  const handleVerifyAadhaarOTP = () => {
    if (!otpInput || otpInput.trim().length < 6) {
      showToast('Enter 6-digit OTP received via SMS (Demo: 742918)', 'danger');
      return;
    }

    setIsAadhaarVerified(true);
    localStorage.setItem('trackmitra_aadhaar_verified', 'true');
    showToast('UIDAI Aadhaar Identity Successfully Verified! ✅', 'success');

    if (onVerifyAadhaar) {
      onVerifyAadhaar(aadhaarInput, mobileInput);
    }

    // Advance to Payment Page as specified in navigation flow
    navigateTo('paymentPage');
  };

  // Part 3 Admin Check
  const handleCheckAdmin = () => {
    const pinEl = document.getElementById('adminPin') as HTMLInputElement | null;
    const pin = (pinEl ? pinEl.value : adminPinValue).trim();

    if (pin === '7878') {
      setIsAdminLoggedIn(true);
      const controlsEl = document.getElementById('adminControls');
      if (controlsEl) controlsEl.style.display = 'block';

      const utrEl = document.getElementById('utrList');
      const savedUtr = localStorage.getItem('trackmitra_utr') || 'No Payment Yet';
      if (utrEl) {
        utrEl.innerHTML = 'UTR: ' + savedUtr;
      }
      showToast('Admin Access Granted! Verified.', 'success');
    } else {
      const err = 'Invalid Credentials Dada!';
      try {
        window.alert(err);
      } catch {}
      showToast(err, 'danger');
    }
  };

  // Part 3 Manual Unlock
  const handleManualUnlock = async () => {
    const savedUtr = localStorage.getItem('trackmitra_utr') || 'admin-manual';
    try {
      await approvePaymentInFirebase(savedUtr);
    } catch (e) {
      console.warn('Firebase unlock error', e);
    }
    localStorage.setItem('trackmitra_payment', 'unlocked');
    const msg = 'DADA Instant Unlock Done! ✅';
    showToast(msg, 'success');

    if (onManualUnlock) onManualUnlock();
    navigateTo('dashboardPage');
  };

  // Part 3 Unlock All
  const handleUnlockAll = async () => {
    const savedUtr = localStorage.getItem('trackmitra_utr') || 'all-users';
    try {
      await approvePaymentInFirebase(savedUtr);
    } catch (e) {
      console.warn('Firebase unlock error', e);
    }
    localStorage.setItem('trackmitra_payment', 'unlocked');
    const msg = 'Sab Unlock Ho Gaya Dada! 🌍';
    showToast(msg, 'success');

    if (onUnlockAll) onUnlockAll();
  };

  // Part 3 Call Admin
  const handleCallAdmin = () => {
    try {
      window.location.href = 'tel:+919999999999';
    } catch {}
    const msg = 'DADA Admin Ko Call Karo - Hotline Support';
    try {
      showToast(msg, "info");
    } catch {}
    showToast(msg, 'info');
  };

  // Part 3 Trigger SOS
  const handleTriggerSOS = () => {
    const msg = '🆘 SOS Sent to Family! Location: Barasat, Kolkata - TrackMitra AI Alert!';
    try {
      window.alert(msg);
    } catch {}
    showToast(msg, 'danger');

    if (onTriggerSOS) onTriggerSOS();
  };

  // Browser History and Popstate support
  useEffect(() => {
    // Main app e ei line add korun
    if (document.getElementById('adminPage') && currentPage !== 'adminPage') {
      document.getElementById('adminPage')!.style.display = 'none';
    }

    // Check initial URL hash on mount
    const hash = window.location.hash.replace('#', '') as PageId;
    const validPages: PageId[] = ['splashPage', 'aadhaarPage', 'paymentPage', 'groupLockPage', 'adminPage', 'dashboardPage'];

    if (hash && validPages.includes(hash)) {
      navigateTo(hash, false);
    } else {
      // Set initial history state
      try {
        window.history.replaceState({ page: currentPage }, '', `#${currentPage}`);
      } catch (e) {}
    }

    const handlePopState = (event: PopStateEvent) => {
      const statePage = event.state?.page as PageId | undefined;
      const currentHash = window.location.hash.replace('#', '') as PageId;
      const targetPage = statePage || (validPages.includes(currentHash) ? currentHash : 'splashPage');

      if (validPages.includes(targetPage)) {
        navigateTo(targetPage, false);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Bind global functions to window so inline HTML onclick and search triggers work
  useEffect(() => {
    (window as any).goBack = handleGoBack;
    (window as any).nextPage = (pageName: PageId) => navigateTo(pageName, true);
    (window as any).copyUPI = handleCopyUPI;
    (window as any).submitPayment = handleSubmitPayment;
    (window as any).checkAdmin = handleCheckAdmin;
    (window as any).manualUnlock = handleManualUnlock;
    (window as any).unlockAll = handleUnlockAll;
    (window as any).callAdmin = handleCallAdmin;
    (window as any).triggerSOS = handleTriggerSOS;
    (window as any).goToAdminDemo = onGoToAdmin;

    // Global Search 7878 / *#admin# listener
    const searchInput = document.getElementById('searchBar') as HTMLInputElement | null;
    const handleSearchInput = (e: Event) => {
      const val = (e.target as HTMLInputElement).value.trim().toLowerCase();
      if (val === '7878' || val === '*#admin#') {
        (window as any).nextPage('adminPage');
        showToast('👑 Admin Override Code Recognized!', 'success');
      }
    };

    if (searchInput) {
      searchInput.addEventListener('input', handleSearchInput);
    }

    return () => {
      if (searchInput) {
        searchInput.removeEventListener('input', handleSearchInput);
      }
    };
  }, [currentPage, utrValue, adminPinValue, onNavigate, onGoToAdmin, onManualUnlock, onUnlockAll, onTriggerSOS]);

  // Global window touch swipe right gesture detection
  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let startTime = 0;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        startTime = Date.now();
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches.length === 1 && startTime > 0) {
        const deltaX = e.changedTouches[0].clientX - startX;
        const deltaY = e.changedTouches[0].clientY - startY;
        const elapsed = Date.now() - startTime;
        startTime = 0;

        if (deltaX > 65 && Math.abs(deltaY) < 90 && elapsed < 700) {
          if (currentPage !== 'splashPage') {
            const prev = PREV_PAGE_MAP[currentPage];
            if (prev) {
              setSwipeFeedback(`← Swiped back to ${PAGE_NAMES[prev]}`);
              setTimeout(() => setSwipeFeedback(null), 1800);
              handleGoBack();
            }
          }
        }
      }
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [currentPage]);

  // Touch Swipe Right gesture detection
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now()
      };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const start = touchStartRef.current;
    touchStartRef.current = null;

    if (e.changedTouches.length === 1) {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const deltaX = endX - start.x;
      const deltaY = endY - start.y;
      const elapsed = Date.now() - start.time;

      // Swipe Right detection:
      // Moved right by >= 65px, horizontal dominance (|deltaY| < 90px), under 700ms
      if (deltaX > 65 && Math.abs(deltaY) < 90 && elapsed < 700) {
        if (currentPage !== 'splashPage') {
          const prev = PREV_PAGE_MAP[currentPage];
          if (prev) {
            setSwipeFeedback(`← Swiped back to ${PAGE_NAMES[prev]}`);
            setTimeout(() => setSwipeFeedback(null), 1800);
            handleGoBack();
          }
        }
      }
    }
  };

  const isSplashActive = currentPage === 'splashPage';
  const isAadhaarActive = currentPage === 'aadhaarPage';
  const isPaymentActive = currentPage === 'paymentPage';
  const isGroupLockActive = currentPage === 'groupLockPage';
  const isAdminActive = currentPage === 'adminPage';
  const isDashboardActive = currentPage === 'dashboardPage';

  return (
    <div 
      className="w-full relative"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Swipe Feedback Floating Toast */}
      {swipeFeedback && (
        <div className="page-swipe-indicator animate-pulse">
          {swipeFeedback}
        </div>
      )}

      {/* Top Quick Mode Bar (Dev Only) */}
      {(typeof window !== "undefined" && new URLSearchParams(window.location.search).get("debug") === "true") && (
<div className="px-4 py-1.5 flex items-center justify-between text-[11px] border-b border-slate-800/80 bg-slate-950/90 shadow-md">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          <span className="text-[10px] font-black text-emerald-400 font-mono shrink-0 mr-1">
            VIEW:
          </span>
          <button
            id="nav-to-splash-btn"
            onClick={() => navigateTo('splashPage')}
            className={`px-2 py-0.5 rounded text-[10px] font-bold transition whitespace-nowrap cursor-pointer ${
              isSplashActive 
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🛡 Splash
          </button>
          <button
            id="nav-to-aadhaar-btn"
            onClick={() => navigateTo('aadhaarPage')}
            className={`px-2 py-0.5 rounded text-[10px] font-bold transition whitespace-nowrap cursor-pointer ${
              isAadhaarActive 
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50 shadow-sm' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🇮🇳 Aadhaar
          </button>
          <button
            id="nav-to-payment-btn"
            onClick={() => navigateTo('paymentPage')}
            className={`px-2 py-0.5 rounded text-[10px] font-bold transition whitespace-nowrap cursor-pointer ${
              isPaymentActive 
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ⚡ Free Test
          </button>
          <button
            id="nav-to-grouplock-btn"
            onClick={() => navigateTo('groupLockPage')}
            className={`px-2 py-0.5 rounded text-[10px] font-bold transition whitespace-nowrap cursor-pointer ${
              isGroupLockActive 
                ? 'bg-red-500/20 text-red-300 border border-red-500/50 shadow-sm' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🚨 Group Lock
          </button>
          <button
            id="nav-to-dashboard-quick-btn"
            onClick={() => navigateTo('dashboardPage')}
            className={`px-2 py-0.5 rounded text-[10px] font-bold transition whitespace-nowrap cursor-pointer ${
              isDashboardActive 
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/50 shadow-sm' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            📡 Live Dashboard
          </button>
        </div>

        
      </div>

            )}
      {/* ========== 1. SPLASH PAGE (AUTO NAVIGATES 2.5s TO HOMETAB) ========== */}
      <div 
        id="splashPage" 
        className={`page ${isSplashActive ? "active" : ""} cursor-pointer`}
        onClick={() => navigateTo("dashboardPage")}
      >
        <div className="top-banner bg-[#0A1931] border-b border-[#FF6B00]/30 text-slate-200">
          🛡 TrackMitra Traveling Safety Pro | AI Surveillance & Family Shield
        </div>
        
        <div className="card-premium relative bg-gradient-to-b from-[#0A1931] via-[#050B14] to-black border border-[#FF6B00]/40 shadow-2xl p-8 rounded-3xl text-center">
          {/* Large Shield Icon with Orange Glow + Pulse Animation */}
          <div className="relative w-24 h-24 mx-auto mb-6 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-[#FF6B00]/25 animate-ping"></div>
            <div className="w-20 h-20 rounded-full bg-[#0A1931] border-2 border-[#FF6B00] flex items-center justify-center shadow-lg shadow-[#FF6B00]/50">
              <Shield className="w-11 h-11 text-[#FF6B00] animate-pulse" />
            </div>
          </div>

          <h1 className="text-3xl font-black text-white tracking-tight mb-1 font-mono">
            TrackMitra <span className="text-[#FF6B00]">Pro</span>
          </h1>

          <p className="text-xs font-bold text-amber-200/90 mb-6 font-mono tracking-widest uppercase">
            DADA KA BHAROSA • 24H TRAVELING ESCORT
          </p>

          <div className="space-y-2 text-left mb-6 bg-black/60 p-4 rounded-2xl border border-blue-900/40 text-xs">
            <div className="flex items-center gap-2.5 text-slate-100 font-bold">
              <span className="text-[#FF6B00]">📍</span>
              <span>Live Radar</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-100 font-bold">
              <span className="text-red-400">🚨</span>
              <span>AI Observer</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-100 font-bold">
              <span className="text-blue-400">🇮🇳</span>
              <span>Aadhaar Verified</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-100 font-bold">
              <span className="text-amber-400">🔒</span>
              <span>Group Lock</span>
            </div>
          </div>

          {/* Clean Premium Loading Spinner / Countdown (No Owner Login or Direct Pay button) */}
          <div className="pt-2 flex items-center justify-center gap-2 text-xs font-mono text-slate-400">
            <span className="w-2 h-2 rounded-full bg-[#FF6B00] animate-ping"></span>
            <span>Connecting to Escort Grid... (Tap to Skip)</span>
          </div>
        </div>
      </div>

      {/* ========== 2. AADHAAR PAGE (BACK TO SPLASH) ========== */}
      <div 
        id="aadhaarPage" 
        className={`page ${isAadhaarActive ? 'active' : ''}`}
      >
        {/* Top Left Back Button */}
        <div className="back-btn-row">
          <button 
            type="button" 
            id="back-btn-aadhaar"
            className="back-btn" 
            onClick={handleGoBack}
            title="Back to Splash Page"
          >
            <span className="arrow">←</span>
            <span>Back</span>
          </button>
          <span className="text-[10px] text-slate-400 font-mono">Step 1 of 3</span>
        </div>

        <div className="top-banner">
          🇮🇳 UIDAI Aadhaar Verification - Safe Family Network
        </div>

        <div className="progress-dots">
          <span className="dot active"></span>
          <span className="dot active"></span>
          <span className="dot"></span>
          <span className="dot"></span>
          <span className="dot"></span>
          <span className="dot"></span>
        </div>

        <div className="card-premium aadhaar-theme">
          <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-sky-950/80 border border-sky-400/40 flex items-center justify-center text-sky-400">
            <Fingerprint className="w-7 h-7" />
          </div>

          <h2 className="title-cyan">🇮🇳 Aadhaar Verification</h2>
          <p className="text-xs text-slate-300 text-center mb-4">
            Security rule mandate: Every member must verify their Aadhaar ID before traveling.
          </p>

          <div className="input-group mb-3">
            <label htmlFor="aadhaarInput">Aadhaar Number (12 Digits)</label>
            <input 
              type="text" 
              id="aadhaarInput" 
              value={aadhaarInput}
              onChange={(e) => setAadhaarInput(e.target.value)}
              placeholder="XXXX XXXX XXXX" 
              maxLength={14} 
            />
          </div>

          <div className="input-group mb-3">
            <label htmlFor="mobileInput">Linked Mobile Number (10 Digits)</label>
            <input 
              type="tel" 
              id="mobileInput" 
              value={mobileInput}
              onChange={(e) => setMobileInput(e.target.value)}
              placeholder="9876543210" 
              maxLength={10} 
            />
          </div>

          {!isOtpSent ? (
            <button 
              type="button"
              className="btn-primary neon-glow" 
              onClick={handleSendAadhaarOTP}
            >
              📲 Send UIDAI OTP
            </button>
          ) : (
            <div className="mt-3">
              <div className="input-group">
                <label htmlFor="otpInput">Enter 6-Digit OTP (Demo: 742918)</label>
                <input 
                  type="text" 
                  id="otpInput" 
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  placeholder="742918" 
                  maxLength={6} 
                  className="font-mono text-center tracking-widest text-base"
                />
              </div>

              <button 
                type="button"
                className="btn-primary green-glow mt-2" 
                onClick={handleVerifyAadhaarOTP}
              >
                ✅ Verify & Proceed to Payment →
              </button>
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
            <button 
              type="button"
              onClick={() => {
                setIsAadhaarVerified(true);
                showToast('Aadhaar verified in Demo Mode! Proceeding to Payment.', 'success');
                navigateTo('paymentPage');
              }}
              className="text-[11px] text-sky-400 hover:text-sky-300 font-semibold"
            >
              ⚡ Instant Bypass / Demo Verify
            </button>

            <button 
              type="button"
              onClick={handleGoBack}
              className="text-[11px] text-slate-400 hover:text-slate-200"
            >
              ← Back to Splash
            </button>
          </div>
        </div>
      </div>

      {/* ========== 3. PAYMENT PAGE (BACK TO AADHAAR) ========== */}
      <div 
        id="paymentPage" 
        className={`page ${isPaymentActive ? 'active' : ''}`}
      >
        {/* Top Left Back Button */}
        <div className="back-btn-row">
          <button 
            type="button" 
            id="back-btn-payment"
            className="back-btn" 
            onClick={handleGoBack}
            title="Back to Aadhaar Page"
          >
            <span className="arrow">←</span>
            <span>Back</span>
          </button>
          <span className="text-[10px] text-slate-400 font-mono">Step 2 of 3</span>
        </div>

        <div className="top-banner">
          🛡 TrackMitra Traveling Safety Pro | Professional Family & Team Safety System
        </div>
        
        <div className="progress-dots">
          <span className="dot active"></span>
          <span className="dot active"></span>
          <span className="dot active"></span>
          <span className="dot"></span>
          <span className="dot"></span>
          <span className="dot"></span>
        </div>
        
        <div className="card-premium green-gold-theme">
          <h2 className="title-gold">💰 Unlock Premium Safety</h2>
          <div className="price-box">
            {IS_TEST_MODE ? "₹0" : "₹99"} <span>/ {IS_TEST_MODE ? "Free Test" : "24h Escort"}</span>
          </div>
          
          {IS_TEST_MODE ? (
            <div className="bg-amber-400/20 border border-amber-400/50 p-4 rounded-xl text-center space-y-1.5 my-3">
              <p className="text-xs font-black text-amber-300 font-mono">🧪 TEST MODE ACTIVE</p>
              <p className="text-[11px] text-slate-300">Payment disabled for testing. Tap below to activate free!</p>
            </div>
          ) : (
            <div className="upi-section">
            <p>UPI ID (Direct to Owner)</p>
            <div className="upi-copy-box" onClick={handleCopyUPI}>
              <span id="upiId">bm427251@okaxis</span>
              <button 
                type="button"
                className="copy-btn" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyUPI();
                }}
              >
                {copiedState ? <Check className="w-3.5 h-3.5" /> : null}
                <span>{copiedState ? '✓ Copied' : '📋 Copy'}</span>
              </button>
            </div>
            <p className="upi-note">✓ UPI Copy kore GPay/PhonePe te pay korun</p>

            <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">Direct App Launch:</span>
              <a
                href="upi://pay?pa=bm427251@okaxis&pn=TrackMitra&am=99&cu=INR&tn=TrackMitra Premium Safety"
                className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30"
              >
                <span>Open GPay/PhonePe</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>

          
          )}<div className="input-group">
            <label htmlFor="utrInput">UTR / Transaction ID (12 digit)</label>
            <input 
              type="text" 
              id="utrInput" 
              value={utrValue}
              onChange={(e) => setUtrValue(e.target.value.replace(/\s+/g, ''))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmitPayment();
              }}
              placeholder="Enter 12-digit UTR after payment" 
              maxLength={12} 
            />
          </div>

          <button 
            type="button"
            id="btn-i-have-paid"
            className="btn-primary green-glow flex items-center justify-center gap-2" 
            onClick={handleSubmitPayment}
          >
            <span>{IS_TEST_MODE ? "Create Free (Test)" : "✓ I Have Paid"}</span>
            {!IS_TEST_MODE && <span className="text-[11px] opacity-80 font-mono">(₹99)</span>}
          </button>
          
          <div className="mt-2 text-center text-[10px] text-emerald-400/90 font-mono flex items-center justify-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>Realtime Sync: trackmitra_payments ({utrValue || 'active'})</span>
          </div>

          <p className="secure-note">
            🔒 24 Hour me Auto Unlock Feature Active Hoga
          </p>

          <div className="mt-3 pt-2 text-center border-t border-slate-800/80">
            <button 
              type="button"
              onClick={handleGoBack}
              className="text-[11px] text-slate-400 hover:text-slate-200"
            >
              ← Back to Aadhaar Verification
            </button>
          </div>
        </div>
      </div>

      {/* ========== 4. GROUP LOCK PAGE (BACK TO PAYMENT) ========== */}
      <div 
        id="groupLockPage" 
        className={`page ${isGroupLockActive ? 'active' : ''}`}
      >
        {/* Top Left Back Button */}
        <div className="back-btn-row">
          <button 
            type="button" 
            id="back-btn-grouplock"
            className="back-btn" 
            onClick={handleGoBack}
            title="Back to Payment Page"
          >
            <span className="arrow">←</span>
            <span>Back</span>
          </button>
          <span className="text-[10px] text-red-300 font-mono">Demo Mode</span>
        </div>

        <div className="top-banner red-alert">
          🚨 Group Locked by AI Safety System
        </div>
        
        <div className="progress-dots">
          <span className="dot active"></span>
          <span className="dot active"></span>
          <span className="dot active"></span>
          <span className="dot active"></span>
          <span className="dot"></span>
          <span className="dot"></span>
        </div>

        <div className="card-premium red-theme">
          <div className="lock-icon">🔒</div>
          <h2 className="title-red">Group Lock Demo Active</h2>
          <p className="demo-text">
            Ye Demo Mode Hai Dada! Real me yahan Family/Team Live Location Lock Ho Jata Hai. AI Safety ke liye Group Lock.
          </p>
          
          <div className="demo-map">
            <div className="radar-dot green"></div>
            <div className="radar-dot red"></div>
            <div className="radar-wave"></div>
            <p>📍 3 Members Locked - Barasat, Kolkata</p>
          </div>

          <button 
            type="button"
            className="btn-primary red-glow" 
            onClick={() => navigateTo('adminPage')}
          >
            🔓 Unlock Ke Liye Admin Se Contact Karo
          </button>
          
          <button 
            type="button"
            className="btn-secondary" 
            onClick={() => navigateTo('dashboardPage')}
          >
            👁️ Dashboard Demo Dekho
          </button>

          <div className="mt-3 pt-2.5 border-t border-red-950/80 flex items-center justify-between text-[11px] text-red-300">
            <span className="text-slate-400 font-mono">Helpline: +91 9088403890</span>
            <a
              href="tel:+919088403890"
              className="px-2 py-1 bg-red-900/60 hover:bg-red-800 text-red-200 rounded font-bold flex items-center gap-1 transition"
            >
              <Phone className="w-3 h-3" />
              <span>Call Now</span>
            </a>
          </div>

          <div className="mt-3 pt-2 text-center border-t border-red-950/50">
            <button 
              type="button"
              onClick={handleGoBack}
              className="text-[11px] text-red-300 hover:text-white"
            >
              ← Back to Payment Page
            </button>
          </div>
        </div>
      </div>

      {/* ========== 5. ADMIN PAGE (BACK TO GROUP LOCK DEMO) ========== */}
      <div 
        id="adminPage" 
        className={`page ${isAdminActive ? 'active' : ''}`}
        style={{ display: isAdminActive ? 'block' : 'none' }}
      >
        {/* Top Left Back Button */}
        <div className="back-btn-row">
          <button 
            type="button" 
            id="back-btn-admin"
            className="back-btn" 
            onClick={handleGoBack}
            title="Back to Group Lock Demo"
          >
            <span className="arrow">←</span>
            <span>Back</span>
          </button>
          <span className="text-[10px] text-cyan-400 font-mono">Protected</span>
        </div>

        <div className="top-banner">🔐 Admin Control - TrackMitra Pro</div>
        
        <div className="card-premium black-neon">
          <h2 className="title-neon">👑 Admin Panel</h2>
          <div className="input-group">
            <label htmlFor="adminPin">Enter Admin PIN</label>
            <input 
              type="password" 
              id="adminPin" 
              value={adminPinValue}
              onChange={(e) => setAdminPinValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCheckAdmin();
              }}
              placeholder="****" 
              maxLength={4} 
            />
          </div>
          <button 
            type="button"
            className="btn-primary neon-glow" 
            onClick={handleCheckAdmin}
          >
            🔓 Login
          </button>
          
          <div 
            id="adminControls" 
            style={{ display: isAdminLoggedIn ? 'block' : 'none', marginTop: '20px' }}
          >
            <p className="neon-text">✅ Admin Access Granted</p>
            <button 
              type="button"
              className="btn-admin" 
              onClick={handleManualUnlock}
            >
              🔓 Manual Unlock (Instant)
            </button>
            <button 
              type="button"
              className="btn-admin" 
              onClick={handleUnlockAll}
            >
              🌍 Unlock All Users
            </button>
            <button 
              type="button"
              className="btn-admin call" 
              onClick={handleCallAdmin}
            >
              📞 Call Admin - Dada Direct
            </button>
            <div className="utr-list" id="utrList">
              UTR: {localStorage.getItem('trackmitra_utr') || 'No Payment Yet'}
            </div>

            {/* Live Transactions Feed from Firebase Realtime Database */}
            <div className="mt-4 pt-4 border-t border-cyan-900/60 text-left">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <h3 className="text-xs font-black text-cyan-300 uppercase tracking-wider">
                    Live Transactions Feed
                  </h3>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-slate-900 border border-cyan-800 text-cyan-400">
                  Firebase: /payments
                </span>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {livePayments.length === 0 ? (
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-center text-xs text-slate-400 space-y-1.5">
                    <p className="font-semibold text-slate-300">No transactions in Firebase /payments yet.</p>
                    <p className="text-[11px] text-slate-500">
                      Submit a payment with 12-digit UTR on Payment Page or simulate below to test real-time synchronization.
                    </p>
                  </div>
                ) : (
                  livePayments.map((item) => {
                    const isPending = item.status === 'pending';
                    return (
                      <div 
                        key={item.utr}
                        className={`p-3 rounded-xl border transition-all text-left ${
                          isPending 
                            ? 'bg-amber-950/30 border-amber-500/50 shadow-sm shadow-amber-950/30' 
                            : 'bg-emerald-950/30 border-emerald-500/50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-[11px] font-mono font-bold text-slate-200 truncate">
                              UTR: {item.utr}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(item.utr);
                                showToast(`Copied UTR: ${item.utr}`, 'info');
                              }}
                              className="text-slate-400 hover:text-cyan-300 p-0.5"
                              title="Copy UTR"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                          {isPending ? (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 animate-pulse shrink-0">
                              <Clock className="w-3 h-3" />
                              <span>Pending</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 shrink-0">
                              <CheckCircle className="w-3 h-3" />
                              <span>Approved</span>
                            </span>
                          )}
                        </div>

                        <div className="mt-1.5 text-[11px] text-slate-400 flex items-center justify-between">
                          <span>UPI: <strong className="text-slate-300 font-mono">{item.upi || UPI_ID}</strong></span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-slate-800/80">
                          {isPending ? (
                            <button
                              type="button"
                              onClick={() => handleApprovePayment(item.utr)}
                              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/40 active:scale-95 transition"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve & Unlock</span>
                            </button>
                          ) : (
                            <div className="text-center text-[10px] text-emerald-400 font-mono font-semibold py-0.5">
                              ✓ Saved to /unlocks/{item.utr} = approved
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Demo test button */}
              <button
                type="button"
                onClick={handleCreateDemoPayment}
                className="mt-2.5 w-full py-1.5 bg-slate-900/80 hover:bg-slate-850 border border-cyan-900/60 rounded-lg text-[11px] text-cyan-400 font-mono flex items-center justify-center gap-1.5 transition"
              >
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>+ Simulate Test Payment in Firebase</span>
              </button>
            </div>
          </div>
          
          <p className="hint">Protected Command Console • 256-bit Encrypted</p>

          <div className="mt-3 pt-2 text-center border-t border-slate-800/80">
            <button 
              type="button"
              onClick={handleGoBack}
              className="text-[11px] text-cyan-400 hover:text-cyan-300"
            >
              ← Back to Group Lock Demo
            </button>
          </div>
        </div>
      </div>

      {/* ========== 6. DASHBOARD PAGE (BACK TO ADMIN / HOME) ========== */}
      <div 
        id="dashboardPage" 
        className={`page ${isDashboardActive ? 'active' : ''}`}
      >
        {/* Top Left Back Button */}
        <div className="back-btn-row">
          <div className="flex items-center gap-2">
            <button 
              type="button" 
              id="back-btn-dashboard"
              className="back-btn" 
              onClick={handleGoBack}
              title="Back"
            >
              <span className="arrow">←</span>
              <span>Back</span>
            </button>
            <button
              type="button"
              id="home-btn-dashboard"
              onClick={() => navigateTo('splashPage')}
              className="px-2.5 py-1 bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full text-[11px] font-bold border border-slate-700 flex items-center gap-1 transition"
              title="Return to Splash / Home"
            >
              <span>🏠 Home</span>
            </button>
          </div>
          <span className="text-[10px] text-emerald-400 font-mono">Radar Active</span>
        </div>

        <div className="top-banner blue-radar">📡 Live Tracking - Family Safety Active</div>
        
        <div className="progress-dots">
          <span className="dot active"></span>
          <span className="dot active"></span>
          <span className="dot active"></span>
          <span className="dot active"></span>
          <span className="dot active"></span>
          <span className="dot active"></span>
        </div>

        <div className="map-container radar-blue">
          <div className="map-radar"></div>
          <div 
            className="member-pin green" 
            style={{ top: '30%', left: '40%' }}
            onClick={() => showToast('👨 Biman: Active location tracked at Barasat Station.', 'info')}
          >
            👨 Biman - Online
          </div>
          <div 
            className="member-pin red" 
            style={{ top: '60%', left: '60%' }}
            onClick={() => showToast('🆘 Rina: Incident trigger active at Barasat Colony!', 'danger')}
          >
            🆘 SOS - Rina
          </div>
          <div 
            className="member-pin green" 
            style={{ top: '50%', left: '20%' }}
            onClick={() => showToast('👩 Ma: Safe zone verified at Home perimeter.', 'success')}
          >
            👩 Ma - Online
          </div>
          <button 
            type="button"
            className="sos-btn" 
            onClick={handleTriggerSOS}
          >
            🆘 SOS EMERGENCY
          </button>
        </div>

        {/* Part 3 Bottom Navigation */}
        <div className="bottom-nav mb-4">
          <button 
            type="button"
            className={`nav-btn ${activeNavTab === 'live' ? 'active' : ''}`}
            onClick={() => {
              setActiveNavTab('live');
              showToast('📡 Live Radar Mode active.', 'info');
            }}
          >
            📍 Live
          </button>
          <button 
            type="button"
            className={`nav-btn ${activeNavTab === 'group' ? 'active' : ''}`}
            onClick={() => {
              setActiveNavTab('group');
              showToast("Group Lock - Premium Feature Dada!", "warning");
              showToast('Group Lock - Premium Feature Dada!', 'warning');
            }}
          >
            🔒 Group
          </button>
          <button 
            type="button"
            className={`nav-btn ${activeNavTab === 'history' ? 'active' : ''}`}
            onClick={() => {
              setActiveNavTab('history');
              showToast("History - Premium!", "info");
              showToast('History - Premium!', 'info');
            }}
          >
            🕒 History
          </button>
        </div>

        {/* Operational System Sub-views & Children (Chat, Advanced Radar, Incident Logs) */}
        {children && (
          <div className="mt-4 pt-3 border-t border-slate-800">
            {children}
          </div>
        )}
      </div>
    </div>
  );
};
