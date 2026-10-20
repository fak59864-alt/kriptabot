import React from 'react';
import { FarmSummary, GameState, formatHashrate } from '../game/engine';

interface TitleScreenModalProps {
  state: GameState;
  summary: FarmSummary;
  onStart: () => void;
}

export const TitleScreenModal: React.FC<TitleScreenModalProps> = ({
  state,
  summary,
  onStart,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between p-6 sm:p-12 select-none overflow-hidden">
      {/* Subtle Ambient Silicon Grid Background */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 opacity-20"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 38%, rgba(10, 132, 255, 0.28), transparent 60%)',
        }}
      />

      {/* Top Negative-Space Balance */}
      <div className="relative z-10 flex items-center justify-between max-w-5xl w-full mx-auto text-xs text-zinc-500 tabular-nums">
        <span>Apple HIG OLED Cupertino Edition</span>
        <span>Эпоха Халвинга #{state.halvingEpoch + 1} · Курс ${state.btcPriceUsd.toLocaleString('en-US')}</span>
      </div>

      {/* Centerpiece Showcase: Bespoke Inline SVG Silicon Wafer & Thermal Die Emblem + Title Lockup */}
      <div className="relative z-10 max-w-2xl w-full mx-auto my-auto flex flex-col items-center text-center space-y-6">
        <svg
          viewBox="0 0 160 160"
          className="w-28 h-28 sm:w-36 sm:h-36"
          aria-label="Эмблема Hashrate Tycoon"
        >
          {/* Outer Silicon Package */}
          <rect
            x="18"
            y="18"
            width="124"
            height="124"
            rx="28"
            fill="#1C1C1E"
            stroke="#0A84FF"
            strokeWidth="2.5"
          />
          {/* Gold Contact Pins */}
          <path
            d="M45 8v10M68 8v10M92 8v10M115 8v10M45 142v10M68 142v10M92 142v10M115 142v10M8 45h10M8 68h10M8 92h10M8 115h10M142 45h10M142 68h10M142 92h10M142 115h10"
            stroke="#FF9F0A"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Inner Thermal Matrix 3x3 */}
          <rect x="38" y="38" width="24" height="24" rx="5" fill="#30D158" fillOpacity="0.3" stroke="#30D158" strokeWidth="1.5" />
          <rect x="68" y="38" width="24" height="24" rx="5" fill="#FF9F0A" fillOpacity="0.35" stroke="#FF9F0A" strokeWidth="1.5" />
          <rect x="98" y="38" width="24" height="24" rx="5" fill="#30D158" fillOpacity="0.3" stroke="#30D158" strokeWidth="1.5" />

          <rect x="38" y="68" width="24" height="24" rx="5" fill="#FF9F0A" fillOpacity="0.35" stroke="#FF9F0A" strokeWidth="1.5" />
          <rect x="68" y="68" width="24" height="24" rx="5" fill="#FF453A" fillOpacity="0.5" stroke="#FF453A" strokeWidth="2" />
          <rect x="98" y="68" width="24" height="24" rx="5" fill="#0A84FF" fillOpacity="0.35" stroke="#0A84FF" strokeWidth="1.5" />

          <rect x="38" y="98" width="24" height="24" rx="5" fill="#0A84FF" fillOpacity="0.3" stroke="#0A84FF" strokeWidth="1.5" />
          <rect x="68" y="98" width="24" height="24" rx="5" fill="#30D158" fillOpacity="0.3" stroke="#30D158" strokeWidth="1.5" />
          <rect x="98" y="98" width="24" height="24" rx="5" fill="#BF5AF2" fillOpacity="0.35" stroke="#BF5AF2" strokeWidth="1.5" />

          {/* Center BTC Symbol */}
          <text
            x="80"
            y="84"
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="11"
            fontWeight="bold"
            fontFamily="sans-serif"
          >
            BTC
          </text>
        </svg>

        <div className="space-y-2">
          <h1
            style={{ textWrap: 'balance' }}
            className="text-3xl sm:text-5xl font-bold tracking-tight text-white"
          >
            Hashrate Tycoon: От балкона до ГЭС
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 max-w-xl mx-auto">
            Хардкорный симулятор термодинамики, кремниевой лотереи, энергосетей и рыночных циклов Биткоина
          </p>
        </div>

        {/* Live Farm Status Preview */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-md bg-[#1C1C1E] border border-white/[0.08] rounded-2xl p-3.5 tabular-nums">
          <div>
            <div className="text-[11px] text-zinc-400">Хешрейт</div>
            <div className="text-sm font-bold text-[#0A84FF]">
              {formatHashrate(summary.totalHashrateGhs)}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-zinc-400">Баланс USD</div>
            <div className="text-sm font-bold text-[#30D158]">
              ${state.usd.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-zinc-400">Баланс BTC</div>
            <div className="text-sm font-bold text-[#FF9F0A]">{state.btc.toFixed(5)} BTC</div>
          </div>
        </div>

        {/* Primary CTA with data-start="true" */}
        <button
          type="button"
          data-start="true"
          onClick={(e) => {
            e.currentTarget.blur();
            onStart();
          }}
          className="px-8 py-4 rounded-2xl bg-[#0A84FF] hover:bg-[#0A84FF]/90 active:scale-[0.98] text-white font-bold text-base tracking-tight transition-all cursor-pointer shadow-lg"
        >
          Открыть терминал фермы
        </button>
      </div>

      {/* Bottom Safe Margin Flat Inline Control Hint */}
      <div className="relative z-10 text-center text-xs text-zinc-500">
        Enter / Пробел Старт · Клик по клетке Установка и Тюнинг · P Пауза и Сейв · M Звук
      </div>
    </div>
  );
};
