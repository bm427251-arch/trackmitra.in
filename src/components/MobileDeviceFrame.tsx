import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  Battery, 
  Globe, 
  Smartphone, 
  Maximize2, 
  Minimize2, 
  Radio
} from 'lucide-react';
import { useLanguage } from '../utils/i18n';

interface MobileDeviceFrameProps {
  children: React.ReactNode;
}

export const MobileDeviceFrame: React.FC<MobileDeviceFrameProps> = ({ children }) => {
  const { currentLanguage, activeLanguageInfo, setIsLangModalOpen, t } = useLanguage();
  
  // Real clock in mobile status bar
  const [timeStr, setTimeStr] = useState('10:45');
  const [batteryLevel] = useState(98);
  const [isFrameEnabled, setIsFrameEnabled] = useState(true);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const mins = now.getMinutes();
      const formatted = `${hours % 12 || 12}:${mins < 10 ? '0' : ''}${mins}`;
      setTimeStr(formatted);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#030914] to-slate-950 flex flex-col items-center justify-start text-slate-100 selection:bg-[#FF6B00] selection:text-white py-0 md:py-6 px-0 md:px-4">
      {/* Desktop Helper Bar: Quick Language Selector + Mobile Screen Mode Toggle */}
      <div className="hidden md:flex items-center justify-between w-full max-w-[480px] mb-3 px-3 py-1.5 bg-[#0A1931]/90 backdrop-blur-md rounded-2xl border border-blue-900/60 shadow-lg text-xs">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-[#FF6B00]" />
          <span className="font-bold text-white font-mono text-[11px]">
            Samsung F51 Mobile View
          </span>
          <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-400 font-mono font-bold">
            FHD+
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Selector Button */}
          <button
            id="desktop-lang-btn"
            onClick={() => setIsLangModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-950 hover:bg-[#FF6B00]/20 border border-[#FF6B00]/40 text-white rounded-xl transition cursor-pointer font-sans active:scale-95 shadow-sm"
            title={t('select_language')}
          >
            <span>{activeLanguageInfo.flag}</span>
            <span className="font-bold text-xs">{activeLanguageInfo.name}</span>
            <Globe className="w-3 h-3 text-[#FF6B00]" />
          </button>

          {/* Toggle Phone Chassis */}
          <button
            id="toggle-frame-btn"
            onClick={() => setIsFrameEnabled(!isFrameEnabled)}
            className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl transition cursor-pointer active:scale-95"
            title={isFrameEnabled ? 'Switch to Full Mobile Width' : 'Enable Mobile Phone Chassis'}
          >
            {isFrameEnabled ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Realistic Mobile Device Container */}
      <div className="relative flex justify-center w-full">
        {/* Hardware Buttons on Phone Frame (Desktop only when frame is ON) */}
        {isFrameEnabled && (
          <>
            {/* Left Volume Rocker */}
            <div className="hidden md:block absolute -left-2.5 top-28 w-1.5 h-12 bg-slate-700 rounded-l-md border-l border-slate-500" />
            <div className="hidden md:block absolute -left-2.5 top-44 w-1.5 h-12 bg-slate-700 rounded-l-md border-l border-slate-500" />
            {/* Right Power Key */}
            <div className="hidden md:block absolute -right-2.5 top-32 w-1.5 h-16 bg-slate-700 rounded-r-md border-r border-slate-500" />
          </>
        )}

        {/* The Phone Chassis Body */}
        <div
          id="mobile-phone-viewport"
          className={`w-full transition-all duration-300 flex flex-col relative ${
            isFrameEnabled
              ? 'md:max-w-[420px] md:rounded-[46px] md:border-[10px] md:border-slate-800 md:ring-1 md:ring-slate-700/80 md:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95),0_0_40px_rgba(255,107,0,0.12)] overflow-hidden bg-black min-h-screen md:min-h-[860px]'
              : 'max-w-[420px] min-h-screen bg-black border-x border-slate-800'
          }`}
        >
          {/* Phone Top Notch / Speaker & Punch-hole Camera (Desktop frame only) */}
          {isFrameEnabled && (
            <div className="hidden md:flex items-center justify-between px-6 pt-2 pb-1 bg-black text-slate-400 select-none z-50 text-[11px] font-mono">
              {/* Left Live Clock */}
              <div className="flex items-center gap-1 font-bold text-slate-200">
                <span>{timeStr}</span>
                <span className="text-[9px] text-[#FF6B00] font-sans">●</span>
              </div>

              {/* Center Earpiece Speaker Grill & Punch-hole Camera */}
              <div className="flex items-center gap-2">
                <div className="w-12 h-1 bg-slate-800 rounded-full" />
                <div className="w-3.5 h-3.5 rounded-full bg-slate-950 border border-slate-700 ring-1 ring-slate-800 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-900/60" />
                </div>
              </div>

              {/* Right Status Icons: 5G, VoLTE, WiFi, Battery */}
              <div className="flex items-center gap-1.5 text-slate-300">
                <span className="text-[9px] font-black text-[#FF6B00]">5G</span>
                <span className="text-[8px] font-bold border border-slate-600 px-0.5 rounded text-slate-400">HD</span>
                <Wifi className="w-3 h-3 text-emerald-400" />
                <div className="flex items-center gap-0.5">
                  <span className="text-[10px] font-bold">{batteryLevel}%</span>
                  <Battery className="w-3.5 h-3.5 text-emerald-400 rotate-90" />
                </div>
              </div>
            </div>
          )}

          {/* Actual Application Content */}
          <div className="flex-1 flex flex-col relative w-full overflow-x-hidden">
            {children}
          </div>

          {/* Bottom Mobile Home Gesture Bar Pill */}
          {isFrameEnabled && (
            <div className="hidden md:block w-full bg-[#0A1931] py-1.5 text-center shrink-0 border-t border-blue-950/40">
              <div className="w-28 h-1 bg-slate-600 rounded-full mx-auto" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
