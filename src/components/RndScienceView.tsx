import React from 'react';
import { GameState, RND_CATALOG } from '../game/engine';

interface RndScienceViewProps {
  state: GameState;
  onUpgradeRnd: (nodeId: string, payWith: 'usd' | 'btc') => void;
}

export const RndScienceView: React.FC<RndScienceViewProps> = ({ state, onUpgradeRnd }) => {
  return (
    <div className="space-y-6">
      <div className="bg-[#1C1C1E] border border-white/[0.08] rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            R&amp;D Лаборатория и Собственные 1-нм Чипы
          </h1>
          <p className="text-xs text-zinc-400">
            Исследования можно оплачивать как в долларах (USD), так и напрямую намайненными биткоинами (BTC)
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs tabular-nums bg-[#2C2C2E] px-4 py-2.5 rounded-2xl shrink-0">
          <div>
            <span className="text-zinc-400">Бюджет USD: </span>
            <span className="font-bold text-[#30D158]">
              ${state.usd.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </span>
          </div>
          <span className="text-zinc-600" aria-hidden="true">·</span>
          <div>
            <span className="text-zinc-400">Резерв BTC: </span>
            <span className="font-bold text-[#FF9F0A]">{state.btc.toFixed(5)} BTC</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {RND_CATALOG.map((node) => {
          const currentLevel = state.rndLevels[node.id] || 0;
          const isMaxed = currentLevel >= node.maxLevel;
          const costUsd = Math.round(
            node.baseCostUsd * Math.pow(node.costMultiplier, currentLevel)
          );
          const costBtc = Number(
            (node.baseCostBtc * Math.pow(node.costMultiplier, currentLevel)).toFixed(5)
          );

          const canPayUsd = !isMaxed && state.usd >= costUsd;
          const canPayBtc = !isMaxed && state.btc >= costBtc;

          const branchLabel =
            node.branch === 'silicon'
              ? 'Кремний и прошивки'
              : node.branch === 'thermodynamics'
              ? 'Термодинамика и охлаждение'
              : node.branch === 'grid'
              ? 'Силовая электроника'
              : 'Квантовая 1-нм литография';

          return (
            <div
              key={node.id}
              className="bg-[#1C1C1E] border border-white/[0.08] rounded-3xl p-5 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-[#BF5AF2]">
                    {branchLabel} · Уровень {currentLevel} / {node.maxLevel}
                  </span>
                </div>
                <h2 className="text-base font-bold text-white">{node.name}</h2>
                <p className="text-xs text-zinc-400 leading-relaxed">{node.description}</p>
                <div className="text-xs font-semibold text-[#30D158] pt-1">
                  Эффект: {node.effectLabel}
                </div>
              </div>

              {isMaxed ? (
                <div className="py-2.5 px-4 rounded-xl bg-[#30D158]/15 text-[#30D158] text-xs font-bold text-center">
                  Максимальный уровень изучен
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-white/[0.06]">
                  <button
                    type="button"
                    disabled={!canPayUsd}
                    onClick={() => onUpgradeRnd(node.id, 'usd')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-semibold tabular-nums transition-colors cursor-pointer ${
                      canPayUsd
                        ? 'bg-[#0A84FF] hover:bg-[#0A84FF]/90 text-white'
                        : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    }`}
                  >
                    Изучить за ${costUsd.toLocaleString('en-US')}
                  </button>

                  <button
                    type="button"
                    disabled={!canPayBtc}
                    onClick={() => onUpgradeRnd(node.id, 'btc')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-semibold tabular-nums transition-colors cursor-pointer ${
                      canPayBtc
                        ? 'bg-[#BF5AF2] hover:bg-[#BF5AF2]/90 text-white'
                        : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    }`}
                  >
                    Изучить за {costBtc} BTC
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
