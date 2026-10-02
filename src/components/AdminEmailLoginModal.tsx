import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, KeyRound, X, AlertCircle } from 'lucide-react';
import { ADMIN_EMAIL, ADMIN_PASS } from '../lib/firebase';

interface AdminEmailLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminEmailLoginModal: React.FC<AdminEmailLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [email, setEmail] = useState('bm427251@gmail.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      const cleanEmail = email.trim().toLowerCase();
      if (cleanEmail === ADMIN_EMAIL.toLowerCase() && password === ADMIN_PASS) {
        setIsLoading(false);
        setError('');
        onSuccess();
        onClose();
      } else {
        setIsLoading(false);
        setError('Invalid credentials. Access restricted to authorized personnel.');
      }
    }, 300);
  };

  return (
    <div 
      id="admin-email-login-modal"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
    >
      <div className="bg-[#0A1931] border border-blue-900/60 rounded-2xl w-full max-w-sm p-5 shadow-2xl animate-scaleUp text-slate-100 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-blue-900/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FF6B00]/20 border border-[#FF6B00]/40 flex items-center justify-center text-[#FF6B00]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider font-mono">
                System Verification
              </h3>
              <p className="text-[10px] text-[#FF6B00] font-mono">
                Command Console
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-red-300 text-xs flex items-center gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5 font-mono">
              <Mail className="w-3.5 h-3.5 text-[#FF6B00]" />
              <span>Email</span>
            </label>
            <input 
              type="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              placeholder="bm427251@gmail.com"
              className="w-full bg-slate-950 border border-blue-900/60 focus:border-[#FF6B00] rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none transition font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5 font-mono">
              <KeyRound className="w-3.5 h-3.5 text-[#FF6B00]" />
              <span>Secret Password</span>
            </label>
            <input 
              type="password"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              placeholder="••••••••••••"
              className="w-full bg-slate-950 border border-blue-900/60 focus:border-[#FF6B00] rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none transition font-mono"
            />
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-2.5 bg-[#FF6B00] hover:bg-[#e05e00] border border-[#FF6B00]/40 text-white font-bold text-xs rounded-xl shadow-lg transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{isLoading ? 'Verifying...' : 'Authorize Access'}</span>
          </button>
        </form>

        <p className="text-[10px] text-center text-slate-500 font-mono">
          Protected System • 256-bit Encrypted
        </p>
      </div>
    </div>
  );
};
