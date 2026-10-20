export type TabId = 'grid' | 'hardware' | 'power' | 'exchange' | 'rnd';

export type MarketPhase = 'BULL_RUN' | 'CRAB_MARKET' | 'CRYPTO_WINTER';

export type EquipmentCategory = 'miner' | 'cooling';

export interface EquipmentSpec {
  id: string;
  name: string;
  subtitle: string;
  category: EquipmentCategory;
  baseCostUsd: number;
  costScale: number;
  baseHashrateGhs: number; // 0 for cooling
  baseWatts: number;
  heatFactor: number; // Positive for miners, negative for coolers
  coolingRadius: number; // 0 = self, 1 = 3x3, 2 = 5x5
  neighborCoolingFactor: number;
  baseNoiseDb: number;
  maintenanceUsdPerMin: number;
  minTier: number;
}

export interface InstalledUnit {
  instanceId: string;
  specId: string;
  x: number;
  y: number;
  siliconQuality: number; // 60 to 100
  coreClock: number; // 70 to 130 (%)
  undervoltMv: number; // -150 to +50 (mV)
  fanSpeed: number; // 20 to 100 (%)
  health: number; // 0 to 100 (%)
  dust: number; // 0 to 100 (%)
  pasteHealth: number; // 0 to 100 (%)
  isCrashed: boolean;
  isBurned: boolean;
  isEnabled: boolean;
  purchasedPriceUsd: number;
}

export interface GridCell {
  x: number;
  y: number;
  temp: number;
  unit: InstalledUnit | null;
}

export interface LocationSpec {
  id: string;
  tier: number;
  name: string;
  subtitle: string;
  gridSize: number; // e.g., 4 for 4x4, up to 10 for 10x10
  ambientTemp: number; // °C
  baseMaxKw: number;
  tariffPerKwh: number; // $/kWh
  noiseLimitDb: number;
  dustRateMultiplier: number;
  rentUsdPerMin: number;
  unlockCostUsd: number;
}

export interface RndNodeSpec {
  id: string;
  name: string;
  description: string;
  branch: 'silicon' | 'thermodynamics' | 'grid' | 'quant';
  baseCostUsd: number;
  baseCostBtc: number;
  costMultiplier: number;
  maxLevel: number;
  effectLabel: string;
}

export interface DynamicIslandAlert {
  id: string;
  type: 'danger' | 'warning' | 'info' | 'halving' | 'profit';
  title: string;
  detail: string;
  timestamp: number;
}

export interface GameState {
  version: number;
  usd: number;
  btc: number;
  btcPriceUsd: number;
  btcPriceHistory: number[];
  marketPhase: MarketPhase;
  marketPhaseTimerSec: number;
  locationId: string;
  unlockedLocations: string[];
  wiringLevel: number;
  grid: GridCell[];
  breakerTripped: boolean;
  powerCutNonPayment: boolean;
  unpaidBillUsd: number;
  billTimerSec: number;
  accumulatedKwhThisCycle: number;
  blocksMined: number;
  blocksUntilHalving: number;
  halvingEpoch: number;
  blockRewardBtc: number;
  networkDifficulty: number; // In GH/s equivalent reference
  rndLevels: Record<string, number>;
  prestigeCount: number;
  quantumMultiplier: number;
  totalBtcMined: number;
  totalBillsPaidUsd: number;
  neighborFineTimerSec: number;
  lastSavedAt: number;
  alerts: DynamicIslandAlert[];
}

export const LOCATIONS: LocationSpec[] = [
  {
    id: 'balcony',
    tier: 1,
    name: 'Балкон в панельке',
    subtitle: 'Тир 1 · Бытовая сеть 220В · Строгие соседи',
    gridSize: 4,
    ambientTemp: 24,
    baseMaxKw: 3.5,
    tariffPerKwh: 0.12,
    noiseLimitDb: 62,
    dustRateMultiplier: 1.0,
    rentUsdPerMin: 8,
    unlockCostUsd: 0,
  },
  {
    id: 'garage',
    tier: 2,
    name: 'Кооперативный гараж',
    subtitle: 'Тир 2 · Трехфазный ввод 380В · Высокая запыленность',
    gridSize: 5,
    ambientTemp: 18,
    baseMaxKw: 15.0,
    tariffPerKwh: 0.08,
    noiseLimitDb: 78,
    dustRateMultiplier: 1.75,
    rentUsdPerMin: 45,
    unlockCostUsd: 3200,
  },
  {
    id: 'warehouse',
    tier: 3,
    name: 'Склад в промзоне',
    subtitle: 'Тир 3 · Выделенная ТП · Промышленная вытяжка',
    gridSize: 6,
    ambientTemp: 16,
    baseMaxKw: 100.0,
    tariffPerKwh: 0.05,
    noiseLimitDb: 95,
    dustRateMultiplier: 1.15,
    rentUsdPerMin: 240,
    unlockCostUsd: 22000,
  },
  {
    id: 'siberia',
    tier: 4,
    name: 'Ангар в Сибири',
    subtitle: 'Тир 4 · Арктический воздух -15°C · Дешевая генерация',
    gridSize: 7,
    ambientTemp: -15,
    baseMaxKw: 1000.0,
    tariffPerKwh: 0.03,
    noiseLimitDb: 112,
    dustRateMultiplier: 0.55,
    rentUsdPerMin: 1100,
    unlockCostUsd: 145000,
  },
  {
    id: 'iceland',
    tier: 5,
    name: 'Геотермальная база Исландии',
    subtitle: 'Тир 5 · Чистая гидротермальная энергия · Иммерсионные залы',
    gridSize: 8,
    ambientTemp: 5,
    baseMaxKw: 10000.0,
    tariffPerKwh: 0.015,
    noiseLimitDb: 125,
    dustRateMultiplier: 0.25,
    rentUsdPerMin: 4800,
    unlockCostUsd: 950000,
  },
  {
    id: 'hydro_nuclear',
    tier: 6,
    name: 'Собственная ГЭС и АЭС',
    subtitle: 'Тир 6 · Энергетический монополист · Прямая шина 500 кВ',
    gridSize: 10,
    ambientTemp: 2,
    baseMaxKw: 100000.0,
    tariffPerKwh: 0.004,
    noiseLimitDb: 150,
    dustRateMultiplier: 0.08,
    rentUsdPerMin: 18500,
    unlockCostUsd: 7500000,
  },
];

export const EQUIPMENT_CATALOG: EquipmentSpec[] = [
  // MINERS
  {
    id: 'gtx1060_rig',
    name: 'GTX 1060 6GB Риг (x6)',
    subtitle: 'Бюджетный вход · Память Samsung · Тихий обдув',
    category: 'miner',
    baseCostUsd: 480,
    costScale: 1.18,
    baseHashrateGhs: 180,
    baseWatts: 720,
    heatFactor: 0.036,
    coolingRadius: 0,
    neighborCoolingFactor: 0,
    baseNoiseDb: 50,
    maintenanceUsdPerMin: 0,
    minTier: 1,
  },
  {
    id: 'rx580_rig',
    name: 'RX 580 8GB Nitro+ (x8)',
    subtitle: 'Прошитый BIOS · Горячий нрав · Надежная классика',
    category: 'miner',
    baseCostUsd: 1050,
    costScale: 1.20,
    baseHashrateGhs: 440,
    baseWatts: 1180,
    heatFactor: 0.039,
    coolingRadius: 0,
    neighborCoolingFactor: 0,
    baseNoiseDb: 57,
    maintenanceUsdPerMin: 0,
    minTier: 1,
  },
  {
    id: 'rtx3070_rig',
    name: 'RTX 3070 Ti Каркас (x8)',
    subtitle: 'Высокая энергоэффективность · Чувствителен к даунвольтингу',
    category: 'miner',
    baseCostUsd: 2650,
    costScale: 1.21,
    baseHashrateGhs: 1350,
    baseWatts: 1650,
    heatFactor: 0.033,
    coolingRadius: 0,
    neighborCoolingFactor: 0,
    baseNoiseDb: 55,
    maintenanceUsdPerMin: 0,
    minTier: 1,
  },
  {
    id: 'antminer_s9',
    name: 'Antminer S9i (Б/У Авито)',
    subtitle: 'Первая кровь ASIC · Воет как пылесос · Греет всю комнату',
    category: 'miner',
    baseCostUsd: 4200,
    costScale: 1.22,
    baseHashrateGhs: 14000, // 14 TH/s
    baseWatts: 1420,
    heatFactor: 0.046,
    coolingRadius: 0,
    neighborCoolingFactor: 0,
    baseNoiseDb: 76,
    maintenanceUsdPerMin: 0,
    minTier: 1,
  },
  {
    id: 'whatsminer_m30s',
    name: 'WhatsMiner M30S++',
    subtitle: 'Индустриальный рабочий конь · Требует силовой линии',
    category: 'miner',
    baseCostUsd: 14800,
    costScale: 1.23,
    baseHashrateGhs: 112000, // 112 TH/s
    baseWatts: 3472,
    heatFactor: 0.019,
    coolingRadius: 0,
    neighborCoolingFactor: 0,
    baseNoiseDb: 82,
    maintenanceUsdPerMin: 0,
    minTier: 2,
  },
  {
    id: 'antminer_s19xp',
    name: 'Antminer S19 XP Hyd',
    subtitle: '5-нм чипы BM1366 · Высокая плотность теплового потока',
    category: 'miner',
    baseCostUsd: 42000,
    costScale: 1.24,
    baseHashrateGhs: 255000, // 255 TH/s
    baseWatts: 5300,
    heatFactor: 0.014,
    coolingRadius: 0,
    neighborCoolingFactor: 0,
    baseNoiseDb: 70,
    maintenanceUsdPerMin: 0,
    minTier: 3,
  },
  {
    id: 'antminer_s21_pro',
    name: 'Antminer S21 Pro 3nm',
    subtitle: 'Флагманская энергоэффективность 15 J/TH для халвинг-эпох',
    category: 'miner',
    baseCostUsd: 125000,
    costScale: 1.25,
    baseHashrateGhs: 780000, // 780 TH/s
    baseWatts: 11700,
    heatFactor: 0.0075,
    coolingRadius: 0,
    neighborCoolingFactor: 0,
    baseNoiseDb: 79,
    maintenanceUsdPerMin: 0,
    minTier: 4,
  },
  {
    id: 'custom_1nm_rack',
    name: 'Собственный 1-нм ASIC Стеллаж',
    subtitle: 'Субнанометровая фотолитография · Требует иммерсионных ванн',
    category: 'miner',
    baseCostUsd: 580000,
    costScale: 1.26,
    baseHashrateGhs: 4500000, // 4.5 PH/s
    baseWatts: 34000,
    heatFactor: 0.0032,
    coolingRadius: 0,
    neighborCoolingFactor: 0,
    baseNoiseDb: 74,
    maintenanceUsdPerMin: 0,
    minTier: 5,
  },

  // COOLING
  {
    id: 'box_fan',
    name: 'Канальный вентилятор ВЕНТС',
    subtitle: 'Выдувает горячий воздух с клетки и 4 соседних зон',
    category: 'cooling',
    baseCostUsd: 190,
    costScale: 1.16,
    baseHashrateGhs: 0,
    baseWatts: 135,
    heatFactor: -15,
    coolingRadius: 1,
    neighborCoolingFactor: 0.48,
    baseNoiseDb: 45,
    maintenanceUsdPerMin: 0,
    minTier: 1,
  },
  {
    id: 'split_ac',
    name: 'Инверторная Сплит-система',
    subtitle: 'Активное фреоновое охлаждение квадрата 3x3 клетки',
    category: 'cooling',
    baseCostUsd: 920,
    costScale: 1.19,
    baseHashrateGhs: 0,
    baseWatts: 950,
    heatFactor: -28,
    coolingRadius: 1,
    neighborCoolingFactor: 0.65,
    baseNoiseDb: 42,
    maintenanceUsdPerMin: 2,
    minTier: 1,
  },
  {
    id: 'industrial_chiller',
    name: 'Промышленный чиллер Carrier',
    subtitle: 'Мощный гликолевый контур охлаждения в радиусе 2 клеток',
    category: 'cooling',
    baseCostUsd: 7600,
    costScale: 1.21,
    baseHashrateGhs: 0,
    baseWatts: 4200,
    heatFactor: -48,
    coolingRadius: 2,
    neighborCoolingFactor: 0.55,
    baseNoiseDb: 72,
    maintenanceUsdPerMin: 18,
    minTier: 2,
  },
  {
    id: 'immersion_bath',
    name: 'Иммерсионная ванна Novec',
    subtitle: 'Диэлектрическая жидкость снимает перегрев соседних ASIC',
    category: 'cooling',
    baseCostUsd: 26000,
    costScale: 1.22,
    baseHashrateGhs: 0,
    baseWatts: 1800,
    heatFactor: -76,
    coolingRadius: 2,
    neighborCoolingFactor: 0.72,
    baseNoiseDb: 34,
    maintenanceUsdPerMin: 55,
    minTier: 3,
  },
];

export const RND_CATALOG: RndNodeSpec[] = [
  {
    id: 'custom_bios',
    name: 'Кастомные тайминги и прошивки',
    description: 'Повышает базовый хешрейт всех GPU и ASIC без роста потребления.',
    branch: 'silicon',
    baseCostUsd: 650,
    baseCostBtc: 0.004,
    costMultiplier: 2.15,
    maxLevel: 15,
    effectLabel: '+8% к хешрейту за уровень',
  },
  {
    id: 'undervolt_llc',
    name: 'Калибровка Load-Line (LLC)',
    description: 'Повышает стабильность чипов при глубоком даунвольтинге и разгоне.',
    branch: 'silicon',
    baseCostUsd: 900,
    baseCostBtc: 0.006,
    costMultiplier: 2.25,
    maxLevel: 10,
    effectLabel: '+6% к стабильности чипов за уровень',
  },
  {
    id: 'watchdog_reboot',
    name: 'Аппаратный USB Watchdog',
    description: 'Автоматически перезапускает зависшие от переразгона фермы.',
    branch: 'silicon',
    baseCostUsd: 1800,
    baseCostBtc: 0.015,
    costMultiplier: 2.6,
    maxLevel: 5,
    effectLabel: '+20% шанс авто-ребута каждую секунду',
  },
  {
    id: 'graphene_paste',
    name: 'Фазовый переход Honeywell PTM7950',
    description: 'Снижает тепловыделение всех майнеров и замедляет деградацию пасты.',
    branch: 'thermodynamics',
    baseCostUsd: 800,
    baseCostBtc: 0.005,
    costMultiplier: 2.2,
    maxLevel: 12,
    effectLabel: '-6% нагрева оборудования за уровень',
  },
  {
    id: 'electrostatic_filters',
    name: 'Электростатические пылеуловители',
    description: 'Замедляет оседание пыли на радиаторах и износ подшипников.',
    branch: 'thermodynamics',
    baseCostUsd: 1100,
    baseCostBtc: 0.008,
    costMultiplier: 2.3,
    maxLevel: 10,
    effectLabel: '-10% скорости накопления пыли за уровень',
  },
  {
    id: 'pfc_capacitors',
    name: 'Реактивная компенсация cos(φ)',
    description: 'Снижает реальное потребление фермы из розетки при той же мощности.',
    branch: 'grid',
    baseCostUsd: 1250,
    baseCostBtc: 0.01,
    costMultiplier: 2.35,
    maxLevel: 12,
    effectLabel: '-4.5% потребления Ватт за уровень',
  },
  {
    id: 'smart_meter',
    name: 'Двухтарифная балансировка нагрузки',
    description: 'Снижает итоговый долларовый счет за электроэнергию.',
    branch: 'grid',
    baseCostUsd: 1600,
    baseCostBtc: 0.012,
    costMultiplier: 2.4,
    maxLevel: 10,
    effectLabel: '-5% от тарифа $/кВт·ч за уровень',
  },
  {
    id: 'asic_1nm_lithography',
    name: 'Собственная 1-нм EUV Литография',
    description: 'Бесконечное улучшение плотности транзисторов и квантового КПД.',
    branch: 'quant',
    baseCostUsd: 25000,
    baseCostBtc: 0.25,
    costMultiplier: 1.95,
    maxLevel: 999,
    effectLabel: '+15% к глобальному доходу майнинга за уровень',
  },
];

export function getLocationSpec(locationId: string): LocationSpec {
  return LOCATIONS.find((l) => l.id === locationId) || LOCATIONS[0];
}

export function getEquipmentSpec(specId: string): EquipmentSpec {
  return EQUIPMENT_CATALOG.find((e) => e.id === specId) || EQUIPMENT_CATALOG[0];
}

export function createEmptyGrid(size: number, ambientTemp: number): GridCell[] {
  const cells: GridCell[] = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      cells.push({
        x,
        y,
        temp: ambientTemp,
        unit: null,
      });
    }
  }
  return cells;
}

export function createInitialGameState(): GameState {
  const startLoc = LOCATIONS[0];
  const grid = createEmptyGrid(startLoc.gridSize, startLoc.ambientTemp);

  // Give player 1 starter GTX 1060 rig on cell (1,1) so the thermal grid is immediately alive
  const starterSpec = EQUIPMENT_CATALOG[0];
  const starterIdx = 1 * startLoc.gridSize + 1;
  grid[starterIdx].unit = {
    instanceId: 'starter-rig-1',
    specId: starterSpec.id,
    x: 1,
    y: 1,
    siliconQuality: 82,
    coreClock: 100,
    undervoltMv: -25,
    fanSpeed: 65,
    health: 100,
    dust: 4,
    pasteHealth: 98,
    isCrashed: false,
    isBurned: false,
    isEnabled: true,
    purchasedPriceUsd: starterSpec.baseCostUsd,
  };
  grid[starterIdx].temp = startLoc.ambientTemp + 16;

  return {
    version: 1,
    usd: 1450,
    btc: 0.0085,
    btcPriceUsd: 68400,
    btcPriceHistory: [
      66200, 66800, 66500, 67100, 67400, 67050, 67600, 67950, 67700, 68100,
      68350, 67900, 68200, 68500, 68400,
    ],
    marketPhase: 'CRAB_MARKET',
    marketPhaseTimerSec: 45,
    locationId: startLoc.id,
    unlockedLocations: [startLoc.id],
    wiringLevel: 0,
    grid,
    breakerTripped: false,
    powerCutNonPayment: false,
    unpaidBillUsd: 0,
    billTimerSec: 60,
    accumulatedKwhThisCycle: 0,
    blocksMined: 0,
    blocksUntilHalving: 24,
    halvingEpoch: 0,
    blockRewardBtc: 3.125,
    networkDifficulty: 22000,
    rndLevels: {},
    prestigeCount: 0,
    quantumMultiplier: 1.0,
    totalBtcMined: 0.0085,
    totalBillsPaidUsd: 0,
    neighborFineTimerSec: 0,
    lastSavedAt: Date.now(),
    alerts: [
      {
        id: 'welcome-island',
        type: 'info',
        title: 'Система мониторинга запущена',
        detail: 'GTX 1060 Риг активен · Следите за температурой и вводным автоматом 3.5 кВт',
        timestamp: Date.now(),
      },
    ],
  };
}

/**
 * Exponential cost calculation based on count of owned items of same specId
 */
export function calculateEquipmentCostUsd(state: GameState, specId: string): number {
  const spec = getEquipmentSpec(specId);
  const ownedCount = state.grid.filter((c) => c.unit?.specId === specId).length;
  return Math.round(spec.baseCostUsd * Math.pow(spec.costScale, ownedCount));
}

/**
 * Max kW capacity for current location + wiring upgrades
 */
export function calculateMaxPowerKw(state: GameState): number {
  const loc = getLocationSpec(state.locationId);
  // Each wiring upgrade adds +22% exponentially compounded capacity
  const multiplier = Math.pow(1.22, state.wiringLevel);
  return Number((loc.baseMaxKw * multiplier).toFixed(2));
}

export function calculateWiringUpgradeCostUsd(state: GameState): number {
  const loc = getLocationSpec(state.locationId);
  const base = Math.max(280, loc.baseMaxKw * 95);
  return Math.round(base * Math.pow(1.48, state.wiringLevel));
}

/**
 * Detailed per-unit performance metrics considering Silicon Lottery, Tuning, Thermal Throttling, Health & R&D
 */
export interface UnitTelemetry {
  effectiveHashrateGhs: number;
  rawHashrateGhs: number;
  throttlePercent: number;
  watts: number;
  stabilityPercent: number;
  noiseDb: number;
  heatGeneratedDelta: number;
}

export function calculateUnitTelemetry(
  unit: InstalledUnit,
  cellTemp: number,
  rndLevels: Record<string, number> = {},
  quantumMultiplier = 1.0
): UnitTelemetry {
  const spec = getEquipmentSpec(unit.specId);

  if (!unit.isEnabled || unit.isBurned || unit.isCrashed) {
    return {
      effectiveHashrateGhs: 0,
      rawHashrateGhs: 0,
      throttlePercent: 0,
      watts: 0,
      stabilityPercent: calculateStabilityPercent(unit, rndLevels),
      noiseDb: 0,
      heatGeneratedDelta: 0,
    };
  }

  const pfcLevel = rndLevels['pfc_capacitors'] || 0;
  const pfcMultiplier = Math.max(0.45, 1 - pfcLevel * 0.045);

  if (spec.category === 'cooling') {
    const fanFactor = unit.fanSpeed / 65;
    const watts = Math.round(spec.baseWatts * Math.pow(fanFactor, 1.35) * pfcMultiplier);
    const noiseDb = Math.round(spec.baseNoiseDb + (unit.fanSpeed - 50) * 0.28);
    const dustPenalty = 1 - Math.min(0.45, (unit.dust / 100) * 0.45);
    const heatGeneratedDelta = spec.heatFactor * fanFactor * dustPenalty;

    return {
      effectiveHashrateGhs: 0,
      rawHashrateGhs: 0,
      throttlePercent: 0,
      watts,
      stabilityPercent: 100,
      noiseDb: Math.max(25, noiseDb),
      heatGeneratedDelta,
    };
  }

  // Miner telemetry
  const clockRatio = unit.coreClock / 100;
  const siliconFactor = 0.85 + 0.15 * (unit.siliconQuality / 100);
  const biosLevel = rndLevels['custom_bios'] || 0;
  const lithoLevel = rndLevels['asic_1nm_lithography'] || 0;
  const rndHashMultiplier = (1 + biosLevel * 0.08) * (1 + lithoLevel * 0.15) * quantumMultiplier;

  const rawHashrateGhs =
    spec.baseHashrateGhs *
    Math.pow(clockRatio, 1.08) *
    siliconFactor *
    (0.4 + 0.6 * (unit.health / 100)) *
    rndHashMultiplier;

  // Thermal Throttling: T > 75°C -> -2.5% per degree above 75°C
  let throttlePercent = 0;
  if (cellTemp > 75) {
    throttlePercent = Math.min(100, (cellTemp - 75) * 2.5);
  }

  const effectiveHashrateGhs = rawHashrateGhs * (1 - throttlePercent / 100);

  // Power consumption (non-linear clock + undervolt mV)
  const clockPowerMult = clockRatio > 1 ? Math.pow(clockRatio, 2.35) : Math.pow(clockRatio, 1.65);
  const voltagePowerMult = Math.max(0.55, 1 + unit.undervoltMv / 340);
  const watts = Math.round(spec.baseWatts * clockPowerMult * voltagePowerMult * pfcMultiplier);

  // Heat generation
  const pasteLevel = rndLevels['graphene_paste'] || 0;
  const rndHeatMult = Math.max(0.4, 1 - pasteLevel * 0.06);
  const dustHeatPenalty = 1 + (unit.dust / 100) * 0.65 + ((100 - unit.pasteHealth) / 100) * 0.35;
  const fanCoolingFactor = 1.32 - 0.55 * (unit.fanSpeed / 100);
  const heatGeneratedDelta =
    watts * spec.heatFactor * dustHeatPenalty * fanCoolingFactor * rndHeatMult;

  const noiseDb = Math.round(spec.baseNoiseDb + (unit.fanSpeed - 55) * 0.36);

  return {
    effectiveHashrateGhs,
    rawHashrateGhs,
    throttlePercent: Number(throttlePercent.toFixed(1)),
    watts,
    stabilityPercent: calculateStabilityPercent(unit, rndLevels),
    noiseDb: Math.max(30, noiseDb),
    heatGeneratedDelta,
  };
}

export function calculateStabilityPercent(
  unit: InstalledUnit,
  rndLevels: Record<string, number> = {}
): number {
  const spec = getEquipmentSpec(unit.specId);
  if (spec.category === 'cooling') return 100;

  const llcLevel = rndLevels['undervolt_llc'] || 0;
  const siliconBonus = (unit.siliconQuality - 60) * 0.55; // 0 to +22

  // Overclock penalty above 100%
  const ocExcess = Math.max(0, unit.coreClock - 100);
  const ocPenalty = Math.pow(ocExcess, 1.28) * (1.15 - (unit.siliconQuality / 100) * 0.35);

  // Undervolt penalty when deeper than safe threshold
  const safeUndervoltMv = 30 + (unit.siliconQuality - 60) * 1.1 + llcLevel * 8;
  const uvDepth = Math.max(0, -unit.undervoltMv - safeUndervoltMv);
  const uvPenalty = Math.pow(uvDepth, 1.22) * 0.65;

  // Overvolt stability bonus
  const ovBonus = unit.undervoltMv > 0 ? unit.undervoltMv * 0.25 : 0;

  const rawStability = 100 + siliconBonus * 0.2 + llcLevel * 6 + ovBonus - ocPenalty - uvPenalty;
  return Math.max(5, Math.min(100, Math.round(rawStability)));
}

/**
 * Step the 2D Thermal Grid Cellular Automaton (called every 500ms)
 */
export function stepThermalGrid(
  grid: GridCell[],
  size: number,
  ambientTemp: number,
  breakerTripped: boolean,
  powerCutNonPayment: boolean,
  rndLevels: Record<string, number> = {}
): GridCell[] {
  const nextTemps = new Array<number>(grid.length).fill(ambientTemp);
  const activePower = !breakerTripped && !powerCutNonPayment;

  // First compute direct heat / cooling sources for each cell
  const sourceDeltas = new Array<number>(grid.length).fill(0);

  for (let i = 0; i < grid.length; i++) {
    const cell = grid[i];
    const unit = cell.unit;
    if (!unit || !activePower || !unit.isEnabled || unit.isBurned || unit.isCrashed) continue;

    const spec = getEquipmentSpec(unit.specId);
    const telemetry = calculateUnitTelemetry(unit, cell.temp, rndLevels);

    if (spec.category === 'miner') {
      sourceDeltas[i] += telemetry.heatGeneratedDelta;
    } else if (spec.category === 'cooling') {
      // Apply cooling to self and cells within coolingRadius
      const radius = spec.coolingRadius;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = cell.x + dx;
          const ny = cell.y + dy;
          if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
            const nIdx = ny * size + nx;
            const dist = Math.abs(dx) + Math.abs(dy);
            if (dist === 0) {
              sourceDeltas[nIdx] += telemetry.heatGeneratedDelta;
            } else {
              sourceDeltas[nIdx] +=
                telemetry.heatGeneratedDelta * Math.pow(spec.neighborCoolingFactor, dist);
            }
          }
        }
      }
    }
  }

  // Cellular automaton step: diffusion across 4 neighbors + ambient relaxation + sourceDeltas
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = y * size + x;
      const currentTemp = grid[idx].temp;

      let neighborSum = 0;
      let neighborCount = 0;
      const dirs = [
        [0, -1],
        [0, 1],
        [-1, 0],
        [1, 0],
      ];
      for (const [dx, dy] of dirs) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
          neighborSum += grid[ny * size + nx].temp;
          neighborCount++;
        }
      }

      const avgNeighbor = neighborCount > 0 ? neighborSum / neighborCount : ambientTemp;
      // Target equilibrium temperature for this cell
      const targetEquilibrium =
        ambientTemp + sourceDeltas[idx] + (avgNeighbor - ambientTemp) * 0.34;

      // Smoothly relax current temperature toward target equilibrium
      const newTemp = currentTemp + (targetEquilibrium - currentTemp) * 0.28;
      // Clamp minimum temperature to ambientTemp - 10°C (for sub-zero chillers)
      nextTemps[idx] = Number(Math.max(ambientTemp - 8, Math.min(135, newTemp)).toFixed(1));
    }
  }

  return grid.map((cell, idx) => ({
    ...cell,
    temp: nextTemps[idx],
  }));
}

export interface FarmSummary {
  totalHashrateGhs: number;
  totalWatts: number;
  totalKw: number;
  maxKw: number;
  combinedNoiseDb: number;
  maxCellTemp: number;
  avgCellTemp: number;
  activeMinersCount: number;
  throttlingMinersCount: number;
  crashedMinersCount: number;
  burnedMinersCount: number;
  btcPerSecond: number;
  usdPowerCostPerMin: number;
  usdRentAndMaintPerMin: number;
  netProfitUsdPerMin: number;
}

export function calculateFarmSummary(state: GameState): FarmSummary {
  const loc = getLocationSpec(state.locationId);
  const maxKw = calculateMaxPowerKw(state);
  const activePower = !state.breakerTripped && !state.powerCutNonPayment;

  let totalHashrateGhs = 0;
  let totalWatts = 0;
  let acousticPowerSum = 0;
  let maxCellTemp = loc.ambientTemp;
  let tempSum = 0;
  let activeMinersCount = 0;
  let throttlingMinersCount = 0;
  let crashedMinersCount = 0;
  let burnedMinersCount = 0;
  let maintenancePerMin = 0;

  for (const cell of state.grid) {
    tempSum += cell.temp;
    if (cell.temp > maxCellTemp) maxCellTemp = cell.temp;

    const unit = cell.unit;
    if (!unit) continue;

    const spec = getEquipmentSpec(unit.specId);
    if (unit.isBurned) burnedMinersCount++;
    if (unit.isCrashed) crashedMinersCount++;

    if (!activePower || !unit.isEnabled || unit.isBurned || unit.isCrashed) continue;

    const tel = calculateUnitTelemetry(unit, cell.temp, state.rndLevels, state.quantumMultiplier);
    totalHashrateGhs += tel.effectiveHashrateGhs;
    totalWatts += tel.watts;
    maintenancePerMin += spec.maintenanceUsdPerMin;

    if (tel.noiseDb > 0) {
      acousticPowerSum += Math.pow(10, tel.noiseDb / 10);
    }

    if (spec.category === 'miner') {
      activeMinersCount++;
      if (tel.throttlePercent > 0) throttlingMinersCount++;
    }
  }

  const totalKw = Number((totalWatts / 1000).toFixed(2));
  const combinedNoiseDb =
    acousticPowerSum > 0 ? Math.round(10 * Math.log10(acousticPowerSum)) : 28;
  const avgCellTemp =
    state.grid.length > 0 ? Number((tempSum / state.grid.length).toFixed(1)) : loc.ambientTemp;

  // Mining BTC/sec formula: proportional to share of network difficulty and current blockRewardBtc
  const shareOfNetwork = totalHashrateGhs / Math.max(1000, state.networkDifficulty);
  const btcPerSecond = activePower ? shareOfNetwork * (state.blockRewardBtc / 600) : 0;

  // Tariff discount from R&D
  const smartMeterLevel = state.rndLevels['smart_meter'] || 0;
  const effectiveTariff = loc.tariffPerKwh * Math.max(0.45, 1 - smartMeterLevel * 0.05);

  // 1 game minute = 1 billing cycle hour equivalent so electricity bills feel meaningful every 60s
  const usdPowerCostPerMin = totalKw * effectiveTariff * 24;
  const usdRentAndMaintPerMin = loc.rentUsdPerMin + maintenancePerMin;
  const grossRevenueUsdPerMin = btcPerSecond * 60 * state.btcPriceUsd;
  const netProfitUsdPerMin =
    grossRevenueUsdPerMin - usdPowerCostPerMin - usdRentAndMaintPerMin;

  return {
    totalHashrateGhs,
    totalWatts,
    totalKw,
    maxKw,
    combinedNoiseDb,
    maxCellTemp,
    avgCellTemp,
    activeMinersCount,
    throttlingMinersCount,
    crashedMinersCount,
    burnedMinersCount,
    btcPerSecond,
    usdPowerCostPerMin,
    usdRentAndMaintPerMin,
    netProfitUsdPerMin,
  };
}

/**
 * Step BTC/USD Market using Geometric Brownian Motion + Market Cycle Drift
 */
export function stepMarketPrice(
  currentPrice: number,
  phase: MarketPhase,
  randomNormal: number // standard normal sample ~ N(0,1)
): number {
  let drift = 0;
  let volatility = 0.008;

  if (phase === 'BULL_RUN') {
    drift = 0.0032;
    volatility = 0.011;
  } else if (phase === 'CRYPTO_WINTER') {
    drift = -0.003;
    volatility = 0.012;
  } else {
    drift = 0.0002;
    volatility = 0.0065;
  }

  const multiplier = Math.exp(drift + volatility * randomNormal);
  const nextPrice = Math.round(currentPrice * multiplier);
  return Math.max(12000, Math.min(450000, nextPrice));
}

export function formatHashrate(ghs: number): string {
  if (ghs >= 1_000_000) {
    return `${(ghs / 1_000_000).toFixed(2)} PH/s`;
  }
  if (ghs >= 1_000) {
    return `${(ghs / 1_000).toFixed(2)} TH/s`;
  }
  return `${ghs.toFixed(1)} GH/s`;
}
