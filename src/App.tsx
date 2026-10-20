import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  DynamicIslandAlert,
  EQUIPMENT_CATALOG,
  GameState,
  MarketPhase,
  RND_CATALOG,
  TabId,
  calculateEquipmentCostUsd,
  calculateFarmSummary,
  calculateMaxPowerKw,
  calculateStabilityPercent,
  calculateWiringUpgradeCostUsd,
  createEmptyGrid,
  createInitialGameState,
  getEquipmentSpec,
  getLocationSpec,
  stepMarketPrice,
  stepThermalGrid,
} from './game/engine';
import {
  getMuted,
  initTelegramWebApp,
  setMuted,
  triggerHaptic,
} from './utils/haptics';
import { DynamicIslandHeader } from './components/DynamicIslandHeader';
import { ThermalGridView } from './components/ThermalGridView';
import { CellBottomSheet } from './components/CellBottomSheet';
import { HardwareTuningView } from './components/HardwareTuningView';
import { PowerLocationsView } from './components/PowerLocationsView';
import { ExchangeFinanceView } from './components/ExchangeFinanceView';
import { RndScienceView } from './components/RndScienceView';
import { BottomTabBar } from './components/BottomTabBar';
import { SavePauseModal } from './components/SavePauseModal';
import { TitleScreenModal } from './components/TitleScreenModal';

const STORAGE_KEY = 'hashrate_tycoon_ios18_save_v1';

type ShellState = 'title' | 'playing' | 'paused';

function sampleStandardNormal(): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function pushAlert(
  alerts: DynamicIslandAlert[],
  type: DynamicIslandAlert['type'],
  title: string,
  detail: string
): DynamicIslandAlert[] {
  const next: DynamicIslandAlert = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    title,
    detail,
    timestamp: Date.now(),
  };
  return [next, ...alerts.slice(0, 7)];
}

export default function App() {
  const [shellState, setShellState] = useState<ShellState>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') {
        return 'playing';
      }
    }
    return 'title';
  });

  const [activeTab, setActiveTab] = useState<TabId>('grid');
  const [selectedCoords, setSelectedCoords] = useState<{ x: number; y: number } | null>(null);
  const [movingFrom, setMovingFrom] = useState<{ x: number; y: number } | null>(null);
  const [isMutedState, setIsMutedState] = useState<boolean>(() => getMuted());
  const [offlineReport, setOfflineReport] = useState<{
    secondsAway: number;
    btcEarned: number;
    usdBillsPaid: number;
  } | null>(null);

  const [state, setState] = useState<GameState>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as GameState;
        if (parsed && parsed.version === 1 && Array.isArray(parsed.grid)) {
          return parsed;
        }
      }
    } catch {
      // Fallback to fresh state
    }
    return createInitialGameState();
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  // Sync shell state to document.body.dataset.state
  useEffect(() => {
    document.body.dataset.state = shellState;
  }, [shellState]);

  // Initialize Telegram WebApp and compute offline progress once on mount
  useEffect(() => {
    initTelegramWebApp();

    const now = Date.now();
    const elapsedSec = Math.floor((now - stateRef.current.lastSavedAt) / 1000);
    if (elapsedSec >= 15) {
      const cappedSec = Math.min(elapsedSec, 86400);
      const summary = calculateFarmSummary(stateRef.current);
      if (summary.btcPerSecond > 0) {
        const btcEarned = summary.btcPerSecond * cappedSec * 0.85;
        const minutesAway = cappedSec / 60;
        const totalBill =
          (summary.usdPowerCostPerMin + summary.usdRentAndMaintPerMin) * minutesAway;
        const paid = Math.min(stateRef.current.usd, totalBill);
        const unpaidRemainder = Math.max(0, totalBill - paid);

        setState((prev) => ({
          ...prev,
          btc: prev.btc + btcEarned,
          totalBtcMined: prev.totalBtcMined + btcEarned,
          usd: Math.max(0, prev.usd - paid),
          totalBillsPaidUsd: prev.totalBillsPaidUsd + paid,
          unpaidBillUsd: prev.unpaidBillUsd + unpaidRemainder,
          powerCutNonPayment: unpaidRemainder > 0 ? true : prev.powerCutNonPayment,
          lastSavedAt: now,
        }));

        setOfflineReport({
          secondsAway: cappedSec,
          btcEarned,
          usdBillsPaid: paid,
        });
      }
    }
  }, []);

  // Keyboard shortcuts: Enter/Space on Title Screen, Escape/P for Pause, M for Mute
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (shellState === 'title' && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        triggerHaptic('medium');
        setShellState('playing');
        return;
      }

      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P' || e.key === 'з' || e.key === 'З') {
        e.preventDefault();
        setSelectedCoords(null);
        setShellState((prev) => (prev === 'paused' ? 'playing' : 'paused'));
      } else if (e.key === 'm' || e.key === 'M' || e.key === 'ь' || e.key === 'Ь') {
        e.preventDefault();
        const nextMuted = !getMuted();
        setMuted(nextMuted);
        setIsMutedState(nextMuted);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shellState]);

  // Autosave every 5 seconds
  useEffect(() => {
    const saveTimer = setInterval(() => {
      try {
        const snapshot: GameState = {
          ...stateRef.current,
          lastSavedAt: Date.now(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
      } catch {
        // Ignore storage quota errors
      }
    }, 5000);
    return () => clearInterval(saveTimer);
  }, []);

  // Core 500ms Simulation & Thermal Automaton Loop
  const halfSecondTickRef = useRef(0);
  useEffect(() => {
    if (shellState !== 'playing') return;

    const interval = setInterval(() => {
      halfSecondTickRef.current += 1;
      const isFullSecond = halfSecondTickRef.current % 2 === 0;
      const isFiveSeconds = halfSecondTickRef.current % 10 === 0;

      setState((prev) => {
        const loc = getLocationSpec(prev.locationId);
        const summary = calculateFarmSummary(prev);

        // 1. Check Breaker Overload
        let breakerTripped = prev.breakerTripped;
        let alerts = prev.alerts;

        if (!breakerTripped && summary.totalKw > summary.maxKw) {
          breakerTripped = true;
          triggerHaptic('error');
          alerts = pushAlert(
            alerts,
            'danger',
            'ВВОДНОЙ АВТОМАТ ВЫБИТ',
            `Нагрузка ${summary.totalKw.toFixed(2)} кВт превысила лимит ${summary.maxKw.toFixed(1)} кВт!`
          );
        }

        // 2. Step 2D Thermal Grid Cellular Automaton (every 500ms)
        const steppedGrid = stepThermalGrid(
          prev.grid,
          loc.gridSize,
          loc.ambientTemp,
          breakerTripped,
          prev.powerCutNonPayment,
          prev.rndLevels
        );

        // 3. Hardware degradation, dust accumulation, stability crashes & watchdog
        const filterLevel = prev.rndLevels['electrostatic_filters'] || 0;
        const dustFilterMult = Math.max(0.2, 1 - filterLevel * 0.1);
        const watchdogLevel = prev.rndLevels['watchdog_reboot'] || 0;
        const activePower = !breakerTripped && !prev.powerCutNonPayment;

        const nextGrid = steppedGrid.map((cell) => {
          if (!cell.unit) return cell;
          const u = { ...cell.unit };
          const spec = getEquipmentSpec(u.specId);

          // Auto-reboot via USB Watchdog R&D
          if (u.isCrashed && !u.isBurned && watchdogLevel > 0 && isFullSecond) {
            if (Math.random() < watchdogLevel * 0.2) {
              u.isCrashed = false;
              alerts = pushAlert(
                alerts,
                'info',
                'USB Watchdog перезапустил риг',
                `${spec.name} в слоте [${cell.x + 1}, ${cell.y + 1}] снова в строю`
              );
            }
          }

          if (!activePower || !u.isEnabled || u.isBurned || u.isCrashed) {
            return { ...cell, unit: u };
          }

          // Dust accumulation
          const dustStep = 0.035 * loc.dustRateMultiplier * dustFilterMult * (u.fanSpeed / 65);
          u.dust = Math.min(100, Number((u.dust + dustStep).toFixed(2)));

          // Paste degradation when hot
          const pasteStep = cell.temp > 70 ? 0.025 : 0.008;
          u.pasteHealth = Math.max(0, Number((u.pasteHealth - pasteStep).toFixed(2)));

          // Thermal degradation when T > 85°C or extreme fan wear
          let healthDrop = 0;
          if (cell.temp > 85) {
            healthDrop += (cell.temp - 85) * 0.085;
          }
          if (u.fanSpeed > 85) {
            healthDrop += 0.012;
          }
          if (healthDrop > 0) {
            u.health = Math.max(0, Number((u.health - healthDrop).toFixed(2)));
            if (u.health <= 0 && !u.isBurned) {
              u.isBurned = true;
              triggerHaptic('error');
              alerts = pushAlert(
                alerts,
                'danger',
                'ЧИП СГОРЕЛ ОТ ПЕРЕГРЕВА',
                `${spec.name} [${cell.x + 1}, ${cell.y + 1}] деградировал до 0% (${cell.temp.toFixed(0)}°C)`
              );
            } else if (cell.temp > 86 && Math.random() < 0.08) {
              alerts = pushAlert(
                alerts,
                'danger',
                `КРИТИЧЕСКИЙ НАГРЕВ ${cell.temp.toFixed(0)}°C`,
                `${spec.name} [${cell.x + 1}, ${cell.y + 1}] теряет здоровье чипа!`
              );
            }
          }

          // Silicon Lottery Stability Check (crashes if unstable overclock/undervolt)
          if (spec.category === 'miner' && isFullSecond) {
            const stab = calculateStabilityPercent(u, prev.rndLevels);
            if (stab < 100) {
              const crashProb = ((100 - stab) / 100) * 0.045;
              if (Math.random() < crashProb) {
                u.isCrashed = true;
                triggerHaptic('warning');
                alerts = pushAlert(
                  alerts,
                  'warning',
                  'СБОЙ РАЗГОНА / UNDERVOLT CRASH',
                  `${spec.name} [${cell.x + 1}, ${cell.y + 1}] завис (стабильность ${stab}%)`
                );
              }
            }
          }

          return { ...cell, unit: u };
        });

        // 4. Mining BTC production for 0.5s
        const minedBtcDelta = activePower ? summary.btcPerSecond * 0.5 : 0;
        let nextBtc = prev.btc + minedBtcDelta;
        let nextTotalBtc = prev.totalBtcMined + minedBtcDelta;
        let nextUsd = prev.usd;
        let nextTotalBillsPaid = prev.totalBillsPaidUsd;
        let nextUnpaidBill = prev.unpaidBillUsd;
        let nextPowerCut = prev.powerCutNonPayment;
        let nextBillTimer = prev.billTimerSec;

        // 5. Full-second events: Electricity billing, Market Price GBM, Noise Fines, Halving Blocks
        let nextBtcPrice = prev.btcPriceUsd;
        let nextHistory = prev.btcPriceHistory;
        let nextPhase: MarketPhase = prev.marketPhase;
        let nextPhaseTimer = prev.marketPhaseTimerSec;
        let nextBlocksMined = prev.blocksMined;
        let nextBlocksUntilHalving = prev.blocksUntilHalving;
        let nextHalvingEpoch = prev.halvingEpoch;
        let nextBlockReward = prev.blockRewardBtc;
        let nextDifficulty = prev.networkDifficulty;
        let nextFineTimer = prev.neighborFineTimerSec;

        if (isFullSecond) {
          // Bill countdown
          nextBillTimer -= 1;
          if (nextBillTimer <= 0) {
            nextBillTimer = 60;
            const cycleBillUsd = summary.usdPowerCostPerMin + summary.usdRentAndMaintPerMin;
            if (cycleBillUsd > 0) {
              if (nextUsd >= cycleBillUsd) {
                nextUsd -= cycleBillUsd;
                nextTotalBillsPaid += cycleBillUsd;
                alerts = pushAlert(
                  alerts,
                  'info',
                  `Оплачен счет за свет -$${cycleBillUsd.toFixed(0)}`,
                  `Локация: ${loc.name} · Баланс $${nextUsd.toFixed(0)}`
                );
              } else {
                const paidPart = nextUsd;
                const shortfall = cycleBillUsd - paidPart;
                nextUsd = 0;
                nextTotalBillsPaid += paidPart;
                nextUnpaidBill += shortfall;
                nextPowerCut = true;
                triggerHaptic('error');
                alerts = pushAlert(
                  alerts,
                  'danger',
                  'ОТКЛЮЧЕНИЕ ЗА НЕУПЛАТУ СВЕТА',
                  `Долг $${nextUnpaidBill.toFixed(0)} USD. Продайте BTC на Бирже!`
                );
              }
            }
          }

          // Neighbor noise fine if combinedNoiseDb > loc.noiseLimitDb
          if (activePower && summary.combinedNoiseDb > loc.noiseLimitDb) {
            nextFineTimer += 1;
            if (nextFineTimer >= 20) {
              nextFineTimer = 0;
              const fineUsd = Math.round(35 * loc.tier);
              nextUsd = Math.max(0, nextUsd - fineUsd);
              alerts = pushAlert(
                alerts,
                'warning',
                `ШТРАФ ЗА ШУМ -$${fineUsd}`,
                `Шум ${summary.combinedNoiseDb} дБ превышает лимит ${loc.noiseLimitDb} дБ!`
              );
            }
          } else {
            nextFineTimer = 0;
          }

          // Market Phase timer & GBM step
          nextPhaseTimer -= 1;
          if (nextPhaseTimer <= 0) {
            nextPhaseTimer = 45 + Math.floor(Math.random() * 35);
            const phases: MarketPhase[] = ['BULL_RUN', 'CRAB_MARKET', 'CRYPTO_WINTER'];
            nextPhase = phases[Math.floor(Math.random() * phases.length)];
            const phaseTitle =
              nextPhase === 'BULL_RUN'
                ? 'НАЧАЛСЯ BULL RUN (БЫЧИЙ РЫНОК)'
                : nextPhase === 'CRYPTO_WINTER'
                ? 'НАСТУПИЛА КРИПТОЗИМА'
                : 'РЫНОК ВОШЕЛ В БОКОВИК (ФЛЭТ)';
            alerts = pushAlert(alerts, 'info', phaseTitle, `Курс BTC: $${nextBtcPrice}`);
          }

          nextBtcPrice = stepMarketPrice(prev.btcPriceUsd, nextPhase, sampleStandardNormal());
          nextHistory = [...prev.btcPriceHistory.slice(-39), nextBtcPrice];
        }

        // Every 5 seconds: new Block mined on network -> difficulty growth & Halving check
        if (isFiveSeconds && activePower && summary.totalHashrateGhs > 0) {
          nextBlocksMined += 1;
          nextBlocksUntilHalving -= 1;
          // Network difficulty slowly climbs by 0.85% per block
          nextDifficulty = Number((prev.networkDifficulty * 1.0085).toFixed(1));

          if (nextBlocksUntilHalving <= 0) {
            nextHalvingEpoch += 1;
            nextBlockReward = Number((prev.blockRewardBtc / 2).toFixed(6));
            nextBlocksUntilHalving = 24;
            triggerHaptic('heavy');
            alerts = pushAlert(
              alerts,
              'halving',
              `ХАЛВИНГ #${nextHalvingEpoch} СВЕРШИЛСЯ!`,
              `Награда за блок снижена вдвое до ${nextBlockReward} BTC!`
            );
          }
        }

        return {
          ...prev,
          grid: nextGrid,
          breakerTripped,
          powerCutNonPayment: nextPowerCut,
          unpaidBillUsd: nextUnpaidBill,
          billTimerSec: nextBillTimer,
          btc: nextBtc,
          totalBtcMined: nextTotalBtc,
          usd: nextUsd,
          totalBillsPaidUsd: nextTotalBillsPaid,
          btcPriceUsd: nextBtcPrice,
          btcPriceHistory: nextHistory,
          marketPhase: nextPhase,
          marketPhaseTimerSec: nextPhaseTimer,
          blocksMined: nextBlocksMined,
          blocksUntilHalving: nextBlocksUntilHalving,
          halvingEpoch: nextHalvingEpoch,
          blockRewardBtc: nextBlockReward,
          networkDifficulty: nextDifficulty,
          neighborFineTimerSec: nextFineTimer,
          alerts,
        };
      });
    }, 500);

    return () => clearInterval(interval);
  }, [shellState]);

  const summary = useMemo(() => calculateFarmSummary(state), [state]);

  const selectedCell = useMemo(() => {
    if (!selectedCoords) return null;
    return (
      state.grid.find((c) => c.x === selectedCoords.x && c.y === selectedCoords.y) || null
    );
  }, [state.grid, selectedCoords]);

  // Handlers
  const handleSelectCell = (cell: { x: number; y: number }) => {
    triggerHaptic('selection');
    if (movingFrom) {
      if (movingFrom.x === cell.x && movingFrom.y === cell.y) {
        setMovingFrom(null);
        return;
      }
      setState((prev) => {
        const size = getLocationSpec(prev.locationId).gridSize;
        const fromIdx = movingFrom.y * size + movingFrom.x;
        const toIdx = cell.y * size + cell.x;
        const nextGrid = [...prev.grid];
        const unitA = nextGrid[fromIdx].unit;
        const unitB = nextGrid[toIdx].unit;

        nextGrid[fromIdx] = {
          ...nextGrid[fromIdx],
          unit: unitB ? { ...unitB, x: movingFrom.x, y: movingFrom.y } : null,
        };
        nextGrid[toIdx] = {
          ...nextGrid[toIdx],
          unit: unitA ? { ...unitA, x: cell.x, y: cell.y } : null,
        };

        return {
          ...prev,
          grid: nextGrid,
          alerts: pushAlert(
            prev.alerts,
            'info',
            'Оборудование переставлено',
            `Слот [${movingFrom.x + 1}, ${movingFrom.y + 1}] ↔ [${cell.x + 1}, ${cell.y + 1}]`
          ),
        };
      });
      setMovingFrom(null);
      return;
    }

    setSelectedCoords({ x: cell.x, y: cell.y });
  };

  const handleBuyAndInstall = (x: number, y: number, specId: string) => {
    const spec = getEquipmentSpec(specId);
    const cost = calculateEquipmentCostUsd(state, specId);
    if (state.usd < cost) return;

    // Roll Silicon Lottery (60% to 100%)
    const siliconQuality = Math.floor(60 + Math.random() * 41);
    triggerHaptic('success');

    setState((prev) => {
      const nextGrid = prev.grid.map((cell) => {
        if (cell.x === x && cell.y === y && !cell.unit) {
          return {
            ...cell,
            unit: {
              instanceId: `unit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              specId,
              x,
              y,
              siliconQuality,
              coreClock: 100,
              undervoltMv: 0,
              fanSpeed: 65,
              health: 100,
              dust: 0,
              pasteHealth: 100,
              isCrashed: false,
              isBurned: false,
              isEnabled: true,
              purchasedPriceUsd: cost,
            },
          };
        }
        return cell;
      });

      return {
        ...prev,
        usd: prev.usd - cost,
        grid: nextGrid,
        alerts: pushAlert(
          prev.alerts,
          'info',
          `Установлен ${spec.name}`,
          `Слот [${x + 1}, ${y + 1}] · Кремниевая лотерея чипа: ${siliconQuality}%`
        ),
      };
    });
  };

  const handleQuickBuyToCoolestCell = (specId: string) => {
    const emptyCells = state.grid.filter((c) => c.unit === null);
    if (emptyCells.length === 0) return;
    const coolest = [...emptyCells].sort((a, b) => a.temp - b.temp)[0];
    handleBuyAndInstall(coolest.x, coolest.y, specId);
  };

  const handleUpdateTuning = (
    instanceId: string,
    changes: Partial<{
      coreClock: number;
      undervoltMv: number;
      fanSpeed: number;
      isEnabled: boolean;
    }>
  ) => {
    triggerHaptic('selection');
    setState((prev) => ({
      ...prev,
      grid: prev.grid.map((cell) =>
        cell.unit && cell.unit.instanceId === instanceId
          ? { ...cell, unit: { ...cell.unit, ...changes } }
          : cell
      ),
    }));
  };

  const handleApplyFleetPreset = (preset: 'eco' | 'stock' | 'turbo' | 'silent') => {
    triggerHaptic('medium');
    setState((prev) => ({
      ...prev,
      grid: prev.grid.map((cell) => {
        if (!cell.unit) return cell;
        const spec = getEquipmentSpec(cell.unit.specId);
        if (preset === 'eco' && spec.category === 'miner') {
          return {
            ...cell,
            unit: { ...cell.unit, coreClock: 95, undervoltMv: -55, fanSpeed: 65 },
          };
        }
        if (preset === 'stock' && spec.category === 'miner') {
          return {
            ...cell,
            unit: { ...cell.unit, coreClock: 100, undervoltMv: 0, fanSpeed: 65 },
          };
        }
        if (preset === 'turbo' && spec.category === 'miner') {
          return {
            ...cell,
            unit: { ...cell.unit, coreClock: 115, undervoltMv: 15, fanSpeed: 85 },
          };
        }
        if (preset === 'silent') {
          return {
            ...cell,
            unit: { ...cell.unit, fanSpeed: 45 },
          };
        }
        return cell;
      }),
      alerts: pushAlert(
        prev.alerts,
        'info',
        'Групповой профиль тюнинга применен',
        `Режим: ${preset.toUpperCase()} активирован для всех стоек`
      ),
    }));
  };

  const handleCleanDust = (instanceId: string) => {
    triggerHaptic('light');
    setState((prev) => ({
      ...prev,
      grid: prev.grid.map((cell) =>
        cell.unit && cell.unit.instanceId === instanceId
          ? { ...cell, unit: { ...cell.unit, dust: 0 } }
          : cell
      ),
    }));
  };

  const handleCleanAllDust = () => {
    triggerHaptic('medium');
    setState((prev) => ({
      ...prev,
      grid: prev.grid.map((cell) =>
        cell.unit ? { ...cell, unit: { ...cell.unit, dust: 0 } } : cell
      ),
      alerts: pushAlert(
        prev.alerts,
        'info',
        'Продувка радиаторов завершена',
        'Вся пыль удалена со стоек (0%)'
      ),
    }));
  };

  const handleReplacePaste = (instanceId: string) => {
    if (state.usd < 35) return;
    triggerHaptic('success');
    setState((prev) => ({
      ...prev,
      usd: prev.usd - 35,
      grid: prev.grid.map((cell) =>
        cell.unit && cell.unit.instanceId === instanceId
          ? { ...cell, unit: { ...cell.unit, pasteHealth: 100 } }
          : cell
      ),
    }));
  };

  const handleRebootUnit = (instanceId: string) => {
    triggerHaptic('medium');
    setState((prev) => ({
      ...prev,
      grid: prev.grid.map((cell) =>
        cell.unit && cell.unit.instanceId === instanceId
          ? { ...cell, unit: { ...cell.unit, isCrashed: false } }
          : cell
      ),
    }));
  };

  const handleRebootAllCrashed = () => {
    triggerHaptic('medium');
    setState((prev) => ({
      ...prev,
      grid: prev.grid.map((cell) =>
        cell.unit ? { ...cell, unit: { ...cell.unit, isCrashed: false } } : cell
      ),
      alerts: pushAlert(
        prev.alerts,
        'info',
        'Все зависшие стойки перезапущены',
        'Майнинг возобновлен'
      ),
    }));
  };

  const handleRepairBurnedUnit = (instanceId: string) => {
    const targetCell = state.grid.find((c) => c.unit?.instanceId === instanceId);
    if (!targetCell?.unit) return;
    const spec = getEquipmentSpec(targetCell.unit.specId);
    const repairCost = Math.round(spec.baseCostUsd * 0.35);
    if (state.usd < repairCost) return;

    triggerHaptic('success');
    setState((prev) => ({
      ...prev,
      usd: prev.usd - repairCost,
      grid: prev.grid.map((cell) =>
        cell.unit && cell.unit.instanceId === instanceId
          ? {
              ...cell,
              unit: {
                ...cell.unit,
                isBurned: false,
                isCrashed: false,
                health: 85,
                pasteHealth: 100,
              },
            }
          : cell
      ),
      alerts: pushAlert(
        prev.alerts,
        'info',
        `Реболлинг ${spec.name} выполнен`,
        `Чип восстановлен до 85% ресурса`
      ),
    }));
  };

  const handleSellUnit = (instanceId: string) => {
    const targetCell = state.grid.find((c) => c.unit?.instanceId === instanceId);
    if (!targetCell?.unit) return;
    const unit = targetCell.unit;
    const spec = getEquipmentSpec(unit.specId);
    const resaleUsd = Math.round(unit.purchasedPriceUsd * 0.65 * (unit.health / 100));

    triggerHaptic('success');
    setState((prev) => ({
      ...prev,
      usd: prev.usd + resaleUsd,
      grid: prev.grid.map((cell) =>
        cell.unit && cell.unit.instanceId === instanceId ? { ...cell, unit: null } : cell
      ),
      alerts: pushAlert(
        prev.alerts,
        'profit',
        `Продано на Авито: ${spec.name}`,
        `Получено +$${resaleUsd.toLocaleString('en-US')} USD`
      ),
    }));
  };

  const handleResetBreaker = () => {
    triggerHaptic('medium');
    setState((prev) => ({
      ...prev,
      breakerTripped: false,
      alerts: pushAlert(
        prev.alerts,
        'info',
        'Вводной автомат взведен',
        `Лимит мощности: ${calculateMaxPowerKw(prev)} кВт`
      ),
    }));
  };

  const handlePayUnpaidBill = () => {
    if (state.unpaidBillUsd <= 0 || state.usd < state.unpaidBillUsd) return;
    triggerHaptic('success');
    setState((prev) => ({
      ...prev,
      usd: prev.usd - prev.unpaidBillUsd,
      totalBillsPaidUsd: prev.totalBillsPaidUsd + prev.unpaidBillUsd,
      unpaidBillUsd: 0,
      powerCutNonPayment: false,
      alerts: pushAlert(
        prev.alerts,
        'profit',
        'Задолженность за свет погашена',
        'Электроснабжение помещения полностью восстановлено!'
      ),
    }));
  };

  const handleUpgradeWiring = () => {
    const cost = calculateWiringUpgradeCostUsd(state);
    if (state.usd < cost) return;
    triggerHaptic('success');
    setState((prev) => ({
      ...prev,
      usd: prev.usd - cost,
      wiringLevel: prev.wiringLevel + 1,
      breakerTripped: false,
      alerts: pushAlert(
        prev.alerts,
        'info',
        `Силовой ввод усилен (Ур. ${prev.wiringLevel + 1})`,
        'Допустимая мощность увеличена на +22%'
      ),
    }));
  };

  const handleSelectOrUnlockLocation = (locationId: string) => {
    const targetLoc = getLocationSpec(locationId);
    const isUnlocked = state.unlockedLocations.includes(locationId);
    if (!isUnlocked && state.usd < targetLoc.unlockCostUsd) return;

    triggerHaptic('success');
    setState((prev) => {
      const existingUnits = prev.grid
        .filter((c) => c.unit !== null)
        .map((c) => c.unit!);
      const newGrid = createEmptyGrid(targetLoc.gridSize, targetLoc.ambientTemp);

      existingUnits.forEach((u, idx) => {
        if (idx < newGrid.length) {
          newGrid[idx].unit = {
            ...u,
            x: newGrid[idx].x,
            y: newGrid[idx].y,
          };
        }
      });

      return {
        ...prev,
        usd: isUnlocked ? prev.usd : prev.usd - targetLoc.unlockCostUsd,
        locationId,
        unlockedLocations: isUnlocked
          ? prev.unlockedLocations
          : [...prev.unlockedLocations, locationId],
        wiringLevel: 0,
        grid: newGrid,
        breakerTripped: false,
        alerts: pushAlert(
          prev.alerts,
          'profit',
          `Переезд завершен: ${targetLoc.name}`,
          `Сетка ${targetLoc.gridSize}×${targetLoc.gridSize} · Тариф $${targetLoc.tariffPerKwh}/кВт·ч`
        ),
      };
    });
    setSelectedCoords(null);
    setMovingFrom(null);
  };

  const handleTriggerPrestige = () => {
    triggerHaptic('heavy');
    setState((prev) => {
      const fresh = createInitialGameState();
      const nextMult = Number((prev.quantumMultiplier + 0.85).toFixed(2));
      const keptLitho = prev.rndLevels['asic_1nm_lithography'] || 0;

      return {
        ...fresh,
        prestigeCount: prev.prestigeCount + 1,
        quantumMultiplier: nextMult,
        totalBtcMined: prev.totalBtcMined,
        rndLevels: keptLitho > 0 ? { asic_1nm_lithography: keptLitho } : {},
        alerts: pushAlert(
          fresh.alerts,
          'halving',
          `КВАНТОВЫЙ ФОРК #${prev.prestigeCount + 1} АКТИВИРОВАН`,
          `Глобальный мультипликатор хешрейта вырос до ×${nextMult}!`
        ),
      };
    });
    setActiveTab('grid');
  };

  const handleSellBtcFraction = (fraction: number) => {
    const amountBtc = state.btc * fraction;
    if (amountBtc <= 0) return;
    const usdProceeds = amountBtc * state.btcPriceUsd;
    triggerHaptic('success');

    setState((prev) => ({
      ...prev,
      btc: Math.max(0, prev.btc - amountBtc),
      usd: prev.usd + usdProceeds,
      alerts: pushAlert(
        prev.alerts,
        'profit',
        `Продано ${amountBtc.toFixed(5)} BTC за $${usdProceeds.toFixed(0)}`,
        `Курс исполнения: $${prev.btcPriceUsd.toLocaleString('en-US')}`
      ),
    }));
  };

  const handleBuyBtcUsdAmount = (usdAmount: number) => {
    if (usdAmount <= 0 || state.usd < usdAmount) return;
    const btcBought = usdAmount / state.btcPriceUsd;
    triggerHaptic('success');

    setState((prev) => ({
      ...prev,
      usd: prev.usd - usdAmount,
      btc: prev.btc + btcBought,
      alerts: pushAlert(
        prev.alerts,
        'info',
        `Куплено +${btcBought.toFixed(5)} BTC`,
        `Списано $${usdAmount.toLocaleString('en-US')} USD`
      ),
    }));
  };

  const handleUpgradeRnd = (nodeId: string, payWith: 'usd' | 'btc') => {
    const node = RND_CATALOG.find((n) => n.id === nodeId);
    if (!node) return;
    const curLevel = state.rndLevels[nodeId] || 0;
    if (curLevel >= node.maxLevel) return;

    const costUsd = Math.round(node.baseCostUsd * Math.pow(node.costMultiplier, curLevel));
    const costBtc = Number(
      (node.baseCostBtc * Math.pow(node.costMultiplier, curLevel)).toFixed(5)
    );

    if (payWith === 'usd' && state.usd < costUsd) return;
    if (payWith === 'btc' && state.btc < costBtc) return;

    triggerHaptic('success');
    setState((prev) => ({
      ...prev,
      usd: payWith === 'usd' ? prev.usd - costUsd : prev.usd,
      btc: payWith === 'btc' ? prev.btc - costBtc : prev.btc,
      rndLevels: {
        ...prev.rndLevels,
        [nodeId]: curLevel + 1,
      },
      alerts: pushAlert(
        prev.alerts,
        'info',
        `R&D Изучено: ${node.name} (Ур. ${curLevel + 1})`,
        node.effectLabel
      ),
    }));
  };

  const handleImportSave = (rawString: string): boolean => {
    try {
      let jsonStr = rawString;
      if (!rawString.trim().startsWith('{')) {
        jsonStr = decodeURIComponent(atob(rawString.trim()));
      }
      const parsed = JSON.parse(jsonStr) as GameState;
      if (parsed && parsed.version === 1 && Array.isArray(parsed.grid)) {
        setState(parsed);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        triggerHaptic('success');
        return true;
      }
    } catch {
      // Invalid save string
    }
    return false;
  };

  const handleResetGame = () => {
    triggerHaptic('heavy');
    const fresh = createInitialGameState();
    setState(fresh);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col pb-20">
      {/* Title Screen Handshake Overlay */}
      {shellState === 'title' && (
        <TitleScreenModal
          state={state}
          summary={summary}
          onStart={() => {
            triggerHaptic('medium');
            setShellState('playing');
          }}
        />
      )}

      {/* Top iOS Status Bar + Dynamic Island */}
      <DynamicIslandHeader
        state={state}
        summary={summary}
        isMuted={isMutedState}
        onToggleMute={() => {
          const next = !isMutedState;
          setMuted(next);
          setIsMutedState(next);
        }}
        onOpenPauseModal={() => setShellState('paused')}
        onResetBreaker={handleResetBreaker}
      />

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6">
        {activeTab === 'grid' && (
          <ThermalGridView
            state={state}
            summary={summary}
            movingFrom={movingFrom}
            onCancelMove={() => setMovingFrom(null)}
            onSelectCell={handleSelectCell}
            onCleanAllDust={handleCleanAllDust}
            onRebootAllCrashed={handleRebootAllCrashed}
            onResetBreaker={handleResetBreaker}
            onPayUnpaidBill={handlePayUnpaidBill}
          />
        )}

        {activeTab === 'hardware' && (
          <HardwareTuningView
            state={state}
            onUpdateTuning={handleUpdateTuning}
            onApplyFleetPreset={handleApplyFleetPreset}
            onCleanDust={handleCleanDust}
            onReplacePaste={handleReplacePaste}
            onRebootUnit={handleRebootUnit}
            onRepairBurnedUnit={handleRepairBurnedUnit}
            onSellUnit={handleSellUnit}
            onQuickBuyToCoolestCell={handleQuickBuyToCoolestCell}
          />
        )}

        {activeTab === 'power' && (
          <PowerLocationsView
            state={state}
            summary={summary}
            onUpgradeWiring={handleUpgradeWiring}
            onResetBreaker={handleResetBreaker}
            onSelectOrUnlockLocation={handleSelectOrUnlockLocation}
            onTriggerPrestige={handleTriggerPrestige}
          />
        )}

        {activeTab === 'exchange' && (
          <ExchangeFinanceView
            state={state}
            summary={summary}
            onSellBtcFraction={handleSellBtcFraction}
            onBuyBtcUsdAmount={handleBuyBtcUsdAmount}
            onPayUnpaidBill={handlePayUnpaidBill}
          />
        )}

        {activeTab === 'rnd' && (
          <RndScienceView state={state} onUpgradeRnd={handleUpgradeRnd} />
        )}
      </main>

      {/* Cell Bottom Sheet Modal */}
      <CellBottomSheet
        cell={selectedCell}
        state={state}
        onClose={() => setSelectedCoords(null)}
        onBuyAndInstall={handleBuyAndInstall}
        onUpdateTuning={handleUpdateTuning}
        onCleanDust={handleCleanDust}
        onReplacePaste={handleReplacePaste}
        onRebootUnit={handleRebootUnit}
        onRepairBurnedUnit={handleRepairBurnedUnit}
        onStartMoveUnit={(x, y) => setMovingFrom({ x, y })}
        onSellUnit={handleSellUnit}
      />

      {/* Pause / Save / Offline Progress Modal */}
      <SavePauseModal
        isOpen={shellState === 'paused'}
        state={state}
        summary={summary}
        offlineReport={offlineReport}
        onClose={() => {
          setOfflineReport(null);
          setShellState('playing');
        }}
        onImportSave={handleImportSave}
        onResetGame={handleResetGame}
        onGoToTitle={() => {
          setOfflineReport(null);
          setShellState('title');
        }}
      />

      {/* Fixed Bottom iOS Tab Bar */}
      <BottomTabBar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          triggerHaptic('selection');
          setActiveTab(tab);
        }}
        crashedCount={summary.crashedMinersCount}
        breakerTripped={state.breakerTripped}
      />
    </div>
  );
}
