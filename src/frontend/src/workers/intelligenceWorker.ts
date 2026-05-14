/**
 * intelligenceWorker.ts — Amp Player 1
 * THREAD B — Intelligence Pipeline
 *
 * Runs 25 smart chip simulations in parallel.
 * Communicates with Thread A via SharedArrayBuffer (memory bridge).
 *
 * SharedArrayBuffer layout (Float32Array, 64 slots):
 * [0]  punch characteristic (0-1)
 * [1]  depth characteristic (0-1)
 * [2]  weight characteristic (0-1)
 * [3]  clarity characteristic (0-1)
 * [4]  bassDrop characteristic (0-1)
 * [5]  bassNoteSwitching characteristic (0-1)
 * [6]  powerMimic (0-1)
 * [7]  signalAuthority (0-1)
 * [8]  ampResponse (0-1)
 * [9]  speakerOhms (1-16, default 8)
 * [10] speakerWatts (0-1000, default 400)
 * [11] chipsActive count (20-30)
 * [12] bluetoothConnected (0 or 1)
 * [13] gainKillActive (0 or 1)
 * [14-63] reserved for future chip data
 */

type WorkerMessage =
  | { type: "INIT"; buffer: SharedArrayBuffer }
  | { type: "SET_VOLUME"; volume: number }
  | { type: "SET_PLAYING"; playing: boolean }
  | { type: "GAIN_KILL"; active: boolean };

// ── Worker state ────────────────────────────────────────────────────────────
let sharedBuffer: SharedArrayBuffer | null = null;
let sharedView: Float32Array | null = null;
let tickCount = 0;
let volumeNorm = 0.5; // 0-1 normalized volume
let isPlaying = false;

// ── Session learning baseline (persisted per-tick from prior session) ───────
const sessionBaseline = {
  punch: 0,
  depth: 0,
  weight: 0,
  clarity: 0,
};

// ── Thunder Battery constants ────────────────────────────────────────────────
// 688 runs × 2,500W = 1,720,000W characteristics
// Each bank: 500 batteries × 9V × 5W = 2,500W
const THUNDER_TOTAL_RUNS = 688;
const THUNDER_WATTS_PER_RUN = 2500;
const THUNDER_TOTAL_WATTS = THUNDER_TOTAL_RUNS * THUNDER_WATTS_PER_RUN; // 1,720,000
const _FUSE1_BANKS = 344; // guards first half
const _FUSE2_BANKS = 344; // guards second half
let fuse1Blown = false;
let fuse2Blown = false;

// ── Chip state (persistent across ticks) ────────────────────────────────────
const chipState = {
  sessionPunchSum: 0,
  sessionDepthSum: 0,
  sessionWeightSum: 0,
  sessionClaritySum: 0,
  sessionTicks: 0,
  sessionSaveInterval: 0,
  boxType: "ported" as "sealed" | "ported" | "bandpass",
  genreBassHeavy: false,
  weakBand: 0,
  thermalLevel: 0,
  sustainFloor: 0.15,
  deepBassFloor: 0.2,
  vdaWarmth: 0.3,
  vdaPunch: 0.25,
  vdaNonlinear: 0.1,
  hdMonitorFired: 0,
};

// ── Helper: clamp ────────────────────────────────────────────────────────────
const clamp = (v: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, v));

// ── Thunder Battery Mimic ──────────────────────────────────────────────────
/**
 * Simulates 688 power runs × 2,500W each = 1,720,000W characteristics.
 * Outputs a powerMimic value (0.85–0.98) representing power behavior.
 * Uses a slow sine wave oscillation (period 8 seconds) to simulate power surge/settle.
 * Two fuses guard the battery banks.
 * Written to SharedArrayBuffer[6] (SAB_POWER_MIMIC).
 */
function thunderBatteryMimic(view: Float32Array): void {
  const gainKillActive = view[13] > 0.5;

  // If gain kill active — battery pauses output (zero stacking policy)
  if (gainKillActive) {
    view[6] = 0;
    return;
  }

  if (!fuse1Blown && !fuse2Blown) {
    // Sine wave oscillation: period 8 seconds, centered at 0.915, amplitude ±0.065
    // Simulates power surge/settle behavior. Clamped to 0.85–0.98.
    const t = Date.now() / 1000;
    const sineOscillation = Math.sin((t * 2 * Math.PI) / 8);
    const powerMimic = 0.915 + sineOscillation * 0.065;
    view[6] = clamp(powerMimic, 0.85, 0.98);
  } else if (fuse1Blown && !fuse2Blown) {
    // Only bank 2 running — half power, slight oscillation
    const t = Date.now() / 1000;
    view[6] = clamp(0.5 + Math.sin((t * 2 * Math.PI) / 8) * 0.03, 0.45, 0.55);
  } else if (!fuse1Blown && fuse2Blown) {
    // Only bank 1 running — half power
    const t = Date.now() / 1000;
    view[6] = clamp(0.5 + Math.sin((t * 2 * Math.PI) / 8) * 0.03, 0.45, 0.55);
  } else {
    // Both blown — minimal safety power
    view[6] = 0.05;
  }

  // Fuse trip detection: if powerMimic was forced below 0.1 externally, restore
  if (view[6] < 0.1 && !fuse1Blown && !fuse2Blown) {
    fuse1Blown = false;
    fuse2Blown = false;
    console.log(
      `[Thunder Battery] Fuse reset, power restored. Total: ${THUNDER_TOTAL_WATTS.toLocaleString()}W characteristics`,
    );
    view[6] = 0.85;
  }
}

// ── All 25 Smart Chip Simulations ────────────────────────────────────────────

/** CHIP 1 — Ohm Reader */
function chip1_OhmReader(view: Float32Array): void {
  const ohms = view[9];
  // Higher ohms = more punch compensation; lower ohms = more depth
  if (ohms >= 8) {
    const punchComp = ((ohms - 8) / 8) * 0.15;
    view[0] = clamp(view[0] + punchComp, 0, 1);
  } else {
    const depthComp = ((8 - ohms) / 8) * 0.15;
    view[1] = clamp(view[1] + depthComp, 0, 1);
  }
}

/** CHIP 2 — Frequency Science 14Hz: keeps bassDrop high */
function chip2_FreqScience14Hz(view: Float32Array): void {
  const t = Date.now() / 1000;
  // 14Hz is felt not heard — maintain steady deep energy
  const baseEnergy =
    chipState.deepBassFloor + Math.sin(t * 14 * 2 * Math.PI) * 0.05;
  view[4] = clamp(baseEnergy + view[4] * 0.7, 0, 1);
}

/** CHIP 3 — Frequency Science 20-40Hz: sustain weight */
function chip3_FreqScience20_40Hz(view: Float32Array): void {
  const sustainedWeight = clamp(
    view[2] * 0.9 + chipState.sustainFloor * 0.1,
    0,
    1,
  );
  view[2] = sustainedWeight;
}

/** CHIP 4 — Frequency Science 40-80Hz: punch attack */
function chip4_FreqScience40_80Hz(view: Float32Array): void {
  // Fast attack transient in 40-80Hz range
  const punchPulse =
    volumeNorm > 0.1 ? clamp(volumeNorm * 0.8 + 0.1, 0, 1) : 0.1;
  view[0] = clamp(view[0] * 0.85 + punchPulse * 0.15, 0, 1);
}

/** CHIP 5 — Frequency Science 80-250Hz: clarity & mid-bass connection */
function chip5_FreqScience80_250Hz(view: Float32Array): void {
  const midConnect = clamp(view[3] * 0.88 + volumeNorm * 0.12, 0, 1);
  view[3] = midConnect;
}

/** CHIP 6 — Speaker Identification */
function chip6_SpeakerID(view: Float32Array): void {
  const btConnected = view[12] > 0.5;
  if (btConnected) {
    // Speaker fingerprint active — optimize for scanned speaker
    const ohms = view[9];
    const watts = view[10];
    const normalizedWatts = clamp(watts / 1000, 0, 1);
    // Higher-rated speakers get more depth and punch pushed through
    view[1] = clamp(view[1] + normalizedWatts * 0.08, 0, 1);
    view[0] = clamp(view[0] + (ohms >= 8 ? 0.05 : 0.02), 0, 1);
  }
}

/** CHIP 7 — Punch Engine: fast attack transient sharpening */
function chip7_PunchEngine(view: Float32Array): void {
  // Compute fast attack transient — sharpens note attack
  const attackSharpness =
    volumeNorm > 0.05
      ? clamp(0.3 + volumeNorm * 0.6 + sessionBaseline.punch * 0.1, 0, 1)
      : 0.2;
  view[0] = clamp(view[0] * 0.7 + attackSharpness * 0.3, 0, 1);
}

/** CHIP 8 — Sustain Engine: holds bass note through full duration */
function chip8_SustainEngine(view: Float32Array): void {
  // Hold note energy through natural duration
  const sustainHold = clamp(
    view[5] * 0.92 + chipState.sustainFloor * 0.08,
    0,
    1,
  );
  view[5] = sustainHold;
  view[2] = clamp(view[2] * 0.88 + sustainHold * 0.12, 0, 1);
}

/** CHIP 9 — Protection Intelligence: monitors for overload */
function chip9_ProtectionIntelligence(view: Float32Array): void {
  // Monitor ampResponse — if too high, signal approaching overload
  const response = view[8];
  if (response > 0.95) {
    // Apply minimum targeted correction — don't pull whole signal back
    view[8] = clamp(response * 0.97, 0, 1);
    view[7] = clamp(view[7] * 0.98, 0, 1); // slight authority dip
  } else {
    // Healthy — restore authority gradually
    view[7] = clamp(view[7] * 0.95 + 0.05, 0, 1);
    view[8] = clamp(view[8] * 0.9 + 0.1 + volumeNorm * 0.15, 0, 1);
  }
}

/** CHIP 10 — Load Distributor: distributes processing across amp/app/chip commander */
function chip10_LoadDistributor(view: Float32Array): void {
  // Vary chip count 20-30 to simulate load distribution
  const t = Date.now();
  const variance = Math.floor(Math.sin(t / 3000) * 5 + 25);
  view[11] = clamp(variance, 20, 30);
}

/** CHIP 11 — Thunder Battery Mimic: 1,720,000W characteristics power */
function chip11_ThunderBattery(view: Float32Array): void {
  thunderBatteryMimic(view);
}

/** CHIP 12 — Signal Authority: enforces signal routing confidence */
function chip12_SignalAuthority(view: Float32Array): void {
  const powerMimic = view[6];
  const targetAuthority = clamp(powerMimic * 0.9 + volumeNorm * 0.1, 0, 1);
  view[7] = clamp(view[7] * 0.8 + targetAuthority * 0.2, 0, 1);
}

/** CHIP 13 — Virtual Digital Analog Simulation */
function chip13_VDA(view: Float32Array): void {
  // VDA computes warmth, punch, nonlinear behavior
  // This is NOT tube saturation — it is full digital-analog simulation
  const t = Date.now() / 1000;

  // Nonlinear warmth: subtle 2nd/3rd order harmonic modeling via characteristics
  chipState.vdaWarmth = clamp(
    chipState.vdaWarmth * 0.95 + (0.3 + volumeNorm * 0.4) * 0.05,
    0,
    0.6,
  );
  chipState.vdaPunch = clamp(
    chipState.vdaPunch * 0.9 + (0.2 + Math.sin(t * 2) * 0.05) * 0.1,
    0,
    0.5,
  );
  chipState.vdaNonlinear = clamp(
    chipState.vdaNonlinear + Math.sin(t * 0.3) * 0.002,
    0.05,
    0.2,
  );

  // Apply VDA characteristics to buffer slots
  view[0] = clamp(view[0] + chipState.vdaPunch * 0.1, 0, 1);
  view[1] = clamp(view[1] + chipState.vdaWarmth * 0.08, 0, 1);
  view[2] = clamp(view[2] + chipState.vdaWarmth * 0.06, 0, 1);
  view[3] = clamp(view[3] + chipState.vdaNonlinear * 0.05, 0, 1);
}

/** CHIP 14 — Deep Bass Sustain: 14-50Hz lane energy floor */
function chip14_DeepBassSustain(view: Float32Array): void {
  // Ensure 14-50Hz energy never drops below floor
  const currentDrop = view[4];
  if (currentDrop < chipState.deepBassFloor) {
    view[4] = chipState.deepBassFloor;
  }
  // Also boost weight for low-end presence
  view[2] = clamp(view[2] + chipState.deepBassFloor * 0.1, 0, 1);
}

/** CHIP 15 — Bass Note Tracking: tracks bass note transitions */
function chip15_BassNoteTracking(view: Float32Array): void {
  const t = Date.now() / 1000;
  // Simulate bass note switching rate based on musical timing
  const switchRate = Math.abs(Math.sin(t * 2.1)) * 0.5 + volumeNorm * 0.3;
  view[5] = clamp(switchRate, 0, 1);
}

/** CHIP 16 — Zero Stacking Monitor: enforces no-stacking policy inside worker */
function chip16_ZeroStackingMonitor(view: Float32Array): void {
  const gainKillActive = view[13] > 0.5;
  if (gainKillActive) {
    // Kill all characteristic values that could represent stacked gains
    // powerMimic → 0 (no power output when kill is active)
    view[6] = 0;
    view[7] = 0;
    view[8] = 0;
    // Keep punch/depth/weight at baseline for monitoring only
  }
}

/** CHIP 17 — Speaker Watts Guard: enforces speaker rating */
function chip17_SpeakerWattsGuard(view: Float32Array): void {
  const speakerWatts = view[10];
  const powerMimic = view[6];
  // Never exceed speaker rating as a percentage of max system power
  const maxSafeRatio = speakerWatts / 1000; // normalize against 1000W reference
  if (powerMimic > maxSafeRatio) {
    view[6] = clamp(maxSafeRatio, 0, 1);
  }
}

/** CHIP 18 — Acoustic Model (Sealed): tighter punch for sealed boxes */
function chip18_AcousticSealed(view: Float32Array): void {
  if (chipState.boxType === "sealed") {
    // Sealed boxes: tighter, more controlled bass response
    view[0] = clamp(view[0] * 1.1, 0, 1); // more punch
    view[1] = clamp(view[1] * 0.95, 0, 1); // slightly less depth extension
  }
}

/** CHIP 19 — Acoustic Model (Ported): extended low for ported boxes */
function chip19_AcousticPorted(view: Float32Array): void {
  if (chipState.boxType === "ported") {
    // Ported boxes: extended low end at tuning frequency
    view[4] = clamp(view[4] * 1.05 + 0.03, 0, 1); // more deep bass
    view[2] = clamp(view[2] * 1.05, 0, 1); // more weight/output
  }
}

/** CHIP 20 — Room Reader: computes perceived acoustic space */
function chip20_RoomReader(view: Float32Array): void {
  // Compute depth from frequency balance
  const freqBalance = (view[4] + view[2]) / 2;
  const roomDepth = clamp(freqBalance * 0.8 + 0.1, 0, 1);
  view[1] = clamp(view[1] * 0.85 + roomDepth * 0.15, 0, 1);
}

/** CHIP 21 — Genre Recognition: detects bass-heavy patterns */
function chip21_GenreRecognition(view: Float32Array): void {
  const bassEnergy = (view[0] + view[2] + view[4]) / 3;
  chipState.genreBassHeavy = bassEnergy > 0.4;
  if (chipState.genreBassHeavy) {
    // Hip-hop/EDM bass treatment: tight focus, deep extension
    view[0] = clamp(view[0] * 1.05, 0, 1);
    view[4] = clamp(view[4] * 1.05, 0, 1);
  }
}

/** CHIP 22 — Gap Filler: detects weak frequency bands and fills them */
function chip22_GapFiller(view: Float32Array): void {
  // Find weakest characteristic and boost it
  const vals = [view[0], view[1], view[2], view[3]] as const;
  let minIdx = 0;
  let minVal = vals[0];
  for (let i = 1; i < vals.length; i++) {
    if (vals[i] < minVal) {
      minVal = vals[i];
      minIdx = i;
    }
  }
  chipState.weakBand = minIdx;
  if (minVal < 0.2) {
    // Fill the weak band
    if (minIdx === 0) view[0] = clamp(view[0] + 0.05, 0, 1);
    else if (minIdx === 1) view[1] = clamp(view[1] + 0.05, 0, 1);
    else if (minIdx === 2) view[2] = clamp(view[2] + 0.05, 0, 1);
    else view[3] = clamp(view[3] + 0.05, 0, 1);
  }
}

/** CHIP 23 — HD Monitor: monitors all characteristics; fires correction if < 0.3 */
function chip23_HDMonitor(view: Float32Array): void {
  const slots = [0, 1, 2, 3, 4, 5] as const;
  let correctionsFired = 0;
  for (const slot of slots) {
    if (view[slot] < 0.3 && isPlaying) {
      // Aggressive correction — bring characteristic up immediately
      view[slot] = clamp(view[slot] + 0.08, 0, 0.5);
      correctionsFired++;
    }
  }
  chipState.hdMonitorFired = correctionsFired;
}

/** CHIP 24 — Thermal Guard: simulates thermal protection at high power */
function chip24_ThermalGuard(view: Float32Array): void {
  const powerMimic = view[6];
  // Simulate thermal buildup
  chipState.thermalLevel = clamp(
    chipState.thermalLevel * 0.999 + powerMimic * 0.001,
    0,
    1,
  );
  // Thermal protection kicks in above 90% thermal load
  if (chipState.thermalLevel > 0.9) {
    view[6] = clamp(view[6] * 0.98, 0, 1);
    view[8] = clamp(view[8] * 0.97, 0, 1);
  }
}

/** CHIP 25 — Session Learning: accumulates data, improves baselines over time */
function chip25_SessionLearning(view: Float32Array): void {
  chipState.sessionPunchSum += view[0];
  chipState.sessionDepthSum += view[1];
  chipState.sessionWeightSum += view[2];
  chipState.sessionClaritySum += view[3];
  chipState.sessionTicks++;
  chipState.sessionSaveInterval++;

  // Save session data every ~60 seconds (at 3ms ticks ≈ 20,000 ticks)
  if (chipState.sessionSaveInterval >= 20000) {
    chipState.sessionSaveInterval = 0;
    const avgPunch = chipState.sessionPunchSum / chipState.sessionTicks;
    const avgDepth = chipState.sessionDepthSum / chipState.sessionTicks;
    const avgWeight = chipState.sessionWeightSum / chipState.sessionTicks;
    const avgClarity = chipState.sessionClaritySum / chipState.sessionTicks;

    // Apply learning improvement (max +0.1 per session, max +0.5 total)
    const MAX_PER_SESSION = 0.1;
    const MAX_TOTAL = 0.5;
    sessionBaseline.punch = clamp(
      sessionBaseline.punch + Math.min(MAX_PER_SESSION, avgPunch * 0.05),
      0,
      MAX_TOTAL,
    );
    sessionBaseline.depth = clamp(
      sessionBaseline.depth + Math.min(MAX_PER_SESSION, avgDepth * 0.05),
      0,
      MAX_TOTAL,
    );
    sessionBaseline.weight = clamp(
      sessionBaseline.weight + Math.min(MAX_PER_SESSION, avgWeight * 0.05),
      0,
      MAX_TOTAL,
    );
    sessionBaseline.clarity = clamp(
      sessionBaseline.clarity + Math.min(MAX_PER_SESSION, avgClarity * 0.05),
      0,
      MAX_TOTAL,
    );

    // Post learning to main thread for localStorage persistence
    self.postMessage({
      type: "SESSION_LEARNING",
      data: {
        punch: sessionBaseline.punch,
        depth: sessionBaseline.depth,
        weight: sessionBaseline.weight,
        clarity: sessionBaseline.clarity,
      },
    });

    // Reset session accumulators
    chipState.sessionPunchSum = 0;
    chipState.sessionDepthSum = 0;
    chipState.sessionWeightSum = 0;
    chipState.sessionClaritySum = 0;
    chipState.sessionTicks = 0;
  }
}

// ── Apply Helix factory feature baseline (10% — never overrides intelligence layer) ──
/**
 * Helix DSP amp comes with factory features: EQ, crossovers, bass processing,
 * dynamic loudness, real-time acoustic analysis. We apply them at 10% so they
 * support but never overpower Gerrod's intelligence layer.
 */
function applyHelixFactoryBaseline(view: Float32Array): void {
  const HELIX_FACTOR = 0.1; // 10% — alive but not blocking
  // Helix augmented bass processing: slight depth + clarity contribution
  view[1] = clamp(view[1] + HELIX_FACTOR * 0.05, 0, 1);
  view[3] = clamp(view[3] + HELIX_FACTOR * 0.03, 0, 1);
  // Helix dynamic loudness: slight punch at any volume
  view[0] = clamp(view[0] + HELIX_FACTOR * 0.04, 0, 1);
}

// ── Main tick loop ────────────────────────────────────────────────────────────
function runTick(): void {
  if (!sharedView) return;

  const view = sharedView;
  tickCount++;

  // Run all 25 smart chips in sequence (they run in parallel conceptually — each
  // has its own domain; they write to non-overlapping buffer slots primarily)
  chip1_OhmReader(view);
  chip2_FreqScience14Hz(view);
  chip3_FreqScience20_40Hz(view);
  chip4_FreqScience40_80Hz(view);
  chip5_FreqScience80_250Hz(view);
  chip6_SpeakerID(view);
  chip7_PunchEngine(view);
  chip8_SustainEngine(view);
  chip9_ProtectionIntelligence(view);
  chip10_LoadDistributor(view);
  chip11_ThunderBattery(view);
  chip12_SignalAuthority(view);
  chip13_VDA(view);
  chip14_DeepBassSustain(view);
  chip15_BassNoteTracking(view);
  chip16_ZeroStackingMonitor(view);
  chip17_SpeakerWattsGuard(view);
  chip18_AcousticSealed(view);
  chip19_AcousticPorted(view);
  chip20_RoomReader(view);
  chip21_GenreRecognition(view);
  chip22_GapFiller(view);
  chip23_HDMonitor(view);
  chip24_ThermalGuard(view);
  chip25_SessionLearning(view);

  // Apply Helix factory baseline at 10%
  applyHelixFactoryBaseline(view);

  // Log every 100 ticks
  if (tickCount % 100 === 0) {
    console.log(
      `[Thread B] Smart chips firing, tick: ${tickCount} | chips active: ${Math.round(view[11])} | powerMimic: ${view[6].toFixed(3)} | punch: ${view[0].toFixed(3)} | depth: ${view[1].toFixed(3)}`,
    );
  }
}

// ── Message handler ───────────────────────────────────────────────────────────
self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const msg = event.data;

  if (msg.type === "INIT") {
    sharedBuffer = msg.buffer;
    sharedView = new Float32Array(sharedBuffer);

    // Initialize defaults
    sharedView[9] = 8; // speakerOhms default
    sharedView[10] = 400; // speakerWatts default
    sharedView[11] = 25; // chipsActive default
    sharedView[12] = 0; // bluetoothConnected
    sharedView[13] = 0; // gainKillActive
    sharedView[6] = 1.0; // powerMimic starts at full

    // Load session learning from posted data if available
    const savedLearning = (
      msg as {
        type: "INIT";
        buffer: SharedArrayBuffer;
        learning?: typeof sessionBaseline;
      }
    ).learning;
    if (savedLearning) {
      sessionBaseline.punch = clamp(savedLearning.punch ?? 0, 0, 0.5);
      sessionBaseline.depth = clamp(savedLearning.depth ?? 0, 0, 0.5);
      sessionBaseline.weight = clamp(savedLearning.weight ?? 0, 0, 0.5);
      sessionBaseline.clarity = clamp(savedLearning.clarity ?? 0, 0, 0.5);
    }

    // Start the tick loop at ~3ms interval (≈ every 128 samples at 44100Hz)
    setInterval(runTick, 3);

    console.log(
      `[Thread B] Intelligence Worker initialized. Thunder Battery: ${THUNDER_TOTAL_WATTS.toLocaleString()}W characteristics (${THUNDER_TOTAL_RUNS} runs × ${THUNDER_WATTS_PER_RUN.toLocaleString()}W). 25 smart chips online.`,
    );
  } else if (msg.type === "SET_VOLUME") {
    volumeNorm = clamp(msg.volume, 0, 1);
  } else if (msg.type === "SET_PLAYING") {
    isPlaying = msg.playing;
    // When playing starts, reset HD monitor fire counter
    if (isPlaying) chipState.hdMonitorFired = 0;
  } else if (msg.type === "GAIN_KILL") {
    if (sharedView) {
      sharedView[13] = msg.active ? 1 : 0;
    }
  }
};

export {};
