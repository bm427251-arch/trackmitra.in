import React, { useState } from 'react';
import { 
  Video, 
  MapPin, 
  EyeOff, 
  Navigation, 
  Crosshair, 
  Battery, 
  Activity, 
  Shield, 
  Eye, 
  Compass, 
  Zap,
  Radio,
  LocateFixed,
  Clock,
  Power
} from 'lucide-react';
import { MapMember, UserAuth, GroupItem } from '../types';
import { formatTimeSeconds } from '../utils/aiObserver';

interface MapTabProps {
  auth: UserAuth;
  members: MapMember[];
  onToggleMe: () => void;
  onInvisible: () => void;
  onToggleMemberVisibility: (memberId: string) => void;
  onOpenLiveVideo: () => void;
  isLiveVideoOpen: boolean;
  videoStream: MediaStream | null;
  onStopLiveVideo: () => void;
  activeGroup?: GroupItem;
  onTurnOnGroup?: (groupId: string) => void;
}

export const MapTab: React.FC<MapTabProps> = ({
  auth,
  members,
  onToggleMe,
  onInvisible,
  onToggleMemberVisibility,
  onOpenLiveVideo,
  isLiveVideoOpen,
  videoStream,
  onStopLiveVideo,
  activeGroup,
  onTurnOnGroup
}) => {
  const [selectedMember, setSelectedMember] = useState<MapMember | null>(null);

  // Group status & timing calculation
  const isGroupActive = activeGroup ? activeGroup.isActive : auth.isPaid;
  const expiresAt = activeGroup?.paidExpiresAt || auth.paidExpiresAt;
  const secondsLeft = isGroupActive && expiresAt && expiresAt > Date.now()
    ? Math.round((expiresAt - Date.now()) / 1000)
    : 0;

  return (
    <div className="space-y-3 p-3 pb-24 animate-fadeIn text-slate-100 overflow-y-auto min-h-screen" style={{ overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
      
      {/* 1. Group Status & 24H Timer Banner */}
      <div className={`p-3 rounded-2xl border shadow-lg flex items-center justify-between transition ${
        isGroupActive 
          ? 'bg-slate-900/90 border-emerald-500/50' 
          : 'bg-slate-950 border-amber-500/40'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
            isGroupActive 
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
              : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
          }`}>
            <Clock className="w-4 h-4 animate-spin-slow" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block">
              {activeGroup ? activeGroup.name : 'Barasat Primary Squad'}
            </span>
            <span className={`text-xs font-mono font-black ${
              isGroupActive ? 'text-emerald-300' : 'text-amber-300'
            }`}>
              {isGroupActive 
                ? `Group Status: ON (${formatTimeSeconds(secondsLeft)} left)` 
                : 'Group Status: OFF - Waiting for Host to Start'}
            </span>
          </div>
        </div>

        {!isGroupActive && activeGroup && onTurnOnGroup && (
          <button
            type="button"
            onClick={() => onTurnOnGroup(activeGroup.id)}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow flex items-center gap-1 active:scale-95 transition"
          >
            <Power className="w-3.5 h-3.5" />
            <span>Turn ON</span>
          </button>
        )}
      </div>

      {/* 2. Top Action Toolbar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-2.5 shadow-md flex items-center justify-between gap-1.5 flex-wrap">
        {/* Live Video Check button */}
        <button
          id="live-video-check-btn"
          onClick={onOpenLiveVideo}
          className="flex-1 min-w-[120px] py-2 px-2.5 bg-blue-900/40 hover:bg-blue-800/50 active:scale-95 border border-blue-500/40 rounded-xl text-xs font-bold text-blue-300 flex items-center justify-center gap-1.5 transition"
        >
          <Video className="w-4 h-4 text-blue-400 animate-pulse" />
          <span className="truncate">Live Video Check</span>
        </button>

        {/* Member Self Go Live ON/OFF toggle */}
        <button
          id="toggle-me-btn"
          onClick={onToggleMe}
          className={`py-2 px-3 active:scale-95 border rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
            auth.isLocationSharing
              ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300 shadow-sm'
              : 'bg-slate-950 border-slate-700 text-slate-400'
          }`}
        >
          <Navigation className={`w-3.5 h-3.5 ${auth.isLocationSharing ? 'text-emerald-400' : 'text-slate-500'}`} />
          <span>{auth.isLocationSharing ? 'Go Live: ON' : 'Go Live: OFF'}</span>
        </button>

        {/* Invisible 15m Stealth Toggle */}
        <button
          id="invisible-1h-btn"
          onClick={onInvisible}
          className={`py-2 px-2.5 active:scale-95 border rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition ${
            auth.isInvisible
              ? 'bg-purple-950/80 border-purple-500/60 text-purple-300'
              : 'bg-slate-950 border-slate-700 text-slate-400'
          }`}
        >
          <EyeOff className="w-3.5 h-3.5 text-purple-400" />
          <span>{auth.isInvisible ? 'Ghost ON' : 'Ghost Mode'}</span>
        </button>
      </div>

      {/* 3. Simulated Radar Canvas */}
      <div 
        id="radar-canvas"
        className="relative w-full aspect-[4/3] max-h-[360px] bg-slate-950 rounded-2xl border border-blue-950 overflow-hidden shadow-inner select-none"
      >
        {/* Radar grid rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
          <div className="w-[85%] h-[85%] rounded-full border border-blue-500/40" />
          <div className="w-[60%] h-[60%] rounded-full border border-blue-500/40" />
          <div className="w-[35%] h-[35%] rounded-full border border-blue-500/40" />
          <div className="w-[10%] h-[10%] rounded-full border border-blue-500/40" />
          {/* Crosshairs */}
          <div className="absolute w-full h-[1px] bg-blue-500/30" />
          <div className="absolute h-full w-[1px] bg-blue-500/30" />
        </div>

        {/* Sweep arm animation */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-full h-full rounded-full animate-spin-radar opacity-20 bg-[conic-gradient(from_0deg,transparent_0_300deg,rgba(16,185,129,0.5)_360deg)]" />
        </div>

        {/* Center Coordinate Indicator */}
        <div className="absolute top-2 left-2 z-20 text-[9px] font-mono text-slate-400 bg-slate-900/80 px-2 py-1 rounded border border-slate-800">
          📍 Barasat, Kolkata • 22.72° N, 88.48° E
        </div>

        {/* Member Dots on Radar */}
        {members.map((member) => {
          const isSelected = selectedMember?.id === member.id;
          const isTrackingOn = member.isTracking !== false && member.isVisible && member.isOnline;

          return (
            <div
              key={member.id}
              id={`member-marker-${member.id}`}
              onClick={() => setSelectedMember(member)}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10 transition-all duration-[2000ms] ease-out group"
              style={{
                left: `${member.x}%`,
                top: `${member.y}%`
              }}
            >
              <div className="relative flex items-center justify-center">
                {/* Ping animation if online and green */}
                {isTrackingOn && (
                  <div className="absolute w-6 h-6 rounded-full bg-emerald-400/20 animate-ping pointer-events-none" />
                )}

                {/* Dot: Green if ON, Grey if OFF */}
                <div
                  className={`w-3.5 h-3.5 rounded-full border-2 transition-transform duration-200 ${
                    isSelected ? 'scale-125 ring-2 ring-white' : ''
                  } ${
                    isTrackingOn
                      ? 'bg-emerald-400 border-slate-950 shadow-[0_0_10px_#10b981]'
                      : 'bg-slate-500 border-slate-800'
                  }`}
                />

                {/* Member Label */}
                <div className={`absolute top-4 px-1.5 py-0.2 rounded text-[9px] font-semibold whitespace-nowrap shadow transition ${
                  isTrackingOn
                    ? 'bg-slate-900/90 border border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-900/80 border border-slate-700 text-slate-400'
                }`}>
                  {member.name.split(' ')[0]} {isTrackingOn ? '' : '(OFF)'}
                </div>
              </div>
            </div>
          );
        })}

        <div className="absolute bottom-2.5 right-2.5 z-20 flex items-center gap-1.5">
          <button
            onClick={() => setSelectedMember(null)}
            className="p-1.5 bg-slate-900/90 hover:bg-slate-800 text-blue-400 rounded-lg border border-blue-900 shadow active:scale-95 transition"
            title="Recenter Radar"
          >
            <LocateFixed className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Selected Member Detail Popover */}
      {selectedMember && (
        <div 
          id="member-detail-card"
          className="bg-slate-900/95 border border-blue-900/60 rounded-2xl p-3 shadow-xl animate-fadeIn"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">{selectedMember.avatar}</span>
              <div>
                <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1">
                  {selectedMember.name}
                  {selectedMember.role === 'Admin' && (
                    <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.2 rounded border border-blue-500/30">
                      Host
                    </span>
                  )}
                </h4>
                <p className="text-[10px] text-slate-400">
                  {selectedMember.status} • Ping {selectedMember.lastPingSec}s ago
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedMember(null)}
              className="text-xs text-slate-400 hover:text-white px-2 py-1"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800">
              <p className="text-[10px] text-slate-400 flex items-center justify-center gap-0.5">
                <Activity className="w-3 h-3 text-emerald-400" /> Velocity
              </p>
              <p className="font-mono font-bold text-slate-100 mt-0.5">
                {selectedMember.speedKmH} km/h
              </p>
            </div>
            <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800">
              <p className="text-[10px] text-slate-400 flex items-center justify-center gap-0.5">
                <Battery className="w-3 h-3 text-emerald-400" /> Battery
              </p>
              <p className="font-mono font-bold text-slate-100 mt-0.5">
                {selectedMember.batteryPct}%
              </p>
            </div>
            <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800">
              <p className="text-[10px] text-slate-400 flex items-center justify-center gap-0.5">
                <Zap className="w-3 h-3 text-cyan-400" /> Status
              </p>
              <p className="font-mono font-bold text-emerald-400 mt-0.5">
                {selectedMember.isTracking !== false ? 'Live Radar' : 'Offline'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 4. Member List & Individual ON/OFF Toggles */}
      <div 
        id="member-list-card"
        className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 shadow-md"
      >
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5 font-mono">
            <Shield className="w-3.5 h-3.5 text-blue-400" />
            <span>Radar Tracking Members ({members.length})</span>
          </h3>
          <span className="text-[10px] text-slate-400 font-mono">
            Auto-refresh: 2.0s
          </span>
        </div>

        <div className="space-y-2">
          {members.map((member) => {
            const isTracking = member.isTracking !== false && member.isVisible && member.isOnline;

            return (
              <div
                key={member.id}
                id={`member-row-${member.id}`}
                className="flex items-center justify-between p-2.5 bg-slate-950/70 rounded-xl border border-slate-800 hover:border-blue-500/30 transition"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative">
                    <span className="text-lg">{member.avatar}</span>
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-slate-950 ${
                        isTracking
                          ? 'bg-emerald-500 shadow-[0_0_6px_#10b981]'
                          : 'bg-slate-500'
                      }`}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-200 truncate flex items-center gap-1">
                      {member.name}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate font-mono">
                      {isTracking 
                        ? `${member.speedKmH > 0 ? `${member.speedKmH} km/h` : 'Stationary'} • Batt ${member.batteryPct}%` 
                        : 'Offline - Tap to Go Live'}
                    </p>
                  </div>
                </div>

                {/* Member Self / Admin ON/OFF Tracking Switch */}
                <button
                  id={`toggle-visibility-${member.id}`}
                  onClick={() => onToggleMemberVisibility(member.id)}
                  className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 ${
                    isTracking
                      ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-900 border-slate-700 text-slate-400'
                  }`}
                  title={isTracking ? 'Turn tracking OFF' : 'Turn tracking ON'}
                >
                  <Power className={`w-3.5 h-3.5 ${isTracking ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <span className="text-[11px] font-mono">{isTracking ? 'Live ON' : 'Turn ON'}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
