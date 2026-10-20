import React from 'react';
import {
  GameState,
  FarmSummary,
  formatHashrate,
  getLocationSpec,
} from '../game/engine';

interface DynamicIslandHeaderProps {
  state: GameState;
  summary: FarmSummary;
  isMuted: boolean;
  onToggleMute: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onOpenPauseModal: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onResetBreaker: () => void;
}

export const DynamicIslandHeader: React.FC<DynamicIslandHeaderProps> = ({
  state,
  summary,
  isMuted,
  onToggleMute,
  onOpenPauseModal,
  onResetBreaker,
}) => {
  const latestAlert = state.alerts[0];
  const loc = getLocationSpec(state.locationId);

  const prevPrice =
    state.btcPriceHistory.length > 1
      ? state.btcPriceHistory[state.btcPriceHistory.length - 2]
      : state.btcPriceUsd;
  const priceDeltaPct = ((state.btcPriceUsd - prevPrice) / prevPrice) * 100;
  const isPriceUp = priceDeltaPct >= 0;

  const loadRatio = summary.maxKw > 0 ? summary.totalKw / summary.maxKw : 0;
  const loadColor =
    state.breakerTripped || loadRatio > 0.95
      ? 'text-[#FF453A]'
      : loadRatio > 0.8
      ? 'text-[#FF9F0A]'
      : 'text-[#30D158]';

  return (
    <header className="sm:sticky sm:top-0 z-30 bg-[#1C1C1E]/95 border-b border-white/[0.08] px-3 sm:px-6 py-2">
      <div className="max-w-7xl mx-auto flex flex-col gap-2">
        {/* Top Row: Brand + Dynamic Island Capsule + Utility Controls */}
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          {/* Brand Title */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-[#0A84FF]/15 border border-[#0A84FF]/40 flex items-center justify-center">
              <svg className="w-4 h-4 text-[#0A84FF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <rect x="4" y="4" width="16" height="16" rx="3" />
                <rect x="9" y="9" width="6" height="6" />
                <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3" />
              </svg>
            </div>
            <div>
              <div className="text-sm sm:text-base font-semibold tracking-tight text-white whitespace-nowrap">
                Hashrate Tycoon
              </div>
              <div className="text-[11px] text-zinc-400 hidden sm:block whitespace-nowrap">
                {loc.name} · T среды {loc.ambientTemp > 0 ? `+${loc.ambientTemp}` : loc.ambientTemp}°C
              </div>
            </div>
          </div>

          {/* iOS Dynamic Island Live Telemetry / Alert Capsule */}
          <div
            role="status"
            aria-live="polite"
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-black border transition-colors min-w-0 max-w-[190px] sm:max-w-md ${
              state.breakerTripped || state.powerCutNonPayment || latestAlert?.type === 'danger'
                ? 'border-[#FF453A]/60 text-[#FF453A]'
                : latestAlert?.type === 'halving'
                ? 'border-[#BF5AF2]/60 text-[#BF5AF2]'
                : latestAlert?.type === 'warning'
                ? 'border-[#FF9F0A]/60 text-[#FF9F0A]'
                : 'border-white/[0.12] text-zinc-200'
            }`}
          >
            <span className="text-[11px] font-semibold tracking-tight truncate">
              {state.breakerTripped
                ? 'АВТОМАТ ВЫБИТ'
                : state.powerCutNonPayment
                ? 'СВЕТ ОТКЛЮЧЕН ЗА ДОЛГ'
                : latestAlert
                ? latestAlert.title
                : 'СИСТЕМА В НОРМЕ'}
            </span>
            <span className="text-zinc-600 hidden sm:inline" aria-hidden="true">·</span>
            <span className="text-[11px] text-zinc-400 truncate hidden sm:inline">
              {state.breakerTripped
                ? `Нагрузка превысила ${summary.maxKw} кВт`
                : state.powerCutNonPayment
                ? `Неоплаченный счет $${state.unpaidBillUsd.toFixed(0)}`
                : latestAlert
                ? latestAlert.detail
                : 'Тепловой режим стабилен'}
            </span>
            {state.breakerTripped && (
              <button
                type="button"
                onClick={onResetBreaker}
                className="ml-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-[#FF453A] text-white hover:bg-[#FF453A]/90 whitespace-nowrap shrink-0 cursor-pointer"
              >
                Включить
              </button>
            )}
          </div>

          {/* Top-right compact utility icon buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              tabIndex={-1}
              aria-label={isMuted ? 'Включить звук [M]' : 'Выключить звук [M]'}
              onClick={(e) => {
                e.currentTarget.blur();
                onToggleMute(e);
              }}
              className="w-9 h-9 rounded-xl bg-[#2C2C2E] hover:bg-[#3A3A3C] border border-white/[0.08] flex items-center justify-center text-zinc-300 transition-colors cursor-pointer"
            >
              {isMuted ? (
                <svg className="w-4 h-4 text-[#FF453A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-[#0A84FF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 5L6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14" />
                </svg>
              )}
            </button>
            <button
              type="button"
              tabIndex={-1}
              aria-label="Меню и сохранение [P]"
              onClick={(e) => {
                e.currentTarget.blur();
                onOpenPauseModal(e);
              }}
              className="h-9 px-3 rounded-xl bg-[#2C2C2E] hover:bg-[#3A3A3C] border border-white/[0.08] flex items-center gap-1.5 text-xs font-medium text-zinc-200 transition-colors cursor-pointer whitespace-nowrap"
            >
              <svg className="w-3.5 h-3.5 text-[#0A84FF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
              <span className="hidden sm:inline">Сейв / Пауза</span>
            </button>
          </div>
        </div>

        {/* Bottom Telemetry Strip: Tabular-Nums Metrics */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 sm:gap-2 pt-1 border-t border-white/[0.06]">
          {/* BTC Balance */}
          <div className="bg-[#2C2C2E]/70 rounded-xl px-2.5 py-1.5 flex flex-col justify-between overflow-hidden">
            <div className="text-[10px] text-zinc-400 font-medium truncate">
              BTC · +{(summary.btcPerSecond * 60).toFixed(4)}/м
            </div>
            <div className="text-xs sm:text-sm font-bold text-[#FF9F0A] tabular-nums truncate">
              {state.btc.toFixed(6)} BTC
            </div>
          </div>

          {/* USD Balance */}
          <div className="bg-[#2C2C2E]/70 rounded-xl px-2.5 py-1.5 flex flex-col justify-between overflow-hidden">
            <div className="text-[10px] text-zinc-400 font-medium truncate">
              USD · Свет {state.billTimerSec}с
            </div>
            <div className={`text-xs sm:text-sm font-bold tabular-nums truncate ${
              state.usd < summary.usdPowerCostPerMin + summary.usdRentAndMaintPerMin
                ? 'text-[#FF453A]'
                : 'text-[#30D158]'
            }`}>
              ${state.usd.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
          </div>

          {/* BTC/USD Exchange Rate */}
          <div className="bg-[#2C2C2E]/70 rounded-xl px-2.5 py-1.5 flex flex-col justify-between overflow-hidden">
            <div className="text-[10px] text-zinc-400 font-medium truncate">
              BTC/USD · {state.marketPhase === 'BULL_RUN' ? 'Рост' : state.marketPhase === 'CRYPTO_WINTER' ? 'Зима' : 'Флэт'}
            </div>
            <div className="flex items-center gap-1 tabular-nums truncate">
              <span className="text-xs sm:text-sm font-bold text-white">
                ${state.btcPriceUsd.toLocaleString('en-US')}
              </span>
              <span className={`text-[10px] font-semibold ${isPriceUp ? 'text-[#30D158]' : 'text-[#FF453A]'}`}>
                {isPriceUp ? '▲' : '▼'}{Math.abs(priceDeltaPct).toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Total Hashrate */}
          <div className="bg-[#2C2C2E]/70 rounded-xl px-2.5 py-1.5 flex flex-col justify-between overflow-hidden">
            <div className="text-[10px] text-zinc-400 font-medium truncate">
              Хешрейт · Риги: {summary.activeMinersCount}
            </div>
            <div className="text-xs sm:text-sm font-bold text-[#0A84FF] tabular-nums truncate">
              {formatHashrate(summary.totalHashrateGhs)}
            </div>
          </div>

          {/* Power Consumption */}
          <div className="bg-[#2C2C2E]/70 rounded-xl px-2.5 py-1.5 flex flex-col justify-between overflow-hidden">
            <div className="text-[10px] text-zinc-400 font-medium truncate">
              Сеть · {summary.combinedNoiseDb}/{loc.noiseLimitDb} дБ
            </div>
            <div className={`text-xs sm:text-sm font-bold tabular-nums truncate ${loadColor}`}>
              {summary.totalKw.toFixed(2)} / {summary.maxKw.toFixed(1)} кВт
            </div>
          </div>

          {/* Halving & Thermal Max */}
          <div className="bg-[#2C2C2E]/70 rounded-xl px-2.5 py-1.5 flex flex-col justify-between overflow-hidden">
            <div className="text-[10px] text-zinc-400 font-medium truncate">
              Халвинг #{state.halvingEpoch + 1} ({state.blockRewardBtc.toFixed(2)})
            </div>
            <div className="flex items-center justify-between text-xs sm:text-sm font-bold tabular-nums truncate">
              <span className="text-[#BF5AF2]">{state.blocksUntilHalving} бл.</span>
              <span className={summary.maxCellTemp > 75 ? 'text-[#FF453A]' : summary.maxCellTemp > 58 ? 'text-[#FF9F0A]' : 'text-[#30D158]'}>
                {summary.maxCellTemp.toFixed(0)}°C
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
