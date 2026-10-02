import React from 'react';
import { Home, MapPin, MessageSquare, Users } from 'lucide-react';
import { TabType } from '../types';
import { useLanguage } from '../utils/i18n';

interface BottomNavProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  chatBadgeCount?: number;
  incidentCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  chatBadgeCount = 0,
  incidentCount = 0
}) => {
  const { t } = useLanguage();

  const tabs = [
    {
      id: 'home' as TabType,
      label: t('nav_home', 'Home'),
      icon: Home,
      badge: 0
    },
    {
      id: 'map' as TabType,
      label: t('nav_map', 'Map'),
      icon: MapPin,
      badge: 0
    },
    {
      id: 'chat' as TabType,
      label: t('nav_chat', 'Chat'),
      icon: MessageSquare,
      badge: chatBadgeCount
    },
    {
      id: 'groups' as TabType,
      label: t('nav_groups', 'Groups'),
      icon: Users,
      badge: incidentCount
    }
  ];

  return (
    <nav 
      id="bottom-nav"
      className="sticky bottom-0 left-0 right-0 max-w-[420px] w-full mx-auto z-40 bg-[#0A1931]/95 backdrop-blur-md border-t border-[#FF6B00]/25 px-2 py-1.5 shadow-[0_-4px_25px_rgba(0,0,0,0.8)] mt-auto"
    >
      <div className="grid grid-cols-4 gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              id={`nav-btn-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'text-white bg-blue-950/80 shadow-[0_0_12px_rgba(255,107,0,0.2)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110 stroke-[2.5] text-[#FF6B00]' : 'stroke-[1.8]'}`} />
                {tab.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 px-1.5 py-0.2 min-w-[16px] h-4 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full animate-pulse shadow">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[11px] mt-1 font-medium tracking-tight ${isActive ? 'font-black text-[#FF6B00]' : 'text-slate-400'}`}>
                {tab.label}
              </span>
              {isActive && (
                <div className="absolute -bottom-1 w-6 h-0.5 bg-[#FF6B00] rounded-full shadow-[0_0_8px_#FF6B00]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
