import { IS_TEST_MODE, PAYMENT_ENABLED } from '../config';
import { ThreatResult, ThreatType } from '../types';

export const BAD_WORDS = [
  "riot",
  "attack",
  "steal",
  "robbery",
  "দাঙ্গা",
  "চুরি",
  "ডাকাতি",
  "মার্ডার",
  "খুন",
  "লুট",
  "বোমা",
  "হামলা"
];

export const CODE_WORDS = [
  "মাল",
  "মালটা",
  "জিনিস",
  "টার্গেট",
  "পাখি",
  "পার্সেল",
  "লোকটা"
];

export const ACTION_WORDS = [
  "ঘিরে ফেল",
  "রেডি থাক",
  "তুলে নে",
  "লক কর",
  "ধরে ফেল",
  "ঘেরাও"
];

export const LOC_PASS = [
  "সামনে দিয়ে গেলো",
  "তোমার সামনে যাবে",
  "তোমার দিকে আসছে",
  "বাড়ির সামনে",
  "পিছনে আছি",
  "এখন একা",
  "বেরিয়েছে"
];

const TARGET_PRONOUNS = ["তোমার", "তোমার দিকে", "তোমার সামনে", "tumar", "tomar"];

/**
 * Advanced intent and linguistic threat check based on Bengali & English semantic patterns.
 */
export function advancedCheck(text: string, history: string[] = []): ThreatResult {
  if (!text || !text.trim()) {
    return {
      isDanger: false,
      type: null,
      triggerWords: [],
      explanation: 'Safe: empty input',
      confidence: 0
    };
  }

  const cleanText = text.toLowerCase().trim();
  const recentHistory = history.slice(-3).map(h => h.toLowerCase()).join(' ');
  const combinedContext = `${recentHistory} ${cleanText}`;

  // 1. Direct Bad Words Detection
  const matchedBadWords: string[] = [];
  for (const bw of BAD_WORDS) {
    if (cleanText.includes(bw.toLowerCase())) {
      matchedBadWords.push(bw);
    }
  }

  if (matchedBadWords.length > 0) {
    return {
      isDanger: true,
      type: 'DIRECT',
      triggerWords: matchedBadWords,
      explanation: `Direct Threat Detected: Prohibited term(s) "${matchedBadWords.join(', ')}"`,
      confidence: 0.99
    };
  }

  // Helper match finder
  const findMatches = (corpus: string, wordList: string[]): string[] => {
    const matches: string[] = [];
    for (const w of wordList) {
      if (corpus.includes(w.toLowerCase())) {
        matches.push(w);
      }
    }
    return matches;
  };

  const textCode = findMatches(cleanText, CODE_WORDS);
  const textAction = findMatches(cleanText, ACTION_WORDS);
  const textLoc = findMatches(cleanText, LOC_PASS);

  const contextCode = findMatches(combinedContext, CODE_WORDS);
  const contextAction = findMatches(combinedContext, ACTION_WORDS);
  const contextLoc = findMatches(combinedContext, LOC_PASS);

  // 2. Code + Action Match => CODE_COMBO
  if ((textCode.length > 0 && textAction.length > 0) || 
      (textCode.length > 0 && contextAction.length > 0) || 
      (textAction.length > 0 && contextCode.length > 0)) {
    const triggers = Array.from(new Set([...textCode, ...textAction, ...contextCode.filter(w => textAction.length > 0), ...contextAction.filter(w => textCode.length > 0)]));
    return {
      isDanger: true,
      type: 'CODE_COMBO',
      triggerWords: triggers.slice(0, 4),
      explanation: `Suspicious Code & Hostile Action Combination: "${triggers.join(' + ')}"`,
      confidence: 0.95
    };
  }

  // 3. Code + Location => STALKING
  if ((textCode.length > 0 && textLoc.length > 0) || 
      (textCode.length > 0 && contextLoc.length > 0) || 
      (textLoc.length > 0 && contextCode.length > 0)) {
    const triggers = Array.from(new Set([...textCode, ...textLoc, ...contextCode.filter(w => textLoc.length > 0), ...contextLoc.filter(w => textCode.length > 0)]));
    return {
      isDanger: true,
      type: 'STALKING',
      triggerWords: triggers.slice(0, 4),
      explanation: `Target Surveillance & Stalking Vector: "${triggers.join(' + ')}"`,
      confidence: 0.93
    };
  }

  // 4. Action + Location => COORDINATION
  if ((textAction.length > 0 && textLoc.length > 0) || 
      (textAction.length > 0 && contextLoc.length > 0) || 
      (textLoc.length > 0 && contextAction.length > 0)) {
    const triggers = Array.from(new Set([...textAction, ...textLoc, ...contextAction.filter(w => textLoc.length > 0), ...contextLoc.filter(w => textAction.length > 0)]));
    return {
      isDanger: true,
      type: 'COORDINATION',
      triggerWords: triggers.slice(0, 4),
      explanation: `Physical Trap / Coordinated Ambush Pattern: "${triggers.join(' + ')}"`,
      confidence: 0.94
    };
  }

  // 5. Location + "তোমার" / "তোমার দিকে" => LOCATION_SHARING
  const hasTargetPronoun = TARGET_PRONOUNS.some(p => cleanText.includes(p));
  if (textLoc.length > 0 && hasTargetPronoun) {
    const pronounMatched = TARGET_PRONOUNS.find(p => cleanText.includes(p)) || "তোমার";
    const triggers = [...textLoc, pronounMatched];
    return {
      isDanger: true,
      type: 'LOCATION_SHARING',
      triggerWords: triggers,
      explanation: `Unauthorized Hostile Location Tracking / Intercept: "${triggers.join(' + ')}"`,
      confidence: 0.92
    };
  }

  return {
    isDanger: false,
    type: null,
    triggerWords: [],
    explanation: 'Threat scan clear. Encrypted and safe.',
    confidence: 0.1
  };
}

/**
 * Format Indian Aadhaar number with standard 4-digit groups (XXXX XXXX XXXX)
 */
export function formatAadhaar(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 12);
  const parts = [];
  for (let i = 0; i < digits.length; i += 4) {
    parts.push(digits.slice(i, i + 4));
  }
  return parts.join(' ');
}

/**
 * Format 10 digit Indian mobile number
 */
export function formatMobile(value: string): string {
  return value.replace(/\D/g, '').slice(0, 10);
}

/**
 * Format seconds into mm:ss or hh:mm:ss
 */
export function formatTimeSeconds(totalSec: number): string {
  if (totalSec <= 0) return '00:00';
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export const PRICING = {
  GROUP_CREATE: 99,
  PER_MEMBER: 29,
  VALIDITY: 24 * 3600 * 1000,
  KIDS_FREE_LIMIT: 3
};

export interface GroupRateResult {
  total: number;
  perPerson: number;
  rate: number;
  type: 'kids_free' | 'create' | 'paid';
}

export const calculateGroupRate = (count: number, isFree: boolean = false): GroupRateResult => {
  if (IS_TEST_MODE || !PAYMENT_ENABLED) {
    return { total: 0, perPerson: 0, rate: 0, type: "kids_free" };
  }
  const safeCount = Math.max(1, Math.round(count));
  if (isFree && safeCount <= 3) {
    return { total: 0, perPerson: 0, rate: 0, type: "kids_free" };
  }
  const total = 99 + (safeCount - 1) * 29;
  return { total, perPerson: 29, rate: safeCount === 1 ? 99 : 29, type: isFree ? "kids_free" : "paid" };
};
