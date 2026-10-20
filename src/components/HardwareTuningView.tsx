import React from 'react';
import {
  EQUIPMENT_CATALOG,
  GameState,
  calculateEquipmentCostUsd,
  calculateUnitTelemetry,
  formatHashrate,
  getEquipmentSpec,
  getLocationSpec,
} from '../game/engine';

interface HardwareTuningViewProps {
  state: GameState;
  onUpdateTuning: (
    instanceId: string,
    changes: Partial<{
      coreClock: number;
      undervoltMv: number;
      fanSpeed: number;
      isEnabled: boolean;
    }>
  ) => void;
  onApplyFleetPreset: (preset: 'eco' | 'stock' | 'turbo' | 'silent') => void;
  onCleanDust: (instanceId: string) => void;
  onReplacePaste: (instanceId: string) => void;
  onRebootUnit: (instanceId: string) => void;
  onRepairBurnedUnit: (instanceId: string) => void;
  onSellUnit: (instanceId: string) => void;
  onQuickBuyToCoolestCell: (specId: string) => void;
}

export const HardwareTuningView: React.FC<HardwareTuningViewProps> = ({
  state,
  onUpdateTuning,
  onApplyFleetPreset,
  onCleanDust,
  onReplacePaste,
  onRebootUnit,
  onRepairBurnedUnit,
  onSellUnit,
  onQuickBuyToCoolestCell,
}) => {
  const loc = getLocationSpec(state.locationId);
  const installedCells = state.grid.filter((c) => c.unit !== null);
  const hasEmptySlot = state.grid.some((c) => c.unit === null);

  return (
    <div className="space-y-6">
      {/* Global Fleet Tuning Presets */}
      <div className="bg-[#1C1C1E] border border-white/[0.08] rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            Железо &amp; Тонкий Тюнинг (Silicon Lottery)
          </h1>
          <p className="text-xs text-zinc-400">
            Управляйте частотами, даунвольтингом (mV) и оборотами кулеров каждой стойки или примените групповой профиль прошивки
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onApplyFleetPreset('eco')}
            className="px-3 py-2 rounded-xl bg-[#30D158]/15 hover:bg-[#30D158]/25 border border-[#30D158]/40 text-xs font-semibold text-[#30D158] cursor-pointer whitespace-nowrap"
          >
            Эко Даунвольт (-55mV)
          </button>
          <button
            type="button"
            onClick={() => onApplyFleetPreset('stock')}
            className="px-3 py-2 rounded-xl bg-[#2C2C2E] hover:bg-[#3A3A3C] border border-white/[0.08] text-xs font-semibold text-white cursor-pointer whitespace-nowrap"
          >
            Сток (100% / 0mV)
          </button>
          <button
            type="button"
            onClick={() => onApplyFleetPreset('turbo')}
            className="px-3 py-2 rounded-xl bg-[#0A84FF]/15 hover:bg-[#0A84FF]/25 border border-[#0A84FF]/40 text-xs font-semibold text-[#0A84FF] cursor-pointer whitespace-nowrap"
          >
            Разгон (115% / +15mV)
          </button>
          <button
            type="button"
            onClick={() => onApplyFleetPreset('silent')}
            className="px-3 py-2 rounded-xl bg-[#2C2C2E] hover:bg-[#3A3A3C] border border-white/[0.08] text-xs font-semibold text-zinc-300 cursor-pointer whitespace-nowrap"
          >
            Тихий режим (Кулеры 45%)
          </button>
        </div>
      </div>

      {/* Installed Hardware Cards */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-400 px-1">
          Установленные единицы оборудования ({installedCells.length} / {state.grid.length} слотов)
        </h2>

        {installedCells.length === 0 ? (
          <div className="bg-[#1C1C1E] border border-white/[0.08] rounded-3xl p-8 text-center space-y-2">
            <div className="text-base font-bold text-white">В помещении пока нет оборудования</div>
            <p className="text-xs text-zinc-400">
              Закупите первый риг из каталога ниже или установите его прямо на тепловой карте.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {installedCells.map((cell) => {
              const unit = cell.unit!;
              const spec = getEquipmentSpec(unit.specId);
              const tel = calculateUnitTelemetry(
                unit,
                cell.temp,
                state.rndLevels,
                state.quantumMultiplier
              );
              const resaleUsd = Math.round(unit.purchasedPriceUsd * 0.65 * (unit.health / 100));
              const repairCost = Math.round(spec.baseCostUsd * 0.35);

              return (
                <div
                  key={unit.instanceId}
                  className="bg-[#1C1C1E] border border-white/[0.08] rounded-3xl p-4 sm:p-5 space-y-4"
                >
                  {/* Top Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm sm:text-base font-bold text-white">
                          {spec.name}
                        </span>
                        <span className="text-xs text-zinc-400 tabular-nums">
                          · Слот [{cell.x + 1}, {cell.y + 1}]
                        </span>
                      </div>
                      <div className="text-xs text-zinc-400 tabular-nums mt-0.5">
                        ASIC Quality: <span className="text-[#BF5AF2] font-semibold">{unit.siliconQuality}%</span> · Темп. клетки:{' '}
                        <span
                          className={`font-semibold ${
                            cell.temp > 75
                              ? 'text-[#FF453A]'
                              : cell.temp > 58
                              ? 'text-[#FF9F0A]'
                              : 'text-[#30D158]'
                          }`}
                        >
                          {cell.temp.toFixed(1)}°C
                        </span>{' '}
                        · Стабильность:{' '}
                        <span
                          className={`font-semibold ${
                            tel.stabilityPercent >= 90
                              ? 'text-[#30D158]'
                              : tel.stabilityPercent >= 75
                              ? 'text-[#FF9F0A]'
                              : 'text-[#FF453A]'
                          }`}
                        >
                          {tel.stabilityPercent}%
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {unit.isCrashed && !unit.isBurned && (
                        <button
                          type="button"
                          onClick={() => onRebootUnit(unit.instanceId)}
                          className="px-2.5 py-1.5 rounded-xl bg-[#FF9F0A] text-black text-xs font-bold cursor-pointer"
                        >
                          Ребут
                        </button>
                      )}
                      {unit.isBurned && (
                        <button
                          type="button"
                          disabled={state.usd < repairCost}
                          onClick={() => onRepairBurnedUnit(unit.instanceId)}
                          className="px-2.5 py-1.5 rounded-xl bg-[#FF453A] text-white text-xs font-bold cursor-pointer disabled:opacity-40"
                        >
                          Реболлинг (${repairCost})
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateTuning(unit.instanceId, { isEnabled: !unit.isEnabled })
                        }
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                          unit.isEnabled
                            ? 'bg-[#30D158]/20 text-[#30D158]'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {unit.isEnabled ? 'Вкл' : 'Выкл'}
                      </button>
                    </div>
                  </div>

                  {/* Metrics Row */}
                  <div className="grid grid-cols-4 gap-2 text-xs tabular-nums bg-[#2C2C2E] rounded-2xl p-3">
                    <div>
                      <div className="text-[10px] text-zinc-400">Хешрейт</div>
                      <div className="font-bold text-[#0A84FF]">
                        {spec.category === 'miner'
                          ? formatHashrate(tel.effectiveHashrateGhs)
                          : `${spec.heatFactor}°C`}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-zinc-400">Мощность</div>
                      <div className="font-bold text-[#FF9F0A]">{tel.watts} Вт</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-zinc-400">Здоровье</div>
                      <div className="font-bold text-white">{unit.health.toFixed(0)}%</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-zinc-400">Пыль / Паста</div>
                      <div className="font-bold text-zinc-300">
                        {unit.dust.toFixed(0)}% / {unit.pasteHealth.toFixed(0)}%
                      </div>
                    </div>
                  </div>

                  {/* Sliders */}
                  <div className="space-y-3">
                    {spec.category === 'miner' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs tabular-nums">
                            <span className="text-zinc-400">Core Clock</span>
                            <span className="font-semibold text-[#0A84FF]">{unit.coreClock}%</span>
                          </div>
                          <input
                            type="range"
                            aria-label={`Core Clock ${spec.name} [${cell.x + 1}, ${cell.y + 1}]`}
                            min={70}
                            max={130}
                            step={1}
                            value={unit.coreClock}
                            onChange={(e) =>
                              onUpdateTuning(unit.instanceId, {
                                coreClock: Number(e.target.value),
                              })
                            }
                            className="ios-slider"
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-xs tabular-nums">
                            <span className="text-zinc-400">Undervolt (mV)</span>
                            <span className="font-semibold text-[#30D158]">
                              {unit.undervoltMv > 0 ? `+${unit.undervoltMv}` : unit.undervoltMv} mV
                            </span>
                          </div>
                          <input
                            type="range"
                            aria-label={`Undervolt ${spec.name} [${cell.x + 1}, ${cell.y + 1}]`}
                            min={-150}
                            max={50}
                            step={5}
                            value={unit.undervoltMv}
                            onChange={(e) =>
                              onUpdateTuning(unit.instanceId, {
                                undervoltMv: Number(e.target.value),
                              })
                            }
                            className="ios-slider"
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs tabular-nums">
                        <span className="text-zinc-400">Fan Speed (Шум {tel.noiseDb} дБ)</span>
                        <span className="font-semibold text-white">{unit.fanSpeed}%</span>
                      </div>
                      <input
                        type="range"
                        aria-label={`Fan Speed ${spec.name} [${cell.x + 1}, ${cell.y + 1}]`}
                        min={20}
                        max={100}
                        step={5}
                        value={unit.fanSpeed}
                        onChange={(e) =>
                          onUpdateTuning(unit.instanceId, { fanSpeed: Number(e.target.value) })
                        }
                        className="ios-slider"
                      />
                    </div>
                  </div>

                  {/* Quick Maintenance Footer */}
                  <div className="pt-2 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onCleanDust(unit.instanceId)}
                        className="px-2.5 py-1.5 rounded-xl bg-[#2C2C2E] hover:bg-[#3A3A3C] text-xs font-medium text-zinc-200 cursor-pointer"
                      >
                        Продуть пыль
                      </button>
                      <button
                        type="button"
                        disabled={state.usd < 35}
                        onClick={() => onReplacePaste(unit.instanceId)}
                        className="px-2.5 py-1.5 rounded-xl bg-[#2C2C2E] hover:bg-[#3A3A3C] text-xs font-medium text-zinc-200 cursor-pointer disabled:opacity-40"
                      >
                        Термопаста ($35)
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSellUnit(unit.instanceId)}
                      className="px-2.5 py-1.5 rounded-xl bg-[#FF453A]/15 hover:bg-[#FF453A]/25 text-xs font-semibold text-[#FF453A] tabular-nums cursor-pointer"
                    >
                      Продать на Авито (+${resaleUsd})
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Hardware Catalog to Install into Coolest Empty Slot */}
      <div className="bg-[#1C1C1E] border border-white/[0.08] rounded-3xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Магазин оборудования (Авто-установка в самую холодную клетку)
            </h2>
            <p className="text-xs text-zinc-400">
              Каждая следующая покупка одной модели дорожает по экспоненте (дефицит чипов у поставщиков)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {EQUIPMENT_CATALOG.map((spec) => {
            const cost = calculateEquipmentCostUsd(state, spec.id);
            const isTierLocked = loc.tier < spec.minTier;
            const canBuy = state.usd >= cost && !isTierLocked && hasEmptySlot;

            return (
              <div
                key={spec.id}
                className="bg-[#2C2C2E] border border-white/[0.06] rounded-2xl p-3.5 flex items-center justify-between gap-3"
              >
                <div className="space-y-0.5">
                  <div className="text-sm font-bold text-white">{spec.name}</div>
                  <div className="text-xs text-zinc-400 tabular-nums">
                    {spec.category === 'miner'
                      ? formatHashrate(spec.baseHashrateGhs)
                      : `Охлаждение ${spec.heatFactor}°C`}{' '}
                    · {(spec.baseWatts / 1000).toFixed(2)} кВт · {spec.baseNoiseDb} дБ
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!canBuy}
                  onClick={() => onQuickBuyToCoolestCell(spec.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold tabular-nums whitespace-nowrap cursor-pointer ${
                    canBuy
                      ? 'bg-[#0A84FF] hover:bg-[#0A84FF]/90 text-white'
                      : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  }`}
                >
                  {isTierLocked
                    ? `Тир ${spec.minTier}`
                    : !hasEmptySlot
                    ? 'Нет места'
                    : `Купить $${cost.toLocaleString('en-US')}`}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
