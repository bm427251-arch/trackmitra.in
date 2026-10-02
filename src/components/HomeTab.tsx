import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, 
  Baby, 
  Crown, 
  PhoneCall, 
  MessageSquare, 
  MapPin, 
  Radio, 
  ChevronUp, 
  X, 
  Volume2, 
  VolumeX, 
  Camera, 
  Video, 
  Lock, 
  Sparkles,
  Zap,
  Activity,
  AlertTriangle,
  ArrowRight,
  Wifi,
  Battery
} from 'lucide-react';
import { UserAuth, MapMember } from '../types';
import { calculateGroupRate, PRICING } from '../utils/aiObserver';
import { IS_TEST_MODE, PAYMENT_ENABLED } from '../config';
import { useLanguage } from '../utils/i18n';

interface HomeTabProps {
  auth: UserAuth;
  members?: MapMember[];
  onJoinFree?: (email: string, pass: string) => void;
  onOpenMap: () => void;
  onOpenChat: () => void;
  onOpenAadhaarModal: () => void;
  onOpenPayModal: (amount?: number, planName?: string, count?: number) => void;
  onRecharge: () => void;
  onCreateGroup: (name: string, members: number, rate: number, total: number, isKidsFree?: boolean) => void;
  onOpenPart2Payment?: () => void;
  onOpenPart2GroupLock?: () => void;
  onToggleMe?: () => void;
  onOpenVideo?: () => void;
}

export const HomeTab: React.FC<HomeTabProps> = ({
  auth,
  members: propMembers,
  onOpenMap,
  onOpenChat,
  onOpenAadhaarModal,
  onOpenPayModal,
  onCreateGroup,
  onOpenPart2GroupLock,
  onToggleMe,
  onOpenVideo
}) => {
  const { t } = useLanguage();
  // Active selected member for Radar Profile Bottom Sheet
  const [selectedMember, setSelectedMember] = useState<MapMember | null>(null);

  // Hidden Video Screen Bottom Sheet state (Swipe up / toggle)
  const [isVideoSheetOpen, setIsVideoSheetOpen] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isMicMuted, setIsMicMuted] = useState(false);

  // Group creation modal/sheet state for Free vs Pro
  const [showCreateGroupSheet, setShowCreateGroupSheet] = useState(false);
  const [createGroupType, setCreateGroupType] = useState<'free' | 'pro'>('pro');
  const [customGroupName, setCustomGroupName] = useState('Barasat Family Escort');
  const [proMemberCount, setProMemberCount] = useState(3);

  // Micro GPS drift jitter for realistic radar animation
  const [jitter, setJitter] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const interval = setInterval(() => {
      setJitter({
        x: Math.sin(Date.now() / 2500) * 1.5,
        y: Math.cos(Date.now() / 2800) * 1.5,
      });
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  // Default live members list if not provided
  const liveMembers: MapMember[] = propMembers && propMembers.length > 0 ? propMembers : [
    {
      id: 'm-admin',
      name: 'Agent Host (You)',
      role: 'Admin',
      avatar: '👑',
      lat: 22.5726,
      lng: 88.3639,
      x: 50,
      y: 50,
      targetX: 50,
      targetY: 50,
      isGhost: false,
      isSOS: false,
      speed: 0,
      speedKmH: 0,
      battery: 98,
      batteryPct: 98,
      isVisible: true,
      isTracking: true,
      lastPingSec: 2,
      status: 'Active',
      isOnline: true,
      phone: '+91 98765 43210'
    },
    {
      id: 'm-1',
      name: 'Rahul Sen',
      role: 'Member',
      avatar: '👮‍♂️',
      lat: 22.5740,
      lng: 88.3650,
      x: 35,
      y: 32,
      targetX: 35,
      targetY: 32,
      isGhost: false,
      isSOS: false,
      speed: 12,
      speedKmH: 12,
      battery: 84,
      batteryPct: 84,
      isVisible: true,
      isTracking: true,
      lastPingSec: 4,
      status: 'Patrolling',
      isOnline: true,
      phone: '+91 98301 23456'
    },
    {
      id: 'm-2',
      name: 'Priya Sen',
      role: 'Member',
      avatar: '👩',
      lat: 22.5710,
      lng: 88.3620,
      x: 68,
      y: 42,
      targetX: 68,
      targetY: 42,
      isGhost: false,
      isSOS: false,
      speed: 4,
      speedKmH: 4,
      battery: 92,
      batteryPct: 92,
      isVisible: true,
      isTracking: true,
      lastPingSec: 1,
      status: 'In Transit',
      isOnline: true,
      phone: '+91 98312 34567'
    },
    {
      id: 'm-3',
      name: 'Amit Sen (Kids)',
      role: 'Member',
      avatar: '👦',
      lat: 22.5760,
      lng: 88.3690,
      x: 60,
      y: 72,
      targetX: 60,
      targetY: 72,
      isGhost: false,
      isSOS: false,
      speed: 0,
      speedKmH: 0,
      battery: 65,
      batteryPct: 65,
      isVisible: true,
      isTracking: false,
      lastPingSec: 10,
      status: 'School Base',
      isOnline: true,
      phone: '+91 98323 45678'
    }
  ];

  // Touch handlers for swipe up on the bottom handle
  const touchStartYRef = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartYRef.current === null) return;
    const diff = touchStartYRef.current - e.changedTouches[0].clientY;
    if (diff > 50) {
      // Swiped UP
      setIsVideoSheetOpen(true);
    } else if (diff < -50) {
      // Swiped DOWN
      setIsVideoSheetOpen(false);
    }
    touchStartYRef.current = null;
  };

  // Open Pro Group or Free Group creation
  const handleOpenCreateFree = () => {
    setCreateGroupType('free');
    setCustomGroupName('Kids Safety Circle');
    setShowCreateGroupSheet(true);
  };

  const handleOpenCreatePro = () => {
    setCreateGroupType('pro');
    setCustomGroupName('Family Travel Escort');
    setProMemberCount(3);
    setShowCreateGroupSheet(true);
  };

  const handleConfirmCreateGroup = () => {
    // In Test Mode: memberLimit = 500, totalPrice = 0, direct active
    onCreateGroup(customGroupName, 500, 0, 0, false);
    setShowCreateGroupSheet(false);
  };

  // Check if any member has SOS active
  const hasActiveSOS = liveMembers.some(m => m.isSOS);

  return (
    <div 
      className="space-y-4 p-4 pb-28 animate-fadeIn text-slate-100 overflow-y-auto min-h-screen bg-black"
      style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}
    >
      {/* Top Banner in Home: Yellow banner TEST MODE */}
      <div 
        id="home-test-mode-banner"
        className="w-full bg-amber-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg border border-amber-300 font-mono tracking-wide"
      >
        <span>🧪</span>
        <span>{t('test_mode_banner', 'TEST MODE - Payment OFF - 5 Friends Testing')}</span>
      </div>

      {/* ========================================================
          FEATURE CHIPS BOX:
          Live Radar | AI Observer | Aadhaar Verified | Group Lock
          ======================================================== */}
      <div 
        id="feature-chips-box"
        className="bg-[#0A1931] border border-blue-900/80 p-2 rounded-2xl flex items-center justify-between gap-1 overflow-x-auto no-scrollbar shadow-lg"
      >
        <button
          id="chip-live-radar"
          onClick={onOpenMap}
          className="flex-1 py-1.5 px-2 rounded-xl bg-black/50 hover:bg-[#FF6B00]/20 text-[11px] font-bold text-white text-center whitespace-nowrap transition cursor-pointer border border-[#FF6B00]/40 flex items-center justify-center gap-1"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B00] animate-ping"></span>
          <span>{t('chip_live_radar', 'Live Radar')}</span>
        </button>

        <span className="text-slate-600 font-mono text-xs select-none">|</span>

        <button
          id="chip-ai-observer"
          onClick={() => onOpenPart2GroupLock && onOpenPart2GroupLock()}
          className="flex-1 py-1.5 px-2 rounded-xl bg-black/50 hover:bg-blue-950 text-[11px] font-bold text-slate-200 text-center whitespace-nowrap transition cursor-pointer border border-blue-900/50"
        >
          <span>{t('chip_ai_observer', 'AI Observer')}</span>
        </button>

        <span className="text-slate-600 font-mono text-xs select-none">|</span>

        <button
          id="chip-aadhaar-verified"
          onClick={onOpenAadhaarModal}
          className="flex-1 py-1.5 px-2 rounded-xl bg-black/50 hover:bg-blue-950 text-[11px] font-bold text-slate-200 text-center whitespace-nowrap transition cursor-pointer border border-blue-900/50"
        >
          <span>{t('chip_aadhaar', 'Aadhaar Verified')}</span>
        </button>

        <span className="text-slate-600 font-mono text-xs select-none">|</span>

        <button
          id="chip-group-lock"
          onClick={() => onOpenPart2GroupLock && onOpenPart2GroupLock()}
          className="flex-1 py-1.5 px-2 rounded-xl bg-black/50 hover:bg-red-950/50 text-[11px] font-bold text-slate-200 text-center whitespace-nowrap transition cursor-pointer border border-red-900/40"
        >
          <span>{t('chip_group_lock', 'Group Lock')}</span>
        </button>
      </div>

      {/* ========================================================
          C: ANIMATED RADAR - MAIN ATTRACTION - LOBH
          300px Diameter Circular Radar with Rotating Sweep Line
          ======================================================== */}
      <div className="relative py-2 flex flex-col items-center justify-center">
        {/* Radar Header Badge */}
        <div className="flex items-center justify-between w-full max-w-[320px] px-2 mb-2">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#FF6B00]">
            <Radio className="w-3.5 h-3.5 animate-pulse text-[#FF6B00]" />
            <span>24H LIVE TELEMETRY RADAR</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800">
            {liveMembers.length} UNITS TRACKED
          </span>
        </div>

        {/* The 300px Circular Radar Container */}
        <div 
          className={`relative w-[300px] h-[300px] rounded-full overflow-hidden select-none transition-all duration-500 ${
            hasActiveSOS 
              ? 'border-2 border-red-500 shadow-[0_0_40px_rgba(239,68,68,0.6)] bg-red-950/40' 
              : 'border-2 border-[#FF6B00]/60 shadow-[0_0_35px_rgba(255,107,0,0.3)] bg-[#0A1931]/95'
          }`}
          style={{ width: '300px', height: '300px' }}
        >
          {/* Conic Gradient Rotating Sweep Line */}
          <div 
            className="absolute inset-0 pointer-events-none rounded-full"
            style={{
              background: hasActiveSOS
                ? 'conic-gradient(from 0deg, rgba(239, 68, 68, 0.6) 0deg, rgba(239, 68, 68, 0.1) 45deg, transparent 65deg, transparent 360deg)'
                : 'conic-gradient(from 0deg, rgba(255, 107, 0, 0.5) 0deg, rgba(255, 107, 0, 0.15) 50deg, transparent 70deg, transparent 360deg)',
              animation: 'radarSweep 4s linear infinite',
              transformOrigin: 'center center'
            }}
          />

          {/* Concentric Range Rings */}
          <div className="absolute inset-[15%] rounded-full border border-[#FF6B00]/25 pointer-events-none" />
          <div className="absolute inset-[32%] rounded-full border border-[#FF6B00]/30 pointer-events-none" />
          <div className="absolute inset-[48%] rounded-full border border-[#FF6B00]/40 pointer-events-none" />

          {/* Crosshair Center Lines */}
          <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-[#FF6B00]/20 pointer-events-none" />
          <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-[#FF6B00]/20 pointer-events-none" />

          {/* Cardinal Points */}
          <span className="absolute top-2 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold text-[#FF6B00]/70 pointer-events-none">N</span>
          <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold text-[#FF6B00]/70 pointer-events-none">S</span>
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-mono font-bold text-[#FF6B00]/70 pointer-events-none">W</span>
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-mono font-bold text-[#FF6B00]/70 pointer-events-none">E</span>

          {/* Distance Ring Labels */}
          <span className="absolute top-[34%] left-[52%] text-[8px] font-mono text-slate-500 pointer-events-none">500m</span>
          <span className="absolute top-[17%] left-[52%] text-[8px] font-mono text-slate-500 pointer-events-none">1.5km</span>

          {/* Interactive Member Dots */}
          {liveMembers.map((member, idx) => {
            const posX = member.x + (idx % 2 === 0 ? jitter.x : -jitter.x);
            const posY = member.y + (idx % 2 === 0 ? jitter.y : -jitter.y);

            return (
              <div
                key={member.id}
                onClick={() => setSelectedMember(member)}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20"
                style={{
                  left: `${Math.max(10, Math.min(90, posX))}%`,
                  top: `${Math.max(10, Math.min(90, posY))}%`
                }}
                title={`${member.name} (${member.isOnline ? 'Online' : 'Offline'})`}
              >
                {/* Ping wave for Online dot */}
                {member.isOnline && !member.isSOS && (
                  <span className="absolute -inset-1 rounded-full bg-emerald-400/40 animate-ping pointer-events-none"></span>
                )}
                {member.isSOS && (
                  <span className="absolute -inset-2 rounded-full bg-red-500/60 animate-ping pointer-events-none"></span>
                )}

                {/* Dot Icon Body */}
                <div 
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shadow-lg border-2 transition-transform duration-200 group-hover:scale-125 ${
                    member.isSOS 
                      ? 'bg-red-600 border-white text-white animate-bounce' 
                      : member.isOnline 
                      ? 'bg-emerald-500 border-white text-slate-950' 
                      : 'bg-slate-600 border-slate-400 text-slate-300'
                  }`}
                >
                  {member.role === 'Admin' ? '👑' : member.avatar || '●'}
                </div>

                {/* Tiny Label under Dot */}
                <span className="absolute top-5 left-1/2 -translate-x-1/2 text-[9px] font-bold font-mono px-1 py-0.2 rounded bg-black/80 text-white whitespace-nowrap border border-slate-800 shadow pointer-events-none">
                  {member.name.split(' ')[0]}
                </span>
              </div>
            );
          })}
        </div>

        {/* Radar Action Caption */}
        <p className="text-[11px] font-mono text-slate-400 mt-2 text-center">
          Tap any <span className="text-emerald-400 font-bold">● Green Member Dot</span> to open instant direct call & profile
        </p>
      </div>

      {/* ========================================================
          D: TWO CARDS SIDE BY SIDE:
          Card 1: FREE GROUP (KIDS SAFETY)
          Card 2: PRO GROUP (UNLIMITED LIVE)
          ======================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        {/* CARD 1 - FREE GROUP (KIDS SAFETY) */}
        <div 
          id="card-free-group"
          className="relative bg-[#0A1931] border border-blue-900/60 rounded-2xl p-4 shadow-xl flex flex-col justify-between hover:border-blue-400/50 transition group"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 text-[10px] font-bold font-mono border border-blue-800">
                FREE (TEST) - Unlimited
              </span>
              <span className="text-xs font-mono font-bold text-slate-400">
                ₹0 / Free
              </span>
            </div>

            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-10 h-10 rounded-xl bg-blue-950 text-blue-400 flex items-center justify-center border border-blue-800 shrink-0">
                <Baby className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-blue-300 transition">
                  Free Group (Test)
                </h3>
                <p className="text-[11px] text-slate-300 font-mono">
                  Unlimited - Text + Live All Features
                </p>
              </div>
            </div>

            <div className="space-y-1.5 my-3 text-xs text-slate-300 bg-black/40 p-2.5 rounded-xl border border-blue-900/40">
              <div className="flex items-center gap-1.5 text-blue-300">
                <span className="text-[10px]">✔</span>
                <span>Encrypted Text Chat & Alerts</span>
              </div>
              <div className="flex items-center gap-1.5 text-blue-300">
                <span className="text-[10px]">✔</span>
                <span>Emergency SOS Text Alert</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500 line-through">
                <span className="text-[10px]">✖</span>
                <span>No Live GPS Radar Telemetry</span>
              </div>
            </div>
          </div>

          <button
            id="create-free-group-btn"
            onClick={handleOpenCreateFree}
            className="w-full py-2.5 bg-blue-900/50 hover:bg-blue-800 border border-blue-500/40 text-blue-100 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow transition active:scale-95 cursor-pointer mt-2"
          >
            <Baby className="w-4 h-4 text-blue-300" />
            <span>Create Group - FREE TEST</span>
          </button>
        </div>

        {/* CARD 2 - PRO GROUP (UNLIMITED LIVE) */}
        <div 
          id="card-pro-group"
          className="relative bg-gradient-to-br from-[#0A1931] via-[#141e33] to-black border-2 border-[#FF6B00]/70 rounded-2xl p-4 shadow-xl flex flex-col justify-between hover:border-[#FF6B00] transition group shadow-[#FF6B00]/10"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="px-2 py-0.5 rounded-full bg-[#FF6B00] text-white text-[10px] font-black font-mono shadow-sm">
                PRO (TEST) - Unlimited Free
              </span>
              <span className="text-xs font-mono font-bold text-[#FF6B00]">
                ₹0 Free (Test)
              </span>
            </div>

            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-10 h-10 rounded-xl bg-[#FF6B00]/20 text-[#FF6B00] flex items-center justify-center border border-[#FF6B00]/40 shrink-0">
                <Crown className="w-5 h-5 text-[#FF6B00]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-[#FF6B00] transition">
                  Pro Group (Test)
                </h3>
                <p className="text-[11px] text-amber-200/90 font-mono">
                  Unlimited - Free - Full Radar + SOS
                </p>
              </div>
            </div>

            <div className="space-y-1.5 my-3 text-xs text-slate-300 bg-black/60 p-2.5 rounded-xl border border-[#FF6B00]/30">
              <div className="flex items-center gap-1.5 text-[#FF6B00]">
                <span className="text-[10px]">★</span>
                <span>Full Live Map & 300px Radar Telemetry</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400">
                <span className="text-[10px]">★</span>
                <span>Member Self ON/OFF & Ghost Mode</span>
              </div>
              <div className="flex items-center gap-1.5 text-blue-300">
                <span className="text-[10px]">★</span>
                <span>AI Observer Threat Auto-Freeze</span>
              </div>
            </div>
          </div>

          <button
            id="create-pro-group-btn"
            onClick={handleOpenCreatePro}
            className="w-full py-2.5 bg-[#FF6B00] hover:bg-[#e05e00] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-[#FF6B00]/30 transition active:scale-95 cursor-pointer mt-2"
          >
            <Crown className="w-4 h-4 text-white" />
            <span>Create Group - FREE TEST</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          E: BOTTOM PULL-UP TRIGGER: VIDEO SCREEN BOTTOM SHEET
          Hidden by default below home screen, swipes up!
          ======================================================== */}
      <div 
        id="video-screen-pull-handle"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={() => setIsVideoSheetOpen(true)}
        className="w-full mt-3 py-3 px-4 bg-[#0A1931] hover:bg-slate-900 border border-[#FF6B00]/40 rounded-2xl flex items-center justify-between text-xs text-slate-200 cursor-pointer shadow-lg active:scale-98 transition group select-none"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-red-600/20 text-red-400 flex items-center justify-center border border-red-500/40">
            <Video className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <span className="font-bold text-white group-hover:text-[#FF6B00] transition">
              {t('video_conference', 'Emergency Video Conference')}
            </span>
            <p className="text-[10px] text-slate-400">
              {t('swipe_up_video', 'Swipe up for Live Emergency Video Conference')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[11px] font-mono text-[#FF6B00] font-bold">
          <span>▲ Swipe Up</span>
          <ChevronUp className="w-4 h-4 animate-bounce" />
        </div>
      </div>

      {/* ========================================================
          MEMBER PROFILE BOTTOM SHEET (Triggered from Radar Dot)
          ======================================================== */}
      {selectedMember && (
        <div 
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end justify-center animate-fadeIn"
          onClick={() => setSelectedMember(null)}
        >
          <div 
            className="w-full max-w-md bg-[#0A1931] border-t-2 border-[#FF6B00] rounded-t-3xl p-5 shadow-2xl space-y-4 animate-slideUp text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Handle */}
            <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto mb-1"></div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-black/60 border border-slate-700 flex items-center justify-center text-2xl shadow">
                  {selectedMember.avatar || '👤'}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>{selectedMember.name}</span>
                    {selectedMember.role === 'Admin' && (
                      <span className="px-1.5 py-0.2 bg-[#FF6B00] text-[9px] font-mono font-bold rounded text-white">
                        HOST
                      </span>
                    )}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5 text-xs font-mono">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      {selectedMember.isOnline ? 'Active on Radar' : 'Offline'}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-400 flex items-center gap-1">
                      <Battery className="w-3 h-3 text-emerald-400" />
                      {selectedMember.battery || 90}%
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedMember(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono bg-black/50 p-2.5 rounded-xl border border-slate-800">
              <div>
                <p className="text-[10px] text-slate-400">GPS Speed</p>
                <p className="font-bold text-white mt-0.5">{selectedMember.speed || 0} km/h</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400">Telemetry</p>
                <p className="font-bold text-blue-300 mt-0.5">2s Synced</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400">Phone</p>
                <p className="font-bold text-[#FF6B00] mt-0.5 truncate">{selectedMember.phone || 'Verified'}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <a
                href={`tel:${selectedMember.phone || '+919876543210'}`}
                className="py-2.5 px-3 bg-[#FF6B00] hover:bg-[#e05e00] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 shadow-lg shadow-[#FF6B00]/30 transition active:scale-95"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Call</span>
              </a>

              <button
                onClick={() => {
                  setSelectedMember(null);
                  onOpenChat();
                }}
                className="py-2.5 px-3 bg-blue-900/60 hover:bg-blue-800 border border-blue-500/40 text-blue-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1 shadow transition active:scale-95 cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Chat</span>
              </button>

              <button
                onClick={() => {
                  setSelectedMember(null);
                  onOpenMap();
                }}
                className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1 border border-slate-700 shadow transition active:scale-95 cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Map</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          E: 70VH SLIDE-UP VIDEO SCREEN BOTTOM SHEET
          Emergency Video Conference with Emergency Tiles & Controls
          ======================================================== */}
      {isVideoSheetOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end justify-center animate-fadeIn"
          onClick={() => setIsVideoSheetOpen(false)}
        >
          <div 
            className="w-full max-w-lg bg-[#0A1931] border-t-2 border-[#FF6B00] rounded-t-3xl p-4 shadow-2xl flex flex-col justify-between animate-slideUp text-slate-100"
            style={{ height: '70vh' }}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Top Bar with Down Handle & Close */}
            <div>
              <div className="w-12 h-1 bg-slate-600 rounded-full mx-auto mb-2"></div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Emergency Video Escort Stream
                    </h3>
                    <p className="text-[10px] font-mono text-slate-400">
                      Encrypted Squad Feed • 24H Traveling Escort
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsVideoSheetOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Video Stream & Emergency Tiles (2x2 Grid) */}
            <div className="grid grid-cols-2 gap-2 my-3 flex-1 overflow-hidden">
              {/* Tile 1: Admin Main Feed */}
              <div className="relative bg-slate-950 rounded-2xl overflow-hidden border border-blue-900/60 flex items-center justify-center shadow-inner">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 z-10 pointer-events-none" />
                <div className="text-center p-3 z-0">
                  <span className="text-4xl block animate-pulse">👮‍♂️</span>
                  <p className="text-[11px] font-bold text-slate-300 mt-1 font-mono">Agent Ravi (Host)</p>
                </div>
                <div className="absolute bottom-2 left-2 z-20 flex items-center gap-1 text-[9px] font-mono bg-black/80 px-1.5 py-0.5 rounded text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  LIVE CAM
                </div>
              </div>

              {/* Tile 2: Rahul Sen */}
              <div className="relative bg-slate-950 rounded-2xl overflow-hidden border border-blue-900/60 flex items-center justify-center shadow-inner">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 z-10 pointer-events-none" />
                <div className="text-center p-3 z-0">
                  <span className="text-4xl block">👩</span>
                  <p className="text-[11px] font-bold text-slate-300 mt-1 font-mono">Priya Sen</p>
                </div>
                <div className="absolute bottom-2 left-2 z-20 flex items-center gap-1 text-[9px] font-mono bg-black/80 px-1.5 py-0.5 rounded text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  MIC ON
                </div>
              </div>

              {/* Tile 3: Escort HQ */}
              <div className="relative bg-slate-950 rounded-2xl overflow-hidden border border-blue-900/60 flex items-center justify-center shadow-inner">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 z-10 pointer-events-none" />
                <div className="text-center p-3 z-0">
                  <span className="text-4xl block">🛡️</span>
                  <p className="text-[11px] font-bold text-[#FF6B00] mt-1 font-mono">Dada Ka Bharosa</p>
                </div>
                <div className="absolute bottom-2 left-2 z-20 text-[9px] font-mono bg-black/80 px-1.5 py-0.5 rounded text-blue-300">
                  AI OBSERVER
                </div>
              </div>

              {/* Tile 4: Kids Unit / Patrol */}
              <div className="relative bg-slate-950 rounded-2xl overflow-hidden border border-blue-900/60 flex items-center justify-center shadow-inner">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 z-10 pointer-events-none" />
                <div className="text-center p-3 z-0">
                  <span className="text-4xl block">👦</span>
                  <p className="text-[11px] font-bold text-slate-300 mt-1 font-mono">Amit Sen</p>
                </div>
                <div className="absolute bottom-2 left-2 z-20 text-[9px] font-mono bg-black/80 px-1.5 py-0.5 rounded text-amber-400">
                  STANDBY
                </div>
              </div>
            </div>

            {/* Video Controls (Speaker ON, Mic, Camera, Minimize) */}
            <div className="flex items-center justify-around pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                className={`flex flex-col items-center gap-1 text-[10px] font-mono ${
                  isSpeakerOn ? 'text-[#FF6B00]' : 'text-slate-500'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center shadow">
                  {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </div>
                <span>Speaker {isSpeakerOn ? 'ON' : 'OFF'}</span>
              </button>

              <button
                onClick={() => setIsMicMuted(!isMicMuted)}
                className={`flex flex-col items-center gap-1 text-[10px] font-mono ${
                  !isMicMuted ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center shadow">
                  <Radio className="w-5 h-5" />
                </div>
                <span>{isMicMuted ? 'Muted' : 'Unmuted'}</span>
              </button>

              <button
                onClick={() => {
                  if (onOpenVideo) onOpenVideo();
                }}
                className="flex flex-col items-center gap-1 text-[10px] font-mono text-blue-300"
              >
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center shadow">
                  <Camera className="w-5 h-5" />
                </div>
                <span>Switch Cam</span>
              </button>

              <button
                onClick={() => setIsVideoSheetOpen(false)}
                className="flex flex-col items-center gap-1 text-[10px] font-mono text-red-400"
              >
                <div className="w-10 h-10 rounded-full bg-red-950/80 border border-red-500/50 flex items-center justify-center shadow">
                  <X className="w-5 h-5 text-red-300" />
                </div>
                <span>Close</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          GROUP CREATION BOTTOM SHEET (Free vs Pro)
          ======================================================== */}
      {showCreateGroupSheet && (
        <div 
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end justify-center animate-fadeIn"
          onClick={() => setShowCreateGroupSheet(false)}
        >
          <div 
            className="w-full max-w-md bg-[#0A1931] border-t-2 border-[#FF6B00] rounded-t-3xl p-5 shadow-2xl space-y-4 animate-slideUp text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto mb-1"></div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#FF6B00]/20 text-[#FF6B00] flex items-center justify-center border border-[#FF6B00]/40">
                  {createGroupType === 'free' ? <Baby className="w-4 h-4" /> : <Crown className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {createGroupType === 'free' ? 'Create Free Group (Kids Safety)' : 'Create Pro Group (Full Live)'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {createGroupType === 'free' ? 'Max 3 Members • Text Only' : 'Unlimited Members • 24H Live Escort'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowCreateGroupSheet(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Squad Name input */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Group Identifier / Squad Name
              </label>
              <input
                type="text"
                value={customGroupName}
                onChange={(e) => setCustomGroupName(e.target.value)}
                placeholder="e.g. Travel Escort Group"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF6B00] transition"
              />
            </div>

            {/* Pro Member Slider (Only for Pro group) */}
            {createGroupType === 'pro' && (
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-300">Members to Escort:</span>
                  <span className="font-mono font-bold text-[#FF6B00] bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800">
                    {proMemberCount} Members
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="50"
                  step="1"
                  value={proMemberCount}
                  onChange={(e) => setProMemberCount(parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#FF6B00]"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                  <span>{IS_TEST_MODE ? 'Host (Free Test)' : '1 Host (₹99)'}</span>
                  <span>{IS_TEST_MODE ? 'Free (Unlimited)' : '+₹29/person'}</span>
                  <span>{IS_TEST_MODE ? '500 Max' : '50 members'}</span>
                </div>

                <div className="bg-black/60 p-3 rounded-xl border border-slate-800 mt-2 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Total Pro Rate:</span>
                  <span className="text-base font-mono font-black text-[#FF6B00]">
                    {IS_TEST_MODE ? '₹0 Free (Test)' : `₹${calculateGroupRate(proMemberCount, false).total}`}
                  </span>
                </div>
              </div>
            )}

            {createGroupType === 'free' && (
              <div className="bg-black/60 p-3 rounded-xl border border-blue-900/60 text-xs space-y-1">
                <div className="flex items-center justify-between text-blue-300 font-bold">
                  <span>Kids Safety 3 Free:</span>
                  <span>₹0 Free</span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Includes 3 members, encrypted text messages, and instant SOS text broadcast.
                </p>
              </div>
            )}

            <button
              onClick={handleConfirmCreateGroup}
              className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition active:scale-95 cursor-pointer ${
                createGroupType === 'free'
                  ? 'bg-blue-600 hover:bg-blue-500 text-white'
                  : 'bg-[#FF6B00] hover:bg-[#e05e00] text-white shadow-[#FF6B00]/40'
              }`}
            >
              <span>Create Group - FREE TEST</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
