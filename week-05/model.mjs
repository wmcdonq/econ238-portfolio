// All model inputs and equations used by the two Week 5 exhibits.
export const inputs = Object.freeze({
  annualLandfilledShortTons: 146100000, // EPA, 2018; not a 2026 observation.
  kgPerShortTon: 907.18474,
  densityKgM3: 688, // EPA AP-42 background report, August 1997, printed p. 2-3.
  depthM: 30, // Assumed average waste thickness, not a measured national average.
  pcIdleW: 30.25, // Dell Aurora R13 long idle, datasheet pp. 4-5.
  pcSleepW: 2.69,
  pcOffW: 0.46,
  hoursPerNight: 8, // Assumed unused time. Not a measurement of Walter's PC.
  nights: 365,
  dollarsPerKWh: 0.2443, // EIA 2024 New York residential average.
  kgCO2PerKWh: 537 * 0.45359237 / 1000 // EIA 2024 NY in-state generation average.
});

export function landfill({ years, annual = inputs.annualLandfilledShortTons,
  density = inputs.densityKgM3, depth = inputs.depthM,
  growth = 0, recycle = 0, compost = 0 } = {}) {
  if (!Number.isInteger(years) || years < 1 || !Number.isFinite(annual) || annual < 0 ||
      !Number.isFinite(density) || density <= 0 || !Number.isFinite(depth) || depth <= 0 ||
      !Number.isFinite(growth) || growth <= -1 || !Number.isFinite(recycle) ||
      !Number.isFinite(compost) || recycle < 0 || compost < 0 || recycle + compost > 1) {
    throw new RangeError('Invalid landfill input');
  }
  // Year 1 uses the baseline flow. Growth starts in year 2.
  // Diversion shares are separate parts of waste that would otherwise be landfilled.
  const factor = growth === 0 ? years : (Math.pow(1 + growth, years) - 1) / growth;
  const shortTons = annual * factor * (1 - recycle - compost);
  const volumeM3 = shortTons * inputs.kgPerShortTon / density;
  const areaKm2 = volumeM3 / depth / 1e6;
  return { years, annual, density, depth, growth, recycle, compost,
    shortTons, volumeM3, areaKm2, squareSideKm: Math.sqrt(areaKm2) };
}

export function pc({ watts, hours = inputs.hoursPerNight, nights = inputs.nights,
  price = inputs.dollarsPerKWh, grid = inputs.kgCO2PerKWh } = {}) {
  if (![watts, hours, nights, price, grid].every(n => Number.isFinite(n) && n >= 0) || hours > 24) {
    throw new RangeError('Invalid PC input');
  }
  const kWh = watts * hours * nights / 1000;
  return { watts, hours, nights, price, grid, kWh, dollars: kWh * price, kgCO2: kWh * grid };
}

export function pcSavings(options = {}) {
  const { idle = inputs.pcIdleW, sleep = inputs.pcSleepW, ...rest } = options;
  const on = pc({ watts: idle, ...rest });
  const asleep = pc({ watts: sleep, ...rest });
  return { idle, sleep, ...rest, kWh: on.kWh - asleep.kWh,
    dollars: on.dollars - asleep.dollars, kgCO2: on.kgCO2 - asleep.kgCO2 };
}
