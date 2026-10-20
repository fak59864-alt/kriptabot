import React from 'react';
import { TabId } from '../game/engine';

interface BottomTabBarProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  crashedCount: number;
  breakerTripped: boolean;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  activeTab,
  onSelectTab,
  crashedCount,
  breakerTripped,
}) => {
  const tabs: { id: TabId; label: string; shortLabel: string; badge?: string }[] = [
    {
      id: 'grid',
      label: 'Помещение (Теплокарта)',
      shortLabel: 'Теплокарта',
    },
    {
      id: 'hardware',
      label: 'Железо & Тюнинг',
      shortLabel: 'Железо',
      badge: crashedCount > 0 ? String(crashedCount) : undefined,
    },
    {
      id: 'power',
      label: 'Энергосеть & Локации',
      shortLabel: 'Энергосеть',
      badge: breakerTripped ? '!' : undefined,
    },
    {
      id: 'exchange',
      label: 'Биржа & Финансы',
      shortLabel: 'Биржа',
    },
    {
      id: 'rnd',
      label: 'R&D (Наука)',
      shortLabel: 'R&D Наука',
    },
  ];

  return (
    <nav
      aria-label="Основная навигация"
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#1C1C1E]/95 border-t border-white/[0.08] px-2 sm:px-6"
    >
      <div className="max-w-5xl mx-auto grid grid-cols-5 items-center h-14 sm:h-16">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              aria-current={isActive ? 'page' : undefined}
              onClick={() => onSelectTab(tab.id)}
              className={`relative h-full flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer whitespace-nowrap ${
                isActive ? 'text-[#0A84FF]' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {/* SVG Icon per Tab */}
              <div className="relative">
                {tab.id === 'grid' && (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" rx="1.5" />
                    <rect x="14" y="3" width="7" height="7" rx="1.5" />
                    <rect x="14" y="14" width="7" height="7" rx="1.5" />
                    <rect x="3" y="14" width="7" height="7" rx="1.5" />
                  </svg>
                )}
                {tab.id === 'hardware' && (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="6" width="20" height="12" rx="2" />
                    <circle cx="8" cy="12" r="2.5" />
                    <circle cx="16" cy="12" r="2.5" />
                  </svg>
                )}
                {tab.id === 'power' && (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                )}
                {tab.id === 'exchange' && (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                    <polyline points="16 7 22 7 22 13" />
                  </svg>
                )}
                {tab.id === 'rnd' && (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 3h6M10 3v5.2a2 2 0 0 1-.5 1.3L4 16.2A2 2 0 0 0 5.5 20h13a2 2 0 0 0 1.5-3.8l-5.5-6.7a2 2 0 0 1-.5-1.3V3" />
                  </svg>
                )}

                {tab.badge && (
                  <span className="absolute -top-1.5 -right-2.5 px-1 min-w-[16px] h-4 rounded-full bg-[#FF453A] text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                    {tab.badge}
                  </span>
                )}
              </div>

              <span className="text-[10px] sm:text-[11px] font-medium tracking-tight hidden sm:inline">
                {tab.label}
              </span>
              <span className="text-[10px] font-medium tracking-tight sm:hidden">
                {tab.shortLabel}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
