import React, { useState } from 'react';
import {
  FarmSummary,
  GameState,
  formatHashrate,
  getLocationSpec,
} from '../game/engine';

interface ExchangeFinanceViewProps {
  state: GameState;
  summary: FarmSummary;
  onSellBtcFraction: (fraction: number) => void;
  onBuyBtcUsdAmount: (usdAmount: number) => void;
  onPayUnpaidBill: () => void;
}

export const ExchangeFinanceView: React.FC<ExchangeFinanceViewProps> = ({
  state,
  summary,
  onSellBtcFraction,
  onBuyBtcUsdAmount,
  onPayUnpaidBill,
}) => {
  const [buyUsdInput, setBuyUsdInput] = useState<string>('500');
  const loc = getLocationSpec(state.locationId);

  const history = state.btcPriceHistory;
  const minP = Math.min(...history);
  const maxP = Math.max(...history);
  const range = Math.max(500, maxP - minP);

  // Build SVG polyline points
  const width = 640;
  const height = 210;
  const points = history
    .map((price, idx) => {
      const x = (idx / Math.max(1, history.length - 1)) * width;
      const y = height - 18 - ((price - minP) / range) * (height - 36);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const firstPrice = history[0] || state.btcPriceUsd;
  const isOverallUp = state.btcPriceUsd >= firstPrice;
  const strokeColor = isOverallUp ? '#30D158' : '#FF453A';

  const phaseLabel =
    state.marketPhase === 'BULL_RUN'
      ? 'Бычий рынок (Bull Run · Агрессивный рост)'
      : state.marketPhase === 'CRYPTO_WINTER'
      ? 'Криптозима (Crypto Winter · Давление продавцов)'
      : 'Накопление / Флэт (Crab Market · Боковик)';

  const btcValueUsd = state.btc * state.btcPriceUsd;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      {/* Left 7 Cols: Live BTC/USD Terminal Chart & Spot Exchange */}
      <div className="lg:col-span-7 space-y-5">
        <div className="bg-[#1C1C1E] border border-white/[0.08] rounded-3xl p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-xs font-medium text-zinc-400">
                Спотовый терминал · {phaseLabel}
              </div>
              <div className="flex items-baseline gap-3 mt-1 tabular-nums">
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  ${state.btcPriceUsd.toLocaleString('en-US')}
                </h1>
                <span
                  className={`text-xs font-semibold ${
                    isOverallUp ? 'text-[#30D158]' : 'text-[#FF453A]'
                  }`}
                >
                  {isOverallUp ? '▲' : '▼'}{' '}
                  {Math.abs(((state.btcPriceUsd - firstPrice) / firstPrice) * 100).toFixed(2)}% за сессию
                </span>
              </div>
            </div>

            <div className="text-right tabular-nums">
              <div className="text-xs text-zinc-400">Смена цикла через</div>
              <div className="text-sm font-bold text-zinc-200">{state.marketPhaseTimerSec} сек</div>
            </div>
          </div>

          {/* Live SVG Price Chart */}
          <div className="bg-black border border-white/[0.08] rounded-2xl p-3 relative overflow-hidden">
            <div className="flex justify-between text-[10px] text-zinc-500 tabular-nums mb-1">
              <span>Макс: ${maxP.toLocaleString('en-US')}</span>
              <span>GBM Симуляция волатильности</span>
              <span>Мин: ${minP.toLocaleString('en-US')}</span>
            </div>
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-44 sm:h-52 overflow-visible"
              aria-label="График курса BTC к USD"
            >
              <defs>
                <linearGradient id="btcChartFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={strokeColor} stopOpacity="0.28" />
                  <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Grid lines */}
              <line x1="0" y1={height * 0.25} x2={width} y2={height * 0.25} stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
              <line x1="0" y1={height * 0.5} x2={width} y2={height * 0.5} stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
              <line x1="0" y1={height * 0.75} x2={width} y2={height * 0.75} stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />

              {/* Area under curve */}
              <polygon
                points={`0,${height} ${points} ${width},${height}`}
                fill="url(#btcChartFill)"
              />
              {/* Main price line */}
              <polyline
                fill="none"
                stroke={strokeColor}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
              />
            </svg>
          </div>

          {/* Spot Exchange Controls: Sell BTC -> USD */}
          <div className="bg-[#2C2C2E] rounded-2xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 tabular-nums">
              <div>
                <div className="text-xs font-bold text-white">
                  Продажа намайненного BTC за Фиат (USD)
                </div>
                <div className="text-[11px] text-zinc-400">
                  В кошельке: <span className="text-[#FF9F0A] font-semibold">{state.btc.toFixed(6)} BTC</span> (≈ ${btcValueUsd.toLocaleString('en-US', { maximumFractionDigits: 1 })})
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[0.25, 0.5, 0.75, 1.0].map((frac) => {
                const usdOut = state.btc * frac * state.btcPriceUsd;
                return (
                  <button
                    key={frac}
                    type="button"
                    disabled={state.btc <= 0.000001}
                    onClick={() => onSellBtcFraction(frac)}
                    className="py-2.5 px-3 rounded-xl bg-[#30D158] hover:bg-[#30D158]/90 disabled:bg-zinc-800 disabled:text-zinc-500 text-black font-bold text-xs tabular-nums transition-colors cursor-pointer"
                  >
                    Продать {Math.round(frac * 100)}%
                    <div className="text-[10px] font-semibold opacity-80">
                      +${usdOut.toFixed(0)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Buy BTC with USD (Speculation / R&D Reserve) */}
          <div className="bg-[#2C2C2E] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-white">
                Откупить BTC на просадке (для оплаты R&amp;D или спекуляции)
              </div>
              <div className="text-[11px] text-zinc-400 tabular-nums">
                Доступный фиат: ${state.usd.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <label htmlFor="buy-btc-usd-input" className="sr-only">
                Сумма покупки BTC в USD
              </label>
              <input
                id="buy-btc-usd-input"
                type="number"
                min={50}
                step={100}
                value={buyUsdInput}
                onChange={(e) => setBuyUsdInput(e.target.value)}
                className="w-28 px-3 py-2 rounded-xl bg-black border border-white/[0.12] text-xs font-bold text-white tabular-nums"
              />
              <button
                type="button"
                disabled={
                  !Number(buyUsdInput) ||
                  Number(buyUsdInput) <= 0 ||
                  state.usd < Number(buyUsdInput)
                }
                onClick={() => onBuyBtcUsdAmount(Number(buyUsdInput))}
                className="px-4 py-2 rounded-xl bg-[#0A84FF] hover:bg-[#0A84FF]/90 disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-xs font-semibold tabular-nums cursor-pointer whitespace-nowrap"
              >
                Купить BTC
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right 5 Cols: Halving Countdown, Network Difficulty & Billing Ledger */}
      <div className="lg:col-span-5 space-y-5">
        {/* Halving & Blockchain Telemetry */}
        <div className="bg-[#1C1C1E] border border-white/[0.08] rounded-3xl p-5 space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white tracking-tight">
              Протокол Биткоина и Халвинг
            </h2>
            <span className="text-xs font-bold text-[#BF5AF2] tabular-nums">
              Эпоха #{state.halvingEpoch + 1}
            </span>
          </div>

          <div className="bg-[#2C2C2E] rounded-2xl p-4 space-y-2 text-xs tabular-nums">
            <div className="flex justify-between">
              <span className="text-zinc-400">Текущая награда за блок:</span>
              <span className="font-bold text-[#FF9F0A]">{state.blockRewardBtc.toFixed(4)} BTC</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Следующий Халвинг (÷2) через:</span>
              <span className="font-bold text-[#BF5AF2]">{state.blocksUntilHalving} блоков</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Глобальная сложность сети:</span>
              <span className="font-bold text-white">
                {formatHashrate(state.networkDifficulty)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Доля вашей фермы в пуле:</span>
              <span className="font-bold text-[#0A84FF]">
                {((summary.totalHashrateGhs / Math.max(1, state.networkDifficulty)) * 100).toFixed(3)}%
              </span>
            </div>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed">
            Каждые 24 добытых блока происходит <strong className="text-[#BF5AF2]">Халвинг</strong>: награда за блок падает ровно вдвое. Старые карты на дорогом тарифе становятся убыточными — продавайте их на вторичке, снижайте вольтаж и переезжайте ближе к Сибири и ГЭС!
          </p>
        </div>

        {/* Electricity Billing & P&L Statement */}
        <div className="bg-[#1C1C1E] border border-white/[0.08] rounded-3xl p-5 space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white tracking-tight">
              Счета за электричество и Аренду
            </h2>
            <span className="text-xs font-semibold text-zinc-400 tabular-nums">
              Списание через {state.billTimerSec} сек
            </span>
          </div>

          {state.unpaidBillUsd > 0 && (
            <div className="bg-[#FF453A]/15 border border-[#FF453A]/50 rounded-2xl p-3.5 flex items-center justify-between gap-2">
              <div className="text-xs text-[#FF453A] font-semibold tabular-nums">
                Долг перед энергосбытом: ${state.unpaidBillUsd.toFixed(0)}
              </div>
              <button
                type="button"
                disabled={state.usd < state.unpaidBillUsd}
                onClick={onPayUnpaidBill}
                className="px-3 py-1.5 rounded-xl bg-[#30D158] text-black text-xs font-bold cursor-pointer disabled:opacity-40"
              >
                Погасить долг
              </button>
            </div>
          )}

          <div className="space-y-2 text-xs tabular-nums">
            <div className="flex justify-between py-1.5 border-b border-white/[0.06]">
              <span className="text-zinc-400">Локация и базовый тариф</span>
              <span className="text-white font-medium">
                {loc.name} (${loc.tariffPerKwh}/кВт·ч)
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-white/[0.06]">
              <span className="text-zinc-400">Ожидаемый счет за свет (60с)</span>
              <span className="text-[#FF453A] font-semibold">
                -${summary.usdPowerCostPerMin.toFixed(1)}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-white/[0.06]">
              <span className="text-zinc-400">Аренда помещения и хладагенты</span>
              <span className="text-[#FF453A] font-semibold">
                -${summary.usdRentAndMaintPerMin.toFixed(1)}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-white/[0.06]">
              <span className="text-zinc-400">Всего оплачено счетов за игру</span>
              <span className="text-zinc-300 font-medium">
                ${state.totalBillsPaidUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
