/**
 * Real-time Payment & Security Synchronization Module
 * Uses localStorage (keys: 'trackmitra_payments' & 'trackmitra_unlocks')
 * with real-time setInterval polling and cross-tab/same-tab event synchronization.
 * Zero external Firebase secrets or environment variables required!
 */

export interface PaymentRecord {
  utr: string;
  upi: string;
  amount?: number;
  count?: number;
  groupId?: string;
  type?: 'create' | 'paid' | 'kids_free';
  status: 'pending' | 'approved' | 'rejected';
  timestamp: number;
  approvedAt?: number;
}

export const UPI_ID = 'bm427251@okaxis';
export const ADMIN_PIN = '7878';
export const ADMIN_EMAIL = 'bm427251@gmail.com';
export const ADMIN_PASS = 'TrackMitra@2026';

// Dedicated storage keys requested by user
export const PAYMENTS_STORAGE_KEY = 'trackmitra_payments';
export const UNLOCKS_STORAGE_KEY = 'trackmitra_unlocks';
export const ADMIN_ACTIONS_STORAGE_KEY = 'trackmitra_admin_actions';

// Deprecated config export kept for backward compatibility (no secrets needed)
export const firebaseConfig = {
  projectId: "trackmitra-local-realtime"
};

// Cross-tab synchronization channel
const BROADCAST_KEY = 'trackmitra_storage_sync';
let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel(BROADCAST_KEY);
  } catch (e) {
    // BroadcastChannel optional fallback
  }
}

/**
 * Reads all payments from localStorage key 'trackmitra_payments'
 * Handles both object map { [utr]: record } and array formats gracefully.
 */
export function getLocalPayments(): Record<string, PaymentRecord> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(PAYMENTS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const map: Record<string, PaymentRecord> = {};
      for (const item of parsed) {
        if (item && item.utr) {
          map[item.utr] = item;
        }
      }
      return map;
    } else if (typeof parsed === 'object' && parsed !== null) {
      return parsed as Record<string, PaymentRecord>;
    }
  } catch (e) {
    console.warn('[Realtime Sync] Failed to parse payments from localStorage', e);
  }
  return {};
}

/**
 * Reads all unlocks from localStorage key 'trackmitra_unlocks'
 */
export function getLocalUnlocks(): Record<string, any> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(UNLOCKS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed;
    }
  } catch (e) {
    console.warn('[Realtime Sync] Failed to parse unlocks from localStorage', e);
  }
  return {};
}

/**
 * Dispatches synchronization notification across windows and same-page listeners
 */
function notifyRealtimeChange(type: 'payment' | 'unlock' | 'action', data: any) {
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type, data, timestamp: Date.now() });
    } catch (e) {}
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('trackmitra_sync_event', { detail: { type, data } }));
  }
}

/**
 * Main App: Save payment to localStorage key 'trackmitra_payments'
 */
export async function savePaymentToFirebase(
  utr: string, 
  upi = UPI_ID, 
  extra: Partial<PaymentRecord> = {}
): Promise<PaymentRecord> {
  const cleanUtr = utr.trim();
  const paymentData: PaymentRecord = {
    utr: cleanUtr,
    upi: upi || UPI_ID,
    amount: extra.amount || 99,
    count: extra.count || 1,
    groupId: extra.groupId,
    type: extra.type || 'create',
    status: 'pending',
    timestamp: Date.now(),
    ...extra
  };

  const payments = getLocalPayments();
  payments[cleanUtr] = paymentData;

  try {
    localStorage.setItem(PAYMENTS_STORAGE_KEY, JSON.stringify(payments));
    localStorage.setItem('trackmitra_utr', cleanUtr);
    localStorage.setItem('trackmitra_payment', 'pending');
  } catch (e) {
    console.warn('[Realtime Sync] Error saving payment to localStorage', e);
  }

  notifyRealtimeChange('payment', paymentData);
  console.log(`[Realtime Sync] Payment saved to '${PAYMENTS_STORAGE_KEY}':`, paymentData);
  return paymentData;
}

/**
 * Admin App: On Approve/Unlock, update status to approved in 'trackmitra_payments'
 * and save to 'trackmitra_unlocks'
 */
export async function approvePaymentInFirebase(utr: string, details?: any): Promise<boolean> {
  const cleanUtr = utr.trim();
  const approvedAt = Date.now();

  // 1. Update payments record in 'trackmitra_payments'
  const payments = getLocalPayments();
  if (payments[cleanUtr]) {
    payments[cleanUtr].status = 'approved';
    payments[cleanUtr].approvedAt = approvedAt;
  } else {
    payments[cleanUtr] = {
      utr: cleanUtr,
      upi: UPI_ID,
      amount: details?.amount || 99,
      status: 'approved',
      timestamp: approvedAt,
      approvedAt
    };
  }

  // 2. Update unlocks record in 'trackmitra_unlocks'
  const unlocks = getLocalUnlocks();
  unlocks[cleanUtr] = {
    status: 'approved',
    approvedAt,
    expiresAt: approvedAt + 24 * 3600 * 1000,
    type: details?.type || 'paid',
    groupName: details?.groupName || 'Primary Safety Squad',
    membersCount: details?.membersCount || 1,
    ...details
  };

  try {
    localStorage.setItem(PAYMENTS_STORAGE_KEY, JSON.stringify(payments));
    localStorage.setItem(UNLOCKS_STORAGE_KEY, JSON.stringify(unlocks));
    localStorage.setItem('trackmitra_payment', 'unlocked');
  } catch (e) {
    console.warn('[Realtime Sync] Error writing approve status to localStorage', e);
  }

  notifyRealtimeChange('unlock', { utr: cleanUtr, status: 'approved' });
  return true;
}

/**
 * Admin App: Reject payment
 */
export async function rejectPaymentInFirebase(utr: string): Promise<boolean> {
  const cleanUtr = utr.trim();
  const payments = getLocalPayments();
  if (payments[cleanUtr]) {
    payments[cleanUtr].status = 'rejected';
  }
  try {
    localStorage.setItem(PAYMENTS_STORAGE_KEY, JSON.stringify(payments));
  } catch (e) {}
  notifyRealtimeChange('payment', { utr: cleanUtr, status: 'rejected' });
  return true;
}

/**
 * Admin App: Extend license 24h
 */
export async function extendUnlockInFirebase(key: string, additionalMs = 24 * 3600 * 1000): Promise<boolean> {
  const unlocks = getLocalUnlocks();
  if (unlocks[key]) {
    const currentExpiry = typeof unlocks[key] === 'object' && unlocks[key].expiresAt 
      ? unlocks[key].expiresAt 
      : Date.now();
    const newExpiry = Math.max(Date.now(), currentExpiry) + additionalMs;
    if (typeof unlocks[key] === 'object') {
      unlocks[key].expiresAt = newExpiry;
      unlocks[key].status = 'approved';
    } else {
      unlocks[key] = { status: 'approved', expiresAt: newExpiry };
    }
    localStorage.setItem(UNLOCKS_STORAGE_KEY, JSON.stringify(unlocks));
    notifyRealtimeChange('unlock', { key, expiresAt: newExpiry });
    return true;
  }
  return false;
}

/**
 * Admin App: Expire license immediately
 */
export async function expireUnlockInFirebase(key: string): Promise<boolean> {
  const unlocks = getLocalUnlocks();
  if (unlocks[key]) {
    if (typeof unlocks[key] === 'object') {
      unlocks[key].expiresAt = Date.now() - 1000;
      unlocks[key].status = 'expired';
    } else {
      unlocks[key] = 'expired';
    }
    localStorage.setItem(UNLOCKS_STORAGE_KEY, JSON.stringify(unlocks));
    notifyRealtimeChange('unlock', { key, status: 'expired' });
    return true;
  }
  return false;
}

/**
 * Admin App: Delete unlock record
 */
export async function deleteUnlockInFirebase(key: string): Promise<boolean> {
  const unlocks = getLocalUnlocks();
  if (unlocks[key]) {
    delete unlocks[key];
    localStorage.setItem(UNLOCKS_STORAGE_KEY, JSON.stringify(unlocks));
    notifyRealtimeChange('unlock', { key, deleted: true });
    return true;
  }
  return false;
}

/**
 * Admin action logger
 */
export function logAdminAction(action: string, targetId?: string, details = '') {
  try {
    const raw = localStorage.getItem(ADMIN_ACTIONS_STORAGE_KEY);
    const logs = raw ? JSON.parse(raw) : [];
    logs.unshift({
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      action,
      targetId,
      details,
      timestamp: Date.now()
    });
    localStorage.setItem(ADMIN_ACTIONS_STORAGE_KEY, JSON.stringify(logs.slice(0, 100)));
    notifyRealtimeChange('action', { action, targetId });
  } catch (e) {}
}

export function getAdminActionLogs(): any[] {
  try {
    const raw = localStorage.getItem(ADMIN_ACTIONS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Admin App: Listen to payments in real-time.
 */
export function subscribeToPayments(
  onUpdate: (payments: PaymentRecord[]) => void
): () => void {
  let lastRawData = '';
  const emitPayments = () => {
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(PAYMENTS_STORAGE_KEY) || '' : '';
      if (raw !== lastRawData) {
        lastRawData = raw;
        const data = getLocalPayments();
        const list = Object.values(data).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        onUpdate(list);
      }
    } catch (e) {
      console.warn('[Realtime Sync] Error in emitPayments', e);
    }
  };

  const initialData = getLocalPayments();
  const initialList = Object.values(initialData).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  onUpdate(initialList);
  if (typeof localStorage !== 'undefined') {
    lastRawData = localStorage.getItem(PAYMENTS_STORAGE_KEY) || '';
  }

  const intervalId = setInterval(emitPayments, 400);

  const handleBroadcast = (e: MessageEvent) => {
    if (e.data?.type === 'payment' || e.data?.type === 'unlock') {
      emitPayments();
    }
  };
  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleBroadcast);
  }

  const handleStorageOrCustom = () => emitPayments();
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorageOrCustom);
    window.addEventListener('trackmitra_sync_event', handleStorageOrCustom);
  }

  return () => {
    clearInterval(intervalId);
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleBroadcast);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorageOrCustom);
      window.removeEventListener('trackmitra_sync_event', handleStorageOrCustom);
    }
  };
}

/**
 * Main App: Listen to unlocks in real-time.
 */
export function subscribeToUnlocks(
  targetUtr: string | null,
  onUnlocked: (utr: string) => void
): () => void {
  let hasTriggered = false;
  const checkUnlock = () => {
    if (hasTriggered) return;
    const unlocks = getLocalUnlocks();
    const currentUtr = targetUtr || (typeof localStorage !== 'undefined' ? localStorage.getItem('trackmitra_utr') : null);

    if (currentUtr) {
      const cleanUtr = currentUtr.trim();
      const val = unlocks[cleanUtr];
      if (val === 'approved' || (typeof val === 'object' && val?.status === 'approved')) {
        hasTriggered = true;
        onUnlocked(cleanUtr);
        return;
      }
    }

    if (unlocks['all-users'] === 'approved' || unlocks['admin-manual'] === 'approved') {
      hasTriggered = true;
      onUnlocked(currentUtr || 'admin-manual');
      return;
    }

    const keys = Object.keys(unlocks);
    for (const key of keys) {
      const val = unlocks[key];
      if (val === 'approved' || (typeof val === 'object' && val?.status === 'approved')) {
        if (!currentUtr || key === currentUtr.trim()) {
          hasTriggered = true;
          onUnlocked(key);
          break;
        }
      }
    }
  };

  checkUnlock();
  const intervalId = setInterval(checkUnlock, 400);

  const handleBroadcast = (e: MessageEvent) => {
    if (e.data?.type === 'unlock') {
      checkUnlock();
    }
  };
  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleBroadcast);
  }

  const handleStorageOrCustom = () => checkUnlock();
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorageOrCustom);
    window.addEventListener('trackmitra_sync_event', handleStorageOrCustom);
  }

  return () => {
    clearInterval(intervalId);
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleBroadcast);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorageOrCustom);
      window.removeEventListener('trackmitra_sync_event', handleStorageOrCustom);
    }
  };
}
