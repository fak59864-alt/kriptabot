import React, { useState } from 'react';
import {
  EquipmentCategory,
  EQUIPMENT_CATALOG,
  GameState,
  GridCell,
  calculateEquipmentCostUsd,
  calculateUnitTelemetry,
  formatHashrate,
  getEquipmentSpec,
  getLocationSpec,
} from '../game/engine';

interface CellBottomSheetProps {
  cell: GridCell | null;
  state: GameState;
  onClose: () => void;
  onBuyAndInstall: (x: number, y: number, specId: string) => void;
  onUpdateTuning: (
    instanceId: string,
    changes: Partial<{
      coreClock: number;
      undervoltMv: number;
      fanSpeed: number;
      isEnabled: boolean;
    }>
  ) => void;
  onCleanDust: (instanceId: string) => void;
  onReplacePaste: (instanceId: string) => void;
  onRebootUnit: (instanceId: string) => void;
  onRepairBurnedUnit: (instanceId: string) => void;
  onStartMoveUnit: (x: number, y: number) => void;
  onSellUnit: (instanceId: string) => void;
}

export const CellBottomSheet: React.FC<CellBottomSheetProps> = ({
  cell,
  state,
  onClose,
  onBuyAndInstall,
  onUpdateTuning,
  onCleanDust,
  onReplacePaste,
  onRebootUnit,
  onRepairBurnedUnit,
  onStartMoveUnit,
  onSellUnit,
}) => {
  const [shopCategory, setShopCategory] = useState<EquipmentCategory>('miner');

  if (!cell) return null;

  const loc = getLocationSpec(state.locationId);
  const unit = cell.unit;

  const tempBadgeColor =
    cell.temp > 83
      ? 'text-[#FF453A]'
      : cell.temp > 72
      ? 'text-[#FF9F0A]'
      : cell.temp > 55
      ? 'text-yellow-400'
      : 'text-[#30D158]';

  if (!unit) {
    const items = EQUIPMENT_CATALOG.filter((item) => item.category === shopCategory);

    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Установка оборудования в клетку (${cell.x + 1}, ${cell.y + 1})`}
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:p-4"
        onClick={onClose}
      >
        <div
          className="w-full max-w-2xl bg-[#1C1C1E] border-t sm:border border-white/[0.12] rounded-t-[24px] sm:rounded-[24px] max-h-[85vh] flex flex-col overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* iOS Grab Handle */}
          <div className="w-10 h-1.5 bg-zinc-700 rounded-full mx-auto mt-3 mb-1 shrink-0" />

          {/* Header */}
          <div className="px-5 py-3 flex items-center justify-between border-b border-white/[0.08] shrink-0">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Клетка [{cell.x + 1}, {cell.y + 1}] · Свободный слот
              </h2>
              <p className="text-xs text-zinc-400 tabular-nums">
                Температура точки: <span className={`font-semibold ${tempBadgeColor}`}>{cell.temp.toFixed(1)}°C</span> · Доступно: <span className="text-[#30D158] font-semibold">${state.usd.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-[#2C2C2E] hover:bg-[#3A3A3C] text-xs font-semibold text-zinc-200 cursor-pointer"
            >
              Закрыть
            </button>
          </div>

          {/* Segmented Control */}
          <div className="px-5 pt-3 shrink-0">
            <div className="grid grid-cols-2 p-1 bg-[#2C2C2E] rounded-xl">
              <button
                type="button"
                onClick={() => setShopCategory('miner')}
                className={`py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  shopCategory === 'miner'
                    ? 'bg-[#0A84FF] text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Майнеры (GPU и ASIC)
              </button>
              <button
                type="button"
                onClick={() => setShopCategory('cooling')}
                className={`py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  shopCategory === 'cooling'
                    ? 'bg-[#0A84FF] text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Охлаждение и Вентиляция
              </button>
            </div>
          </div>

          {/* Catalog List */}
          <div className="p-5 overflow-y-auto space-y-2.5">
            {items.map((spec) => {
              const cost = calculateEquipmentCostUsd(state, spec.id);
              const isTierLocked = loc.tier < spec.minTier;
              const canAfford = state.usd >= cost && !isTierLocked;
              const ownedCount = state.grid.filter((c) => c.unit?.specId === spec.id).length;

              return (
                <div
                  key={spec.id}
                  className="bg-[#2C2C2E] border border-white/[0.08] rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{spec.name}</span>
                      {ownedCount > 0 && (
                        <span className="text-xs text-zinc-400 tabular-nums">
                          · В зале: {ownedCount} шт.
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400">{spec.subtitle}</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-300 tabular-nums pt-0.5">
                      {spec.category === 'miner' ? (
                        <span className="text-[#0A84FF] font-semibold">
                          {formatHashrate(spec.baseHashrateGhs)}
                        </span>
                      ) : (
                        <span className="text-[#30D158] font-semibold">
                          Охлаждение {spec.heatFactor}°C (радиус {spec.coolingRadius})
                        </span>
                      )}
                      <span aria-hidden="true">·</span>
                      <span className="text-[#FF9F0A]">{(spec.baseWatts / 1000).toFixed(2)} кВт</span>
                      <span aria-hidden="true">·</span>
                      <span>Шум {spec.baseNoiseDb} дБ</span>
                      {spec.maintenanceUsdPerMin > 0 && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>Обслуж. ${spec.maintenanceUsdPerMin}/мин</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    <div className="text-right tabular-nums">
                      <div className="text-sm font-bold text-white">
                        ${cost.toLocaleString('en-US')}
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        {isTierLocked ? `Нужен Тир ${spec.minTier}` : 'Кремний: 60–100%'}
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={!canAfford}
                      onClick={() => onBuyAndInstall(cell.x, cell.y, spec.id)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                        canAfford
                          ? 'bg-[#0A84FF] hover:bg-[#0A84FF]/90 text-white'
                          : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                      }`}
                    >
                      {isTierLocked ? `Тир ${spec.minTier}` : 'Установить'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Occupied cell: show unit details, maintenance, and Silicon Lottery fine tuning
  const spec = getEquipmentSpec(unit.specId);
  const tel = calculateUnitTelemetry(unit, cell.temp, state.rndLevels, state.quantumMultiplier);
  const resaleValue = Math.round(unit.purchasedPriceUsd * 0.65 * (unit.health / 100));
  const repairCost = Math.round(spec.baseCostUsd * 0.35);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Настройка ${spec.name} в клетке (${cell.x + 1}, ${cell.y + 1})`}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#1C1C1E] border-t sm:border border-white/[0.12] rounded-t-[24px] sm:rounded-[24px] max-h-[88vh] flex flex-col overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* iOS Grab Handle */}
        <div className="w-10 h-1.5 bg-zinc-700 rounded-full mx-auto mt-3 mb-1 shrink-0" />

        {/* Header */}
        <div className="px-5 py-3 flex items-center justify-between border-b border-white/[0.08] shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {spec.name}
              </h2>
              <span className="text-xs text-zinc-400 tabular-nums">
                [{cell.x + 1}, {cell.y + 1}]
              </span>
            </div>
            <p className="text-xs text-zinc-400 tabular-nums">
              ASIC Quality (Кремниевая лотерея):{' '}
              <span className="text-[#BF5AF2] font-semibold">{unit.siliconQuality}%</span> · Температура:{' '}
              <span className={`font-semibold ${tempBadgeColor}`}>{cell.temp.toFixed(1)}°C</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-[#2C2C2E] hover:bg-[#3A3A3C] text-xs font-semibold text-zinc-200 cursor-pointer"
          >
            Готово
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Status Warning Banner if throttling, crashed, or burned */}
          {(unit.isBurned || unit.isCrashed || tel.throttlePercent > 0) && (
            <div className="bg-[#2C2C2E] border border-[#FF453A]/50 rounded-2xl p-3.5 flex items-center justify-between gap-3">
              <div className="text-xs text-[#FF453A] font-medium">
                {unit.isBurned
                  ? 'КРИТИЧЕСКИЙ ОТКАЗ: Чип деградировал до 0% от перегрева. Требуется реболлинг в сервисе.'
                  : unit.isCrashed
                  ? 'СБОЙ ДРАЙВЕРА / KERNEL PANIC: Нестабильный разгон или даунвольтинг остановил майнинг.'
                  : `ТЕРМАЛЬНЫЙ ТРОТТЛИНГ: Клетка нагрета до ${cell.temp.toFixed(1)}°C (>75°C). Потеря хешрейта -${tel.throttlePercent}%.`}
              </div>
              {unit.isCrashed && !unit.isBurned && (
                <button
                  type="button"
                  onClick={() => onRebootUnit(unit.instanceId)}
                  className="px-3.5 py-2 rounded-xl bg-[#0A84FF] text-white text-xs font-semibold whitespace-nowrap cursor-pointer"
                >
                  Перезапустить
                </button>
              )}
              {unit.isBurned && (
                <button
                  type="button"
                  disabled={state.usd < repairCost}
                  onClick={() => onRepairBurnedUnit(unit.instanceId)}
                  className="px-3.5 py-2 rounded-xl bg-[#FF9F0A] text-black text-xs font-semibold whitespace-nowrap cursor-pointer disabled:opacity-40"
                >
                  Реболлинг (${repairCost})
                </button>
              )}
            </div>
          )}

          {/* Telemetry Readout Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 tabular-nums">
            <div className="bg-[#2C2C2E] rounded-xl p-3">
              <div className="text-[11px] text-zinc-400">Эфф. Хешрейт</div>
              <div className="text-sm font-bold text-[#0A84FF]">
                {spec.category === 'miner' ? formatHashrate(tel.effectiveHashrateGhs) : 'Охладитель'}
              </div>
            </div>
            <div className="bg-[#2C2C2E] rounded-xl p-3">
              <div className="text-[11px] text-zinc-400">Потребление</div>
              <div className="text-sm font-bold text-[#FF9F0A]">{tel.watts} Вт</div>
            </div>
            <div className="bg-[#2C2C2E] rounded-xl p-3">
              <div className="text-[11px] text-zinc-400">Стабильность</div>
              <div
                className={`text-sm font-bold ${
                  tel.stabilityPercent >= 92
                    ? 'text-[#30D158]'
                    : tel.stabilityPercent >= 75
                    ? 'text-[#FF9F0A]'
                    : 'text-[#FF453A]'
                }`}
              >
                {tel.stabilityPercent}%
              </div>
            </div>
            <div className="bg-[#2C2C2E] rounded-xl p-3">
              <div className="text-[11px] text-zinc-400">Ресурс / Пыль</div>
              <div className="text-sm font-bold text-white">
                {unit.health.toFixed(0)}% · Пыль {unit.dust.toFixed(0)}%
              </div>
            </div>
          </div>

          {/* Fine Tuning Sliders (Silicon Lottery) */}
          <div className="bg-[#2C2C2E] rounded-2xl p-4 space-y-4 border border-white/[0.06]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">
                Тонкий тюнинг и вольтаж (MSI Afterburner / Braiins OS)
              </span>
              <span className="text-[11px] text-zinc-400 tabular-nums">
                Шум кулеров: {tel.noiseDb} дБ
              </span>
            </div>

            {spec.category === 'miner' && (
              <>
                {/* Core Clock Slider */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs tabular-nums">
                    <label htmlFor="slider-core-clock" className="text-zinc-300 font-medium">
                      Core / Hash Clock (%)
                    </label>
                    <span className="font-bold text-[#0A84FF]">{unit.coreClock}%</span>
                  </div>
                  <input
                    id="slider-core-clock"
                    type="range"
                    min={70}
                    max={130}
                    step={1}
                    value={unit.coreClock}
                    onChange={(e) =>
                      onUpdateTuning(unit.instanceId, { coreClock: Number(e.target.value) })
                    }
                    className="ios-slider"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-500 tabular-nums">
                    <span>70% (Эко)</span>
                    <span>100% (Сток)</span>
                    <span>130% (Экстрим)</span>
                  </div>
                </div>

                {/* Core Voltage / Undervolt Slider */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs tabular-nums">
                    <label htmlFor="slider-undervolt" className="text-zinc-300 font-medium">
                      Core Voltage / Undervolt (mV)
                    </label>
                    <span
                      className={`font-bold ${
                        unit.undervoltMv < 0 ? 'text-[#30D158]' : 'text-[#FF9F0A]'
                      }`}
                    >
                      {unit.undervoltMv > 0 ? `+${unit.undervoltMv}` : unit.undervoltMv} mV
                    </span>
                  </div>
                  <input
                    id="slider-undervolt"
                    type="range"
                    min={-150}
                    max={50}
                    step={5}
                    value={unit.undervoltMv}
                    onChange={(e) =>
                      onUpdateTuning(unit.instanceId, { undervoltMv: Number(e.target.value) })
                    }
                    className="ios-slider"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-500 tabular-nums">
                    <span>-150 mV (Холодный / Риск сбоя)</span>
                    <span>0 mV</span>
                    <span>+50 mV (Стабильность)</span>
                  </div>
                </div>
              </>
            )}

            {/* Fan Speed Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs tabular-nums">
                <label htmlFor="slider-fan-speed" className="text-zinc-300 font-medium">
                  Обороты вентиляторов (Fan Speed %)
                </label>
                <span className="font-bold text-white">{unit.fanSpeed}%</span>
              </div>
              <input
                id="slider-fan-speed"
                type="range"
                min={20}
                max={100}
                step={5}
                value={unit.fanSpeed}
                onChange={(e) =>
                  onUpdateTuning(unit.instanceId, { fanSpeed: Number(e.target.value) })
                }
                className="ios-slider"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 tabular-nums">
                <span>20% (Тихо)</span>
                <span>65% (Баланс)</span>
                <span>100% (Турбина / Износ)</span>
              </div>
            </div>
          </div>

          {/* Maintenance & Service Actions */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => onCleanDust(unit.instanceId)}
              className="p-3 rounded-xl bg-[#2C2C2E] hover:bg-[#3A3A3C] border border-white/[0.08] text-left transition-colors cursor-pointer"
            >
              <div className="text-xs font-semibold text-white">Продуть сжатым воздухом</div>
              <div className="text-[11px] text-[#30D158] tabular-nums">
                Бесплатно · Пыль {unit.dust.toFixed(0)}% → 0%
              </div>
            </button>

            <button
              type="button"
              disabled={state.usd < 35}
              onClick={() => onReplacePaste(unit.instanceId)}
              className="p-3 rounded-xl bg-[#2C2C2E] hover:bg-[#3A3A3C] border border-white/[0.08] text-left transition-colors cursor-pointer disabled:opacity-40"
            >
              <div className="text-xs font-semibold text-white">Сменить термопасту</div>
              <div className="text-[11px] text-[#0A84FF] tabular-nums">
                $35 · Паста {unit.pasteHealth.toFixed(0)}% → 100%
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                onStartMoveUnit(cell.x, cell.y);
                onClose();
              }}
              className="p-3 rounded-xl bg-[#2C2C2E] hover:bg-[#3A3A3C] border border-white/[0.08] text-left transition-colors cursor-pointer"
            >
              <div className="text-xs font-semibold text-white">Переставить в зале</div>
              <div className="text-[11px] text-zinc-400">Выбрать другую клетку</div>
            </button>

            <button
              type="button"
              onClick={() =>
                onUpdateTuning(unit.instanceId, { isEnabled: !unit.isEnabled })
              }
              className="p-3 rounded-xl bg-[#2C2C2E] hover:bg-[#3A3A3C] border border-white/[0.08] text-left transition-colors cursor-pointer"
            >
              <div className="text-xs font-semibold text-white">
                {unit.isEnabled ? 'Отключить питание' : 'Включить питание'}
              </div>
              <div className="text-[11px] text-zinc-400">
                {unit.isEnabled ? 'Снять нагрузку с автомата' : 'Запустить в работу'}
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                onSellUnit(unit.instanceId);
                onClose();
              }}
              className="p-3 rounded-xl bg-[#FF453A]/15 hover:bg-[#FF453A]/25 border border-[#FF453A]/30 text-left transition-colors cursor-pointer sm:col-span-2"
            >
              <div className="text-xs font-semibold text-[#FF453A]">
                Продать на вторичке (Авито)
              </div>
              <div className="text-[11px] text-zinc-300 tabular-nums">
                Мгновенный выкуп за +${resaleValue.toLocaleString('en-US')} USD и освобождение слота
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
