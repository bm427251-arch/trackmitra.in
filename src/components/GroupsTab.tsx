import React, { useState } from 'react';
import { 
  Users, 
  ShieldAlert, 
  ShieldCheck, 
  Copy, 
  Check, 
  ExternalLink, 
  AlertTriangle,
  Trash2,
  Plus,
  Power,
  Clock,
  UserPlus,
  Radio,
  Lock,
  Unlock,
  Baby,
  Phone,
  MessageCircle,
  Share2
} from 'lucide-react';
import { GroupItem, UserAuth, IncidentRecord, LockedGroup, GroupMemberItem } from '../types';
import { PRICING, calculateGroupRate, formatTimeSeconds } from '../utils/aiObserver';
import { IS_TEST_MODE, PAYMENT_ENABLED } from '../config';

interface GroupsTabProps {
  auth: UserAuth;
  groups: GroupItem[];
  lockedGroups: LockedGroup[];
  incidents: IncidentRecord[];
  onOpenAdminPin?: () => void;
  onClearIncidents: () => void;
  onTurnOnGroup: (groupId: string) => void;
  onTurnOffGroup: (groupId: string) => void;
  onToggleMemberTracking: (groupId: string, memberId: string) => void;
  onCreateGroup: (name: string, purpose: string, isKidsFree: boolean) => void;
  onAddMemberWithAdminPay: (groupId: string, members: Array<{ name: string, phone: string }>) => void;
  onTriggerInvitePayThemselves: (groupId: string, memberName: string, phone: string) => void;
}

export const GroupsTab: React.FC<GroupsTabProps> = ({
  auth,
  groups,
  lockedGroups,
  incidents,
  onOpenAdminPin,
  onClearIncidents,
  onTurnOnGroup,
  onTurnOffGroup,
  onToggleMemberTracking,
  onCreateGroup,
  onAddMemberWithAdminPay,
  onTriggerInvitePayThemselves
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupPurpose, setNewGroupPurpose] = useState('Family Travel Escort');
  const [isKidsFreeToggle, setIsKidsFreeToggle] = useState(false);

  // Add Member Modal State
  const [activeAddMemberGroupId, setActiveAddMemberGroupId] = useState<string | null>(null);
  const [contactList, setContactList] = useState([
    { id: 'c1', name: 'Biman Mukherjee', phone: '+91 9088403890', appInstalled: true, selected: true },
    { id: 'c2', name: 'Rina Mukherjee', phone: '+91 9876543210', appInstalled: true, selected: false },
    { id: 'c3', name: 'Sourav Das', phone: '+91 9831209845', appInstalled: false, selected: false },
    { id: 'c4', name: 'Priya Sen', phone: '+91 9748123456', appInstalled: false, selected: false },
  ]);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');

  const handleCopyLink = (groupId: string) => {
    const url = `https://trackmitra.in/join/${groupId}?pay=29`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
    }
    setCopiedId(groupId);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleShareWhatsApp = (groupId: string, groupName: string) => {
    const url = `https://trackmitra.in/join/${groupId}?pay=29`;
    const text = encodeURIComponent(
      `🛡 Join our verified TrackMitra Safety Group: "${groupName}".\n` +
      `AI Threat Observer & Live Escort active.\n` +
      `Link valid 24H: ${url}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleCreateGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    onCreateGroup(newGroupName.trim(), newGroupPurpose.trim(), isKidsFreeToggle);
    setNewGroupName('');
    setIsKidsFreeToggle(false);
    setIsCreateModalOpen(false);
  };

  const toggleSelectContact = (id: string) => {
    setContactList((prev) => 
      prev.map((c) => c.id === id ? { ...c, selected: !c.selected } : c)
    );
  };

  const handleAddNewContact = () => {
    if (!newContactName.trim() || !newContactPhone.trim()) return;
    setContactList((prev) => [
      ...prev,
      {
        id: `c_${Date.now()}`,
        name: newContactName.trim(),
        phone: newContactPhone.trim(),
        appInstalled: false,
        selected: true
      }
    ]);
    setNewContactName('');
    setNewContactPhone('');
  };

  const selectedContacts = contactList.filter((c) => c.selected);

  return (
    <div id="groups-tab" className="p-4 space-y-4 pb-24 text-slate-100 overflow-y-auto min-h-screen" style={{ WebkitOverflowScrolling: "touch" }}>
      
      {/* Top Header Card */}
      <div className="bg-[#000066]/90 border border-blue-900 rounded-2xl p-4 shadow-xl flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-black text-white uppercase tracking-wider font-mono">
              Safety Squads & Groups
            </h2>
          </div>
          <p className="text-[11px] text-blue-200 mt-0.5">
            DADA KA BHAROSA • Group ON/OFF & 24h Escort Control
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="px-3 py-2 bg-gradient-to-r from-[#FF9933] to-amber-500 hover:from-amber-500 hover:to-orange-500 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center gap-1.5 active:scale-95 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ New Safety Group</span>
        </button>
      </div>

      {/* CREATE GROUP MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-blue-900 rounded-2xl w-full max-w-sm p-4 space-y-3.5 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-xs font-black uppercase text-white flex items-center gap-1.5 font-mono">
                <Users className="w-4 h-4 text-amber-400" />
                <span>Create New Safety Group</span>
              </h3>
              <button 
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">Group Name</label>
                <input
                  type="text"
                  required
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g. Barasat Family Escort"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              {/* 2 Plans Side-by-Side: Card 1 Free vs Card 2 Pro */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {/* Card 1: FREE GROUP */}
                <div 
                  onClick={() => setIsKidsFreeToggle(true)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition flex flex-col justify-between ${
                    isKidsFreeToggle 
                      ? "bg-purple-950/70 border-purple-400 shadow-md ring-1 ring-purple-400" 
                      : "bg-slate-950 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xl">👶</span>
                      <span className="text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/40 px-1.5 py-0.2 rounded font-bold uppercase">
                        Free Tier
                      </span>
                    </div>
                    <h4 className="text-xs font-black text-white">Free Group (Test)</h4>
                    <p className="text-[11px] text-purple-300 font-bold font-mono">Unlimited (Test Mode)</p>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      • Text Alert Only<br/>
                      • Team Chat & SOS Text<br/>
                      • NO Live Radar/Map
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!newGroupName.trim()) {
                        alert("Please enter a group name first");
                        return;
                      }
                      onCreateGroup(newGroupName.trim(), "Free Group (Text Only)", true);
                      setNewGroupName("");
                      setIsKidsFreeToggle(false);
                      setIsCreateModalOpen(false);
                    }}
                    className="w-full mt-2.5 py-1.5 bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs rounded-lg transition"
                  >
                    Create Free (Test)
                  </button>
                </div>

                {/* Card 2: PRO GROUP */}
                <div 
                  onClick={() => setIsKidsFreeToggle(false)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition flex flex-col justify-between ${
                    !isKidsFreeToggle 
                      ? "bg-blue-950/70 border-blue-400 shadow-md ring-1 ring-blue-400" 
                      : "bg-slate-950 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xl">🛡️</span>
                      <span className="text-[9px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded uppercase">
                        PRO
                      </span>
                    </div>
                    <h4 className="text-xs font-black text-white">Pro Group (Test)</h4>
                    <p className="text-[11px] text-blue-300 font-bold font-mono">Unlimited - Free (Test)</p>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      • Full Live + Radar + SOS<br/>
                      • AI Observer & Code Words<br/>
                      • Free Testing - ₹0
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!newGroupName.trim()) {
                        alert("Please enter a group name first");
                        return;
                      }
                      onCreateGroup(newGroupName.trim(), "Pro Group (Full Escort)", false);
                      setNewGroupName("");
                      setIsKidsFreeToggle(false);
                      setIsCreateModalOpen(false);
                    }}
                    className="w-full mt-2.5 py-1.5 bg-gradient-to-r from-amber-500 to-[#FF9933] hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs rounded-lg transition"
                  >
                    Create Free (Test)
                  </button>
                </div>
              </div>

              <p className="text-[10px] text-center text-slate-400 italic pt-1">
                * Groups are created OFF initially. Timer starts when Host turns ON.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ADD MEMBER & DUAL PAYMENT MODAL */}
      {activeAddMemberGroupId && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-blue-900 rounded-2xl w-full max-w-md p-4 space-y-3.5 shadow-2xl animate-scaleUp max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-xs font-black uppercase text-white flex items-center gap-1.5 font-mono">
                <UserPlus className="w-4 h-4 text-emerald-400" />
                <span>Add Members to Squad</span>
              </h3>
              <button 
                type="button"
                onClick={() => setActiveAddMemberGroupId(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Contact Multi-Select */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300">
                Select from Contacts (Phonebook):
              </label>
              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {contactList.map((contact) => (
                  <div
                    key={contact.id}
                    onClick={() => toggleSelectContact(contact.id)}
                    className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                      contact.selected
                        ? 'bg-blue-950/60 border-blue-500/60'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        checked={contact.selected}
                        onChange={() => {}} 
                        className="accent-blue-500" 
                      />
                      <div>
                        <p className="text-xs font-bold text-white leading-tight">{contact.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{contact.phone}</p>
                      </div>
                    </div>

                    <div>
                      {contact.appInstalled ? (
                        <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.5 rounded font-bold flex items-center gap-1">
                          <Check className="w-2.5 h-2.5" />
                          <span>App Installed</span>
                        </span>
                      ) : (
                        <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">
                          Invite via SMS
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Add Custom Contact */}
            <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
              <p className="text-[10px] text-slate-400 font-semibold">+ Or Add New Phone Number:</p>
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  type="text"
                  placeholder="Name"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                />
                <input
                  type="tel"
                  placeholder="+91 Mobile"
                  value={newContactPhone}
                  onChange={(e) => setNewContactPhone(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono"
                />
              </div>
              <button
                type="button"
                onClick={handleAddNewContact}
                className="w-full py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg"
              >
                + Add To List
              </button>
            </div>

            {/* Dual Payment Choice */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <p className="text-[11px] font-bold text-slate-200">
                Choose Payment Option for Selected ({selectedContacts.length} members):
              </p>

              {/* Option A: Admin Pays */}
              <button
                type="button"
                onClick={() => {
                  const activeGrp = groups.find((g) => g.id === activeAddMemberGroupId);
                  
                  onAddMemberWithAdminPay(
                    activeAddMemberGroupId, 
                    selectedContacts.map((c) => ({ name: c.name, phone: c.phone }))
                  );
                  setActiveAddMemberGroupId(null);
                }}
                className="w-full p-2.5 bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-500/50 rounded-xl text-left transition flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-black text-emerald-300">
                    Add Free (Test Mode - Unlimited)
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Direct add • Sends SMS: "Added you - No payment needed"
                  </p>
                </div>
                <span className="text-xs font-bold text-emerald-400 font-mono">
                  Add Free (Test) →
                </span>
              </button>

              {/* Option B: Invitee Pays */}
              <button
                type="button"
                onClick={() => {
                  if (selectedContacts.length > 0) {
                    onTriggerInvitePayThemselves(
                      activeAddMemberGroupId, 
                      selectedContacts[0].name, 
                      selectedContacts[0].phone
                    );
                  }
                  setActiveAddMemberGroupId(null);
                }}
                className="w-full p-2.5 bg-blue-950/70 hover:bg-blue-900/80 border border-blue-500/50 rounded-xl text-left transition flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-black text-blue-300">
                    {IS_TEST_MODE ? 'Option B: Direct Invite Link (Free Test)' : 'Option B: They will Pay Themselves (₹29)'}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {IS_TEST_MODE ? 'Generates direct 24h WhatsApp deep link with free access' : 'Generates 24h WhatsApp deep link for self-checkout'}
                  </p>
                </div>
                <span className="text-xs font-bold text-blue-400 font-mono">
                  Share Link →
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. Group List (Enrolled Security Groups) */}
      <div id="glist-card" className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
            Active Security Groups ({groups.length})
          </h3>
          <span className="text-[10px] text-blue-400 font-mono">
            AI Surveillance Grid
          </span>
        </div>

        {groups.map((grp) => {
          const lockedInfo = lockedGroups.find((lg) => lg.id === grp.id);
          const isGrpLocked = !!lockedInfo || grp.isLocked;
          const isKidsFree = grp.isKidsFree;

          // Expiry Countdown Calculation
          const isGroupRunning = grp.isActive && grp.paidExpiresAt && grp.paidExpiresAt > Date.now();
          const secondsRemaining = isGroupRunning ? Math.round((grp.paidExpiresAt! - Date.now()) / 1000) : 0;

          return (
            <div
              key={grp.id}
              id={`group-item-${grp.id}`}
              className={`p-4 rounded-2xl transition border ${
                isGrpLocked 
                  ? 'bg-red-950/40 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
                  : grp.isActive
                  ? 'bg-slate-900/90 border-emerald-500/50 shadow-lg'
                  : 'bg-slate-950 border-slate-800'
              }`}
            >
              {/* Group Header Row */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    isGrpLocked 
                      ? 'bg-red-500 animate-ping' 
                      : grp.isActive 
                      ? 'bg-emerald-400 animate-pulse' 
                      : 'bg-slate-600'
                  }`} />
                  <div>
                    <h4 className="text-sm font-black text-white">{grp.name}</h4>
                    <p className="text-[10px] text-slate-400 font-mono">{grp.code} • {grp.purpose || 'Travel Safety'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {isKidsFree && (
                    <span className="text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/40 font-mono px-2 py-0.5 rounded font-black">
                      FREE - Text Alert Only - 3 Members Max
                    </span>
                  )}
                  {isGrpLocked && (
                    <span className="text-[9px] bg-red-500 text-black font-mono px-2 py-0.5 rounded font-black animate-pulse flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      LOCKED
                    </span>
                  )}
                  {grp.isAdmin && (
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono px-1.5 py-0.2 rounded font-black">
                      PRO - Unlimited - Full Live Tracking
                    </span>
                  )}
                </div>
              </div>

              {/* Status and 24H Timer Control Bar */}
              <div className="my-2.5 p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Clock className={`w-4 h-4 ${grp.isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">
                      Group Status & Timer
                    </span>
                    <span className={`text-xs font-mono font-bold ${grp.isActive ? 'text-emerald-300' : 'text-slate-400'}`}>
                      {grp.isActive 
                        ? `ON • ${formatTimeSeconds(secondsRemaining)} remaining` 
                        : 'OFF • Waiting for Host to Start'}
                    </span>
                  </div>
                </div>

                {/* Admin ON/OFF Control Buttons */}
                {grp.isAdmin && (
                  <div className="flex items-center gap-1.5">
                    {!grp.isActive ? (
                      <button
                        type="button"
                        onClick={() => onTurnOnGroup(grp.id)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 active:scale-95 transition"
                      >
                        <Power className="w-3.5 h-3.5" />
                        <span>TURN ON GROUP - START 24H TIMER</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onTurnOffGroup(grp.id)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition"
                      >
                        Stop / Turn OFF
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Locked Notice (without visible PIN) */}
              {isGrpLocked && (
                <div className="my-2 p-2.5 bg-red-950/70 border border-red-500/40 rounded-xl text-xs text-red-200 space-y-1.5">
                  <p className="font-bold">🚨 Locked by AI Safety: {lockedInfo?.reason || grp.lockReason || 'Security breach threat'}</p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] font-mono text-red-300">Security verification required to resume</span>
                    
                  </div>
                </div>
              )}

              {/* Member Self ON/OFF List */}
              <div className="space-y-1.5 mt-3 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-300 font-semibold mb-1">
                  <span>Enrolled Members ({grp.members?.length || grp.membersCount})</span>
                  <button
                    type="button"
                    onClick={() => setActiveAddMemberGroupId(grp.id)}
                    className="text-[10px] text-blue-400 hover:text-blue-300 font-mono font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{IS_TEST_MODE ? '+ Add Member (Free Test)' : '+ Add Member (₹29)'}</span>
                  </button>
                </div>

                <div className="space-y-1 max-h-36 overflow-y-auto pr-1 font-mono text-xs">
                  {(grp.members || []).map((m) => {
                    const isTracking = m.isTracking !== false;
                    return (
                      <div 
                        key={m.id}
                        className="p-1.5 bg-slate-950 rounded-lg flex items-center justify-between border border-slate-800/80"
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${isTracking ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                          <span className="text-slate-200 font-medium">{m.name}</span>
                          <span className="text-[10px] text-slate-500">{m.phone}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-bold ${isTracking ? 'text-emerald-400' : 'text-slate-500'}`}>
                            {isTracking ? 'Live Tracking ON' : 'Offline'}
                          </span>
                          <button
                            type="button"
                            onClick={() => onToggleMemberTracking(grp.id, m.id)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                              isTracking 
                                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' 
                                : 'bg-emerald-600 text-white hover:bg-emerald-500'
                            }`}
                          >
                            {isTracking ? 'Turn OFF' : 'Go Live'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Share & Invite Action Bar */}
              <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyLink(grp.id)}
                  className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono rounded-xl flex items-center gap-1.5 transition"
                >
                  {copiedId === grp.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === grp.id ? 'Copied' : 'Copy Join Link'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleShareWhatsApp(grp.id, grp.name)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow transition"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>{IS_TEST_MODE ? 'WhatsApp Invite (Free Test)' : 'WhatsApp Link (₹29)'}</span>
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* 2. AI Incident Audit Log */}
      <div id="incident-log-card" className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
              AI Incident Audit Log ({incidents.length})
            </h3>
          </div>
          {incidents.length > 0 && (
            <button
              onClick={onClearIncidents}
              className="text-[10px] text-slate-400 hover:text-red-400 flex items-center gap-1 transition"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear</span>
            </button>
          )}
        </div>

        {incidents.length === 0 ? (
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 text-center">
            <ShieldCheck className="w-6 h-6 text-emerald-400 mx-auto mb-1.5" />
            <p className="text-xs font-semibold text-slate-300">All Radar Channels Clear</p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Multilingual Bengali & Hindi AI Observer active in 24h background escort mode.
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {incidents.map((inc) => (
              <div
                key={inc.id}
                className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl text-xs space-y-1 animate-fadeIn"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 font-mono text-[10px] font-bold">
                    [{inc.type}]
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {inc.timestamp}
                  </span>
                </div>
                <p className="text-slate-200">
                  <strong className="text-red-400">Trigger:</strong> "{inc.triggerWords.join(', ')}"
                </p>
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-red-900/40 font-mono">
                  <span>Source: {inc.source}</span>
                  <span className="text-emerald-400 font-semibold">Action: Auto-Freeze Alert Dispatched</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
