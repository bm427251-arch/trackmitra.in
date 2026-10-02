import React from 'react';
import { X, Check, Globe } from 'lucide-react';
import { useLanguage, SUPPORTED_LANGUAGES, LanguageCode } from '../utils/i18n';

export const LanguageModal: React.FC = () => {
  const { currentLanguage, setLanguage, isLangModalOpen, setIsLangModalOpen, t } = useLanguage();

  if (!isLangModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-fadeIn">
      <div 
        id="language-picker-modal"
        className="w-full max-w-[420px] bg-[#0A1931] border-t sm:border border-[#FF6B00]/40 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-slideUp"
      >
        {/* Modal Header */}
        <div className="p-4 bg-gradient-to-r from-[#000066] to-[#0A1931] border-b border-blue-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FF6B00]/20 border border-[#FF6B00]/40 flex items-center justify-center text-[#FF6B00]">
              <Globe className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>{t('select_language', 'ভাষা নির্বাচন করুন')}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">
                  8+ Indian Languages
                </span>
              </h2>
              <p className="text-[11px] text-slate-300">
                {t('choose_preferred_language', 'আপনার পছন্দের ভারতীয় ভাষা বেছে নিন')}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsLangModalOpen(false)}
            className="w-8 h-8 rounded-full bg-slate-900/80 border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center active:scale-90 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Language List */}
        <div className="p-3 overflow-y-auto space-y-2 max-h-[60vh] divide-y divide-blue-950/40">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = currentLanguage === lang.code;
            return (
              <button
                key={lang.code}
                id={`lang-select-${lang.code}`}
                onClick={() => {
                  setLanguage(lang.code as LanguageCode);
                  setIsLangModalOpen(false);
                }}
                className={`w-full flex items-center justify-between p-3 rounded-2xl transition cursor-pointer text-left ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#FF6B00]/20 to-blue-950 border border-[#FF6B00] shadow-md shadow-[#FF6B00]/10'
                    : 'bg-slate-950/50 hover:bg-blue-950/40 border border-blue-900/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{lang.flag}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-white font-sans">
                        {lang.name}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        ({lang.englishName})
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                      <span className="text-amber-400/90 font-mono">
                        {lang.speakers}
                      </span>
                      <span>•</span>
                      <span className="truncate max-w-[170px]">
                        {lang.region}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 pl-2">
                  {isSelected ? (
                    <div className="w-6 h-6 rounded-full bg-[#FF6B00] text-white flex items-center justify-center shadow-md shadow-[#FF6B00]/40">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border border-slate-700 bg-slate-900/50" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="p-3 bg-black/60 border-t border-blue-950/80 text-center">
          <p className="text-[10px] text-slate-400 font-mono">
            TrackMitra Pro • Pan-India Real-Time Safety Escort
          </p>
        </div>
      </div>
    </div>
  );
};
