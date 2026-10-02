import { IS_TEST_MODE, PAYMENT_ENABLED, TEST_MODE_BANNER } from './config';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  TabType, 
  UserAuth, 
  MapMember, 
  ChatMessage, 
  IncidentRecord, 
  GroupItem, 
  ThreatType, 
  ThreatResult, 
  ToastNotification,
  LockedGroup
} from './types';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { HomeTab } from './components/HomeTab';
import { MapTab } from './components/MapTab';
import { ChatTab } from './components/ChatTab';
import { GroupsTab } from './components/GroupsTab';
import { Modals } from './components/Modals';
import { AdminPinModal, AdminPanelModal } from './components/AdminPanelModal';
import { AdminEmailLoginModal } from './components/AdminEmailLoginModal';
import { PaymentWebView } from './components/PaymentWebView';
import { PRICING } from './utils/aiObserver';
import { Part2Pages, PageId } from './components/Part2Pages';
import { Toast } from './components/Toast';
import { advancedCheck, calculateGroupRate } from './utils/aiObserver';
import { 
  subscribeToUnlocks, 
  approvePaymentInFirebase, 
  savePaymentToFirebase,
  UPI_ID 
} from './lib/firebase';
import { LanguageProvider } from './utils/i18n';
import { LanguageModal } from './components/LanguageModal';
import { MobileDeviceFrame } from './components/MobileDeviceFrame';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [currentPage, setCurrentPage] = useState<PageId>(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.replace('#', '') as PageId;
      const valid: PageId[] = ['splashPage', 'aadhaarPage', 'paymentPage', 'groupLockPage', 'adminPage', 'dashboardPage'];
      if (valid.includes(hash)) return hash;
    }
    return 'splashPage';
  });

  // Track current UTR for Firebase RTDB synchronization
  const [currentUtr, setCurrentUtr] = useState<string | null>(() => {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('trackmitra_utr');
    }
    return null;
  });

  // Splash auto-navigate 2.5s to HomeTab
  useEffect(() => {
    if (currentPage === "splashPage") {
      const timer = setTimeout(() => {
        setCurrentPage("dashboardPage");
        setActiveTab("home");
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [currentPage]);

  // User Auth & State Flow
  const [auth, setAuth] = useState<UserAuth>({
    email: '',
    isJoined: IS_TEST_MODE ? true : false,
    trialStartedAt: null,
    trialSecondsRemaining: 600,
    isAadhaarVerified: true,
    aadhaarNumber: '5482 9102 7394',
    mobileNumber: '9876543210',
    isPaid: IS_TEST_MODE ? true : false,
    paidAt: IS_TEST_MODE ? Date.now() : null,
    paidExpiresAt: IS_TEST_MODE ? Date.now() + 24 * 3600 * 1000 : null,
    isLocationSharing: true,
    isInvisible: false,
    invisibleExpiresAt: null,
  });

  // AI Observer & Network State
  const [isNetworkSuspended, setIsNetworkSuspended] = useState(false);
  const [suspendCountdown, setSuspendCountdown] = useState(30);
  const [aiThreatType, setAiThreatType] = useState<ThreatType | null>(null);
  const [aiTriggerWords, setAiTriggerWords] = useState<string[]>([]);

  // Modals state
  const [isAadhaarOpen, setIsAadhaarOpen] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpGenerated, setOtpGenerated] = useState('742918');

  const [isPayOpen, setIsPayOpen] = useState(false);
  const [payAmount, setPayAmount] = useState(49);
  const [payPlanTitle, setPayPlanTitle] = useState('Solo Escort Tier (₹49 / 24h)');

  const [isFinalPayOpen, setIsFinalPayOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);

  // Live Video stream & modal
  const [isLiveVideoModalOpen, setIsLiveVideoModalOpen] = useState(false);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);

  // Admin Manual Override & Locked Groups State (Persisted in localStorage: tm_locked_groups)
    // Admin Email Login Modal & Payment WebView state
  const [isAdminEmailModalOpen, setIsAdminEmailModalOpen] = useState(false);

  const handleOpenAdminLogin = () => {
    if (typeof window !== "undefined" && window.history) {
      try {
        window.history.pushState({}, "", "/admin-login");
      } catch {}
    }
    setIsAdminEmailModalOpen(true);
  };

  const handleCloseAdminLogin = () => {
    if (typeof window !== "undefined" && window.history && (window.location.pathname === "/admin-login" || window.location.hash === "#admin-login")) {
      try {
        window.history.pushState({}, "", "/");
      } catch {}
    }
    setIsAdminEmailModalOpen(false);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const checkAdminRoute = () => {
        if (window.location.pathname === "/admin-login" || window.location.hash === "#admin-login") {
          setIsAdminEmailModalOpen(true);
        }
      };
      checkAdminRoute();
      window.addEventListener("popstate", checkAdminRoute);
      return () => window.removeEventListener("popstate", checkAdminRoute);
    }
  }, []);
  const [isPaymentWebViewOpen, setIsPaymentWebViewOpen] = useState(false);
  const [webViewAmount, setWebViewAmount] = useState(99);
  const [webViewPlan, setWebViewPlan] = useState("Group Creation License (₹99)");
  const [webViewCount, setWebViewCount] = useState(1);
  const [webViewGroupId, setWebViewGroupId] = useState<string | undefined>(undefined);
  const [pendingAddMembers, setPendingAddMembers] = useState<Array<{ name: string; phone: string }>>([]);

  const [lockedGroups, setLockedGroups] = useState<LockedGroup[]>(() => {
    try {
      const saved = localStorage.getItem('tm_locked_groups');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Could not parse tm_locked_groups from localStorage', e);
    }
    return [];
  });

  const [isAdminPinOpen, setIsAdminPinOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGroupId, setActiveGroupId] = useState('grp-1');

  // Toasts
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // Initial Members on Map
  const [members, setMembers] = useState<MapMember[]>([
    {
      id: 'm-1',
      name: 'Rahul Sen',
      role: 'Member',
      avatar: '👮‍♂️',
      lat: 22.5726,
      lng: 88.3639,
      x: 32,
      y: 38,
      targetX: 32,
      targetY: 38,
      speedKmH: 24,
      batteryPct: 88,
      isVisible: true,
      isOnline: true,
      lastPingSec: 1,
      status: 'Patrolling Sector 4B'
    },
    {
      id: 'm-2',
      name: 'Priya Mukherjee',
      role: 'Member',
      avatar: '👩‍💼',
      lat: 22.5742,
      lng: 88.3655,
      x: 64,
      y: 42,
      targetX: 64,
      targetY: 42,
      speedKmH: 18,
      batteryPct: 92,
      isVisible: true,
      isOnline: true,
      lastPingSec: 2,
      status: 'En route to Metro'
    },
    {
      id: 'm-3',
      name: 'Amit Kumar',
      role: 'Member',
      avatar: '👨‍✈️',
      lat: 22.5698,
      lng: 88.3612,
      x: 28,
      y: 72,
      targetX: 28,
      targetY: 72,
      speedKmH: 31,
      batteryPct: 76,
      isVisible: true,
      isOnline: true,
      lastPingSec: 1,
      status: 'Mobile Transit Detail'
    },
    {
      id: 'm-4',
      name: 'Sneha Roy',
      role: 'Member',
      avatar: '👩‍⚕️',
      lat: 22.5781,
      lng: 88.3694,
      x: 75,
      y: 68,
      targetX: 75,
      targetY: 68,
      speedKmH: 0,
      batteryPct: 95,
      isVisible: false, // Stealth/Invisible
      isOnline: false,
      lastPingSec: 4,
      status: 'Stealth / Off-grid'
    },
    {
      id: 'm-5',
      name: 'Vikram Bose',
      role: 'Member',
      avatar: '🛡️',
      lat: 22.5665,
      lng: 88.3582,
      x: 52,
      y: 22,
      targetX: 52,
      targetY: 22,
      speedKmH: 22,
      batteryPct: 81,
      isVisible: true,
      isOnline: true,
      lastPingSec: 2,
      status: 'North Checkpoint Station'
    }
  ]);

  // Initial Chat Messages
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-0',
      senderId: 'm-1',
      senderName: 'Rahul Sen',
      senderAvatar: '👮‍♂️',
      text: 'TrackMitra secure channel initiated. All beacons transmitting at 2s interval.',
      timestamp: '10:00 AM',
      timeMs: Date.now() - 600000,
      type: 'text'
    },
    {
      id: 'msg-1',
      senderId: 'm-2',
      senderName: 'Priya Mukherjee',
      senderAvatar: '👩‍💼',
      text: 'Sector 4B perimeter looks quiet. Keeping visual on route.',
      timestamp: '10:04 AM',
      timeMs: Date.now() - 360000,
      type: 'text'
    }
  ]);

  // Initial Groups List with ON/OFF timing state
  const [groups, setGroups] = useState<GroupItem[]>([
    {
      id: 'grp-1',
      name: 'Barasat Primary Safety Squad',
      code: 'TM-GRP-7891',
      purpose: 'Barasat Station Perimeter Escort',
      isActive: IS_TEST_MODE ? true : false,
      startTime: IS_TEST_MODE ? Date.now() : null,
      paidExpiresAt: IS_TEST_MODE ? Date.now() + 24 * 3600 * 1000 : null,
      membersCount: 4,
      ratePerPerson: 29,
      totalCost: 186,
      isAdmin: true,
      createdAt: '2026-08-29',
      members: [
        { id: 'm-1', name: 'Biman Mukherjee', phone: '+91 9088403890', isTracking: true, lastSeen: Date.now(), role: 'admin' },
        { id: 'm-2', name: 'Rina Mukherjee', phone: '+91 9876543210', isTracking: true, lastSeen: Date.now(), role: 'member' },
        { id: 'm-3', name: 'Ma (Home)', phone: '+91 9831201122', isTracking: false, lastSeen: Date.now(), role: 'member' },
        { id: 'm-4', name: 'Rahul Sen', phone: '+91 9831203344', isTracking: true, lastSeen: Date.now(), role: 'member' }
      ]
    },
    {
      id: 'grp-2',
      name: 'Kids Safety Squad',
      code: 'TM-GRP-KIDS',
      purpose: 'School & Tuition Transport',
      isKidsFree: true,
      isActive: true,
      startTime: Date.now(),
      paidExpiresAt: Date.now() + 24 * 3600 * 1000,
      membersCount: 3,
      ratePerPerson: 0,
      totalCost: 0,
      isAdmin: false,
      createdAt: '2026-08-28',
      members: [
        { id: 'm-k1', name: 'Aarav (Kid)', phone: '+91 9831001111', isTracking: true, lastSeen: Date.now(), role: 'member' },
        { id: 'm-k2', name: 'Diya (Kid)', phone: '+91 9831002222', isTracking: true, lastSeen: Date.now(), role: 'member' },
        { id: 'm-k3', name: 'Parent Escort', phone: '+91 9088403890', isTracking: true, lastSeen: Date.now(), role: 'admin' }
      ]
    }
  ]);

  // Incident Audit Log
  const [incidents, setIncidents] = useState<IncidentRecord[]>([
    {
      id: 'inc-demo-1',
      timestamp: 'Yesterday 18:42',
      timeMs: Date.now() - 86400000,
      type: 'CODE_COMBO',
      triggerWords: ['মালটা', 'তুলে নে'],
      source: 'Chat',
      memberName: 'Unknown Infiltrator',
      resolved: true
    }
  ]);

  // Toast Helper
  const toast = (message: string, type: 'success' | 'danger' | 'info' | 'warning' = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Main app e ei line add korun
  useEffect(() => {
    if (document.getElementById('adminPage')) {
      document.getElementById('adminPage')!.style.display = 'none';
    }
  }, []);

  // Browser back button support with history synchronization
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      const statePage = e.state?.page as PageId | undefined;
      const hash = (typeof window !== 'undefined' ? window.location.hash.replace('#', '') : '') as PageId;
      const valid: PageId[] = ['splashPage', 'aadhaarPage', 'paymentPage', 'groupLockPage', 'adminPage', 'dashboardPage'];
      const target = statePage || (valid.includes(hash) ? hash : 'splashPage');
      if (valid.includes(target)) {
        setCurrentPage(target);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (currentPage !== 'adminPage') {
      const adminEl = document.getElementById('adminPage');
      if (adminEl) {
        adminEl.style.display = 'none';
      }
    } else {
      const adminEl = document.getElementById('adminPage');
      if (adminEl) {
        adminEl.style.display = 'block';
      }
    }
  }, [currentPage]);

  // Main App: Listen to Firebase /unlocks and if UTR exists, auto unlock and show "Unlocked by Admin" toast
  useEffect(() => {
    const unsub = subscribeToUnlocks(currentUtr, (unlockedUtr) => {
      console.log(`[Main App] Firebase RTDB auto unlock triggered for UTR: ${unlockedUtr}`);

      setAuth((prev) => ({
        ...prev,
        isPaid: true,
        paidAt: Date.now(),
        paidExpiresAt: Date.now() + 24 * 3600 * 1000,
        isJoined: true,
      }));
      setIsNetworkSuspended(false);
      setLockedGroups([]);
      localStorage.setItem('trackmitra_payment', 'unlocked');

      // User prompt requirement: show "Unlocked by Admin" toast
      toast('Unlocked by Admin', 'success');

      // Smoothly route away from payment/lock screens if customer is waiting
      setCurrentPage((prev) => {
        if (prev === 'paymentPage' || prev === 'groupLockPage') {
          return 'dashboardPage';
        }
        return prev;
      });
    });

    return () => unsub();
  }, [currentUtr]);

  // 1. Moving dots every 2s on Mock Map
  useEffect(() => {
    if (isNetworkSuspended) return;

    const interval = setInterval(() => {
      setMembers((prevMembers) =>
        prevMembers.map((m) => {
          if (!m.isOnline || !m.isVisible) return m;

          // Random slight delta in range [-3, 3] percent
          const deltaX = (Math.random() - 0.5) * 5;
          const deltaY = (Math.random() - 0.5) * 5;

          const nextX = Math.min(85, Math.max(15, m.x + deltaX));
          const nextY = Math.min(85, Math.max(15, m.y + deltaY));

          // Calculate approximate new speed
          const speedVariation = Math.round(15 + Math.random() * 18);

          return {
            ...m,
            x: Number(nextX.toFixed(1)),
            y: Number(nextY.toFixed(1)),
            speedKmH: speedVariation,
            lastPingSec: 1
          };
        })
      );
    }, 2000);

    return () => clearInterval(interval);
  }, [isNetworkSuspended]);

  // 2. Free Trial 600s Countdown Timer
  useEffect(() => {
    if (!auth.isJoined || auth.isPaid) return;

    const trialTimer = setInterval(() => {
      setAuth((prev) => {
        if (prev.trialSecondsRemaining <= 1) {
          clearInterval(trialTimer);
          // When 10 min expires, prompt Aadhaar verification
          setIsAadhaarOpen(true);
          toast('Free 10-Minute Trial Expired. Please complete Aadhaar verification to activate.', 'warning');
          return { ...prev, trialSecondsRemaining: 0 };
        }
        return { ...prev, trialSecondsRemaining: prev.trialSecondsRemaining - 1 };
      });
    }, 1000);

    return () => clearInterval(trialTimer);
  }, [auth.isJoined, auth.isPaid]);

  // 3. Active 24h License countdown
  useEffect(() => {
    if (!auth.isPaid || !auth.paidExpiresAt) return;

    const activeTimer = setInterval(() => {
      const now = Date.now();
      if (now >= auth.paidExpiresAt!) {
        clearInterval(activeTimer);
        setAuth((prev) => ({ ...prev, isPaid: false }));
        toast('Your 24-Hour Active Security License has expired. Please recharge.', 'warning');
      }
    }, 1000);

    return () => clearInterval(activeTimer);
  }, [auth.isPaid, auth.paidExpiresAt]);

  // 4. AI Network Suspension 30s Countdown
  useEffect(() => {
    if (!isNetworkSuspended) return;

    const timer = setInterval(() => {
      setSuspendCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          resume();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isNetworkSuspended]);

  // 5. Live Video 3s AI Watching Check
  useEffect(() => {
    if (!videoStream || isNetworkSuspended) return;

    const videoCheckTimer = setInterval(() => {
      // Periodic automatic AI scan in background
      // If hazard is detected, triggers danger
    }, 3000);

    return () => clearInterval(videoCheckTimer);
  }, [videoStream, isNetworkSuspended]);

  // Flow function: joinFree
  const joinFree = (email: string, pass: string) => {
    setAuth((prev) => ({
      ...prev,
      email,
      isJoined: true,
      trialStartedAt: Date.now(),
      trialSecondsRemaining: 600
    }));
    toast('10-Minute Free Trial activated! Live Map, Chat & AI unlocked.', 'success');
  };

  // Flow function: startFreeTimer
  const startFreeTimer = () => {
    setAuth((prev) => ({
      ...prev,
      trialStartedAt: Date.now(),
      trialSecondsRemaining: 600
    }));
  };

  // Flow function: sendAadhaarOTP
  const sendAadhaarOTP = (aadhaar: string, mobile: string): boolean => {
    if (aadhaar.length !== 12 || mobile.length !== 10) {
      toast('Invalid Aadhaar (12 digits) or Mobile (10 digits).', 'danger');
      return false;
    }
    const generated = Math.floor(100000 + Math.random() * 900000).toString();
    setOtpGenerated(generated);
    setIsOtpSent(true);
    setAuth((prev) => ({
      ...prev,
      aadhaarNumber: aadhaar,
      mobileNumber: mobile
    }));
    toast(`UIDAI OTP sent to +91 ******${mobile.slice(-4)}. Code: ${generated}`, 'success');
    return true;
  };

  // Flow function: verifyOTP
  const verifyOTP = (otp: string): boolean => {
    if (otp.length === 6) {
      setAuth((prev) => ({
        ...prev,
        isAadhaarVerified: true
      }));
      setIsAadhaarOpen(false);
      setIsOtpSent(false);
      setIsPayOpen(true);
      setIsFinalPayOpen(false);
      toast('Aadhaar KYC verified with UIDAI successfully!', 'success');
      return true;
    }
    return false;
  };

  // Deep link & pending invite check
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const isJoin = window.location.pathname.includes("/join") || urlParams.get("join") || urlParams.get("pay") === "29";
      const pendingInvite = localStorage.getItem("trackmitra_pending_invite");
      if (isJoin || pendingInvite) {
        setWebViewAmount(29);
        setWebViewPlan("Member Join License (₹29)");
        setWebViewCount(1);
        setIsPaymentWebViewOpen(true);
      }
    } catch (e) {}
  }, []);

  // Flow function: openPay, doPay
  const [payMemberCount, setPayMemberCount] = useState(1);

  const openPay = (amount?: number, title = '24-Hour Active Security License', count = 1) => {
    setPayMemberCount(count);
    const calc = calculateGroupRate(count);
    const finalAmount = amount !== undefined ? amount : calc.total;
    setPayAmount(finalAmount);
    setPayPlanTitle(title);

    // Keep Aadhaar verification before payment:
    if (!auth.isAadhaarVerified) {
      setIsAadhaarOpen(true);
      toast('UIDAI Aadhaar KYC verification is required before UPI payment.', 'warning');
    } else {
      setIsPayOpen(true);
    }
  };

  const doPay = (utr?: string, totalAmount?: number) => {
    const now = Date.now();
    const expiry24h = now + 24 * 3600 * 1000;
    setAuth((prev) => ({
      ...prev,
      isPaid: true,
      paidAt: now,
      paidExpiresAt: expiry24h
    }));
    setIsPayOpen(false);
    setIsFinalPayOpen(false);
    const amt = totalAmount || payAmount;
    const utrSnippet = utr && utr.trim() ? ` [UTR: ${utr.trim()}]` : '';
    toast(`₹${amt} Direct UPI Payment confirmed to bm427251@okaxis${utrSnippet}! 24h License Active. All features unlocked.`, 'success');
  };

  // Flow function: finalPay
  const finalPay = () => {
    doPay();
  };

  // Flow function: recharge
  const recharge = () => {
    openPay(49, 'Extend 24-Hour Active License (₹49)', 1);
  };

  // Flow function: showP
  const showP = () => {
    openPay(49, 'Standard 24h Protection (₹49)', 1);
  };

  // Map function: toggleMe
  const toggleMe = () => {
    setAuth((prev) => {
      const nextState = !prev.isLocationSharing;
      toast(nextState ? 'GPS Location broadcasting: ON' : 'GPS Location broadcasting: OFF', 'info');
      return { ...prev, isLocationSharing: nextState };
    });
  };

  // Map function: invisible (1h stealth)
  const invisible = () => {
    setAuth((prev) => {
      const nextInvisible = !prev.isInvisible;
      if (nextInvisible) {
        toast('Stealth Mode Activated. You are invisible on radar for 1 hour.', 'warning');
        return {
          ...prev,
          isInvisible: true,
          invisibleExpiresAt: Date.now() + 3600 * 1000
        };
      } else {
        toast('Stealth Mode Disabled. Visible on radar.', 'info');
        return {
          ...prev,
          isInvisible: false,
          invisibleExpiresAt: null
        };
      }
    });
  };

  // Map function: toggleMi
  const toggleMi = (memberId: string) => {
    setMembers((prev) =>
      prev.map((m) => {
        if (m.id === memberId) {
          const nextVis = !m.isVisible;
          toast(`${m.name} radar display: ${nextVis ? 'ON' : 'OFF'}`, 'info');
          return { ...m, isVisible: nextVis };
        }
        return m;
      })
    );
  };

  // Trigger AI Threat Event
  const triggerAI = (type: ThreatType, words: string | string[], source: 'Chat' | 'Voice' | 'File' | 'Live Video' = 'Chat') => {
    const wordList = Array.isArray(words) ? words : [words];
    setAiThreatType(type);
    setAiTriggerWords(wordList);
    setIsNetworkSuspended(true);
    setSuspendCountdown(30);
    setIsAIOpen(true);

    // Lock group and persist in localStorage (tm_locked_groups)
    const activeGroup = groups.find((g) => g.id === activeGroupId) || groups[0] || { id: 'grp-1', name: 'Special Security Unit 7' };
    const lockReason = `${type} - ${wordList.join(', ')}`;
    const preview = wordList.join(', ');

    const newLocked: LockedGroup = {
      id: activeGroup.id,
      name: activeGroup.name,
      reason: lockReason,
      threatType: type,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timeMs: Date.now(),
      messagePreview: preview
    };

    setLockedGroups((prev) => {
      const filtered = prev.filter((g) => g.id !== activeGroup.id);
      const updated = [newLocked, ...filtered];
      try {
        localStorage.setItem('tm_locked_groups', JSON.stringify(updated));
      } catch (err) {
        console.warn('Failed to write tm_locked_groups to localStorage', err);
      }
      return updated;
    });

    // Save incident to log
    const newIncident: IncidentRecord = {
      id: `inc-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timeMs: Date.now(),
      type,
      triggerWords: wordList,
      source,
      memberName: 'Channel Monitor',
      resolved: false
    };
    setIncidents((prev) => [newIncident, ...prev]);

    // Add Red System Message to chat
    const alertMsg: ChatMessage = {
      id: `sys-${Date.now()}`,
      senderId: 'sentinel',
      senderName: 'AI Sentinel',
      senderAvatar: '🚨',
      text: `CRITICAL ALERT: Intent category [${type}] flagged on "${wordList.join(', ')}". Transmission blocked. Network suspended for 30s. Group locked by AI Safety.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timeMs: Date.now(),
      type: 'system',
      isFlagged: true,
      threatType: type
    };
    setMessages((prev) => [...prev, alertMsg]);

    toast(`AI OBSERVER ALERT: [${type}] threat intercepted! Group locked.`, 'danger');
  };

  // Resume network
  const resume = () => {
    setIsNetworkSuspended(false);
    setIsAIOpen(false);
    setSuspendCountdown(30);
    toast('Security override authenticated. Network resumed.', 'success');
  };

  // Admin Manual Unlock for a single group
  const handleManualUnlock = async (groupId: string) => {
    const utrToUnlock = currentUtr || localStorage.getItem('trackmitra_utr') || 'admin-manual';
    try {
      await approvePaymentInFirebase(utrToUnlock);
    } catch (e) {
      console.warn('Firebase approve error', e);
    }

    setLockedGroups((prev) => {
      const updated = prev.filter((g) => g.id !== groupId);
      try {
        localStorage.setItem('tm_locked_groups', JSON.stringify(updated));
      } catch (err) {
        console.warn('Failed to update tm_locked_groups', err);
      }
      return updated;
    });

    // Unlock chat and remove banner
    setIsNetworkSuspended(false);
    setIsAIOpen(false);
    setSuspendCountdown(30);

    toast('Unlocked by Admin', 'success');
  };

  // Admin Emergency Unlock for All Groups
  const handleEmergencyUnlockAll = async () => {
    try {
      await approvePaymentInFirebase('all-users');
    } catch (e) {
      console.warn('Firebase approve error', e);
    }

    setLockedGroups([]);
    try {
      localStorage.removeItem('tm_locked_groups');
    } catch (err) {
      console.warn('Failed to clear tm_locked_groups', err);
    }

    // Unlock chat and remove banner
    setIsNetworkSuspended(false);
    setIsAIOpen(false);
    setSuspendCountdown(30);

    toast('Unlocked by Admin', 'success');
  };

  // Simulate Threat Lock for demonstration
  const handleSimulateThreatLock = () => {
    triggerAI('DIRECT', ['attack', 'checkpoint'], 'Chat');
  };

  // Chat function: sendText
  const sendText = (text: string, threatResult: ThreatResult) => {
    if (threatResult.isDanger && threatResult.type) {
      triggerAI(threatResult.type, threatResult.triggerWords, 'Chat');
      return;
    }

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: 'self',
      senderName: auth.email ? auth.email.split('@')[0] : 'Officer',
      senderAvatar: '👤',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timeMs: Date.now(),
      type: 'text'
    };

    setMessages((prev) => [...prev, newMsg]);
  };

  // Chat function: handleFile
  const handleFile = (
    file: File, 
    type: 'image' | 'video', 
    isThreat: boolean, 
    threatType?: ThreatType, 
    triggerWords?: string[]
  ) => {
    if (isThreat && threatType) {
      triggerAI(threatType, triggerWords || [file.name], 'File');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: 'self',
      senderName: auth.email ? auth.email.split('@')[0] : 'Officer',
      senderAvatar: '👤',
      text: type === 'video' ? `Encrypted Video Clip (${file.name})` : `Surveillance Photo (${file.name})`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timeMs: Date.now(),
      type,
      mediaUrl: objectUrl,
      mediaName: file.name
    };

    setMessages((prev) => [...prev, newMsg]);
    toast(`${type === 'video' ? 'Video' : 'Photo'} scanned and sent safely.`, 'success');
  };

  // Live Video: toggleLiveVideo & stopLive
  const toggleLiveVideo = async () => {
    if (videoStream) {
      stopLive();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: false
      });
      setVideoStream(stream);
      setIsLiveVideoModalOpen(true);
      toast('Live Video camera link activated. AI Watching every 3s.', 'success');
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      toast('Unable to access camera. Please allow camera permissions.', 'danger');
    }
  };

  const stopLive = () => {
    if (videoStream) {
      videoStream.getTracks().forEach((track) => track.stop());
      setVideoStream(null);
    }
    setIsLiveVideoModalOpen(false);
    toast('Live camera stream terminated.', 'info');
  };

  // Create Group: If IS_TEST_MODE, memberLimit=500, totalPrice=0, profileStatus=Active directly, start 24H timer, skip payment
  const handleCreateGroup = (name: string, membersCount: number, rate: number, total: number, isKidsFree?: boolean) => {
    const isTest = IS_TEST_MODE || !PAYMENT_ENABLED;
    const finalMemberLimit = isTest ? 500 : membersCount;
    const finalTotal = isTest ? 0 : total;
    const now = Date.now();
    const expires = now + 24 * 3600 * 1000;
    const newGrpId = `TM-GRP-${Math.floor(1000 + Math.random() * 9000)}`;
    const newGrp: GroupItem = {
      id: newGrpId,
      name,
      code: newGrpId,
      purpose: isKidsFree ? "Kids Safety (Free Unlimited)" : "Family Traveling Escort (Free Unlimited)",
      isKidsFree: !!isKidsFree,
      isActive: isTest ? true : false,
      startTime: isTest ? now : null,
      paidExpiresAt: isTest ? expires : null,
      isLive: isTest ? true : false,
      membersCount: finalMemberLimit,
      ratePerPerson: isTest ? 0 : (isKidsFree && membersCount <= 3 ? 0 : 29),
      totalCost: finalTotal,
      isAdmin: true,
      createdAt: new Date().toISOString().split("T")[0],
      members: [
        { id: `m-${Date.now()}`, name: "You (Host)", phone: auth.mobileNumber || "+91 9088403890", isTracking: true, lastSeen: Date.now(), role: "admin" }
      ]
    };
    setGroups((prev) => [newGrp, ...prev]);

    if (isTest) {
      toast(`Group "${name}" Active (Test Mode)! 24H Timer Started.`, "success");
      sendText(`Group "${name}" Created & Active (Test Mode - Unlimited 500 Members, 24H Timer Started).`, { isDanger: false, type: null, triggerWords: [], explanation: "", confidence: 0 });
    } else {
      toast(`Group "${name}" created (Status: OFF). Tap "TURN ON GROUP" to start 24H timer.`, "success");
      if (finalTotal > 0) {
        setWebViewAmount(finalTotal);
        setWebViewPlan(`Group Provisioning: ${name} (₹${finalTotal})`);
        setWebViewCount(membersCount);
        setWebViewGroupId(newGrpId);
        setIsPaymentWebViewOpen(true);
      }
    }
  };

  const turnOnGroup = (groupId: string) => {
    setGroups((prev) => prev.map((g) => {
      if (g.id === groupId) {
        const now = Date.now();
        const expires = now + 24 * 3600 * 1000;
        return {
          ...g,
          isActive: true,
          startTime: now,
          paidExpiresAt: expires,
          isLive: true
        };
      }
      return g;
    }));
    toast("Group Started - 24H Timer ON - DADA KA BHAROSA Active", "success");
    sendText("Group Started. 24H Traveling Escort Active.", { isDanger: false, type: null, triggerWords: [], explanation: "", confidence: 0 });
  };

  const turnOffGroup = (groupId: string) => {
    setGroups((prev) => prev.map((g) => g.id === groupId ? { ...g, isActive: false, isLive: false } : g));
    toast("Group Stopped", "info");
  };

  const toggleMemberTracking = (groupId: string, memberId: string) => {
    setGroups((prev) => prev.map((g) => {
      if (g.id === groupId) {
        return {
          ...g,
          members: (g.members || []).map((m) => m.id === memberId ? { ...m, isTracking: !m.isTracking } : m)
        };
      }
      return g;
    }));
    setMembers((prev) => prev.map((m) => m.id === memberId ? { ...m, isTracking: !m.isTracking } : m));
    toast("Member tracking state toggled.", "info");
  };

  const handleAddMemberWithAdminPay = (groupId: string, newMemberList: Array<{ name: string; phone: string }>) => {
    if (newMemberList.length === 0) return;
    if (IS_TEST_MODE || !PAYMENT_ENABLED) {
      setGroups((prev) => prev.map((g) => {
        if (g.id === groupId) {
          const currentMembers = g.members || [];
          const additions = newMemberList.map((m) => ({
            id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            name: m.name,
            phone: m.phone,
            isTracking: true,
            lastSeen: Date.now(),
            role: "member" as const
          }));
          return {
            ...g,
            members: [...currentMembers, ...additions],
            membersCount: (g.membersCount || 0) + additions.length,
            isActive: true,
            isLive: true
          };
        }
        return g;
      }));
      toast(`🧪 ${newMemberList.length} Members Added Directly (Test Mode - Free)!`, "success");
      return;
    }
    const cost = newMemberList.length * 29;
    setPendingAddMembers(newMemberList);
    setWebViewGroupId(groupId);
    setWebViewAmount(cost);
    setWebViewPlan(`Add ${newMemberList.length} Members (₹29/p)`);
    setWebViewCount(newMemberList.length);
    setIsPaymentWebViewOpen(true);
  };

  const handleTriggerInvitePayThemselves = (groupId: string, memberName: string, phone: string) => {
    const isTest = IS_TEST_MODE || !PAYMENT_ENABLED;
    const url = isTest ? `https://trackmitra.in/join/${groupId}?test=free` : `https://trackmitra.in/join/${groupId}?pay=29`;
    const text = encodeURIComponent(
      `🛡 Join our verified TrackMitra Safety Group (${isTest ? 'Free Test' : '24H License'}).\n` +
      `AI Threat Observer & Live Escort active.\n` +
      `Link valid 24H: ${url}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
    toast(`Invite link generated for ${memberName}: ${url}`, "success");
  };

  // Groups: copyLink & shareWA
  const copyLink = (link: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link);
    }
    toast(`Link copied: ${link}`, 'success');
  };

  const shareWA = (link: string) => {
    const url = `https://wa.me/?text=${encodeURIComponent(`Join my secure TrackMitra tracking & safety net: https://${link}`)}`;
    window.open(url, '_blank');
  };

  // Clear incidents
  const handleClearIncidents = () => {
    setIncidents([]);
    toast('AI Incident log cleared.', 'info');
  };

  // Active locked group for chat / notification
  const currentLockedGroup = lockedGroups.find((g) => g.id === activeGroupId) || (lockedGroups.length > 0 ? lockedGroups[0] : null);
  const isGroupLocked = !!currentLockedGroup;
  const lockedReason = currentLockedGroup ? currentLockedGroup.reason : '';

  return (
    <LanguageProvider>
      <MobileDeviceFrame>
        {/* 420px mobile frame constraint */}
        <div 
          id="app-container"
          className="w-full max-w-[420px] min-h-screen bg-black flex flex-col relative mx-auto"
        >
          {/* Global Floating Toast */}
          <Toast toasts={toasts} onDismiss={dismissToast} />

        {/* Top Header with live Telemetry & Search / Logo Triggers */}
        <Header
          auth={auth}
          isNetworkSuspended={isNetworkSuspended}
          suspendCountdown={suspendCountdown}
          onResume={resume}
          onTriggerAdmin={handleOpenAdminLogin}
          searchQuery={searchQuery}
          onSearchChange={(val) => {
            setSearchQuery(val);
            const trimmed = val.trim().toLowerCase();
            if (trimmed === '7878' || trimmed === '*#admin#') {
              handleOpenAdminLogin();
            }
          }}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-x-hidden relative">
          <Part2Pages
            currentPage={currentPage}
            onNavigate={(page) => setCurrentPage(page)}
            onGoToAdmin={() => {
              setCurrentPage('adminPage');
              toast('Admin authorization requested: Restricted access.', 'info');
            }}
            onManualUnlock={async () => {
              const utrToUnlock = currentUtr || localStorage.getItem('trackmitra_utr') || 'admin-manual';
              await approvePaymentInFirebase(utrToUnlock);
              setAuth((prev) => ({
                ...prev,
                isPaid: true,
                paidAt: Date.now(),
                paidExpiresAt: Date.now() + 24 * 3600 * 1000,
                isJoined: true,
              }));
              setIsNetworkSuspended(false);
              setLockedGroups([]);
              toast('Unlocked by Admin', 'success');
            }}
            onUnlockAll={async () => {
              const utrToUnlock = currentUtr || localStorage.getItem('trackmitra_utr') || 'all-users';
              await approvePaymentInFirebase(utrToUnlock);
              setAuth((prev) => ({
                ...prev,
                isPaid: true,
                isJoined: true,
              }));
              setIsNetworkSuspended(false);
              setLockedGroups([]);
              toast('Unlocked by Admin', 'success');
            }}
            onTriggerSOS={() => {
              triggerAI('DIRECT', 'SOS Emergency Alert dispatched to Barasat response network', 'Chat');
            }}
            onPaymentSuccess={(utr) => {
              setCurrentUtr(utr);
              localStorage.setItem('trackmitra_utr', utr);
              toast(`Payment recorded: UTR ${utr} saved to Firebase (/payments). Waiting for Admin to approve...`, 'info');
            }}
            onVerifyAadhaar={(aadhaar, mobile) => {
              setAuth((prev) => ({
                ...prev,
                isAadhaarVerified: true,
                aadhaarNumber: aadhaar,
                mobileNumber: mobile,
              }));
              toast('Aadhaar Identity Confirmed & Verified.', 'success');
            }}
            showToast={(msg, type) => toast(msg, type)}
          >
            {/* Embedded Active Tab Views within Dashboard */}
            {activeTab === 'home' && (
              <HomeTab
                auth={auth}
                members={members}
                onJoinFree={joinFree}
                onOpenMap={() => setActiveTab('map')}
                onOpenChat={() => setActiveTab('chat')}
                onOpenAadhaarModal={() => setIsAadhaarOpen(true)}
                onOpenPayModal={(amt, title, count) => openPay(amt, title, count)}
                onRecharge={recharge}
                onCreateGroup={handleCreateGroup}
                onOpenPart2Payment={() => setCurrentPage('paymentPage')}
                onOpenPart2GroupLock={() => setCurrentPage('groupLockPage')}
                onToggleMe={toggleMe}
                onOpenVideo={() => setIsLiveVideoModalOpen(true)}
              />
            )}

            {activeTab === 'map' && (
              <MapTab
                auth={auth}
                members={members}
                onToggleMe={toggleMe}
                onInvisible={invisible}
                onToggleMemberVisibility={toggleMi}
                onOpenLiveVideo={toggleLiveVideo}
                isLiveVideoOpen={isLiveVideoModalOpen}
                videoStream={videoStream}
                onStopLiveVideo={stopLive}
                activeGroup={groups[0]}
                onTurnOnGroup={turnOnGroup}
              />
            )}

            {activeTab === 'chat' && (
              <ChatTab
                auth={auth}
                messages={messages}
                onSendMessage={sendText}
                onSendMedia={handleFile}
                onVoiceTriggerDanger={(words) => triggerAI('VOICE', words, 'Voice')}
                isNetworkSuspended={isNetworkSuspended}
                isGroupLocked={isGroupLocked}
                lockedReason={lockedReason}
                onRequestUnlock={() => {
                  toast('Unlock request submitted to Safety Support (+91 9088403890). Priority review queued.', 'warning');
                }}
                onTriggerAdmin={() => setCurrentPage('adminPage')}
              />
            )}

            {activeTab === 'groups' && (
              <GroupsTab
                auth={auth}
                groups={groups}
                incidents={incidents}
                onClearIncidents={handleClearIncidents}
                lockedGroups={lockedGroups}
                onOpenAdminPin={() => setIsAdminEmailModalOpen(true)}
                onTurnOnGroup={turnOnGroup}
                onTurnOffGroup={turnOffGroup}
                onToggleMemberTracking={toggleMemberTracking}
                onCreateGroup={(name, purpose, isKidsFree) => {
                  const rateCalc = calculateGroupRate(1, isKidsFree);
                  handleCreateGroup(name, 1, rateCalc.rate, rateCalc.total, isKidsFree);
                }}
                onAddMemberWithAdminPay={handleAddMemberWithAdminPay}
                onTriggerInvitePayThemselves={handleTriggerInvitePayThemselves}
              />
            )}
          </Part2Pages>
        </main>

        {/* Bottom Navigation (Active in Dashboard view) */}
        {currentPage === 'dashboardPage' && (
          <BottomNav
            activeTab={activeTab}
            setActiveTab={(tab) => {
              setActiveTab(tab);
              setCurrentPage('dashboardPage');
            }}
            chatBadgeCount={messages.filter((m) => m.isFlagged).length}
            incidentCount={incidents.filter((i) => !i.resolved).length}
          />
        )}

        {/* Admin Authentication & Override Modals */}
                {/* Admin Email Login Modal (Silent 7s Press / 5-Tap Trigger) */}
        <AdminEmailLoginModal
          isOpen={isAdminEmailModalOpen}
          onClose={handleCloseAdminLogin}
          onSuccess={() => {
            handleCloseAdminLogin();
            setIsAdminPanelOpen(true);
            toast("Superuser Authorized.", "success");
          }}
        />

        {/* In-App Payment WebView Modal */}
        <PaymentWebView
          isOpen={isPaymentWebViewOpen}
          total={webViewAmount}
          planName={webViewPlan}
          count={webViewCount}
          groupId={webViewGroupId}
          onClose={() => setIsPaymentWebViewOpen(false)}
          onSuccess={(utr) => {
            setIsPaymentWebViewOpen(false);
            doPay(utr, webViewAmount);
            if (pendingAddMembers.length > 0 && webViewGroupId) {
              setGroups((prev) => prev.map((g) => {
                if (g.id === webViewGroupId) {
                  const added = pendingAddMembers.map((m) => ({
                    id: `m-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
                    name: m.name,
                    phone: m.phone,
                    isTracking: false,
                    lastSeen: Date.now(),
                    role: "member" as const
                  }));
                  return {
                    ...g,
                    membersCount: g.membersCount + added.length,
                    members: [...(g.members || []), ...added]
                  };
                }
                return g;
              }));
              toast("Biman added you - No payment needed - Go Live in app", "success");
              setPendingAddMembers([]);
            }
            toast("✅ Payment Success! 24h Active - Host ON to Start", "success");
          }}
        />

        <AdminPinModal
          isOpen={isAdminPinOpen}
          onClose={() => setIsAdminPinOpen(false)}
          onSuccess={() => {
            setIsAdminPinOpen(false);
            setIsAdminPanelOpen(true);
          }}
        />

        <AdminPanelModal
          isOpen={isAdminPanelOpen}
          onClose={() => setIsAdminPanelOpen(false)}
          lockedGroups={lockedGroups}
          onUnlockGroup={handleManualUnlock}
          onUnlockAllGroups={handleEmergencyUnlockAll}
          onSimulateThreatLock={handleSimulateThreatLock}
        />

        {/* All Modals (aadhaarM, payM, finalPayM, aiM, liveVideoModal) */}
        <Modals
          isAadhaarOpen={isAadhaarOpen}
          onCloseAadhaar={() => setIsAadhaarOpen(false)}
          onSendAadhaarOTP={sendAadhaarOTP}
          onVerifyOTP={verifyOTP}
          aadhaarNumber={auth.aadhaarNumber}
          mobileNumber={auth.mobileNumber}
          isOtpSent={isOtpSent}
          otpGenerated={otpGenerated}
          isAadhaarVerified={auth.isAadhaarVerified}

          isPayOpen={isPayOpen}
          onClosePay={() => setIsPayOpen(false)}
          payAmount={payAmount}
          payPlanTitle={payPlanTitle}
          initialMemberCount={payMemberCount}
          onDoPay={doPay}
          onOpenAadhaarIfUnverified={() => setIsAadhaarOpen(true)}

          isFinalPayOpen={isFinalPayOpen}
          onCloseFinalPay={() => setIsFinalPayOpen(false)}
          onFinalPay={finalPay}

          isAIOpen={isAIOpen}
          aiThreatType={aiThreatType}
          aiTriggerWords={aiTriggerWords}
          suspendCountdown={suspendCountdown}
          onResumeNetwork={resume}

          isLiveVideoModalOpen={isLiveVideoModalOpen}
          onCloseLiveVideo={stopLive}
          videoStream={videoStream}
          onTriggerLiveVideoHazard={() => {
            triggerAI('LIVE_VIDEO', 'Suspicious Visual Weapon / Violence Detected', 'Live Video');
          }}
        />

        {/* Multi-language Selector Modal for India's 8+ Most Spoken Languages */}
        <LanguageModal />
      </div>
    </MobileDeviceFrame>
  </LanguageProvider>
  );
}
