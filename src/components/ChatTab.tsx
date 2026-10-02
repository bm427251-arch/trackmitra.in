import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Mic, 
  MicOff, 
  Paperclip, 
  Camera, 
  ShieldCheck, 
  ShieldAlert, 
  Sparkles, 
  Play, 
  Check, 
  AlertTriangle, 
  FileVideo, 
  Image as ImageIcon, 
  Volume2,
  Lock,
  Search,
  PhoneCall
} from 'lucide-react';
import { ChatMessage, ThreatResult, ThreatType, UserAuth } from '../types';
import { advancedCheck } from '../utils/aiObserver';

interface ChatTabProps {
  auth: UserAuth;
  messages: ChatMessage[];
  onSendMessage: (text: string, threatResult: ThreatResult) => void;
  onSendMedia: (file: File, type: 'image' | 'video', isThreat: boolean, threatType?: ThreatType, triggerWords?: string[]) => void;
  onVoiceTriggerDanger: (triggerWords: string[]) => void;
  isNetworkSuspended: boolean;
  isGroupLocked?: boolean;
  lockedReason?: string;
  onRequestUnlock?: () => void;
  onTriggerAdmin?: () => void;
}

export const ChatTab: React.FC<ChatTabProps> = ({
  auth,
  messages,
  onSendMessage,
  onSendMedia,
  onVoiceTriggerDanger,
  isNetworkSuspended,
  isGroupLocked = false,
  lockedReason = '',
  onRequestUnlock,
  onTriggerAdmin
}) => {
  const [inputText, setInputText] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceError, setVoiceError] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isScanning]);

  // Handle Send text
  const handleSendText = () => {
    if (!inputText.trim()) return;

    // Check for secret admin commands in text
    const trimmed = inputText.trim().toLowerCase();
    if (trimmed === '7878' || trimmed === '*#admin#') {
      setInputText('');
      if (onTriggerAdmin) onTriggerAdmin();
      return;
    }

    if (isNetworkSuspended || isGroupLocked) return;

    setIsScanning(true);

    // Extract recent text history
    const recentHistory = messages.slice(-5).map(m => m.text);
    const result = advancedCheck(inputText, recentHistory);

    setTimeout(() => {
      setIsScanning(false);
      onSendMessage(inputText, result);
      setInputText('');
    }, 400);
  };

  // Handle file input (Photo / Video)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || isGroupLocked) return;

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    const fileType = isVideo ? 'video' : 'image';

    setIsScanning(true);

    setTimeout(() => {
      setIsScanning(false);

      // AI File scan: check filename + 20% mock flagged for video files
      const lowerName = file.name.toLowerCase();
      const dangerousWords = ["riot", "attack", "steal", "robbery", "bomb", "weapon", "target", "দাঙ্গা", "খুন", "হামলা"];
      const matchedWord = dangerousWords.find(w => lowerName.includes(w));

      // Mock 20% check for video files as specified in prompt: "mock 20% video flagged, block Type VIDEO else Safe"
      const isRandomVideoFlagged = isVideo && Math.random() < 0.20;

      if (matchedWord || isRandomVideoFlagged) {
        const trigger = matchedWord || 'Suspicious Motion / Violence Detected';
        onSendMedia(file, fileType, true, isVideo ? 'VIDEO' : 'PHOTO', [trigger]);
      } else {
        onSendMedia(file, fileType, false);
      }

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }, 600);
  };

  // Trigger file picker
  const handlePickFile = () => {
    if (isNetworkSuspended || isGroupLocked) return;
    fileInputRef.current?.click();
  };

  // Web Speech API Voice Recognition (bn-IN)
  const handleToggleVoice = () => {
    if (isNetworkSuspended || isGroupLocked) return;

    if (isListening) {
      // Stop voice
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceError('Speech recognition is not supported in this browser. Please use standard typing.');
      setTimeout(() => setVoiceError(''), 4000);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'bn-IN'; // Bengali (India)
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceTranscript('');
        setVoiceError('');
      };

      recognition.onresult = (event: any) => {
        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript;
        setVoiceTranscript(transcript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setVoiceError('Microphone permission denied.');
        } else {
          setVoiceError(`Voice input error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        // If we captured a transcript, analyze it
        if (voiceTranscript && voiceTranscript.trim()) {
          const recentHistory = messages.slice(-4).map(m => m.text);
          const checkRes = advancedCheck(voiceTranscript, recentHistory);

          if (checkRes.isDanger) {
            onVoiceTriggerDanger(checkRes.triggerWords);
          } else {
            setInputText((prev) => prev ? `${prev} ${voiceTranscript}` : voiceTranscript);
          }
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Speech start failed:', err);
      setIsListening(false);
      setVoiceError('Failed to initialize microphone.');
    }
  };

  // Quick test intent triggers for customer review
  const testTriggers = [
    { label: 'Attack Now (DIRECT)', text: 'We will attack the checkpoint tonight' },
    { label: 'মালটা তুলে নে (CODE_COMBO)', text: 'মালটা পেয়েছি, তাড়াতাড়ি তুলে নে' },
    { label: 'টার্গেট বাড়ির সামনে (STALKING)', text: 'টার্গেট এখন বাড়ির সামনে দাঁড়িয়ে আছে' },
    { label: 'ঘিরে ফেল (COORDINATION)', text: 'সবাই রেডি থাক, পিছনে আছি ঘিরে ফেল' },
    { label: 'তোমার দিকে আসছে (LOC)', text: 'সাবধান, তোমার দিকে আসছে' },
    { label: 'Safe Message', text: 'All team members reached base station safely.' }
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-130px)] pb-16 animate-fadeIn">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Top Chat Info Bar */}
      <div className="bg-slate-900/90 border-b border-emerald-950/60 px-3 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${isGroupLocked ? 'bg-red-500 animate-ping' : 'bg-emerald-400 animate-pulse'}`} />
          <div>
            <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
              <span>{isGroupLocked ? 'Group Locked (AI Safety Active)' : 'Encrypted Secure Channel'}</span>
              {isGroupLocked ? (
                <Lock className="w-3 h-3 text-red-400" />
              ) : (
                <Lock className="w-3 h-3 text-emerald-400" />
              )}
            </h3>
            <p className="text-[10px] text-emerald-400/80 font-mono">
              AI Observer Active (bn-IN / en-IN)
            </p>
          </div>
        </div>

        <div className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-mono border ${
          isGroupLocked
            ? 'bg-red-950/80 text-red-300 border-red-500/40 animate-pulse'
            : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30'
        }`}>
          {isGroupLocked ? (
            <>
              <AlertTriangle className="w-3 h-3 text-red-400" />
              <span>GROUP LOCKED</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>REAL-TIME SCAN</span>
            </>
          )}
        </div>
      </div>

      {/* Red Banner: Group Locked by AI Safety */}
      {isGroupLocked && (
        <div 
          id="group-locked-ai-banner"
          className="bg-red-950/95 border-b-2 border-red-500 text-white p-3 shadow-lg shrink-0 animate-fadeIn"
        >
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5 animate-bounce" />
            <div className="flex-1 min-w-0">
              <h4 className="font-black text-xs sm:text-sm text-red-100 tracking-wide break-words">
                🚨 Group Locked by AI Safety - Reason: {lockedReason || 'Threat policy triggered'}
              </h4>
              <p className="text-[11px] text-red-200/90 mt-1 leading-snug">
                Transmission has been halted to safeguard members. Contact customer care or submit an unlock request.
              </p>
              <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                <a
                  id="call-admin-btn"
                  href="tel:+919088403890"
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-500 active:scale-95 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow transition cursor-pointer"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>📞 Call Support</span>
                </a>
                <button
                  id="request-unlock-btn"
                  type="button"
                  onClick={onRequestUnlock}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-red-500/60 active:scale-95 text-red-200 hover:text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5 text-red-400" />
                  <span>Request Unlock</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Messages Stream */}
      <div 
        id="chat-messages-area"
        className="flex-1 overflow-y-auto p-3 space-y-3"
      >
        {messages.map((msg) => {
          const isMe = msg.senderId === 'self';
          const isSystem = msg.type === 'system';

          if (isSystem) {
            return (
              <div 
                key={msg.id}
                id={`msg-system-${msg.id}`}
                className="my-2 p-2.5 rounded-xl bg-red-950/80 border border-red-500/60 text-red-200 text-xs shadow-md flex items-start gap-2 animate-fadeIn"
              >
                <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between text-[10px] text-red-300 font-mono font-bold mb-0.5">
                    <span>SECURITY SENTINEL INTERCEPT</span>
                    <span>{msg.timestamp}</span>
                  </div>
                  <p className="leading-snug font-medium">{msg.text}</p>
                </div>
              </div>
            );
          }

          return (
            <div
              key={msg.id}
              id={`msg-bubble-${msg.id}`}
              className={`flex items-start gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs shrink-0 select-none">
                {msg.senderAvatar || (isMe ? '👤' : '🛡️')}
              </div>

              {/* Message Content */}
              <div
                className={`max-w-[78%] rounded-2xl p-2.5 shadow-sm text-xs ${
                  isMe
                    ? 'bg-emerald-600 text-white rounded-tr-none'
                    : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-tl-none'
                }`}
              >
                {/* Sender Name */}
                <div className="flex items-center justify-between gap-2 text-[10px] opacity-75 mb-1 font-mono">
                  <span className="font-bold">{isMe ? 'You' : msg.senderName}</span>
                  <span>{msg.timestamp}</span>
                </div>

                {/* Media rendering */}
                {msg.type === 'image' && msg.mediaUrl && (
                  <div className="mb-2 rounded-xl overflow-hidden border border-emerald-500/30">
                    <img 
                      src={msg.mediaUrl} 
                      alt="Encrypted attachment" 
                      className="w-full h-auto max-h-48 object-cover" 
                    />
                    <div className="bg-slate-950/80 px-2 py-0.5 text-[9px] text-emerald-400 flex items-center gap-1 font-mono">
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>AI Scanned & Encrypted</span>
                    </div>
                  </div>
                )}

                {msg.type === 'video' && msg.mediaUrl && (
                  <div className="mb-2 rounded-xl overflow-hidden border border-emerald-500/30">
                    <video 
                      src={msg.mediaUrl} 
                      controls 
                      className="w-full max-h-48 rounded-lg bg-black" 
                    />
                    <div className="bg-slate-950/80 px-2 py-0.5 text-[9px] text-emerald-400 flex items-center gap-1 font-mono">
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>Video Verified Safe ✓</span>
                    </div>
                  </div>
                )}

                {msg.type === 'voice' && (
                  <div className="flex items-center gap-2 bg-slate-950/40 p-1.5 rounded-lg mb-1">
                    <Volume2 className="w-4 h-4 text-emerald-300" />
                    <div className="flex gap-0.5 items-center">
                      <div className="w-1 h-3 bg-emerald-400 rounded-full" />
                      <div className="w-1 h-5 bg-emerald-400 rounded-full" />
                      <div className="w-1 h-2 bg-emerald-400 rounded-full" />
                      <div className="w-1 h-4 bg-emerald-400 rounded-full" />
                    </div>
                    <span className="text-[10px] font-mono text-emerald-200 ml-1">
                      {msg.audioDuration || '0:04'} (bn-IN)
                    </span>
                  </div>
                )}

                {/* Text */}
                <p className="break-words leading-relaxed whitespace-pre-wrap">
                  {msg.text}
                </p>
              </div>
            </div>
          );
        })}

        {/* AI Checking scan animation banner */}
        {isScanning && (
          <div 
            id="scan-ui-checking"
            className="flex items-center gap-2 p-2 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-mono animate-pulse"
          >
            <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" />
            <span>AI Observer: Scanning intent & semantic safety...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Voice UI Sheet / Modal when listening */}
      {isListening && (
        <div 
          id="voice-ui-modal"
          className="mx-3 mb-2 p-3 rounded-2xl bg-emerald-950/90 border border-emerald-500/60 shadow-xl animate-fadeIn text-center"
        >
          <div className="flex items-center justify-between text-xs font-bold text-emerald-300 mb-2">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <span>LISTENING (Bengali bn-IN / English)</span>
            </span>
            <button
              onClick={handleToggleVoice}
              className="text-[10px] bg-red-600 hover:bg-red-500 text-white font-bold px-2 py-0.5 rounded-md"
            >
              Stop & Analyze
            </button>
          </div>

          <div className="flex items-center justify-center gap-1 my-3">
            <span className="w-1.5 h-6 bg-emerald-400 rounded-full animate-bounce" />
            <span className="w-1.5 h-10 bg-emerald-300 rounded-full animate-bounce [animation-delay:0.1s]" />
            <span className="w-1.5 h-4 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.2s]" />
            <span className="w-1.5 h-8 bg-emerald-200 rounded-full animate-bounce [animation-delay:0.3s]" />
            <span className="w-1.5 h-5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.4s]" />
          </div>

          <p className="text-xs text-slate-200 italic min-h-[20px] font-mono">
            {voiceTranscript || 'Speak now in Bengali or English...'}
          </p>
        </div>
      )}

      {/* Voice Error notice */}
      {voiceError && (
        <div className="mx-3 mb-2 p-2 rounded-xl bg-red-950/80 border border-red-500 text-red-200 text-[11px]">
          {voiceError}
        </div>
      )}

      {/* Quick Test Chips for AI Observer Rules */}
      <div className="px-3 pb-2 flex gap-1.5 overflow-x-auto no-scrollbar">
        <span className="text-[10px] text-slate-500 self-center shrink-0 font-mono">TEST:</span>
        {testTriggers.map((t, idx) => (
          <button
            key={idx}
            onClick={() => setInputText(t.text)}
            className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-emerald-300 rounded-lg text-[10px] whitespace-nowrap transition shrink-0 active:scale-95"
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Input Toolbar */}
      <div className="p-3 bg-slate-950 border-t border-emerald-950/60">
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-700/80 rounded-2xl px-2 py-1.5 focus-within:border-emerald-400 transition shadow-inner">
          {/* Photo/Video upload button */}
          <button
            id="chat-attach-btn"
            type="button"
            onClick={handlePickFile}
            disabled={isNetworkSuspended || isGroupLocked}
            className="p-1.5 text-slate-400 hover:text-emerald-400 active:scale-95 transition disabled:opacity-40"
            title="Attach Photo or Video"
          >
            <Camera className="w-4 h-4" />
          </button>

          {/* Voice Mic button */}
          <button
            id="chat-mic-btn"
            type="button"
            onClick={handleToggleVoice}
            disabled={isNetworkSuspended || isGroupLocked}
            className={`p-1.5 rounded-lg active:scale-95 transition disabled:opacity-40 ${
              isListening
                ? 'bg-red-500 text-white animate-pulse'
                : 'text-slate-400 hover:text-emerald-400'
            }`}
            title="Voice bn-IN Speech-to-Text"
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Text Input */}
          <input
            id="chat-text-input"
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSendText();
              }
            }}
            disabled={isNetworkSuspended || isGroupLocked}
            placeholder={
              isGroupLocked 
                ? "🚨 Group Locked by AI Safety - Security Verification Required" 
                : isNetworkSuspended 
                ? "Network suspended by AI Observer..." 
                : "Type secure message..."
            }
            className="flex-1 bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-none disabled:opacity-40"
          />

          {/* Send button */}
          <button
            id="chat-send-btn"
            type="button"
            onClick={handleSendText}
            disabled={!inputText.trim() || isNetworkSuspended || isScanning || isGroupLocked}
            className="p-2 bg-emerald-500 hover:bg-emerald-400 active:scale-95 disabled:opacity-40 disabled:hover:bg-emerald-500 text-slate-950 rounded-xl transition shadow-md cursor-pointer"
            title="Send Message"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
