export type TabType = 'home' | 'map' | 'chat' | 'groups';

export interface UserAuth {
  email: string;
  isJoined: boolean;
  trialStartedAt: number | null; // timestamp
  trialSecondsRemaining: number;
  isAadhaarVerified: boolean;
  aadhaarNumber: string;
  mobileNumber: string;
  isPaid: boolean;
  paidAt: number | null;
  paidExpiresAt: number | null; // 24h expiry
  isLocationSharing: boolean;
  isInvisible: boolean;
  invisibleExpiresAt: number | null;
}

export interface MapMember {
  id: string;
  name: string;
  role: 'Admin' | 'Member';
  avatar: string;
  lat: number;
  lng: number;
  x: number; // percentage on mock map (10% to 90%)
  y: number; // percentage on mock map (10% to 90%)
  targetX: number;
  targetY: number;
  speedKmH: number;
  batteryPct: number;
  isVisible: boolean;
  isOnline: boolean;
  isTracking: boolean; // Member Self ON/OFF
  lastPingSec: number;
  status: string;
  phone?: string;
  isSOS?: boolean;
  isGhost?: boolean;
  speed?: number;
  battery?: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  timestamp: string;
  timeMs: number;
  type: 'text' | 'image' | 'video' | 'system' | 'voice';
  mediaUrl?: string;
  mediaName?: string;
  isFlagged?: boolean;
  threatType?: string;
  audioDuration?: string;
}

export type ThreatType = 
  | 'DIRECT'
  | 'CODE_COMBO'
  | 'STALKING'
  | 'COORDINATION'
  | 'LOCATION_SHARING'
  | 'VOICE'
  | 'VIDEO'
  | 'PHOTO'
  | 'LIVE_VIDEO';

export interface ThreatResult {
  isDanger: boolean;
  type: ThreatType | null;
  triggerWords: string[];
  explanation: string;
  confidence: number;
}

export interface IncidentRecord {
  id: string;
  timestamp: string;
  timeMs: number;
  groupId?: string;
  type: ThreatType;
  triggerWords: string[];
  explanation?: string;
  source: 'Chat' | 'Voice' | 'File' | 'Live Video';
  memberName: string;
  resolved: boolean;
  blockedUser?: boolean;
}

export interface GroupMemberItem {
  id: string;
  name: string;
  phone: string;
  isTracking: boolean; // Member Self ON/OFF
  lastSeen: number;
  role: 'admin' | 'member';
}

export interface GroupItem {
  id: string;
  name: string;
  code: string;
  purpose?: string;
  isKidsFree?: boolean; // Kids Safety (3 Free - Text Only)
  isActive: boolean; // Initially OFF, turned ON by Admin
  startTime: number | null;
  paidExpiresAt: number | null; // 24h timer starts ONLY after Admin turns ON
  isLive?: boolean;
  membersCount: number;
  ratePerPerson: number;
  totalCost: number;
  isAdmin: boolean;
  createdAt: string;
  isLocked?: boolean;
  lockReason?: string;
  members: GroupMemberItem[];
}

export interface LockedGroup {
  id: string;
  name: string;
  reason: string;
  threatType: ThreatType;
  timestamp: string;
  timeMs: number;
  messagePreview: string;
}

export interface ToastNotification {
  id: string;
  message: string;
  type: 'success' | 'danger' | 'info' | 'warning';
}

export interface SOSLogItem {
  id: string;
  time: string;
  timeMs: number;
  location: string;
  user: string;
  phone?: string;
  resolved: boolean;
}

export interface AdminActionLog {
  id: string;
  action: string;
  targetId?: string;
  details: string;
  timestamp: number;
}
