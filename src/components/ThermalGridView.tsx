import React from 'react';
import {
  FarmSummary,
  GameState,
  GridCell,
  calculateUnitTelemetry,
  formatHashrate,
  getEquipmentSpec,
  getLocationSpec,
} from '../game/engine';

interface ThermalGridViewProps {
  state: GameState;
  summary: FarmSummary;
  movingFrom: { x: number; y: number } | null;
  onCancelMove: () => void;
  onSelectCell: (cell: GridCell) => void;
  onCleanAllDust: () => void;
  onRebootAllCrashed: () => void;
  onResetBreaker: () => void;
  onPayUnpaidBill: () => void;
}

function getThermalCellStyle(temp: number): {
  bg: string;
  border: string;
  tempText: string;
  pulse: boolean;
} {
  if (temp > 83) {
    return {
      bg: 'rgba(255, 69, 58, 0.26)',
      border: 'rgba(255, 69, 58, 0.85)',
      tempText: 'text-[#FF453A]',
      pulse: true,
    };
  }
  if (temp >= 73) {
    return {
      bg: 'rgba(255, 159, 10, 0.22)',
      border: 'rgba(255, 159, 10, 0.65)',
      tempText: 'text-[#FF9F0A]',
      pulse: false,
    };
  }
  if (temp >= 55) {
    return {
      bg: 'rgba(255, 214, 10, 0.14)',
      border: 'rgba(255, 214, 10, 0.42)',
      tempText: 'text-yellow-300',
      pulse: false,
    };
  }
  if (temp < 15) {
    return {
      bg: 'rgba(10, 132, 255, 0.16)',
      border: 'rgba(10, 132, 255, 0.42)',
      tempText: 'text-[#0A84FF]',
      pulse: false,
    };
  }
  return {
    bg: 'rgba(48, 209, 88, 0.11)',
    border: 'rgba(48, 209, 88, 0.32)',
    tempText: 'text-[#30D158]',
    pulse: false,
  };
}

export const ThermalGridView: React.FC<ThermalGridViewProps> = ({
  state,
  summary,
  movingFrom,
  onCancelMove,
  onSelectCell,
  onCleanAllDust,
  onRebootAllCrashed,
  onResetBreaker,
  onPayUnpaidBill,
}) => {
  const loc = getLocationSpec(state.locationId);
  const size = loc.gridSize;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      {/* Left/Center Column: 2D Thermal Grid Matrix */}
      <div className="lg:col-span-8 bg-[#1C1C1E] border border-white/[0.08] rounded-3xl p-4 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Тепловая карта зала · {loc.name} ({size}×{size})
            </h1>
            <p className="text-xs text-zinc-400 tabular-nums">
              Клеточный автомат тепла (500 мс) · Среда {loc.ambientTemp > 0 ? `+${loc.ambientTemp}` : loc.ambientTemp}°C · Средняя по залу {summary.avgCellTemp.toFixed(1)}°C
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {summary.crashedMinersCount > 0 && (
              <button
                type="button"
                onClick={onRebootAllCrashed}
                className="px-3 py-2 rounded-xl bg-[#FF9F0A] text-black text-xs font-semibold cursor-pointer whitespace-nowrap"
              >
                Перезапустить сбои ({summary.crashedMinersCount})
              </button>
            )}
            <button
              type="button"
              onClick={onCleanAllDust}
              className="px-3 py-2 rounded-xl bg-[#2C2C2E] hover:bg-[#3A3A3C] border border-white/[0.08] text-xs font-semibold text-zinc-200 transition-colors cursor-pointer whitespace-nowrap"
            >
              Продуть все от пыли
            </button>
          </div>
        </div>

        {/* Emergency Banner if Breaker Tripped or Unpaid Bill */}
        {(state.breakerTripped || state.powerCutNonPayment) && (
          <div className="bg-[#FF453A]/15 border border-[#FF453A]/60 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="text-sm font-bold text-[#FF453A]">
                {state.breakerTripped
                  ? 'АВАРИЯ ПИТАНИЯ: Выбило вводной автомат (перегрузка по кВт)!'
                  : `ОТКЛЮЧЕНИЕ ЗА НЕУПЛАТУ: Задолженность за электроэнергию $${state.unpaidBillUsd.toFixed(0)}`}
              </div>
              <div className="text-xs text-zinc-300">
                {state.breakerTripped
                  ? 'Отключите часть стоек, сделайте даунвольтинг или прокачайте вводной щиток во вкладке Энергосеть.'
                  : 'Продайте часть намайненных BTC во вкладке Биржа и погасите долг для подачи напряжения.'}
              </div>
            </div>
            {state.breakerTripped ? (
              <button
                type="button"
                onClick={onResetBreaker}
                className="px-4 py-2.5 rounded-xl bg-[#FF453A] text-white text-xs font-bold whitespace-nowrap cursor-pointer"
              >
                Включить автомат
              </button>
            ) : (
              <button
                type="button"
                disabled={state.usd < state.unpaidBillUsd}
                onClick={onPayUnpaidBill}
                className="px-4 py-2.5 rounded-xl bg-[#30D158] text-black text-xs font-bold whitespace-nowrap cursor-pointer disabled:opacity-40"
              >
                Оплатить долг (${state.unpaidBillUsd.toFixed(0)})
              </button>
            )}
          </div>
        )}

        {/* Move Mode Banner */}
        {movingFrom && (
          <div className="bg-[#0A84FF]/15 border border-[#0A84FF]/60 rounded-2xl p-3 flex items-center justify-between gap-3">
            <span className="text-xs font-medium text-[#0A84FF]">
              Режим перестановки: выберите любую клетку, чтобы переместить оборудование из [{movingFrom.x + 1}, {movingFrom.y + 1}]
            </span>
            <button
              type="button"
              onClick={onCancelMove}
              className="px-3 py-1 rounded-lg bg-[#2C2C2E] text-xs font-semibold text-white cursor-pointer"
            >
              Отмена
            </button>
          </div>
        )}

        {/* Interactive 2D Thermal Grid */}
        <div
          data-testid="thermal-grid"
          style={{
            gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
          }}
          className="grid gap-2 sm:gap-2.5 max-w-[540px] mx-auto select-none"
        >
          {state.grid.map((cell) => {
            const style = getThermalCellStyle(cell.temp);
            const unit = cell.unit;
            const spec = unit ? getEquipmentSpec(unit.specId) : null;
            const tel =
              unit && spec
                ? calculateUnitTelemetry(
                    unit,
                    cell.temp,
                    state.rndLevels,
                    state.quantumMultiplier
                  )
                : null;
            const isMovingSource =
              movingFrom && movingFrom.x === cell.x && movingFrom.y === cell.y;

            const cellLabel = unit && spec
              ? `Клетка (${cell.x + 1}, ${cell.y + 1}): ${spec.name}, температура ${cell.temp.toFixed(1)}°C`
              : `Пустая клетка (${cell.x + 1}, ${cell.y + 1}), температура ${cell.temp.toFixed(1)}°C. Установить оборудование`;

            return (
              <button
                key={`${cell.x}-${cell.y}`}
                type="button"
                aria-label={cellLabel}
                onClick={() => onSelectCell(cell)}
                style={{
                  backgroundColor: style.bg,
                  borderColor: isMovingSource ? '#0A84FF' : style.border,
                }}
                className={`relative aspect-square rounded-2xl border p-2 flex flex-col justify-between text-left transition-transform active:scale-[0.97] cursor-pointer overflow-hidden ${
                  style.pulse ? 'thermal-danger-pulse' : ''
                }`}
              >
                {/* Top row: Coordinates + Temperature */}
                <div className="w-full flex items-center justify-between gap-1 tabular-nums">
                  <span className="text-[10px] font-medium text-zinc-400">
                    {cell.x + 1}:{cell.y + 1}
                  </span>
                  <span className={`text-[11px] sm:text-xs font-bold ${style.tempText}`}>
                    {cell.temp.toFixed(0)}°C
                  </span>
                </div>

                {/* Center: Hardware Icon or Empty Plus */}
                <div className="my-auto flex flex-col items-center justify-center text-center">
                  {!unit || !spec ? (
                    <div className="w-7 h-7 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-500">
                      <span className="text-sm font-semibold">+</span>
                    </div>
                  ) : spec.category === 'miner' ? (
                    <>
                      <svg
                        className={`w-6 h-6 sm:w-7 sm:h-7 ${
                          unit.isBurned || unit.isCrashed
                            ? 'text-[#FF453A]'
                            : !unit.isEnabled
                            ? 'text-zinc-500'
                            : 'text-[#0A84FF]'
                        }`}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.9"
                      >
                        <rect x="2" y="5" width="20" height="14" rx="2.5" />
                        <circle cx="8" cy="12" r="3" />
                        <circle cx="16" cy="12" r="3" />
                      </svg>
                      <div className="text-[10px] sm:text-[11px] font-semibold text-white truncate max-w-full mt-0.5">
                        {spec.name.split(' ')[0]} {spec.name.split(' ')[1]}
                      </div>
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-6 h-6 sm:w-7 sm:h-7 text-[#30D158]"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.9"
                      >
                        <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07" />
                      </svg>
                      <div className="text-[10px] sm:text-[11px] font-semibold text-[#30D158] truncate max-w-full mt-0.5">
                        {spec.name.split(' ')[0]}
                      </div>
                    </>
                  )}
                </div>

                {/* Bottom row: Status / Hashrate & Health bar */}
                {unit && spec && tel ? (
                  <div className="w-full space-y-1">
                    <div className="flex items-center justify-between text-[9px] sm:text-[10px] tabular-nums">
                      {unit.isBurned ? (
                        <span className="font-bold text-[#FF453A]">СГОРЕЛ</span>
                      ) : unit.isCrashed ? (
                        <span className="font-bold text-[#FF9F0A]">СБОЙ ОС</span>
                      ) : !unit.isEnabled ? (
                        <span className="text-zinc-400">ВЫКЛ</span>
                      ) : spec.category === 'miner' ? (
                        <span className="text-zinc-200 font-medium truncate">
                          {formatHashrate(tel.effectiveHashrateGhs)}
                        </span>
                      ) : (
                        <span className="text-[#30D158] font-medium">
                          {spec.heatFactor}°C
                        </span>
                      )}

                      {tel.throttlePercent > 0 && !unit.isCrashed && !unit.isBurned && (
                        <span className="text-[#FF453A] font-bold">
                          -{tel.throttlePercent.toFixed(0)}%
                        </span>
                      )}
                    </div>

                    {/* Health & Dust micro-bar */}
                    <div className="w-full h-1 bg-black/50 rounded-full overflow-hidden flex">
                      <div
                        style={{ width: `${Math.max(0, unit.health)}%` }}
                        className={`h-full ${
                          unit.health > 60
                            ? 'bg-[#30D158]'
                            : unit.health > 25
                            ? 'bg-[#FF9F0A]'
                            : 'bg-[#FF453A]'
                        }`}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-[9px] text-zinc-500 text-center">Свободно</div>
                )}
              </button>
            );
          })}
        </div>

        {/* Thermal Scale Legend */}
        <div className="pt-2 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[#30D158] font-medium">● &lt;55°C Норма</span>
            <span className="text-yellow-300 font-medium">● 55–72°C Нагрев</span>
            <span className="text-[#FF9F0A] font-medium">● 73–82°C Троттлинг (&gt;75°C)</span>
            <span className="text-[#FF453A] font-medium">● &gt;83°C Деградация чипа</span>
          </div>
          <span className="text-[11px] text-zinc-400">
            Нажмите на любую клетку для установки или тонкого тюнинга
          </span>
        </div>
      </div>

      {/* Right Column: Live Engineering Summary & Quick Guide */}
      <div className="lg:col-span-4 space-y-4">
        {/* Financial & Power Real-Time Balance Card */}
        <div className="bg-[#1C1C1E] border border-white/[0.08] rounded-3xl p-5 space-y-3.5">
          <h2 className="text-base font-bold text-white tracking-tight">
            Инженерная сводка зала
          </h2>

          <div className="space-y-2 text-xs tabular-nums">
            <div className="flex items-center justify-between py-1.5 border-b border-white/[0.06]">
              <span className="text-zinc-400">Добыча за минуту</span>
              <span className="font-semibold text-[#FF9F0A]">
                +{(summary.btcPerSecond * 60).toFixed(6)} BTC (${(summary.btcPerSecond * 60 * state.btcPriceUsd).toFixed(1)})
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-white/[0.06]">
              <span className="text-zinc-400">Счет за свет (каждые 60с)</span>
              <span className="font-semibold text-[#FF453A]">
                -${summary.usdPowerCostPerMin.toFixed(1)} / мин
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-white/[0.06]">
              <span className="text-zinc-400">Аренда и хладагент</span>
              <span className="font-semibold text-zinc-300">
                -${summary.usdRentAndMaintPerMin.toFixed(1)} / мин
              </span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-zinc-200 font-semibold">Чистый баланс ($ экв.)</span>
              <span
                className={`text-sm font-bold ${
                  summary.netProfitUsdPerMin >= 0 ? 'text-[#30D158]' : 'text-[#FF453A]'
                }`}
              >
                {summary.netProfitUsdPerMin >= 0 ? '+' : ''}
                ${summary.netProfitUsdPerMin.toFixed(1)} / мин
              </span>
            </div>
          </div>

          {/* Acoustic Noise Bar */}
          <div className="pt-2 space-y-1.5">
            <div className="flex justify-between text-xs tabular-nums">
              <span className="text-zinc-400">Уровень шума</span>
              <span
                className={`font-semibold ${
                  summary.combinedNoiseDb > loc.noiseLimitDb
                    ? 'text-[#FF453A]'
                    : 'text-zinc-200'
                }`}
              >
                {summary.combinedNoiseDb} дБ / лимит {loc.noiseLimitDb} дБ
              </span>
            </div>
            <div className="w-full h-2 bg-[#2C2C2E] rounded-full overflow-hidden">
              <div
                style={{
                  width: `${Math.min(100, (summary.combinedNoiseDb / loc.noiseLimitDb) * 100)}%`,
                }}
                className={`h-full transition-all ${
                  summary.combinedNoiseDb > loc.noiseLimitDb ? 'bg-[#FF453A]' : 'bg-[#0A84FF]'
                }`}
              />
            </div>
            {summary.combinedNoiseDb > loc.noiseLimitDb && (
              <p className="text-[11px] text-[#FF453A]">
                Превышен санитарный порог шума! Соседи вызывают участкового (штрафы в USD). Снизьте обороты кулеров или переезжайте в гараж.
              </p>
            )}
          </div>
        </div>

        {/* Heat Physics & Tips Card */}
        <div className="bg-[#1C1C1E] border border-white/[0.08] rounded-3xl p-5 space-y-2.5">
          <h3 className="text-sm font-bold text-white tracking-tight">
            Правила термодинамики и сети
          </h3>
          <ul className="space-y-2 text-xs text-zinc-400 leading-relaxed">
            <li>
              <strong className="text-zinc-200">Тепловая диффузия:</strong> соседние риги греют друг друга. Не ставьте мощные ASIC вплотную без канальных вентиляторов или сплит-систем.
            </li>
            <li>
              <strong className="text-zinc-200">Даунвольтинг (mV):</strong> снижение вольтажа до -50..-80 mV срезает потребление и нагрев на ~20% без потери хешрейта, если позволяет кремниевая лотерея чипа.
            </li>
            <li>
              <strong className="text-zinc-200">Счета в USD:</strong> майнинг идет в BTC, а энергетики требуют доллары каждые 60 секунд. Вовремя фиксируйте прибыль на вкладке Биржа!
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
