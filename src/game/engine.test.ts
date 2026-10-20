import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialGameState,
  calculateEquipmentCostUsd,
  calculateMaxPowerKw,
  calculateUnitTelemetry,
  calculateStabilityPercent,
  stepThermalGrid,
  calculateFarmSummary,
  stepMarketPrice,
  formatHashrate,
} from './engine.ts';

test('exponential cost scaling increases price with each installed unit', () => {
  const state = createInitialGameState();
  // Starter state already has 1 gtx1060_rig
  const costWithOne = calculateEquipmentCostUsd(state, 'gtx1060_rig');
  assert.ok(costWithOne > 480, 'Second rig should cost more than base 480 USD');

  // Install a second rig
  state.grid[0].unit = {
    ...state.grid[5].unit!,
    instanceId: 'rig-2',
    x: 0,
    y: 0,
  };
  const costWithTwo = calculateEquipmentCostUsd(state, 'gtx1060_rig');
  assert.ok(costWithTwo > costWithOne, 'Third rig should scale exponentially');
});

test('thermal throttling reduces effective hashrate by 2.5% per degree above 75C', () => {
  const state = createInitialGameState();
  const unit = state.grid[5].unit!;

  const coolTel = calculateUnitTelemetry(unit, 65, {});
  assert.equal(coolTel.throttlePercent, 0);
  assert.equal(coolTel.effectiveHashrateGhs, coolTel.rawHashrateGhs);

  // At 85°C (10 degrees above 75°C), throttle should be 25%
  const hotTel = calculateUnitTelemetry(unit, 85, {});
  assert.equal(hotTel.throttlePercent, 25);
  assert.ok(
    Math.abs(hotTel.effectiveHashrateGhs - hotTel.rawHashrateGhs * 0.75) < 0.01,
    'Effective hashrate at 85C should be 75% of raw hashrate'
  );
});

test('undervolting reduces power consumption and extreme undervolt reduces stability', () => {
  const state = createInitialGameState();
  const baseUnit = { ...state.grid[5].unit!, undervoltMv: 0, coreClock: 100 };
  const undervoltedUnit = { ...baseUnit, undervoltMv: -80 };
  const extremeUndervoltUnit = { ...baseUnit, undervoltMv: -145, coreClock: 125 };

  const baseTel = calculateUnitTelemetry(baseUnit, 60, {});
  const uvTel = calculateUnitTelemetry(undervoltedUnit, 60, {});

  assert.ok(uvTel.watts < baseTel.watts, 'Undervolting must reduce watts consumed');
  assert.equal(uvTel.rawHashrateGhs, baseTel.rawHashrateGhs, 'Undervolting preserves raw hashrate');

  const extremeStability = calculateStabilityPercent(extremeUndervoltUnit, {});
  assert.ok(extremeStability < 60, 'Extreme overclock + undervolt must drop stability');
});

test('2D thermal grid cellular automaton heats active miner cells and diffuses to neighbors', () => {
  const state = createInitialGameState();
  // Reset all cell temperatures to ambient 24C
  const grid0 = state.grid.map((c) => ({ ...c, temp: 24 }));
  const grid1 = stepThermalGrid(grid0, 4, 24, false, false, {});
  const grid2 = stepThermalGrid(grid1, 4, 24, false, false, {});

  // Miner is at (1,1) -> index 5
  assert.ok(grid2[5].temp > 24, 'Miner cell (1,1) should heat up above ambient');
  // Neighbor (1,0) -> index 1 should also warm up via heat diffusion
  assert.ok(grid2[1].temp > 24, 'Neighbor cell (1,0) should warm up via thermal diffusion');
});

test('farm summary calculates positive BTC generation and accurate kW load', () => {
  const state = createInitialGameState();
  const summary = calculateFarmSummary(state);

  assert.ok(summary.totalHashrateGhs > 0, 'Starter farm has positive hashrate');
  assert.ok(summary.totalKw > 0 && summary.totalKw < summary.maxKw, 'Starter farm is within kW limit');
  assert.ok(summary.btcPerSecond > 0, 'Starter farm mines BTC');

  const maxKwLvl0 = calculateMaxPowerKw(state);
  state.wiringLevel = 2;
  const maxKwLvl2 = calculateMaxPowerKw(state);
  assert.ok(maxKwLvl2 > maxKwLvl0, 'Upgrading wiring increases max kW limit');
});

test('market price simulation respects bounds and formatting works', () => {
  const bullPrice = stepMarketPrice(68000, 'BULL_RUN', 0.5);
  assert.ok(bullPrice > 68000, 'Positive normal shock in BULL_RUN raises BTC price');
  assert.equal(formatHashrate(14000), '14.00 TH/s');
  assert.equal(formatHashrate(2500000), '2.50 PH/s');
});
