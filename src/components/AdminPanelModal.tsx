import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  X, 
  PhoneCall, 
  Clock, 
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  Phone,
  Search,
  Users,
  DollarSign,
  Radio,
  Trash2,
  Send,
  AlertOctagon,
  Copy,
  Check,
  Ban,
  Activity
} from 'lucide-react';
import { LockedGroup, GroupItem, IncidentRecord, SOSLogItem } from '../types';
import { 
  subscribeToPayments, 
  approvePaymentInFirebase, 
  rejectPaymentInFirebase,
  savePaymentToFirebase, 
  getLocalUnlocks,
  extendUnlockInFirebase,
  expireUnlockInFirebase,
  deleteUnlockInFirebase,
  logAdminAction,
  getAdminActionLogs,
  PaymentRecord, 
  UPI_ID 
} from '../lib/firebase';

interface AdminPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminPinModal: React.FC<AdminPinModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '7878') {
      setError('');
      onSuccess();
    } else {
      setError('Access Denied: Invalid Security Credentials');
    }
  };

  const handleQuickKey = (num: string) => {
    if (pin.length < 6) {
      const nextPin = pin + num;
      setPin(nextPin);
      if (nextPin === '7878') {
        setError('');
        onSuccess();
      }
    }
  };

  return (
    <div 
      id="admin-pin-modal"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
    >
      <div className="bg-slate-900 border border-blue-900/60 rounded-2xl w-full max-w-sm p-4 shadow-2xl animate-scaleUp text-slate-100 space-y-3.5">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#000066] border border-blue-500/40 flex items-center justify-center text-blue-400">
              <ShieldAlert className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-100 uppercase tracking-wider">
                Admin Authentication
              </h3>
              <p className="text-[10px] text-blue-400 font-mono">
                Manual Override Authorization
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5 text-center">
            <p className="text-xs text-slate-300">
              Enter Administrator Credentials to access the <span className="text-blue-400 font-semibold">Manual Override Panel</span>:
            </p>
            <div className="mt-2">
              <input
                id="admin-pin-input"
                type="password"
                maxLength={8}
                value={pin}
                autoFocus
                onChange={(e) => {
                  setPin(e.target.value);
                  setError('');
                  if (e.target.value === '7878') {
                    onSuccess();
                  }
                }}
                placeholder="••••"
                className="w-full text-center tracking-[0.4em] font-mono font-black text-xl bg-slate-900 border border-blue-500/40 focus:border-blue-400 rounded-xl py-2 px-3 text-blue-300 focus:outline-none transition shadow-inner"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1.5 font-mono">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((key) => {
              if (key === 'C') {
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setPin('');
                      setError('');
                    }}
                    className="py-2.5 bg-slate-950 hover:bg-slate-800 active:scale-95 text-red-400 rounded-xl font-bold text-xs border border-slate-800 transition"
                  >
                    Clear
                  </button>
                );
              }
              if (key === '⌫') {
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setPin((prev) => prev.slice(0, -1))}
                    className="py-2.5 bg-slate-950 hover:bg-slate-800 active:scale-95 text-slate-300 rounded-xl font-bold text-xs border border-slate-800 transition"
                  >
                    ←
                  </button>
                );
              }
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleQuickKey(key)}
                  className="py-2.5 bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-slate-100 rounded-xl font-bold text-sm border border-slate-700 transition"
                >
                  {key}
                </button>
              );
            })}
          </div>

          {error && (
            <p className="text-[11px] text-red-400 text-center font-medium bg-red-950/40 py-1 rounded-lg border border-red-900/50">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 rounded-xl text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-[#000066] hover:bg-blue-900 active:scale-95 text-white rounded-xl text-xs font-bold transition shadow-md border border-blue-500/40"
            >
              Unlock Console
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  lockedGroups: LockedGroup[];
  onUnlockGroup: (id: string) => void;
  onUnlockAllGroups: () => void;
  onSimulateThreatLock?: () => void;
  groups?: GroupItem[];
  onForceGroupOff?: (groupId: string) => void;
  onBroadcastMessage?: (msg: string) => void;
  onClearAllData?: () => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  lockedGroups,
  onUnlockGroup,
  onUnlockAllGroups,
  onSimulateThreatLock,
  groups = [],
  onForceGroupOff,
  onBroadcastMessage,
  onClearAllData
}) => {
  const [activeTab, setActiveTab] = useState<'payments' | 'users' | 'revenue' | 'incidents' | 'sos' | 'system'>('payments');
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [unlocks, setUnlocks] = useState<Record<string, any>>({});
  const [searchUtr, setSearchUtr] = useState('');
  const [copiedUtr, setCopiedUtr] = useState<string | null>(null);
  const [broadcastText, setBroadcastText] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // SOS sample logs
  const [sosLogs, setSosLogs] = useState<SOSLogItem[]>([
    {
      id: 'sos_1',
      time: '12:42 PM',
      timeMs: Date.now() - 3600000,
      location: 'Barasat Station, Kolkata',
      user: 'Biman Mukherjee',
      phone: '+91 9088403890',
      resolved: false
    },
    {
      id: 'sos_2',
      time: '11:15 AM',
      timeMs: Date.now() - 7200000,
      location: 'Jessore Road Sector 3',
      user: 'Rina Mukherjee',
      phone: '+91 9876543210',
      resolved: true
    }
  ]);

  // Subscribe to realtime payments
  useEffect(() => {
    if (!isOpen) return;
    const unsub = subscribeToPayments((list) => {
      setPayments(list);
    });
    setUnlocks(getLocalUnlocks());
    return () => unsub();
  }, [isOpen]);

  if (!isOpen) return null;

  const showInternalToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleApprove = async (utr: string) => {
    await approvePaymentInFirebase(utr);
    logAdminAction('APPROVE_PAYMENT', utr, 'Approved via Admin Panel');
    setUnlocks(getLocalUnlocks());
    showInternalToast(`Approved & Unlocked UTR: ${utr}`);
  };

  const handleReject = async (utr: string) => {
    await rejectPaymentInFirebase(utr);
    logAdminAction('REJECT_PAYMENT', utr, 'Rejected via Admin Panel');
    showInternalToast(`Rejected payment UTR: ${utr}`);
  };

  const handleExtend = async (key: string) => {
    await extendUnlockInFirebase(key);
    logAdminAction('EXTEND_LICENSE', key, 'Extended 24h');
    setUnlocks(getLocalUnlocks());
    showInternalToast(`Extended 24h for ${key}`);
  };

  const handleExpireNow = async (key: string) => {
    await expireUnlockInFirebase(key);
    logAdminAction('EXPIRE_LICENSE', key, 'Expired immediately');
    setUnlocks(getLocalUnlocks());
    showInternalToast(`Expired license for ${key}`);
  };

  const handleDeleteUnlock = async (key: string) => {
    await deleteUnlockInFirebase(key);
    logAdminAction('DELETE_LICENSE', key, 'Deleted unlock entry');
    setUnlocks(getLocalUnlocks());
    showInternalToast(`Deleted unlock ${key}`);
  };

  const handleCopy = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    setCopiedUtr(text);
    setTimeout(() => setCopiedUtr(null), 2000);
  };

  const handleSendBroadcast = () => {
    if (!broadcastText.trim()) return;
    if (onBroadcastMessage) {
      onBroadcastMessage(broadcastText);
    }
    logAdminAction('BROADCAST_MESSAGE', undefined, broadcastText);
    showInternalToast('Broadcast message transmitted to all active groups');
    setBroadcastText('');
  };

  // Calculations for Revenue Tab
  const totalApprovedPayments = payments.filter((p) => p.status === 'approved');
  const totalRevenue = totalApprovedPayments.reduce((acc, p) => acc + (p.amount || 99), 0);
  const todayRevenue = totalApprovedPayments
    .filter((p) => Date.now() - p.timestamp < 24 * 3600 * 1000)
    .reduce((acc, p) => acc + (p.amount || 99), 0);
  const pendingCount = payments.filter((p) => p.status === 'pending').length;

  const filteredPayments = payments.filter((p) => 
    !searchUtr.trim() || p.utr.toLowerCase().includes(searchUtr.trim().toLowerCase())
  );

  return (
    <div 
      id="admin-panel-modal"
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
    >
      <div className="bg-slate-900 border border-blue-900/60 rounded-2xl w-full max-w-4xl h-[92vh] max-h-[760px] flex flex-col shadow-2xl overflow-hidden animate-scaleUp text-slate-100">
        
        {/* Header Bar */}
        <div className="px-4 py-3 bg-[#000066] border-b border-blue-900/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-blue-300">
              <ShieldCheck className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono">
                  TrackMitra Admin Command Center
                </h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded font-bold">
                  LIVE
                </span>
              </div>
              <p className="text-[10px] text-blue-300/80 font-mono">
                System Superuser Console • Manual Unlock & Telemetry
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              type="button"
              onClick={onClose}
              className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Internal Toast Notice */}
        {toastMessage && (
          <div className="bg-emerald-600 text-white text-xs px-4 py-1.5 text-center font-bold font-mono shrink-0 animate-fadeIn">
            {toastMessage}
          </div>
        )}

        {/* 6 Tabs Navigation */}
        <div className="flex bg-slate-950 border-b border-slate-800 overflow-x-auto shrink-0 no-scrollbar">
          {[
            { id: 'payments', label: '1. Payment Approvals', badge: pendingCount > 0 ? pendingCount : null },
            { id: 'users', label: '2. Active Users & Licenses', badge: Object.keys(unlocks).length },
            { id: 'revenue', label: '3. Revenue' },
            { id: 'incidents', label: '4. Incidents & Unlock', badge: lockedGroups.length > 0 ? lockedGroups.length : null, alert: lockedGroups.length > 0 },
            { id: 'sos', label: '5. SOS Logs', badge: sosLogs.filter((s) => !s.resolved).length },
            { id: 'system', label: '6. System Control' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-2 text-xs font-bold whitespace-nowrap flex items-center gap-1.5 border-b-2 transition ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-400 bg-slate-900/60'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge !== null && tab.badge !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  tab.alert ? 'bg-red-600 text-white animate-pulse' : 'bg-blue-900/80 text-blue-200'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-900/90 text-slate-200 space-y-4">
          
          {/* TAB 1: PAYMENT APPROVALS */}
          {activeTab === 'payments' && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">
                    Customer Payment Submissions (trackmitra_payments)
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Review incoming 12-digit UTR transactions and grant instant 24h licenses.
                  </p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    value={searchUtr}
                    onChange={(e) => setSearchUtr(e.target.value)}
                    placeholder="Search by UTR..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {filteredPayments.length === 0 ? (
                <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-slate-800">
                  <CheckCircle2 className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                  <p className="text-xs text-slate-400 font-medium">No payment submissions found matching query.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredPayments.map((p) => {
                    const isPending = p.status === 'pending';
                    const isApproved = p.status === 'approved';
                    const isRejected = p.status === 'rejected';

                    return (
                      <div 
                        key={p.utr}
                        className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isPending 
                            ? 'bg-amber-950/30 border-amber-500/40' 
                            : isApproved 
                            ? 'bg-slate-950 border-emerald-500/30' 
                            : 'bg-red-950/20 border-red-500/30'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-xs text-white">
                              UTR: {p.utr}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(p.utr)}
                              className="text-slate-400 hover:text-white p-0.5"
                              title="Copy UTR"
                            >
                              {copiedUtr === p.utr ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            </button>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase font-mono ${
                              isPending ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                              isApproved ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                              'bg-red-500/20 text-red-300 border border-red-500/40'
                            }`}>
                              {p.status}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-400 flex flex-wrap gap-x-4 gap-y-0.5">
                            <span>Amount: <strong className="text-emerald-400 font-mono">₹{p.amount || 99}</strong></span>
                            <span>Seats: <strong className="text-slate-300 font-mono">{p.count || 1}</strong></span>
                            <span>UPI: <strong className="text-slate-300 font-mono">{p.upi || UPI_ID}</strong></span>
                            <span>Time: <strong className="text-slate-400 font-mono">{new Date(p.timestamp).toLocaleTimeString()}</strong></span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isPending && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleApprove(p.utr)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow active:scale-95 transition"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Approve & Unlock</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleReject(p.utr)}
                                className="px-2.5 py-1.5 bg-red-950 hover:bg-red-900 text-red-300 border border-red-800 font-bold text-xs rounded-xl active:scale-95 transition"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {isApproved && (
                            <span className="text-[11px] text-emerald-400 font-mono font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Active in /unlocks</span>
                            </span>
                          )}
                          {isRejected && (
                            <span className="text-[11px] text-red-400 font-mono">
                              Rejected
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ACTIVE USERS & LICENSES */}
          {activeTab === 'users' && (
            <div className="space-y-3">
              <div className="pb-2 border-b border-slate-800">
                <h4 className="text-xs font-black text-white uppercase tracking-wider">
                  Active Security Licenses (trackmitra_unlocks)
                </h4>
                <p className="text-[11px] text-slate-400">
                  Manage active license expiries, squad statuses, and force disconnects.
                </p>
              </div>

              {Object.keys(unlocks).length === 0 ? (
                <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-slate-800">
                  <Users className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                  <p className="text-xs text-slate-400 font-medium">No active licenses found in storage.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {Object.entries(unlocks).map(([key, data]) => {
                    const item = (typeof data === 'object' && data !== null ? data : {}) as any;
                    const expiresAt = item.expiresAt || (Date.now() + 24 * 3600 * 1000);
                    const hoursLeft = Math.max(0, Math.round((expiresAt - Date.now()) / (3600 * 1000)));
                    const isKidsFree = item.type === 'kids_free';

                    return (
                      <div 
                        key={key}
                        className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-slate-200">
                              {key}
                            </span>
                            {isKidsFree ? (
                              <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/40 px-1.5 py-0.5 rounded font-bold">
                                KIDS FREE (Text Only)
                              </span>
                            ) : (
                              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.5 rounded font-bold">
                                24H ACTIVE ({hoursLeft}h left)
                              </span>
                            )}
                          </div>

                          <div className="text-[11px] text-slate-400 flex flex-wrap gap-x-4">
                            <span>Plan: <strong className="text-slate-300">{isKidsFree ? 'Kids Free' : 'Paid Escort'}</strong></span>
                            <span>Seats: <strong className="text-slate-300 font-mono">{item.membersCount || 1}</strong></span>
                            <span>Group Status: <strong className="text-emerald-400">ON (Tracking Active)</strong></span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleExtend(key)}
                            className="px-2.5 py-1 bg-blue-900/60 hover:bg-blue-800 text-blue-200 text-xs font-semibold rounded-lg transition"
                          >
                            + Extend 24h
                          </button>
                          <button
                            type="button"
                            onClick={() => handleExpireNow(key)}
                            className="px-2.5 py-1 bg-amber-950 hover:bg-amber-900 text-amber-300 text-xs font-semibold rounded-lg transition"
                          >
                            Expire Now
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteUnlock(key)}
                            className="p-1.5 text-slate-500 hover:text-red-400 transition"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: REVENUE */}
          {activeTab === 'revenue' && (
            <div className="space-y-4">
              <div className="pb-2 border-b border-slate-800">
                <h4 className="text-xs font-black text-white uppercase tracking-wider">
                  Financial Analytics & Telemetry
                </h4>
                <p className="text-[11px] text-slate-400">
                  Realtime gross transaction breakdown via UPI (Test Mode - Payment Disabled).
                </p>
              </div>

              {/* 4 Metrics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Today's Gross</p>
                  <p className="text-xl font-black font-mono text-emerald-400">₹{todayRevenue}</p>
                  <p className="text-[9px] text-slate-500 font-mono">Last 24 hours</p>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Total Revenue</p>
                  <p className="text-xl font-black font-mono text-white">₹{totalRevenue}</p>
                  <p className="text-[9px] text-slate-500 font-mono">Cumulative</p>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Active Users</p>
                  <p className="text-xl font-black font-mono text-blue-400">{Object.keys(unlocks).length}</p>
                  <p className="text-[9px] text-slate-500 font-mono">Licensed Squads</p>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Pending UTRs</p>
                  <p className="text-xl font-black font-mono text-amber-400">{pendingCount}</p>
                  <p className="text-[9px] text-slate-500 font-mono">Awaiting Review</p>
                </div>
              </div>

              {/* 7-Day Visual Bar Chart */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <h5 className="text-xs font-bold text-slate-300">Last 7 Days Revenue Trend</h5>
                <div className="grid grid-cols-7 gap-2 items-end h-32 pt-4">
                  {[
                    { day: 'Thu', amt: 297, pct: 40 },
                    { day: 'Fri', amt: 485, pct: 65 },
                    { day: 'Sat', amt: 679, pct: 85 },
                    { day: 'Sun', amt: 873, pct: 100 },
                    { day: 'Mon', amt: 388, pct: 50 },
                    { day: 'Tue', amt: 582, pct: 75 },
                    { day: 'Today', amt: todayRevenue || 198, pct: Math.min(100, Math.max(30, (todayRevenue / 873) * 100)) }
                  ].map((item, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-1.5 h-full justify-end">
                      <span className="text-[9px] font-mono text-emerald-400 font-bold">₹{item.amt}</span>
                      <div 
                        className="w-full bg-gradient-to-t from-[#000066] to-blue-500 rounded-t-lg transition-all duration-500"
                        style={{ height: `${item.pct}%` }}
                      />
                      <span className="text-[9px] text-slate-400 font-mono">{item.day}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: AI OBSERVER INCIDENTS & MANUAL UNLOCK */}
          {activeTab === 'incidents' && (
            <div className="space-y-4">
              <div className="pb-2 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">
                    AI Observer Incidents & Manual Override
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Multilingual security triggers, locked group controls, and instant manual override.
                  </p>
                </div>
                {onSimulateThreatLock && (
                  <button
                    type="button"
                    onClick={onSimulateThreatLock}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono rounded-lg transition"
                  >
                    + Test Trigger
                  </button>
                )}
              </div>

              {/* Red Alert Banner if any locked group exists */}
              {lockedGroups.length > 0 && (
                <div className="p-4 bg-red-950/70 border-2 border-red-500 rounded-2xl shadow-xl shadow-red-950/40 space-y-3 animate-pulse">
                  <div className="flex items-center gap-2 text-red-300">
                    <AlertOctagon className="w-5 h-5 text-red-400" />
                    <span className="text-xs font-black uppercase tracking-wider">
                      CRITICAL ALERT: {lockedGroups.length} GROUP(S) FROZEN BY AI OBSERVER
                    </span>
                  </div>

                  {lockedGroups.map((grp) => (
                    <div key={grp.id} className="p-3 bg-black/60 rounded-xl border border-red-500/40 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-red-300 text-xs">
                          {grp.name} ({grp.id})
                        </span>
                        <span className="text-[10px] bg-red-500 text-black px-2 py-0.5 rounded font-black uppercase">
                          LOCKED
                        </span>
                      </div>
                      <p className="text-xs text-slate-200">
                        <strong>Reason:</strong> {grp.reason}
                      </p>
                      <p className="text-[11px] text-slate-400 italic bg-red-950/40 p-2 rounded border border-red-900/40">
                        "{grp.messagePreview}"
                      </p>

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            onUnlockGroup(grp.id);
                            logAdminAction('VERIFY_UNLOCK_GROUP', grp.id, 'Admin manual override executed');
                            showInternalToast(`Admin Verified - Unlocked ${grp.name}`);
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5 active:scale-95 transition"
                        >
                          <Unlock className="w-3.5 h-3.5" />
                          <span>Verify & Unlock</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            logAdminAction('KEEP_LOCKED_BLOCK', grp.id, 'Blocked and retained lock');
                            showInternalToast(`Group ${grp.name} maintained locked`);
                          }}
                          className="px-3 py-1.5 bg-red-950 hover:bg-red-900 border border-red-800 text-red-300 text-xs font-bold rounded-xl active:scale-95 transition"
                        >
                          <Ban className="w-3.5 h-3.5 inline mr-1" />
                          <span>Keep Locked + Block User</span>
                        </button>
                        <a
                          href="tel:+919088403890"
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1 transition"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Call & Verify</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Global Unlock All Button */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-200">Master Emergency Unlock</p>
                  <p className="text-[10px] text-slate-400">Release all AI security locks across the entire platform.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onUnlockAllGroups();
                    logAdminAction('EMERGENCY_UNLOCK_ALL', undefined, 'Master unlock executed');
                    showInternalToast('Admin Verified - All Groups Unlocked');
                  }}
                  className="px-3.5 py-2 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white font-black text-xs rounded-xl shadow active:scale-95 transition flex items-center gap-1.5"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Unlock All Groups</span>
                </button>
              </div>

              {/* Action Logs */}
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Audit Log (admin_actions)</h5>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 max-h-48 overflow-y-auto font-mono text-[10px] space-y-1.5">
                  {getAdminActionLogs().length === 0 ? (
                    <p className="text-slate-500">No actions recorded yet this session.</p>
                  ) : (
                    getAdminActionLogs().map((act) => (
                      <div key={act.id} className="text-slate-400 flex items-center justify-between border-b border-slate-900 pb-1">
                        <span className="text-blue-400">[{act.action}]</span>
                        <span className="text-slate-300 truncate max-w-[200px]">{act.details}</span>
                        <span className="text-slate-500">{new Date(act.timestamp).toLocaleTimeString()}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SOS LOGS */}
          {activeTab === 'sos' && (
            <div className="space-y-3">
              <div className="pb-2 border-b border-slate-800">
                <h4 className="text-xs font-black text-white uppercase tracking-wider">
                  Emergency SOS Alarm Dispatch Log
                </h4>
                <p className="text-[11px] text-slate-400">
                  Incoming 1-tap SOS distress broadcasts with geolocation telemetry.
                </p>
              </div>

              <div className="space-y-2">
                {sosLogs.map((log) => (
                  <div 
                    key={log.id}
                    className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      !log.resolved ? 'bg-red-950/40 border-red-500/50' : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-white">{log.user}</span>
                        {!log.resolved ? (
                          <span className="px-2 py-0.5 bg-red-600 text-white text-[9px] font-black rounded-full animate-pulse uppercase">
                            ACTIVE SOS
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-bold rounded-full uppercase">
                            RESOLVED
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300">📍 {log.location}</p>
                      <p className="text-[10px] text-slate-400 font-mono">Time: {log.time} • Phone: {log.phone}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {!log.resolved && (
                        <button
                          type="button"
                          onClick={() => {
                            setSosLogs((prev) => prev.map((s) => s.id === log.id ? { ...s, resolved: true } : s));
                            showInternalToast(`Marked SOS for ${log.user} resolved`);
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow active:scale-95 transition"
                        >
                          Mark Resolved
                        </button>
                      )}
                      <a
                        href={`tel:${log.phone}`}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1 transition"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Call</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: SYSTEM CONTROL */}
          {activeTab === 'system' && (
            <div className="space-y-4">
              <div className="pb-2 border-b border-slate-800">
                <h4 className="text-xs font-black text-white uppercase tracking-wider">
                  Platform System Controls & Master Override
                </h4>
                <p className="text-[11px] text-slate-400">
                  Global freeze state, broadcast announcements, and data sanitization.
                </p>
              </div>

              {/* Broadcast Message Input */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-blue-400" />
                  <span>Transmit Broadcast Announcement to All Squads</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={broadcastText}
                    onChange={(e) => setBroadcastText(e.target.value)}
                    placeholder="e.g., Heavy monsoon advisory in Barasat sector. Stay in verified zone."
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleSendBroadcast}
                    className="px-4 py-2 bg-[#000066] hover:bg-blue-900 text-white font-bold text-xs rounded-xl shadow transition active:scale-95 flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </div>
              </div>

              {/* Master System Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-200">Global Freeze All</p>
                    <p className="text-[10px] text-slate-400">Instant safety lockdown across all squads</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      logAdminAction('GLOBAL_FREEZE_ALL', undefined, 'All squads locked');
                      showInternalToast('Global freeze activated');
                    }}
                    className="px-3 py-1.5 bg-red-950 hover:bg-red-900 border border-red-800 text-red-300 font-bold text-xs rounded-xl"
                  >
                    Freeze All
                  </button>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-200">Master Unfreeze All</p>
                    <p className="text-[10px] text-slate-400">Release security freezes everywhere</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onUnlockAllGroups();
                      logAdminAction('GLOBAL_UNFREEZE_ALL', undefined, 'All squads unlocked');
                      showInternalToast('Master unfreeze activated');
                    }}
                    className="px-3 py-1.5 bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 font-bold text-xs rounded-xl"
                  >
                    Unfreeze All
                  </button>
                </div>
              </div>

              {/* Reset Data Danger Zone */}
              <div className="p-4 bg-red-950/20 border border-red-900/40 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-red-300">Sanitize Storage & Reset</p>
                  <p className="text-[10px] text-slate-400">Clears trackmitra_payments and unlocks cache.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Clear all local payments and unlocks storage?')) {
                      localStorage.removeItem('trackmitra_payments');
                      localStorage.removeItem('trackmitra_unlocks');
                      localStorage.removeItem('trackmitra_admin_actions');
                      if (onClearAllData) onClearAllData();
                      showInternalToast('Storage sanitized.');
                    }
                  }}
                  className="px-3 py-1.5 bg-red-800 hover:bg-red-700 text-white font-bold text-xs rounded-xl"
                >
                  Clear All Data
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0 text-[11px] text-slate-400">
          <span className="font-mono">
            Support Hotline: <strong className="text-slate-200">+91 9088403890</strong>
          </span>
          <span className="text-[10px] font-mono text-slate-500">
            TrackMitra v2.1 • DADA KA BHAROSA
          </span>
        </div>

      </div>
    </div>
  );
};
