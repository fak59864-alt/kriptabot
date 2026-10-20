import React from 'react';
import {
  FarmSummary,
  GameState,
  LOCATIONS,
  calculateMaxPowerKw,
  calculateWiringUpgradeCostUsd,
  getLocationSpec,
} from '../game/engine';

interface PowerLocationsViewProps {
  state: GameState;
  summary: FarmSummary;
  onUpgradeWiring: () => void;
  onResetBreaker: () => void;
  onSelectOrUnlockLocation: (locationId: string) => void;
}

export const PowerLocationsView: React.FC<PowerLocationsViewProps> = ({
  state,
  summary,
  onUpgradeWiring,
  onResetBreaker,
  onSelectOrUnlockLocation,
}) => {
  const currentLoc = getLocationSpec(state.locationId);
  const wiringCost = calculateWiringUpgradeCostUsd(state);
  const nextMaxKw = Number((currentLoc.baseMaxKw * Math.pow(1.22, state.wiringLevel + 1)).toFixed(2));
  const loadPct = summary.maxKw > 0 ? Math.min(100, (summary.totalKw / summary.maxKw) * 100) : 0;
  const noisePct =
    currentLoc.noiseLimitDb > 0
      ? Math.min(100, (summary.combinedNoiseDb / currentLoc.noiseLimitDb) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Power Grid & Switchboard Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 bg-[#1C1C1E] border border-white/[0.08] rounded-3xl p-5 sm:p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Вводной щиток и Энергосеть
              </h1>
              <p className="text-xs text-zinc-400">
                Текущая локация: {currentLoc.name} · Тариф ${currentLoc.tariffPerKwh.toFixed(3)}/кВт·ч
              </p>
            </div>
            <span
              className={`text-xs font-bold tabular-nums ${
                state.breakerTripped ? 'text-[#FF453A]' : 'text-[#30D158]'
              }`}
            >
              {state.breakerTripped ? 'АВТОМАТ ВЫБИТ' : 'ВВОД В НОРМЕ'}
            </span>
          </div>

          {/* Load Bar */}
          <div className="bg-[#2C2C2E] rounded-2xl p-4 space-y-2.5 tabular-nums">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-300 font-medium">Нагрузка на вводной автомат</span>
              <span className="font-bold text-white">
                {summary.totalKw.toFixed(2)} кВт из {summary.maxKw.toFixed(2)} кВт ({loadPct.toFixed(0)}%)
              </span>
            </div>
            <div className="w-full h-3 bg-black rounded-full overflow-hidden">
              <div
                style={{ width: `${loadPct}%` }}
                className={`h-full transition-all ${
                  loadPct > 92
                    ? 'bg-[#FF453A]'
                    : loadPct > 75
                    ? 'bg-[#FF9F0A]'
                    : 'bg-[#30D158]'
                }`}
              />
            </div>
            <div className="flex justify-between text-[11px] text-zinc-400">
              <span>Уровень проводки: Ур. {state.wiringLevel}</span>
              <span>След. ступень: {nextMaxKw} кВт (+22%)</span>
            </div>
          </div>

          {/* Upgrade Wiring CTA */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="space-y-0.5">
              <div className="text-sm font-bold text-white">
                Усилить медную шину и вводной автомат (Ур. {state.wiringLevel + 1})
              </div>
              <div className="text-xs text-zinc-400 tabular-nums">
                Повысит лимит мощности с {calculateMaxPowerKw(state)} кВт до {nextMaxKw} кВт
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {state.breakerTripped && (
                <button
                  type="button"
                  onClick={onResetBreaker}
                  className="px-4 py-2.5 rounded-xl bg-[#FF453A] text-white text-xs font-bold cursor-pointer whitespace-nowrap"
                >
                  Включить автомат
                </button>
              )}
              <button
                type="button"
                disabled={state.usd < wiringCost}
                onClick={onUpgradeWiring}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold tabular-nums whitespace-nowrap cursor-pointer ${
                  state.usd >= wiringCost
                    ? 'bg-[#0A84FF] hover:bg-[#0A84FF]/90 text-white'
                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                }`}
              >
                Улучшить за ${wiringCost.toLocaleString('en-US')}
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Acoustic Control & Environmental Telemetry */}
        <div className="lg:col-span-5 bg-[#1C1C1E] border border-white/[0.08] rounded-3xl p-5 sm:p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Акустика и Тарифный Режим
              </h2>
              <span
                className={`text-xs font-bold tabular-nums ${
                  summary.combinedNoiseDb > currentLoc.noiseLimitDb
                    ? 'text-[#FF453A]'
                    : 'text-[#30D158]'
                }`}
              >
                {summary.combinedNoiseDb} / {currentLoc.noiseLimitDb} дБ
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              При превышении санитарного порога шума в жилых и кооперативных зонах начисляются штрафы. Снижайте обороты кулеров или переезжайте в промышленные локации.
            </p>
          </div>

          <div className="bg-[#2C2C2E] rounded-2xl p-3.5 text-xs tabular-nums space-y-2">
            <div className="w-full h-2.5 bg-black rounded-full overflow-hidden">
              <div
                style={{ width: `${noisePct}%` }}
                className={`h-full transition-all ${
                  summary.combinedNoiseDb > currentLoc.noiseLimitDb
                    ? 'bg-[#FF453A]'
                    : 'bg-[#0A84FF]'
                }`}
              />
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-zinc-400">Расход на свет (60с):</span>
              <span className="font-bold text-[#FF453A]">
                -${summary.usdPowerCostPerMin.toFixed(1)} / мин
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Аренда и хладагенты:</span>
              <span className="font-bold text-zinc-200">
                -${summary.usdRentAndMaintPerMin.toFixed(1)} / мин
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Коэффициент пыли зала:</span>
              <span className="font-semibold text-white">
                ×{currentLoc.dustRateMultiplier.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 6 Location Tiers Progression */}
      <div className="space-y-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight px-1">
            Локации и Энергетические Базы (Тир 1 – Тир 6)
          </h2>
          <p className="text-xs text-zinc-400 px-1">
            При переезде все купленное оборудование автоматически перевозится и расставляется в новом помещении
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {LOCATIONS.map((loc) => {
            const isCurrent = state.locationId === loc.id;
            const isUnlocked = state.unlockedLocations.includes(loc.id);
            const canUnlock = state.usd >= loc.unlockCostUsd;

            return (
              <div
                key={loc.id}
                className={`bg-[#1C1C1E] border rounded-3xl p-5 flex flex-col justify-between space-y-4 ${
                  isCurrent
                    ? 'border-[#0A84FF]'
                    : isUnlocked
                    ? 'border-white/[0.12]'
                    : 'border-white/[0.06]'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-base font-bold text-white">{loc.name}</span>
                    <span className="text-xs font-semibold text-zinc-400 tabular-nums">
                      {loc.gridSize}×{loc.gridSize} слотов
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">{loc.subtitle}</p>

                  <div className="bg-[#2C2C2E] rounded-2xl p-3 space-y-1.5 text-xs tabular-nums">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Базовый ввод:</span>
                      <span className="font-bold text-[#0A84FF]">
                        {loc.baseMaxKw >= 1000
                          ? `${(loc.baseMaxKw / 1000).toFixed(0)} МВт`
                          : `${loc.baseMaxKw} кВт`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Тариф розетки:</span>
                      <span className="font-bold text-[#30D158]">${loc.tariffPerKwh}/кВт·ч</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Температура среды:</span>
                      <span className="font-bold text-white">
                        {loc.ambientTemp > 0 ? `+${loc.ambientTemp}` : loc.ambientTemp}°C
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Лимит шума / Аренда:</span>
                      <span className="font-semibold text-zinc-300">
                        {loc.noiseLimitDb} дБ · ${loc.rentUsdPerMin}/м
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isCurrent || (!isUnlocked && !canUnlock)}
                  onClick={() => onSelectOrUnlockLocation(loc.id)}
                  className={`w-full py-2.5 rounded-xl text-xs font-semibold tabular-nums transition-colors cursor-pointer ${
                    isCurrent
                      ? 'bg-[#30D158]/20 text-[#30D158] cursor-default'
                      : isUnlocked
                      ? 'bg-[#2C2C2E] hover:bg-[#3A3A3C] text-white'
                      : canUnlock
                      ? 'bg-[#0A84FF] hover:bg-[#0A84FF]/90 text-white'
                      : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  }`}
                >
                  {isCurrent
                    ? 'Текущая база'
                    : isUnlocked
                    ? 'Переехать сюда (Бесплатно)'
                    : `Открыть и переехать ($${loc.unlockCostUsd.toLocaleString('en-US')})`}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
