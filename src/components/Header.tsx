import React, { useRef } from 'react';
import { ShieldAlert, Wifi, BatteryCharging, Radio, Lock, Search, PhoneCall, Globe } from 'lucide-react';
import { UserAuth } from '../types';
import { formatTimeSeconds } from '../utils/aiObserver';
import { DeepBlueLogo } from './DeepBlueLogo';
import { useLanguage } from '../utils/i18n';

interface HeaderProps {
  auth: UserAuth;
  isNetworkSuspended: boolean;
  suspendCountdown: number;
  onResume: () => void;
  onOpenSOS?: () => void;
  onTriggerAdmin?: () => void;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  auth,
  isNetworkSuspended,
  suspendCountdown,
  onResume,
  onTriggerAdmin,
  searchQuery = '',
  onSearchChange
}) => {
  const { t, activeLanguageInfo, setIsLangModalOpen } = useLanguage();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 7-second Silent Long Press Trigger - Exactly per specification (No counting, completely silent)
  const startTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (onTriggerAdmin) onTriggerAdmin();
    }, 7000);
  };

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  // Search input: check for phone numbers or silent code
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (onSearchChange) onSearchChange(val);
    const trimmed = val.trim().toLowerCase();
    if (trimmed === '7878' || trimmed === '*#admin#') {
      if (onSearchChange) onSearchChange('');
      if (onTriggerAdmin) onTriggerAdmin();
    }
  };

  // Check if search query looks like a phone number
  const cleanDigits = searchQuery.replace(/[^0-9]/g, '');
  const isPhoneNumber = cleanDigits.length >= 7;

  return (
    <header className="sticky top-0 z-30 bg-[#0A1931] backdrop-blur-md border-b border-[#FF6B00]/20 shadow-xl">
      {/* Network Suspended Red Emergency Banner */}
      {isNetworkSuspended && (
        <div 
          id="network-suspended-banner"
          className="bg-red-600 text-white px-3 py-2 text-xs font-semibold flex items-center justify-between animate-pulse border-b border-red-500 shadow-md"
        >
          <div className="flex items-center gap-1.5 truncate">
            <ShieldAlert className="w-4 h-4 text-white shrink-0 animate-bounce" />
            <span className="truncate">
              THREAT INTERCEPTED: Network Frozen ({suspendCountdown}s)
            </span>
          </div>
          <button
            id="emergency-resume-btn"
            onClick={onResume}
            className="ml-2 px-2 py-0.5 bg-white text-red-700 font-bold rounded text-[11px] hover:bg-red-50 active:scale-95 transition shadow shrink-0 cursor-pointer"
          >
            Override
          </button>
        </div>
      )}

      {/* Main Top Header */}
      <div className="px-3.5 py-2.5 flex items-center justify-between">
        {/* Brand & Identity: onLongPress 7000ms -> triggers Admin Login (100% hidden, no visual clue, no counting) */}
        <div 
          id="trackmitra-logo-click-area"
          onTouchStart={startTimer}
          onTouchEnd={clearTimer}
          onTouchCancel={clearTimer}
          onMouseDown={startTimer}
          onMouseUp={clearTimer}
          onMouseLeave={clearTimer}
          onContextMenu={(e) => e.preventDefault()}
          className="logo flex items-center gap-2 cursor-pointer select-none"
          style={{ WebkitTouchCallout: 'none', userSelect: 'none' }}
        >
          <DeepBlueLogo size={32} />
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-base tracking-tight text-white font-mono">
              TrackMitra
            </span>
            {auth.isPaid && (
              <span className="px-1.5 py-0.2 text-[9px] font-mono font-black uppercase rounded bg-[#FF6B00] text-white shadow-sm shadow-[#FF6B00]/40">
                PRO
              </span>
            )}
          </div>
        </div>

        {/* Right Status Badge, Language Switcher & Telemetry */}
        <div className="flex items-center gap-1.5">
          {/* Language Selector Button */}
          <button
            id="header-lang-btn"
            onClick={() => setIsLangModalOpen(true)}
            className="flex items-center gap-1 px-2 py-1 bg-blue-950/80 hover:bg-[#FF6B00]/20 border border-[#FF6B00]/40 text-white rounded-full transition active:scale-95 cursor-pointer text-[11px] shadow-sm font-sans"
            title="ভারতের ভাষা নির্বাচন করুন (Select Language)"
          >
            <span className="text-xs">{activeLanguageInfo.flag}</span>
            <span className="font-bold text-[10px] text-amber-300 font-sans">{activeLanguageInfo.name}</span>
            <Globe className="w-2.5 h-2.5 text-[#FF6B00]" />
          </button>

          {/* Status Indicator */}
          {isNetworkSuspended ? (
            <div className="flex items-center gap-1 bg-red-950/80 border border-red-500/60 text-red-300 px-2 py-1 rounded-full text-[10px] font-mono font-bold animate-pulse">
              <Radio className="w-2.5 h-2.5 text-red-400" />
              <span>{t('status_offline', 'OFFLINE')} ({suspendCountdown}s)</span>
            </div>
          ) : auth.isPaid ? (
            <div className="flex items-center gap-1 bg-[#FF6B00]/20 border border-[#FF6B00]/50 text-[#FF6B00] px-2 py-0.5 rounded-full text-[10px] font-mono font-bold shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>{t('status_active', '24H ACTIVE')}</span>
            </div>
          ) : auth.isJoined ? (
            <div className="flex items-center gap-1 bg-blue-950/80 border border-blue-500/40 text-blue-300 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
              <span>{t('status_trial', 'TRIAL')} {formatTimeSeconds(auth.trialSecondsRemaining)}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-700 text-slate-300 px-2 py-0.5 rounded-full text-[10px] font-mono">
              <Lock className="w-2.5 h-2.5 text-slate-400" />
              <span>{t('status_standby', 'STANDBY')}</span>
            </div>
          )}

          {/* Signal and Battery Indicators */}
          <div className="flex items-center gap-1 text-slate-300 pl-1 border-l border-blue-900/60">
            <Wifi className={`w-3 h-3 ${isNetworkSuspended ? 'text-red-500' : 'text-emerald-400'}`} />
            <BatteryCharging className="w-3 h-3 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Global Search Bar with Phone Number Direct Call Support */}
      <div className="px-3.5 pb-2.5 pt-0.5">
        <div className="relative flex items-center gap-2">
          <div className="relative flex-1 flex items-center">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              id="searchBar"
              type="text"
              value={searchQuery}
              onChange={handleInputChange}
              placeholder={t('search_placeholder', 'Search groups, members...')}
              className="w-full bg-slate-950/90 border border-blue-900/60 focus:border-[#FF6B00] rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none transition shadow-inner font-mono"
            />
          </div>

          {/* Direct Call Button if Phone Number is Typed */}
          {isPhoneNumber && (
            <a
              id="direct-call-btn"
              href={`tel:${cleanDigits}`}
              className="flex items-center gap-1 px-3 py-1.5 bg-[#FF6B00] hover:bg-[#e05e00] active:scale-95 text-white font-bold text-xs rounded-xl shadow-lg shadow-[#FF6B00]/30 transition shrink-0 animate-fadeIn"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>{t('direct_call', 'Direct Call')}</span>
            </a>
          )}
        </div>
      </div>
    </header>
  );
};
