const defaults = {
  units: {
    millimetresPerWorldUnit: 1000,
  },
  airSpring: {
    outerDiameterMm: 300,
    innerDiameterMm: 120,
    heightMm: 260,
  },
  turntable: {
    diameterMm: 500,
    heightMm: 70,
    speedRpm: 2,
  },
  cameras: {
    count: 2,
    travelMm: 450,
    verticalSpeedMmPerSecond: 20,
    standOffsetMm: 390,
    lowerLimitMm: 95,
  },
  inspection: {
    captureAngleStepDegrees: 30,
  },
};

export const DEFAULT_AIR_SPRING_TESTER_CONFIG = Object.freeze({
  units: Object.freeze({ ...defaults.units }),
  airSpring: Object.freeze({ ...defaults.airSpring }),
  turntable: Object.freeze({ ...defaults.turntable }),
  cameras: Object.freeze({ ...defaults.cameras }),
  inspection: Object.freeze({ ...defaults.inspection }),
});

function finiteNumber(value, fallback, path, warn, { allowNegative = false } = {}) {
  const valid = Number.isFinite(value)
    && (allowNegative ? true : value >= 0);

  if (valid) return value;
  if (value !== undefined) warn(`Invalid ${path}; using ${fallback}.`);
  return fallback;
}

function positiveNumber(value, fallback, path, warn) {
  const normalized = finiteNumber(value, fallback, path, warn);
  if (normalized > 0) return normalized;
  if (value !== undefined && Number.isFinite(value)) {
    warn(`Invalid ${path}; using ${fallback}.`);
  }
  return fallback;
}

export function createAirSpringTesterConfig(input = {}, warn = console.warn) {
  const source = input && typeof input === 'object' ? input : {};
  const units = source.units ?? {};
  const spring = source.airSpring ?? {};
  const turntable = source.turntable ?? {};
  const cameras = source.cameras ?? {};
  const inspection = source.inspection ?? {};

  const config = {
    units: {
      millimetresPerWorldUnit: positiveNumber(
        units.millimetresPerWorldUnit,
        defaults.units.millimetresPerWorldUnit,
        'units.millimetresPerWorldUnit',
        warn,
      ),
    },
    airSpring: {
      outerDiameterMm: positiveNumber(
        spring.outerDiameterMm,
        defaults.airSpring.outerDiameterMm,
        'airSpring.outerDiameterMm',
        warn,
      ),
      innerDiameterMm: positiveNumber(
        spring.innerDiameterMm,
        defaults.airSpring.innerDiameterMm,
        'airSpring.innerDiameterMm',
        warn,
      ),
      heightMm: positiveNumber(
        spring.heightMm,
        defaults.airSpring.heightMm,
        'airSpring.heightMm',
        warn,
      ),
    },
    turntable: {
      diameterMm: positiveNumber(
        turntable.diameterMm,
        defaults.turntable.diameterMm,
        'turntable.diameterMm',
        warn,
      ),
      heightMm: positiveNumber(
        turntable.heightMm,
        defaults.turntable.heightMm,
        'turntable.heightMm',
        warn,
      ),
      speedRpm: finiteNumber(
        turntable.speedRpm,
        defaults.turntable.speedRpm,
        'turntable.speedRpm',
        warn,
        { allowNegative: true },
      ),
    },
    cameras: {
      count: cameras.count === undefined ? 2 : cameras.count,
      travelMm: positiveNumber(
        cameras.travelMm,
        defaults.cameras.travelMm,
        'cameras.travelMm',
        warn,
      ),
      verticalSpeedMmPerSecond: finiteNumber(
        cameras.verticalSpeedMmPerSecond,
        defaults.cameras.verticalSpeedMmPerSecond,
        'cameras.verticalSpeedMmPerSecond',
        warn,
      ),
      standOffsetMm: positiveNumber(
        cameras.standOffsetMm,
        defaults.cameras.standOffsetMm,
        'cameras.standOffsetMm',
        warn,
      ),
      lowerLimitMm: finiteNumber(
        cameras.lowerLimitMm,
        defaults.cameras.lowerLimitMm,
        'cameras.lowerLimitMm',
        warn,
      ),
    },
    inspection: {
      captureAngleStepDegrees: positiveNumber(
        inspection.captureAngleStepDegrees,
        defaults.inspection.captureAngleStepDegrees,
        'inspection.captureAngleStepDegrees',
        warn,
      ),
    },
    onCapture: typeof source.onCapture === 'function' ? source.onCapture : null,
    onInspection: typeof source.onInspection === 'function' ? source.onInspection : null,
  };

  if (config.airSpring.innerDiameterMm >= config.airSpring.outerDiameterMm) {
    warn(`Invalid airSpring.innerDiameterMm; using ${defaults.airSpring.innerDiameterMm}.`);
    config.airSpring.innerDiameterMm = defaults.airSpring.innerDiameterMm;
  }

  if (config.turntable.diameterMm < config.airSpring.outerDiameterMm) {
    warn(`Invalid turntable.diameterMm; using ${defaults.turntable.diameterMm}.`);
    config.turntable.diameterMm = Math.max(
      defaults.turntable.diameterMm,
      config.airSpring.outerDiameterMm * 1.2,
    );
  }

  if (config.cameras.count !== 2) {
    warn('Invalid cameras.count; this machine uses 2.');
    config.cameras.count = 2;
  }

  return config;
}

export function mmToWorld(mm, config) {
  return mm / config.units.millimetresPerWorldUnit;
}
