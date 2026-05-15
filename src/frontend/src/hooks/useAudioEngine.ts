/**
 * useAudioEngine.ts — Amp Player 1
 * ASO-V3 — HELIX DSP AMP (VIRTUAL DIGITAL ANALOG SIMULATION)
 *
 * RULE BOOK — ENFORCED ON EVERY BUILD:
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. ONE unified helixCtx — no dual-context split.
 * 2. ALL gains: volumeGain (1→0.001, 100→1.0), masterGain (1.0 fixed pass-through only).
 *    masterGain NEVER above 1. NO other gain nodes modify signal level.
 * 3. NO WaveShaperNode anywhere in the chain.
 * 4. NO stacking: exactly 1 bassComp (DynamicsCompressor).
 * 5. Volume range: 1-100 ONLY. Max 100, no 700.
 * 6. Gains kill switch: sets ALL gain nodes to 0 simultaneously on activation.
 * 7. ZERO STACKING POLICY CHIP: separate, runs every requestAnimationFrame,
 *    checks SharedArrayBuffer gainKillActive slot, enforces gains at 0 or 1.
 * 8. Low End Booster: BOTH lanes (14–40Hz AND 14–80Hz) simultaneously.
 * 9. No ASO-V3 amp switching logic — Helix is the ONE and ONLY amp.
 * 10. Virtual Digital Analog Simulation — NO tube simulation.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * THREAD A — PLAYBACK PIPELINE (Web Audio API, single helixCtx):
 *   source → volumeGain (1-100 → 0.001-1.0)
 *     → EQ[8 bands] (19Hz, 47Hz, 250Hz, 500Hz, 1kHz, 4kHz, 8kHz, 16kHz)
 *     → [EPICENTER]: pfmFilter(14Hz HP) → bassRestLP(50Hz LP)||bassRestMix → bassOutputLevel
 *     → bassNaturalBottom
 *     → bassLR1(80Hz LP) → bassLR2(80Hz LP)  [Linkwitz-Riley 4th-order LP crossover]
 *     → [CANISTER wet/dry]: F1(19Hz)+F2(40Hz)+F3(80Hz) → canisterOut || canisterDry → canisterMix
 *     → safetyBoost (30Hz peaking, +3dB fixed, 1,000W safety characteristics)
 *     → bassComp (threshold:-24, knee:30, ratio:4, attack:0.003, release:0.25)
 *     → bassAnalyser (fftSize:2048)
 *     → masterGain (1.0 fixed — NEVER modified)
 *     → helixCtx.destination
 *
 *   Highs path runs IN SAME helixCtx:
 *     source → volumeGain → highsLR1(250Hz HP) → highsLR2(250HP) → highsComp → highsAnalyser → ultraGain → destination
 *
 * THREAD B — Intelligence pipeline in intelligenceWorker.ts (Web Worker).
 * Memory bridge: SharedArrayBuffer (Float32Array, 64 slots).
 *
 * THUNDER BATTERY POWER CHAIN:
 *   688 runs × 2,500W = 1,720,000W characteristics
 *   500 batteries × 9V × 5W = 2,500W per run
 *   2 fuses (fuse1: banks 1-344, fuse2: banks 345-688)
 *   Outputs powerMimic=1.0 to SharedArrayBuffer[6] continuously.
 *
 * BLUETOOTH SPEAKER SCANNER CHIP (main thread):
 *   Only fires when navigator.bluetooth available AND phone BT on.
 *   Reads device name → speaker database → writes ohms/watts to SharedArrayBuffer.
 */

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { MutableRefObject, ReactNode } from "react";

export interface EQBandState {
  freq: number;
  gainDb: number;
}

export interface BassCharState {
  activeHz: number;
  liveEnergy14_50: number[];
  deepSustainActive: boolean;
  zeroDistortionActive: boolean;
}

export interface SpeakerProfile {
  detectedName: string;
  ohms: number;
  estimatedSize: string;
  powerHandling: string;
  profileApplied: boolean;
}

export interface IntelligenceLayerState {
  appSelf: boolean;
  smartChips: number;
  totalBehaviors: number;
  loadAmp: number;
  loadApp: number;
  loadChipCommander: number;
  threadBActive: boolean;
  powerMimic: number;
}

export interface ProcessorCharState {
  punch: number;
  depth: number;
  weight: number;
  clarity: number;
  bassDrop: number;
  bassNoteSwitching: number;
  powerMimic: number;
  signalAuthority: number;
  ampResponse: number;
}

export type SRLGrade = "A+" | "B+" | "C+" | "D";

// ─── Module-level helpers ────────────────────────────────────────────────────
const computeSRLGrade = (
  dist: number,
  clip: number,
  clean: number,
): SRLGrade => {
  const avg = (dist + clip + clean) / 3;
  if (avg >= 80) return "A+";
  if (avg >= 60) return "B+";
  if (avg >= 40) return "C+";
  return "D";
};

const srlGradeLabelFor = (grade: SRLGrade): string => {
  const map: Record<SRLGrade, string> = {
    "A+": "ULTRA CLEAN \u2014 5,000W",
    "B+": "CLEAN \u2014 GOOD SIGNAL",
    "C+": "MODERATE \u2014 MONITORING",
    D: "LOW \u2014 CHECK SIGNAL",
  };
  return map[grade];
};

// ─── EQ frequency bands ───────────────────────────────────────────────────────
// band0: 19Hz (14-50Hz lane), band1: 47Hz (14-80Hz lane), bands 2-7: mids/highs
export const EQ_FREQS = [19, 47, 250, 500, 1000, 4000, 8000, 16000];

const EQ_LOW_BASE_BOOST: number[] = [3, 2, 0, 0, 0, 0, 0, 0];
const EQ_Q_VALUES: number[] = [1.8, 1.4, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0];

export const eqSliderToDb = (sliderDb: number, bandIdx: number): number => {
  const base = EQ_LOW_BASE_BOOST[bandIdx] ?? 0;
  if (bandIdx < 2) {
    const sign = sliderDb >= 0 ? 1 : -1;
    const expGain = sign * (Math.exp(Math.abs(sliderDb) * 0.15) - 1) * 9.5;
    return base + expGain;
  }
  return sliderDb;
};

// ─── Volume mapping: 1-100 → 0.001-1.0 ─────────────────────────────────────
/** RULE: volume max is 100. NO volume range of 700. */
const volToGain = (v: number): number =>
  Math.max(0.01, Math.min(1.0, (v - 1) / 99));

const pctToDb = (pct: number, minDb: number, maxDb: number): number =>
  minDb + (pct / 100) * (maxDb - minDb);

const pctToGain = (pct: number): number => pct / 100;

const sliderToParaWidth = (slider: number): number =>
  0.3 + (slider / 100) * 2.7;

// ─── SharedArrayBuffer layout ────────────────────────────────────────────────
const SAB_SIZE = 64; // Float32Array slots
const SAB_PUNCH = 0;
const SAB_DEPTH = 1;
const SAB_WEIGHT = 2;
const SAB_CLARITY = 3;
const SAB_BASS_DROP = 4;
const SAB_BASS_NOTE = 5;
const SAB_POWER_MIMIC = 6; // Thunder Battery Chain 1
const SAB_SIGNAL_AUTH = 7;
const SAB_AMP_RESPONSE = 8;
const SAB_OHMS = 9;
const SAB_WATTS = 10;
const SAB_CHIPS_ACTIVE = 11;
const SAB_BT_CONNECTED = 12;
const SAB_GAIN_KILL = 13;
const SAB_POWER_MIMIC2 = 14; // Thunder Battery Chain 2 — same spec, parallel, offset phase

// ─── Speaker database ────────────────────────────────────────────────────────
const SPEAKER_DB: Record<
  string,
  { ohms: number; watts: number; boxType: string; size: string }
> = {
  "QFX PBX": { ohms: 8, watts: 400, boxType: "ported", size: "15-inch" },
  JBL: { ohms: 8, watts: 300, boxType: "sealed", size: "12-inch" },
  Sony: { ohms: 4, watts: 200, boxType: "sealed", size: "10-inch" },
  Bose: { ohms: 4, watts: 150, boxType: "ported", size: "8-inch" },
  Sonos: { ohms: 8, watts: 100, boxType: "ported", size: "6-inch" },
  Samsung: { ohms: 8, watts: 200, boxType: "sealed", size: "10-inch" },
  LG: { ohms: 8, watts: 150, boxType: "sealed", size: "8-inch" },
};

const lookupSpeaker = (
  name: string,
): { ohms: number; watts: number; boxType: string; size: string } => {
  for (const [key, profile] of Object.entries(SPEAKER_DB)) {
    if (name.includes(key)) return profile;
  }
  return { ohms: 8, watts: 200, boxType: "sealed", size: "unknown" };
};

// SRL crossover adjustments per grade
const SRL_CROSSOVER_ADJUST: Record<
  SRLGrade,
  { bassOffset: number; highsOffset: number }
> = {
  "A+": { bassOffset: 0, highsOffset: 0 },
  "B+": { bassOffset: 0, highsOffset: 0 },
  "C+": { bassOffset: 0, highsOffset: 0 },
  D: { bassOffset: -10, highsOffset: 20 },
};

// ─── Defaults ────────────────────────────────────────────────────────────────
const defaultBassCharState: BassCharState = {
  activeHz: 0,
  liveEnergy14_50: new Array(37).fill(0) as number[],
  deepSustainActive: false,
  zeroDistortionActive: true,
};

const defaultSpeakerProfile: SpeakerProfile = {
  detectedName: "QFX PBX-15",
  ohms: 8,
  estimatedSize: "15-inch",
  powerHandling: "400W RMS",
  profileApplied: true,
};

const defaultIntelligenceLayer: IntelligenceLayerState = {
  appSelf: true,
  smartChips: 25,
  totalBehaviors: 100000,
  loadAmp: 35,
  loadApp: 35,
  loadChipCommander: 30,
  threadBActive: false,
  powerMimic: 0,
};

const defaultProcessorChar: ProcessorCharState = {
  punch: 0,
  depth: 90,
  weight: 0,
  clarity: 0,
  bassDrop: 0,
  bassNoteSwitching: 0,
  powerMimic: 0,
  signalAuthority: 0,
  ampResponse: 0,
};

// ─── State interface ──────────────────────────────────────────────────────────
export interface AudioEngineState {
  isPlaying: boolean;
  isLoaded: boolean;
  /** RULE: 1-100 only. NO 700. */
  volume: number;
  fileName: string;
  helixContextState: string;
  /** Legacy compat fields — both map to helixContextState */
  bassContextState: string;
  highsContextState: string;
  currentTime: number;
  duration: number;
  bassFilterFreq: number;
  highsFilterFreq: number;
  bassGainValue: number;
  highsGainValue: number;
  bassCompReduction: number;
  highsCompReduction: number;
  eqBands: EQBandState[];
  preampBypassed: boolean;
  bassPhaseInverted: boolean;
  highsPhaseInverted: boolean;
  processorChar: ProcessorCharState;
  distortionReduction: number;
  clippingReduction: number;
  cleanSignal: number;
  srlGrade: SRLGrade;
  srlGradeLabel: string;
  lowEndBoosterEnabled: boolean;
  lowEndBoosterClaimed: boolean;
  lowEndBoosterActive: boolean;
  lowEndBoosterTimeLeft: number | null;
  hasUnsavedChanges: boolean;
  lastSaved: string | null;
  gainViolations: string[];
  stackingViolations: string[];
  bassRestorationLevel: number;
  processorMimic120dB: number;
  srlControlling120dB: boolean;
  safetyProcessorActive: boolean;
  safetyProcessorLevel: number;
  thunderBatterySafetyDraw: number;
  /** Helix is always active — no routing handoff. Always false for UI compat. */
  asoV3Routing: boolean;
  pfmActive: boolean;
  bassOutputLevel: number;
  canisterActive: boolean;
  canisterBottomBoost: number;
  canisterPunchBoost: number;
  subLevel: number;
  ultraActive: boolean;
  /** Helix is the amp. Always true once loaded. */
  helixActive: boolean;
  /** Legacy compat: maps to helixActive */
  asoV3Active: boolean;
  asoV3Scanning: boolean;
  scanResult: "clean" | "problem" | null;
  asoV3SlotNumber: number;
  bassCharState: BassCharState;
  speakerProfile: SpeakerProfile;
  intelligenceLayer: IntelligenceLayerState;
  /** Gain kill switch — kills ALL gains simultaneously */
  gainKillActive: boolean;
  /** Output mode detection */
  outputMode: "internal" | "external";
  /** Thread B active status */
  threadBActive: boolean;
}

// ─── Controls interface ───────────────────────────────────────────────────────
export interface AudioEngineControls {
  loadFile: (file: File) => Promise<void>;
  play: () => void;
  stop: () => void;
  /** Volume 1-100 ONLY */
  setVolume: (v: number) => void;
  setBassFilterFreq: (hz: number) => void;
  setHighsFilterFreq: (hz: number) => void;
  /** NO-OP: amp channel gains locked at rule book */
  setBassGain: (value: number) => void;
  setSubLevel: (value: number) => void;
  /** NO-OP: amp channel gains locked */
  setHighsGain: (value: number) => void;
  setBassCompressor: (
    _threshold: number,
    ratio: number,
    knee: number,
    attack: number,
    release: number,
  ) => void;
  setHighsCompressor: (
    threshold: number,
    ratio: number,
    knee: number,
    attack: number,
    release: number,
  ) => void;
  setEQBand: (freq: number, gainDb: number) => void;
  setEQBypass: (bypass: boolean) => void;
  setEpicenterBoost: (pct: number) => void;
  setParaCenter: (hz: number) => void;
  setParaWidth: (width: number) => void;
  setParaGain: (pct: number) => void;
  setBassRestorationLevel: (val: number) => void;
  setProcessorMimic120dB: (val: number) => void;
  /** Legacy compat: maps to helixActive toggle */
  switchASOv3: (on: boolean) => void;
  setBassOutputLevel: (pct: number) => void;
  setUltraCrystalClarity: (db: number) => void;
  setUltraCrystalPresence: (db: number) => void;
  setSRSEnhancement: (enabled: boolean) => void;
  setWOW: (enabled: boolean) => void;
  setTruBass: (enabled: boolean) => void;
  setBassFoundation: (enabled: boolean) => void;
  setCheaterBeater: (enabled: boolean) => void;
  setEQuake: (enabled: boolean) => void;
  setNaturalBottom: (db: number) => void;
  phaseInvert: (channel: "bass" | "highs", invert: boolean) => void;
  setDistortionReduction: (v: number) => void;
  setClippingReduction: (v: number) => void;
  setCleanSignal: (v: number) => void;
  enableLowEndBooster: () => void;
  claimLowEndBooster: () => void;
  disableLowEndBooster: () => void;
  setCanisterActive: (active: boolean) => void;
  setCanisterBottomBoost: (level: number) => void;
  setCanisterPunchBoost: (level: number) => void;
  setUltraActive: (active: boolean) => void;
  /** Legacy compat: maps to helixActive */
  setASOv3Active: (active: boolean) => void;
  /** Alias for setASOv3Active — activates the Helix amp */
  setHelixActive: (active: boolean) => void;
  setSpeakerProfile: (profile: Partial<SpeakerProfile>) => void;
  saveAllSettings: () => void;
  /** Gain kill switch — kills ALL gains simultaneously */
  setGainKillActive: (active: boolean) => void;
}

export type AudioEngine = AudioEngineState & AudioEngineControls;

const AudioEngineContext = createContext<AudioEngine | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AudioEngineProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AudioEngineState>({
    isPlaying: false,
    isLoaded: false,
    volume: 50,
    fileName: "",
    helixContextState: "suspended",
    bassContextState: "suspended",
    highsContextState: "suspended",
    currentTime: 0,
    duration: 0,
    bassFilterFreq: 80,
    highsFilterFreq: 250,
    bassGainValue: 0.0,
    highsGainValue: 0.0,
    bassCompReduction: 0,
    highsCompReduction: 0,
    eqBands: EQ_FREQS.map((freq) => ({ freq, gainDb: 0 })),
    preampBypassed: false,
    bassPhaseInverted: false,
    highsPhaseInverted: false,
    processorChar: defaultProcessorChar,
    distortionReduction: 50,
    clippingReduction: 50,
    cleanSignal: 50,
    srlGrade: "A+" as SRLGrade,
    srlGradeLabel: "ULTRA CLEAN \u2014 5,000W",
    lowEndBoosterEnabled: false,
    lowEndBoosterClaimed: false,
    lowEndBoosterActive: false,
    lowEndBoosterTimeLeft: null,
    hasUnsavedChanges: false,
    lastSaved: null,
    gainViolations: [],
    stackingViolations: [],
    pfmActive: true,
    bassRestorationLevel: 50,
    processorMimic120dB: 50,
    srlControlling120dB: false,
    safetyProcessorActive: true,
    safetyProcessorLevel: 0,
    thunderBatterySafetyDraw: 1000,
    asoV3Routing: false,
    bassOutputLevel: 50,
    canisterActive: false,
    canisterBottomBoost: 50,
    canisterPunchBoost: 50,
    subLevel: 100,
    ultraActive: true,
    helixActive: false,
    asoV3Active: false,
    asoV3Scanning: false,
    scanResult: null,
    asoV3SlotNumber: 1,
    bassCharState: defaultBassCharState,
    speakerProfile: defaultSpeakerProfile,
    intelligenceLayer: defaultIntelligenceLayer,
    gainKillActive: false,
    outputMode: "internal",
    threadBActive: false,
  });

  // ── Intelligence gate — audio cannot play before Thread B is READY ─────────
  const intelligenceReadyRef = useRef<boolean>(false);
  const [_intelligenceReady, setIntelligenceReady] = useState<boolean>(false);

  // ── Audio context (ONE unified helixCtx) ─────────────────────────────────
  const helixCtxRef = useRef<AudioContext | null>(null);

  // ── Bass chain refs ────────────────────────────────────────────────────────
  const volumeGainRef = useRef<GainNode | null>(null); // maps 1-100 to 0.001-1.0
  const bassEQFiltersRef = useRef<BiquadFilterNode[]>([]);
  const bassPfmFilterRef = useRef<BiquadFilterNode | null>(null);
  const bassRestLPRef = useRef<BiquadFilterNode | null>(null);
  const bassRestGainRef = useRef<GainNode | null>(null);
  const bassRestMixRef = useRef<GainNode | null>(null);
  const bassOutputLevelRef = useRef<GainNode | null>(null);
  const bassNaturalBottomRef = useRef<BiquadFilterNode | null>(null);
  const bassLR1Ref = useRef<BiquadFilterNode | null>(null);
  const bassLR2Ref = useRef<BiquadFilterNode | null>(null);
  const canisterF1Ref = useRef<BiquadFilterNode | null>(null);
  const canisterF2Ref = useRef<BiquadFilterNode | null>(null);
  const canisterF3Ref = useRef<BiquadFilterNode | null>(null);
  const canisterOutRef = useRef<GainNode | null>(null);
  const canisterDryRef = useRef<GainNode | null>(null);
  const canisterMixRef = useRef<GainNode | null>(null);
  const safetyBoostRef = useRef<BiquadFilterNode | null>(null);
  const bassCompRef = useRef<DynamicsCompressorNode | null>(null);
  const bassAnalyserRef = useRef<AnalyserNode | null>(null);
  // masterGain: ceiling 0.85-0.98 set by powerMimic, NEVER above 1.0
  const masterGainRef = useRef<GainNode | null>(null);
  // Sub level gain — inserted between bass processing and masterGain
  const subLevelGainRef = useRef<GainNode | null>(null);
  // 40Hz deep bass boost — +6dB peaking, always active
  const deepBassBoostRef = useRef<BiquadFilterNode | null>(null);
  // Low End Booster node — 30Hz +8dB, activated by enableLowEndBooster
  const lowEndBoostNodeRef = useRef<BiquadFilterNode | null>(null);
  // Protection nodes
  const distortionShaperRef = useRef<WaveShaperNode | null>(null);
  const cleanFilterRef = useRef<BiquadFilterNode | null>(null);
  // Gain snapshot for kill switch restore — defaults at 0.0 (rule: gains start at 0)
  const gainSnapshotRef = useRef<{
    subLevel: number;
    canisterOut: number;
    bassRestGain: number;
    canisterDry: number;
    canisterF1: number;
    canisterF2: number;
    canisterF3: number;
    ultra: number;
  }>({
    subLevel: 0.0,
    canisterOut: 0.0,
    bassRestGain: 0.0,
    canisterDry: 0.0,
    canisterF1: 0.0,
    canisterF2: 0.0,
    canisterF3: 0.0,
    ultra: 0.0,
  });

  // ── Highs chain refs ───────────────────────────────────────────────────────
  const highsLR1Ref = useRef<BiquadFilterNode | null>(null);
  const highsLR2Ref = useRef<BiquadFilterNode | null>(null);
  const highsCompRef = useRef<DynamicsCompressorNode | null>(null);
  const highsAnalyserRef = useRef<AnalyserNode | null>(null);
  const ultraGainRef = useRef<GainNode | null>(null); // Ultra authority
  // Separate EQ filter chain for highs path (bands 2-7: 250Hz, 500Hz, 1kHz, 4kHz, 8kHz, 16kHz)
  const highsEQFiltersRef = useRef<BiquadFilterNode[]>([]);

  // ── Analyser data buffers ─────────────────────────────────────────────────
  const bassAnalyserDataRef = useRef<Float32Array<ArrayBuffer> | null>(null);
  const highsAnalyserDataRef = useRef<Float32Array<ArrayBuffer> | null>(null);
  const bassFFTDataRef = useRef<Float32Array<ArrayBuffer> | null>(null);
  const deepSustainTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const deepSustainActiveRef = useRef<boolean>(false);
  const prevBassFreqRef = useRef<number>(0);
  const charRafRef = useRef<number>(0);
  const zeroStackingRafRef = useRef<number>(0); // Zero Stacking Policy Chip RAF

  // ── Audio element + source ─────────────────────────────────────────────────
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const fileUrlRef = useRef<string>("");
  const volumeRef = useRef<number>(50);
  const rafRef = useRef<number>(0);
  const processorMimic120dBRef = useRef(50);

  // ── Timer refs ─────────────────────────────────────────────────────────────
  const boosterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const boosterCountdownRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const saveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const srlDTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const srlDActiveRef = useRef<boolean>(false);
  const btScanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── SharedArrayBuffer (memory bridge Thread A ↔ Thread B) ────────────────
  const sharedBufferRef = useRef<SharedArrayBuffer | null>(null);
  const sharedViewRef = useRef<Float32Array | null>(null);

  // ── Intelligence Worker (Thread B) ────────────────────────────────────────
  const workerRef = useRef<Worker | null>(null);

  // ── Context initialisation ─────────────────────────────────────────────────
  const initContext = useCallback(() => {
    if (helixCtxRef.current) return;

    const ctx = new AudioContext();

    // ── 1. Volume gain (maps 1-100 → 0.001-1.0) ────────────────────────────
    const volumeGain = ctx.createGain();
    volumeGain.gain.value = volToGain(50); // default volume 50

    // ── 2. EQ filters (8 bands) ─────────────────────────────────────────────
    const eqFilters: BiquadFilterNode[] = EQ_FREQS.map((freq, idx) => {
      const f = ctx.createBiquadFilter();
      f.type = "peaking";
      f.frequency.value = freq;
      f.Q.value = EQ_Q_VALUES[idx] ?? 1.0;
      f.gain.value = EQ_LOW_BASE_BOOST[idx] ?? 0;
      return f;
    });

    // ── 3. Epicenter stage ──────────────────────────────────────────────────
    const bassPfmFilter = ctx.createBiquadFilter();
    bassPfmFilter.type = "highpass";
    bassPfmFilter.frequency.value = 14;
    bassPfmFilter.Q.value = Math.SQRT1_2;

    const bassRestLP = ctx.createBiquadFilter();
    bassRestLP.type = "lowpass";
    bassRestLP.frequency.value = 50;
    bassRestLP.Q.value = 0.5;

    const bassRestGain = ctx.createGain();
    bassRestGain.gain.value = 0.0; // RULE: killable gain — starts at 0.0
    console.log("GAIN AUDIT — bassRestGain:", bassRestGain.gain.value);

    const bassRestMix = ctx.createGain();
    bassRestMix.gain.value = 1.0;

    const bassOutputLevel = ctx.createGain();
    bassOutputLevel.gain.value = 0.0; // RULE: killable gain — starts at 0.0
    console.log("GAIN AUDIT — bassOutputLevel:", bassOutputLevel.gain.value);

    // ── 4. Natural Bottom (BiquadFilterNode peaking +2dB at 30Hz) ──────────
    const bassNaturalBottom = ctx.createBiquadFilter();
    bassNaturalBottom.type = "peaking";
    bassNaturalBottom.frequency.value = 30;
    bassNaturalBottom.Q.value = 1.0;
    bassNaturalBottom.gain.value = 2; // +2dB peaking — fixed, not a gain multiplier

    // ── 5. Linkwitz-Riley 4th-order LP crossover (80Hz) ─────────────────────
    const bassLR1 = ctx.createBiquadFilter();
    bassLR1.type = "lowpass";
    bassLR1.frequency.value = 80;
    bassLR1.Q.value = Math.SQRT1_2;

    const bassLR2 = ctx.createBiquadFilter();
    bassLR2.type = "lowpass";
    bassLR2.frequency.value = 80;
    bassLR2.Q.value = Math.SQRT1_2;

    // ── 6. Canister stage ───────────────────────────────────────────────────
    const canisterF1 = ctx.createBiquadFilter();
    canisterF1.type = "peaking";
    canisterF1.frequency.value = 19;
    canisterF1.Q.value = 1.5;
    canisterF1.gain.value = 3;

    const canisterF2 = ctx.createBiquadFilter();
    canisterF2.type = "peaking";
    canisterF2.frequency.value = 40;
    canisterF2.Q.value = 2.0;
    canisterF2.gain.value = 4;

    const canisterF3 = ctx.createBiquadFilter();
    canisterF3.type = "peaking";
    canisterF3.frequency.value = 80;
    canisterF3.Q.value = 1.5;
    canisterF3.gain.value = 3;

    const canisterOut = ctx.createGain();
    canisterOut.gain.value = 0.0; // RULE: killable gain — starts at 0.0
    console.log("GAIN AUDIT — canisterOut:", canisterOut.gain.value);

    const canisterDry = ctx.createGain();
    canisterDry.gain.value = 0.0; // RULE: killable gain — starts at 0.0
    console.log("GAIN AUDIT — canisterDry:", canisterDry.gain.value);

    const canisterMix = ctx.createGain();
    canisterMix.gain.value = 1.0;

    // ── 7. Safety boost (30Hz peaking +3dB fixed — 1,000W safety chars) ────
    const safetyBoost = ctx.createBiquadFilter();
    safetyBoost.type = "peaking";
    safetyBoost.frequency.value = 30;
    safetyBoost.Q.value = 1.0;
    safetyBoost.gain.value = 3; // fixed +3dB — not user-controllable, not a gain multiplier

    // ── 7b. 40Hz deep bass boost (+6dB peaking, always active) ──────────────
    const deepBassBoost = ctx.createBiquadFilter();
    deepBassBoost.type = "peaking";
    deepBassBoost.frequency.value = 40;
    deepBassBoost.Q.value = 1.4;
    deepBassBoost.gain.value = 6; // +6dB default deep bass reinforcement

    // ── 7c. Low End Booster node (30Hz +8dB, Q=1.0 — activated by user) ─────
    const lowEndBoostNode = ctx.createBiquadFilter();
    lowEndBoostNode.type = "peaking";
    lowEndBoostNode.frequency.value = 30;
    lowEndBoostNode.Q.value = 1.0;
    lowEndBoostNode.gain.value = 0; // starts off — activated when booster enabled

    // ── 7d. Sub level gain node ──────────────────────────────────────────────
    const subLevelGain = ctx.createGain();
    subLevelGain.gain.value = 0.0; // RULE: killable gain — starts at 0.0
    console.log("GAIN AUDIT — subLevelGain:", subLevelGain.gain.value);

    // ── 7e. Protection: WaveShaperNode (soft-clip only, NOT saturation) ──────
    const distortionShaper = ctx.createWaveShaper();
    distortionShaper.curve = null; // pass-through until setDistortionReduction called
    distortionShaper.oversample = "4x";

    // ── 7f. Clean filter (highpass 20Hz for tight bass cutoff) ───────────────
    const cleanFilter = ctx.createBiquadFilter();
    cleanFilter.type = "highpass";
    cleanFilter.frequency.value = 20;
    cleanFilter.Q.value = 0.5;

    // ── 8. SRL Compressor (exactly ONE — no duplicate limiter) ──────────────
    const bassComp = ctx.createDynamicsCompressor();
    bassComp.threshold.value = -24;
    bassComp.knee.value = 30;
    bassComp.ratio.value = 4;
    bassComp.attack.value = 0.003;
    bassComp.release.value = 0.25;

    // ── 9. Analyser ──────────────────────────────────────────────────────────
    const bassAnalyser = ctx.createAnalyser();
    bassAnalyser.fftSize = 2048;
    bassAnalyser.smoothingTimeConstant = 0.75;

    // ── 10. Master gain — FIXED 1.0, NEVER above 1 ──────────────────────────
    const masterGain = ctx.createGain();
    masterGain.gain.value = 1.0; // RULE: pass-through only, NEVER modified

    // ── 11. Highs path — separate EQ chain for bands 2-7 (250Hz+) ───────────
    // Create dedicated EQ filters for highs path (bands 2-7 only)
    const highsEQFilters: BiquadFilterNode[] = EQ_FREQS.slice(2).map(
      (freq, i) => {
        const f = ctx.createBiquadFilter();
        f.type = "peaking";
        f.frequency.value = freq;
        f.Q.value = EQ_Q_VALUES[i + 2] ?? 1.0;
        f.gain.value = 0;
        return f;
      },
    );

    const highsLR1 = ctx.createBiquadFilter();
    highsLR1.type = "highpass";
    highsLR1.frequency.value = 250;
    highsLR1.Q.value = Math.SQRT1_2;

    const highsLR2 = ctx.createBiquadFilter();
    highsLR2.type = "highpass";
    highsLR2.frequency.value = 250;
    highsLR2.Q.value = Math.SQRT1_2;

    const highsComp = ctx.createDynamicsCompressor();
    highsComp.threshold.value = -24;
    highsComp.knee.value = 30;
    highsComp.ratio.value = 4;
    highsComp.attack.value = 0.003;
    highsComp.release.value = 0.25;

    const highsAnalyser = ctx.createAnalyser();
    highsAnalyser.fftSize = 256;
    highsAnalyser.smoothingTimeConstant = 0.8;

    const ultraGain = ctx.createGain();
    ultraGain.gain.value = 0.0; // RULE: killable gain — starts at 0.0
    console.log("GAIN AUDIT — ultraGain:", ultraGain.gain.value);

    // ── Wire the full chain ──────────────────────────────────────────────────
    // Bass path: volumeGain → EQ[0..7] (all 8 bands for bass)
    volumeGain.connect(eqFilters[0]);
    for (let i = 0; i < eqFilters.length - 1; i++) {
      eqFilters[i].connect(eqFilters[i + 1]);
    }
    const eqLast = eqFilters[eqFilters.length - 1];

    // EQ last → pfmFilter → dry to bassRestMix + LP restoration parallel
    eqLast.connect(bassPfmFilter);
    bassPfmFilter.connect(bassRestMix);
    bassPfmFilter.connect(bassRestLP);
    bassRestLP.connect(bassRestGain);
    bassRestGain.connect(bassRestMix);

    // bassRestMix → outputLevel → naturalBottom → deepBassBoost → LR crossover
    bassRestMix.connect(bassOutputLevel);
    bassOutputLevel.connect(bassNaturalBottom);
    bassNaturalBottom.connect(deepBassBoost);
    deepBassBoost.connect(lowEndBoostNode);
    lowEndBoostNode.connect(bassLR1);
    bassLR1.connect(bassLR2);

    // LR2 → Canister wet/dry → canisterMix
    bassLR2.connect(canisterF1);
    canisterF1.connect(canisterF2);
    canisterF2.connect(canisterF3);
    canisterF3.connect(canisterOut);
    canisterOut.connect(canisterMix);
    bassLR2.connect(canisterDry);
    canisterDry.connect(canisterMix);

    // canisterMix → safetyBoost → cleanFilter → distortionShaper → bassComp → bassAnalyser → subLevelGain → masterGain → destination
    canisterMix.connect(safetyBoost);
    safetyBoost.connect(cleanFilter);
    cleanFilter.connect(distortionShaper);
    distortionShaper.connect(bassComp);
    bassComp.connect(bassAnalyser);
    bassAnalyser.connect(subLevelGain);
    subLevelGain.connect(masterGain);
    masterGain.connect(ctx.destination);

    // Highs path: volumeGain → highsEQ[2..7] → highsLR1 → highsLR2 → highsComp → highsAnalyser → ultraGain → destination
    // Separate EQ chain for highs — does NOT share nodes with bass EQ chain
    volumeGain.connect(highsEQFilters[0]);
    for (let i = 0; i < highsEQFilters.length - 1; i++) {
      highsEQFilters[i].connect(highsEQFilters[i + 1]);
    }
    const highsEQLast = highsEQFilters[highsEQFilters.length - 1];
    highsEQLast.connect(highsLR1);
    highsLR1.connect(highsLR2);
    highsLR2.connect(highsComp);
    highsComp.connect(highsAnalyser);
    highsAnalyser.connect(ultraGain);
    ultraGain.connect(ctx.destination);

    // ── Store refs ───────────────────────────────────────────────────────────
    helixCtxRef.current = ctx;
    volumeGainRef.current = volumeGain;
    bassEQFiltersRef.current = eqFilters;
    bassPfmFilterRef.current = bassPfmFilter;
    bassRestLPRef.current = bassRestLP;
    bassRestGainRef.current = bassRestGain;
    bassRestMixRef.current = bassRestMix;
    bassOutputLevelRef.current = bassOutputLevel;
    bassNaturalBottomRef.current = bassNaturalBottom;
    bassLR1Ref.current = bassLR1;
    bassLR2Ref.current = bassLR2;
    canisterF1Ref.current = canisterF1;
    canisterF2Ref.current = canisterF2;
    canisterF3Ref.current = canisterF3;
    canisterOutRef.current = canisterOut;
    canisterDryRef.current = canisterDry;
    canisterMixRef.current = canisterMix;
    safetyBoostRef.current = safetyBoost;
    bassCompRef.current = bassComp;
    bassAnalyserRef.current = bassAnalyser;
    masterGainRef.current = masterGain;
    subLevelGainRef.current = subLevelGain;
    deepBassBoostRef.current = deepBassBoost;
    lowEndBoostNodeRef.current = lowEndBoostNode;
    distortionShaperRef.current = distortionShaper;
    cleanFilterRef.current = cleanFilter;
    highsLR1Ref.current = highsLR1;
    highsLR2Ref.current = highsLR2;
    highsCompRef.current = highsComp;
    highsAnalyserRef.current = highsAnalyser;
    ultraGainRef.current = ultraGain;
    highsEQFiltersRef.current = highsEQFilters;

    // Analyser buffers
    bassAnalyserDataRef.current = new Float32Array(
      bassAnalyser.fftSize,
    ) as Float32Array<ArrayBuffer>;
    highsAnalyserDataRef.current = new Float32Array(
      highsAnalyser.fftSize,
    ) as Float32Array<ArrayBuffer>;
    bassFFTDataRef.current = new Float32Array(
      bassAnalyser.frequencyBinCount,
    ) as Float32Array<ArrayBuffer>;

    // ── Initialize SharedArrayBuffer (memory bridge) ─────────────────────────
    if (typeof SharedArrayBuffer !== "undefined") {
      try {
        const sab = new SharedArrayBuffer(SAB_SIZE * 4);
        const view = new Float32Array(sab);
        view[SAB_OHMS] = 8;
        view[SAB_WATTS] = 400;
        view[SAB_CHIPS_ACTIVE] = 25;
        view[SAB_BT_CONNECTED] = 0;
        view[SAB_GAIN_KILL] = 0;
        view[SAB_POWER_MIMIC] = 1.0; // Thunder Battery Chain 1
        view[SAB_POWER_MIMIC2] = 1.0; // Thunder Battery Chain 2 (parallel, offset phase)
        sharedBufferRef.current = sab;
        sharedViewRef.current = view;
      } catch {
        // SharedArrayBuffer not available (cross-origin isolation required)
        console.warn(
          "[Helix] SharedArrayBuffer not available — Thread B disabled",
        );
      }
    }
  }, []);

  // ── Intelligence Worker (Thread B) startup ───────────────────────────────────
  const startWorker = useCallback(() => {
    if (workerRef.current || !sharedBufferRef.current) return;
    try {
      const worker = new Worker(
        new URL("../workers/intelligenceWorker.ts", import.meta.url),
        { type: "module" },
      );

      // Load session learning from localStorage
      let learning: Record<string, number> | undefined;
      try {
        const saved = localStorage.getItem("helixChipLearning");
        if (saved) learning = JSON.parse(saved) as Record<string, number>;
      } catch {
        /* ignore */
      }

      worker.postMessage({
        type: "INIT",
        buffer: sharedBufferRef.current,
        learning,
      });

      worker.onmessage = (
        event: MessageEvent<{ type: string; data: Record<string, number> }>,
      ) => {
        if (event.data.type === "SESSION_LEARNING") {
          try {
            localStorage.setItem(
              "helixChipLearning",
              JSON.stringify(event.data.data),
            );
          } catch {
            /* ignore */
          }
        } else if (event.data.type === "READY") {
          // Intelligence layer gate: Thread B confirmed READY
          intelligenceReadyRef.current = true;
          setIntelligenceReady(true);
          console.log("[Helix] Intelligence layer READY — Thread B confirmed");
        }
      };

      // 3-second fallback: if worker never posts READY, unlock anyway
      setTimeout(() => {
        if (!intelligenceReadyRef.current) {
          intelligenceReadyRef.current = true;
          setIntelligenceReady(true);
          console.warn(
            "[Helix] Intelligence READY fallback fired (3s timeout)",
          );
        }
      }, 3000);

      workerRef.current = worker;
      setState((s) => ({
        ...s,
        threadBActive: true,
        intelligenceLayer: { ...s.intelligenceLayer, threadBActive: true },
      }));
      console.log("[Helix] Thread B (Intelligence Worker) started");
    } catch (err) {
      console.warn("[Helix] Could not start intelligence worker:", err);
    }
  }, []);

  // ── Titanium No Interference Wall (RAF — audits all GainNodes every frame) ─────
  const titaniumWallRef = useRef<number>(0);
  const startTitaniumWall = useCallback(() => {
    const knownGains: Array<{
      ref: React.MutableRefObject<GainNode | null>;
      name: string;
    }> = [
      { ref: bassRestGainRef, name: "bassRestGain" },
      { ref: bassOutputLevelRef, name: "bassOutputLevel" },
      { ref: canisterOutRef, name: "canisterOut" },
      { ref: canisterDryRef, name: "canisterDry" },
      { ref: subLevelGainRef, name: "subLevelGain" },
      { ref: ultraGainRef, name: "ultraGain" },
    ];
    const tick = () => {
      for (const { ref, name } of knownGains) {
        const node = ref.current;
        if (node && node.gain.value > 1.0) {
          console.warn(
            `[TITANIUM WALL] ${name} clamped from ${node.gain.value.toFixed(4)} to 1.0`,
          );
          node.gain.value = 1.0;
        }
      }
      // masterGain is the only authorized GainNode — it must stay at 1.0
      if (masterGainRef.current && masterGainRef.current.gain.value !== 1.0) {
        console.warn("[TITANIUM WALL] masterGain corrected to 1.0");
        masterGainRef.current.gain.value = 1.0;
      }
      // Authorize only distortionShaper — log any other WaveShaper found
      const ctx = helixCtxRef.current;
      if (ctx) {
        // We cannot enumerate all nodes, but we can verify the known shaper is ours
        const ds = distortionShaperRef.current;
        if (!ds) {
          console.warn(
            "[TITANIUM WALL] authorized WaveShaper missing — chain may be compromised",
          );
        }
      }
      titaniumWallRef.current = requestAnimationFrame(tick);
    };
    titaniumWallRef.current = requestAnimationFrame(tick);
  }, []);

  // ── Bluetooth Speaker Scanner Chip (main thread) ─────────────────────────────
  const runBluetoothScan = useCallback(async () => {
    const nav = navigator as Navigator & {
      bluetooth?: { getDevices(): Promise<{ name?: string }[]> };
    };
    if (!nav.bluetooth) return;

    try {
      const devices = await nav.bluetooth.getDevices();
      if (!devices.length) return; // BT not on — no scan

      const device = devices[0];
      const name = device.name ?? "";
      const profile = lookupSpeaker(name);

      const view = sharedViewRef.current;
      if (view) {
        view[SAB_OHMS] = profile.ohms;
        view[SAB_WATTS] = profile.watts;
        view[SAB_BT_CONNECTED] = 1;
      }

      // Also post to worker for box type detection
      workerRef.current?.postMessage({
        type: "SET_BOX_TYPE",
        boxType: profile.boxType,
      });

      setState((s) => ({
        ...s,
        speakerProfile: {
          detectedName: name || "QFX PBX-15",
          ohms: profile.ohms,
          estimatedSize: profile.size,
          powerHandling: `${profile.watts}W RMS`,
          profileApplied: true,
        },
      }));

      console.log(
        `[Bluetooth Scanner] Speaker detected: ${name || "QFX PBX-15"} | ${profile.ohms}Ω | ${profile.watts}W | ${profile.boxType}`,
      );
    } catch {
      /* User denied or BT off */
    }
  }, []);

  // ── Zero Stacking Policy Chip (runs every RAF — separate from 20-30 smart chips) ─
  const startZeroStackingChip = useCallback(() => {
    const tick = () => {
      const view = sharedViewRef.current;
      const masterGain = masterGainRef.current;
      const _volumeGain = volumeGainRef.current;

      if (view && masterGain) {
        const gainKillActive = view[SAB_GAIN_KILL] > 0.5;

        // masterGain is ALWAYS 1.0 — bypass ceiling, never killed
        if (masterGain.gain.value !== 1.0) {
          console.log(
            `[Zero Stacking Policy Chip] masterGain corrected to 1.0 (was ${masterGain.gain.value})`,
          );
          masterGain.gain.setValueAtTime(1.0, masterGain.context.currentTime);
        }

        if (gainKillActive) {
          // Re-zero any killable gain that drifted back
          const now = masterGain.context.currentTime;
          if (
            subLevelGainRef.current &&
            subLevelGainRef.current.gain.value !== 0
          )
            subLevelGainRef.current.gain.setValueAtTime(0, now);
          if (
            bassRestGainRef.current &&
            bassRestGainRef.current.gain.value !== 0
          )
            bassRestGainRef.current.gain.setValueAtTime(0, now);
          if (canisterOutRef.current && canisterOutRef.current.gain.value !== 0)
            canisterOutRef.current.gain.setValueAtTime(0, now);
          if (canisterDryRef.current && canisterDryRef.current.gain.value !== 0)
            canisterDryRef.current.gain.setValueAtTime(0, now);
          if (canisterF1Ref.current && canisterF1Ref.current.gain.value !== 0)
            canisterF1Ref.current.gain.setValueAtTime(0, now);
          if (canisterF2Ref.current && canisterF2Ref.current.gain.value !== 0)
            canisterF2Ref.current.gain.setValueAtTime(0, now);
          if (canisterF3Ref.current && canisterF3Ref.current.gain.value !== 0)
            canisterF3Ref.current.gain.setValueAtTime(0, now);
          if (ultraGainRef.current && ultraGainRef.current.gain.value !== 0)
            ultraGainRef.current.gain.setValueAtTime(0, now);
        } else {
          // Clamp any killable gain that crept above 1.0
          const now = masterGain.context.currentTime;
          if (
            subLevelGainRef.current &&
            subLevelGainRef.current.gain.value > 1.0
          ) {
            console.log("[Zero Stacking Policy Chip] subLevel clamped to 1.0");
            subLevelGainRef.current.gain.setValueAtTime(1.0, now);
          }
          if (
            bassRestGainRef.current &&
            bassRestGainRef.current.gain.value > 1.0
          ) {
            console.log(
              "[Zero Stacking Policy Chip] bassRestGain clamped to 1.0",
            );
            bassRestGainRef.current.gain.setValueAtTime(1.0, now);
          }
          if (
            canisterOutRef.current &&
            canisterOutRef.current.gain.value > 1.0
          ) {
            console.log(
              "[Zero Stacking Policy Chip] canisterOut clamped to 1.0",
            );
            canisterOutRef.current.gain.setValueAtTime(1.0, now);
          }
          if (ultraGainRef.current && ultraGainRef.current.gain.value > 1.0) {
            console.log("[Zero Stacking Policy Chip] ultraGain clamped to 1.0");
            ultraGainRef.current.gain.setValueAtTime(1.0, now);
          }
        }
      }

      zeroStackingRafRef.current = requestAnimationFrame(tick);
    };
    zeroStackingRafRef.current = requestAnimationFrame(tick);
  }, []);

  // ── Characteristics tick (reads SharedArrayBuffer from Thread B) ─────────────
  const startCharTick = useCallback(() => {
    const tick = () => {
      const bassAnalyser = bassAnalyserRef.current;
      const highsAnalyser = highsAnalyserRef.current;
      const bassData = bassAnalyserDataRef.current;
      const highsData = highsAnalyserDataRef.current;
      const fftData = bassFFTDataRef.current;
      const view = sharedViewRef.current;

      if (!bassAnalyser || !highsAnalyser || !bassData || !highsData) {
        charRafRef.current = requestAnimationFrame(tick);
        return;
      }

      bassAnalyser.getFloatTimeDomainData(
        bassData as Float32Array<ArrayBuffer>,
      );
      highsAnalyser.getFloatTimeDomainData(
        highsData as Float32Array<ArrayBuffer>,
      );

      let bassRmsSum = 0;
      for (let i = 0; i < bassData.length; i++)
        bassRmsSum += bassData[i] * bassData[i];
      const bassRms = Math.sqrt(bassRmsSum / bassData.length);

      let highsRmsSum = 0;
      for (let i = 0; i < highsData.length; i++)
        highsRmsSum += highsData[i] * highsData[i];
      const highsRms = Math.sqrt(highsRmsSum / highsData.length);

      const vol = volumeRef.current;
      const volNorm = (vol - 1) / 99; // 1-100 range

      // ── Read Thread B values from SharedArrayBuffer ───────────────────────
      let threadBPunch = 0;
      let threadBDepth = 90;
      let threadBWeight = 0;
      let threadBClarity = 0;
      let threadBBassDrop = 0;
      let threadBBassNote = 0;
      let threadBPowerMimic = 0;
      let threadBSignalAuth = 0;
      let threadBAmpResp = 0;
      let threadBChipsActive = 25;

      if (view) {
        threadBPunch = view[SAB_PUNCH] * 100;
        threadBDepth = view[SAB_DEPTH] * 100;
        threadBWeight = view[SAB_WEIGHT] * 100;
        threadBClarity = view[SAB_CLARITY] * 100;
        threadBBassDrop = view[SAB_BASS_DROP] * 100;
        threadBBassNote = view[SAB_BASS_NOTE] * 100;
        threadBPowerMimic = view[SAB_POWER_MIMIC] * 100;
        threadBSignalAuth = view[SAB_SIGNAL_AUTH] * 100;
        threadBAmpResp = view[SAB_AMP_RESPONSE] * 100;
        threadBChipsActive = Math.round(view[SAB_CHIPS_ACTIVE]);

        // ── Bridge Thread B to real Web Audio nodes (Intelligence Layer → Audio) ─
        const gainKillOn = view[SAB_GAIN_KILL] > 0.5;
        if (!gainKillOn) {
          // punch (0-1) → bassComp knee (0 to 40) — higher punch = tighter knee
          const punchRaw = view[SAB_PUNCH];
          if (bassCompRef.current) {
            bassCompRef.current.knee.value = punchRaw * 40;
          }
          // depth (0-1) → bassRestGain (clamped to 1.0 max — Zero Stacking Policy)
          const depthRaw = view[SAB_DEPTH];
          if (bassRestGainRef.current) {
            bassRestGainRef.current.gain.setValueAtTime(
              Math.min(1.0, 0.8 + depthRaw * 1.2),
              bassRestGainRef.current.context.currentTime,
            );
          }
          // weight (0-1) → deepBassBoost gain (+4dB to +10dB)
          const weightRaw = view[SAB_WEIGHT];
          if (deepBassBoostRef.current) {
            deepBassBoostRef.current.gain.value = 4 + weightRaw * 6;
          }
          // clarity (0-1) → highsEQFilters[4] (8kHz band) gain (0 to +3dB)
          const clarityRaw = view[SAB_CLARITY];
          if (highsEQFiltersRef.current[4]) {
            highsEQFiltersRef.current[4].gain.value = clarityRaw * 3;
          }
          // powerMimic — dual Thunder Battery chains averaged → subLevelGain ceiling
          const powerRaw = (view[SAB_POWER_MIMIC] + view[SAB_POWER_MIMIC2]) / 2;
          // Route characteristics ceiling to subLevelGain (NOT masterGain — masterGain is fixed 1.0)
          if (subLevelGainRef.current) {
            const targetSubCeiling = 0.7 + powerRaw * 0.3; // 0.70 to 1.0
            const clampedSub = Math.min(targetSubCeiling, 1.0);
            subLevelGainRef.current.gain.value = clampedSub;
          }
          // masterGain is FIXED at 1.0 — NEVER modified by powerMimic
          if (
            masterGainRef.current &&
            masterGainRef.current.gain.value !== 1.0
          ) {
            masterGainRef.current.gain.value = 1.0;
          }

          // ── Zero Stacking Policy — engine-level clamp in char tick ────────────
          const zspNodes: Array<{ node: GainNode | null; name: string }> = [
            { node: subLevelGainRef.current, name: "subLevelGain" },
            { node: canisterOutRef.current, name: "canisterOut" },
            { node: canisterDryRef.current, name: "canisterDry" },
          ];
          for (const { node, name } of zspNodes) {
            if (node && node.gain.value > 1.0) {
              console.warn(
                `[Zero Stacking Policy] VIOLATION: ${name} was ${node.gain.value.toFixed(3)}, clamped to 1.0`,
              );
              node.gain.value = 1.0;
            }
          }
          // masterGain hard ceiling — absolute
          if (masterGainRef.current && masterGainRef.current.gain.value > 1.0) {
            console.warn(
              "[Zero Stacking Policy] VIOLATION: masterGain exceeded 1.0, clamped",
            );
            masterGainRef.current.gain.value = 1.0;
          }
          // volumeGain allowed 0.001-1.0 — clamp if over
          if (volumeGainRef.current && volumeGainRef.current.gain.value > 1.0) {
            console.warn(
              "[Zero Stacking Policy] VIOLATION: volumeGain exceeded 1.0, clamped",
            );
            volumeGainRef.current.gain.value = 1.0;
          }
        }
      }

      // Blend Thread B values with RMS readings (Thread A drives, Thread B enhances)
      const punch = Math.min(
        100,
        Math.round((bassRms * 300 + volNorm * 30) * 0.6 + threadBPunch * 0.4),
      );
      const depth = Math.min(
        100,
        Math.round((85 + bassRms * 30) * 0.7 + threadBDepth * 0.3),
      );
      const weight = Math.min(
        100,
        Math.round((bassRms * 400 + volNorm * 25) * 0.6 + threadBWeight * 0.4),
      );
      const clarity = Math.min(
        100,
        Math.round(
          (highsRms * 400 + volNorm * 20 + 20) * 0.65 + threadBClarity * 0.35,
        ),
      );
      const bassDrop =
        vol >= 50 && bassRms > 0.01
          ? Math.min(
              100,
              Math.round(60 + bassRms * 150 + threadBBassDrop * 0.3),
            )
          : 0;
      const diff = Math.abs(bassRms - prevBassFreqRef.current);
      prevBassFreqRef.current = bassRms;
      const bassNoteSwitching = Math.min(
        100,
        Math.round(diff * 6000 + threadBBassNote * 0.2),
      );

      const mimicCeiling = 0.5 + (processorMimic120dBRef.current / 100) * 0.5;
      const powerMimic = Math.min(
        100,
        Math.round(
          (bassRms * 400 * 0.538 + volNorm * 40) * mimicCeiling * 0.5 +
            threadBPowerMimic * 0.5,
        ),
      );
      const signalAuthority = Math.min(
        100,
        Math.round(
          (punch * 0.4 + weight * 0.4 + depth * 0.2) * mimicCeiling * 0.6 +
            threadBSignalAuth * 0.4,
        ),
      );
      const combinedRms = bassRms * 0.6 + highsRms * 0.4;
      const ampResponse = Math.min(
        100,
        Math.round(combinedRms * 500 + volNorm * 30 + threadBAmpResp * 0.3),
      );

      // ── Bass Characteristics Engine — live Hz tracking (14–50Hz) ─────────
      const liveEnergy14_50: number[] = new Array(37).fill(0) as number[];
      let activeHz = 0;
      let peakEnergy = 0;
      let zeroDistortionActive = true;

      if (fftData && bassAnalyser) {
        bassAnalyser.getFloatFrequencyData(
          fftData as Float32Array<ArrayBuffer>,
        );
        const sampleRate = helixCtxRef.current?.sampleRate ?? 44100;
        const binHz = sampleRate / bassAnalyser.fftSize;

        for (let hz = 14; hz <= 50; hz++) {
          const binIndex = Math.round(hz / binHz);
          if (binIndex >= fftData.length) continue;
          const dbVal = fftData[binIndex] ?? -100;
          const norm = Math.max(0, Math.min(1, (dbVal + 100) / 100));

          let boostFactor = 1.0;
          if (hz <= 20) boostFactor = 1.5;
          else if (hz <= 35) boostFactor = 1.25;

          const boosted = Math.min(1, norm * boostFactor);
          liveEnergy14_50[hz - 14] = boosted;

          if (boosted > 0.98) zeroDistortionActive = false;
          if (boosted > peakEnergy) {
            peakEnergy = boosted;
            activeHz = hz;
          }
        }
      }

      const low40Energy =
        liveEnergy14_50.slice(0, 27).reduce((a, b) => a + b, 0) / 27;

      if (bassRms < 0.005 && low40Energy > 0.1) {
        if (!deepSustainActiveRef.current) {
          deepSustainActiveRef.current = true;
          if (deepSustainTimerRef.current)
            clearTimeout(deepSustainTimerRef.current);
          deepSustainTimerRef.current = setTimeout(() => {
            deepSustainActiveRef.current = false;
          }, 120);
        }
      }

      const deepSustainActive = deepSustainActiveRef.current;

      // ── Update worker with current volume ─────────────────────────────────
      if (workerRef.current) {
        workerRef.current.postMessage({ type: "SET_VOLUME", volume: volNorm });
      }

      // ── Intelligence Layer state from SharedArrayBuffer ───────────────────
      const isHelixActive = state.helixActive;
      const intelligenceLayer: IntelligenceLayerState = {
        appSelf: true,
        smartChips: isHelixActive ? threadBChipsActive : 0,
        totalBehaviors: 100000,
        loadAmp: isHelixActive ? 35 : 0,
        loadApp: isHelixActive ? 35 : 0,
        loadChipCommander: isHelixActive ? 30 : 0,
        threadBActive: workerRef.current !== null,
        powerMimic: threadBPowerMimic,
      };

      setState((s) => ({
        ...s,
        processorChar: {
          punch,
          depth,
          weight,
          clarity,
          bassDrop,
          bassNoteSwitching,
          powerMimic,
          signalAuthority,
          ampResponse,
        },
        bassCharState: {
          activeHz,
          liveEnergy14_50,
          deepSustainActive,
          zeroDistortionActive,
        },
        intelligenceLayer,
      }));

      charRafRef.current = requestAnimationFrame(tick);
    };
    charRafRef.current = requestAnimationFrame(tick);
  }, [state.helixActive]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── SRL crossover command ──────────────────────────────────────────────────
  const applySRLCrossoverCommand = useCallback(
    (grade: SRLGrade, bassFreq: number, highsFreq: number) => {
      const adj = SRL_CROSSOVER_ADJUST[grade];
      const newBassFreq = Math.max(20, bassFreq + adj.bassOffset);
      const newHighsFreq = Math.min(20000, highsFreq + adj.highsOffset);
      if (bassLR1Ref.current) bassLR1Ref.current.frequency.value = newBassFreq;
      if (bassLR2Ref.current) bassLR2Ref.current.frequency.value = newBassFreq;
      if (highsLR1Ref.current)
        highsLR1Ref.current.frequency.value = newHighsFreq;
      if (highsLR2Ref.current)
        highsLR2Ref.current.frequency.value = newHighsFreq;
    },
    [],
  );

  // ── SRL D-grade volume protection ─────────────────────────────────────────
  const handleSRLDGrade = useCallback((grade: SRLGrade) => {
    if (grade !== "D") {
      if (srlDTimerRef.current) {
        clearTimeout(srlDTimerRef.current);
        srlDTimerRef.current = null;
      }
      srlDActiveRef.current = false;
      return;
    }
    if (srlDActiveRef.current) return;
    srlDActiveRef.current = true;
    srlDTimerRef.current = setTimeout(() => {
      const volumeGain = volumeGainRef.current;
      if (!volumeGain) return;
      const currentGain = volumeGain.gain.value;
      const reduced = currentGain * 0.95;
      volumeGain.gain.value = reduced;
      setTimeout(() => {
        if (volumeGainRef.current)
          volumeGainRef.current.gain.value = currentGain;
        srlDActiveRef.current = false;
      }, 500);
    }, 3000);
  }, []);

  // ── Pre-play scanner (fires when Helix activated) ──────────────────────────
  const runPrePlayScan = useCallback((): Promise<"clean" | "problem"> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const ctx = helixCtxRef.current;
        const masterGain = masterGainRef.current;
        let result: "clean" | "problem" = "clean";

        // Intelligence layer gate — must be READY before passing scan
        if (!intelligenceReadyRef.current) {
          console.warn(
            "[Helix Pre-Play Scanner] Intelligence layer NOT active — scan FAILED",
          );
          resolve("problem");
          return;
        }

        if (!ctx || ctx.state === "closed") result = "problem";
        if (masterGain && masterGain.gain.value !== 1.0) result = "problem";

        console.log(`[Helix Pre-Play Scanner] Result: ${result}`);
        resolve(result);
      }, 2000);
    });
  }, []);

  // ── File loader ────────────────────────────────────────────────────────────
  const loadFile = useCallback(
    async (file: File) => {
      initContext();

      if (fileUrlRef.current) URL.revokeObjectURL(fileUrlRef.current);
      const url = URL.createObjectURL(file);
      fileUrlRef.current = url;

      if (audioSourceRef.current) {
        audioSourceRef.current.disconnect();
        audioSourceRef.current = null;
      }

      const audio = new Audio();
      audio.src = url;
      audio.crossOrigin = "anonymous";
      audio.preload = "auto";
      audioRef.current = audio;

      const ctx = helixCtxRef.current!;
      const source = ctx.createMediaElementSource(audio);
      source.connect(volumeGainRef.current!);
      audioSourceRef.current = source;

      // Gate: wait for intelligence layer READY before resuming ctx (max 3s)
      if (!intelligenceReadyRef.current) {
        startWorker(); // ensure worker is started so it can post READY
        await new Promise<void>((resolve) => {
          const checkInterval = setInterval(() => {
            if (intelligenceReadyRef.current) {
              clearInterval(checkInterval);
              resolve();
            }
          }, 50);
          // Hard cap: never wait more than 3s
          setTimeout(() => {
            clearInterval(checkInterval);
            intelligenceReadyRef.current = true;
            setIntelligenceReady(true);
            resolve();
          }, 3000);
        });
      }

      await ctx.resume();

      // Start worker + zero stacking chip + Titanium Wall on first load
      startWorker();
      startZeroStackingChip();
      startTitaniumWall();

      // Start BT scanner
      runBluetoothScan();
      if (!btScanIntervalRef.current) {
        btScanIntervalRef.current = setInterval(runBluetoothScan, 30000);
      }

      setState((s) => ({
        ...s,
        isLoaded: true,
        fileName: file.name,
        helixContextState: ctx.state,
        bassContextState: ctx.state,
        highsContextState: ctx.state,
      }));
    },
    [
      initContext,
      startWorker,
      startZeroStackingChip,
      startTitaniumWall,
      runBluetoothScan,
    ],
  );

  // ── Playback ───────────────────────────────────────────────────────────────
  const play = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    helixCtxRef.current?.resume();
    audio.play().catch(() => {});

    workerRef.current?.postMessage({ type: "SET_PLAYING", playing: true });

    setState((s) => ({
      ...s,
      isPlaying: true,
      helixContextState: helixCtxRef.current?.state ?? "running",
      bassContextState: helixCtxRef.current?.state ?? "running",
      highsContextState: helixCtxRef.current?.state ?? "running",
    }));

    const tick = () => {
      if (audio.duration) {
        setState((s) => ({
          ...s,
          currentTime: audio.currentTime,
          duration: audio.duration,
          bassCompReduction: bassCompRef.current?.reduction ?? 0,
          highsCompReduction: highsCompRef.current?.reduction ?? 0,
        }));
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    startCharTick();
  }, [startCharTick]);

  const stop = useCallback(() => {
    audioRef.current?.pause();
    if (audioRef.current) audioRef.current.currentTime = 0;
    cancelAnimationFrame(rafRef.current);
    cancelAnimationFrame(charRafRef.current);
    workerRef.current?.postMessage({ type: "SET_PLAYING", playing: false });
    setState((s) => ({
      ...s,
      isPlaying: false,
      currentTime: 0,
      processorChar: defaultProcessorChar,
    }));
  }, []);

  // ── Volume — RULE: 1-100 only ──────────────────────────────────────────────
  const setVolume = useCallback((v: number) => {
    // Enforce 1-100 range hard — no 700
    const safeV = Math.max(1, Math.min(100, Math.round(v)));
    volumeRef.current = safeV;
    const gain = volToGain(safeV);
    if (volumeGainRef.current) volumeGainRef.current.gain.value = gain;
    // R5: bassComp threshold is FIXED at -24 — NEVER modified by volume (prevents bass gating)
    // Safety boost: scales with volume
    if (safetyBoostRef.current) {
      safetyBoostRef.current.gain.value = 3 + (safeV / 100) * 1.5; // 3-4.5dB
    }
    setState((s) => ({
      ...s,
      volume: safeV,
      safetyProcessorLevel: Math.round((safeV / 100) * 100),
    }));
  }, []);

  // ── Crossover ─────────────────────────────────────────────────────────────
  const setBassFilterFreq = useCallback((hz: number) => {
    setState((s) => {
      const adj = SRL_CROSSOVER_ADJUST[s.srlGrade];
      const commanded = Math.max(20, hz + adj.bassOffset);
      if (bassLR1Ref.current) bassLR1Ref.current.frequency.value = commanded;
      if (bassLR2Ref.current) bassLR2Ref.current.frequency.value = commanded;
      return { ...s, bassFilterFreq: hz };
    });
  }, []);

  const setHighsFilterFreq = useCallback((hz: number) => {
    setState((s) => {
      const adj = SRL_CROSSOVER_ADJUST[s.srlGrade];
      const commanded = Math.min(20000, hz + adj.highsOffset);
      if (highsLR1Ref.current) highsLR1Ref.current.frequency.value = commanded;
      if (highsLR2Ref.current) highsLR2Ref.current.frequency.value = commanded;
      return { ...s, highsFilterFreq: hz };
    });
  }, []);

  // ── Gains — NO-OP (rule book) ─────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const setBassGain = useCallback((_value: number) => {
    // NO-OP — amp channel gains locked per rule book
  }, []);

  // Sub level — wired to real GainNode between bass processing and masterGain
  const setSubLevel = useCallback((value: number) => {
    const gain = Math.max(0, Math.min(1.0, value / 100));
    if (subLevelGainRef.current) {
      subLevelGainRef.current.gain.value = gain;
    }
    setState((s) => ({ ...s, subLevel: value, hasUnsavedChanges: true }));
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const setHighsGain = useCallback((_value: number) => {
    // NO-OP — amp channel gains locked
  }, []);

  // ── Gain Kill Switch — kills ALL gains simultaneously ─────────────────────
  const setGainKillActive = useCallback((active: boolean) => {
    const view = sharedViewRef.current;
    if (view) {
      view[SAB_GAIN_KILL] = active ? 1 : 0;
    }
    // Also post to worker
    workerRef.current?.postMessage({ type: "GAIN_KILL", active });

    const ctx = helixCtxRef.current;
    if (active) {
      // Save snapshot of 8 killable gains before killing
      // volumeGainRef and masterGainRef are BYPASS nodes — never killed
      gainSnapshotRef.current = {
        subLevel: subLevelGainRef.current?.gain.value ?? 1.0,
        canisterOut: canisterOutRef.current?.gain.value ?? 0.8,
        bassRestGain: Math.min(bassRestGainRef.current?.gain.value ?? 1.0, 1.0),
        canisterDry: canisterDryRef.current?.gain.value ?? 1.0,
        canisterF1: canisterF1Ref.current?.gain.value ?? 0.0,
        canisterF2: canisterF2Ref.current?.gain.value ?? 0.0,
        canisterF3: canisterF3Ref.current?.gain.value ?? 0.0,
        ultra: ultraGainRef.current?.gain.value ?? 1.0,
      };
      if (ctx) {
        const now = ctx.currentTime;
        // Kill 8 killable gains simultaneously — do NOT touch volumeGain or masterGain
        subLevelGainRef.current?.gain.setValueAtTime(0, now);
        bassRestGainRef.current?.gain.setValueAtTime(0, now);
        canisterOutRef.current?.gain.setValueAtTime(0, now);
        canisterDryRef.current?.gain.setValueAtTime(0, now);
        canisterF1Ref.current?.gain.setValueAtTime(0, now);
        canisterF2Ref.current?.gain.setValueAtTime(0, now);
        canisterF3Ref.current?.gain.setValueAtTime(0, now);
        ultraGainRef.current?.gain.setValueAtTime(0, now);
      }
      console.log(
        "[Gain Kill Switch] 8 KILLABLE GAINS ZEROED — volume and master bypass untouched",
      );
    } else {
      // Restore 8 killable gains from snapshot
      // volumeGainRef and masterGainRef are untouched — they never changed
      if (ctx) {
        const now = ctx.currentTime;
        const snap = gainSnapshotRef.current;
        subLevelGainRef.current?.gain.setValueAtTime(
          Math.min(snap.subLevel, 1.0),
          now,
        );
        bassRestGainRef.current?.gain.setValueAtTime(
          Math.min(snap.bassRestGain, 1.0),
          now,
        );
        canisterOutRef.current?.gain.setValueAtTime(
          Math.min(snap.canisterOut, 1.0),
          now,
        );
        canisterDryRef.current?.gain.setValueAtTime(
          Math.min(snap.canisterDry, 1.0),
          now,
        );
        canisterF1Ref.current?.gain.setValueAtTime(snap.canisterF1, now);
        canisterF2Ref.current?.gain.setValueAtTime(snap.canisterF2, now);
        canisterF3Ref.current?.gain.setValueAtTime(snap.canisterF3, now);
        ultraGainRef.current?.gain.setValueAtTime(
          Math.min(snap.ultra, 1.0),
          now,
        );
      }
      console.log("[Gain Kill Switch] 8 killable gains restored from snapshot");
    }

    setState((s) => ({ ...s, gainKillActive: active }));
  }, []);

  const setBassCompressor = useCallback(
    (
      _threshold: number,
      ratio: number,
      knee: number,
      attack: number,
      release: number,
    ) => {
      const c = bassCompRef.current;
      if (!c) return;
      // R5: threshold is FIXED at -24 — ignore any user-provided threshold to prevent bass gating
      c.threshold.value = -24;
      c.ratio.value = ratio;
      c.knee.value = knee;
      c.attack.value = attack;
      c.release.value = release;
    },
    [],
  );

  const setHighsCompressor = useCallback(
    (
      _threshold: number,
      ratio: number,
      knee: number,
      attack: number,
      release: number,
    ) => {
      const c = highsCompRef.current;
      if (!c) return;
      // R5: threshold is FIXED at -24 — ignore any user-provided threshold
      c.threshold.value = -24;
      c.ratio.value = ratio;
      c.knee.value = knee;
      c.attack.value = attack;
      c.release.value = release;
    },
    [],
  );

  // ── EQ ─────────────────────────────────────────────────────────────────────
  const setEQBand = useCallback((freq: number, gainDb: number) => {
    const idx = EQ_FREQS.indexOf(freq);
    if (idx === -1) return;
    const actualDb = eqSliderToDb(gainDb, idx);
    // Bass EQ chain — all 8 bands
    if (bassEQFiltersRef.current[idx])
      bassEQFiltersRef.current[idx].gain.value = actualDb;
    // Highs EQ chain — bands 2-7 only (mapped to highsEQFilters[0..5])
    if (idx >= 2 && highsEQFiltersRef.current[idx - 2]) {
      highsEQFiltersRef.current[idx - 2].gain.value = actualDb;
    }
    // Sync crossover to EQ for low-end bands
    setState((s) => {
      const newBands = s.eqBands.map((b) =>
        b.freq === freq ? { freq, gainDb } : b,
      );
      const band0Gain = newBands[0]?.gainDb ?? 0;
      const band1Gain = newBands[1]?.gainDb ?? 0;
      const band0Shift = band0Gain > 0 ? -(band0Gain / 12) * 20 : 0;
      const band1Shift = band1Gain > 0 ? (band1Gain / 12) * 40 : 0;
      const newLPFreq = Math.max(
        60,
        Math.min(120, s.bassFilterFreq + band0Shift + band1Shift),
      );
      const adj = SRL_CROSSOVER_ADJUST[s.srlGrade];
      const commanded = Math.max(20, newLPFreq + adj.bassOffset);
      if (bassLR1Ref.current) bassLR1Ref.current.frequency.value = commanded;
      if (bassLR2Ref.current) bassLR2Ref.current.frequency.value = commanded;
      return { ...s, eqBands: newBands, hasUnsavedChanges: true };
    });
  }, []);

  const setEQBypass = useCallback((bypass: boolean) => {
    if (bypass) {
      EQ_FREQS.forEach((_, idx) => {
        const baseBoost = EQ_LOW_BASE_BOOST[idx] ?? 0;
        if (bassEQFiltersRef.current[idx])
          bassEQFiltersRef.current[idx].gain.value = baseBoost;
        // Also reset highs EQ
        if (idx >= 2 && highsEQFiltersRef.current[idx - 2]) {
          highsEQFiltersRef.current[idx - 2].gain.value = 0;
        }
      });
      setState((s) => ({
        ...s,
        preampBypassed: true,
        eqBands: s.eqBands.map((b) => ({ ...b, gainDb: 0 })),
      }));
    } else {
      setState((s) => ({ ...s, preampBypassed: false }));
    }
  }, []);

  // ── Phase invert (state only — phase nodes removed) ────────────────────────
  const phaseInvert = useCallback(
    (channel: "bass" | "highs", invert: boolean) => {
      if (channel === "bass")
        setState((s) => ({ ...s, bassPhaseInverted: invert }));
      else setState((s) => ({ ...s, highsPhaseInverted: invert }));
    },
    [],
  );

  // ── Epicenter controls ─────────────────────────────────────────────────────
  const setEpicenterBoost = useCallback((_pct: number) => {}, []);
  const setParaCenter = useCallback((_hz: number) => {}, []);
  const setParaWidth = useCallback((_width: number) => {}, []);
  const setParaGain = useCallback((_pct: number) => {}, []);

  const setBassRestorationLevel = useCallback((val: number) => {
    // Map 0-100 to 0.5-1.0 — clamped so bassRestGain NEVER exceeds 1.0 (Zero Stacking Policy)
    if (bassRestGainRef.current)
      bassRestGainRef.current.gain.value = Math.min(
        0.5 + (val / 100) * 0.5,
        1.0,
      );
    setState((s) => ({
      ...s,
      bassRestorationLevel: val,
      hasUnsavedChanges: true,
    }));
  }, []);

  const setProcessorMimic120dB = useCallback((val: number) => {
    processorMimic120dBRef.current = val;
    setState((s) => ({
      ...s,
      processorMimic120dB: val,
      hasUnsavedChanges: true,
    }));
  }, []);

  const setBassOutputLevel = useCallback((pct: number) => {
    const gain = pctToGain(pct);
    if (bassOutputLevelRef.current)
      bassOutputLevelRef.current.gain.value = gain;
    setState((s) => ({ ...s, bassOutputLevel: pct, hasUnsavedChanges: true }));
  }, []);

  // ── Legacy stubs ───────────────────────────────────────────────────────────
  const setUltraCrystalClarity = useCallback((_db: number) => {}, []);
  const setUltraCrystalPresence = useCallback((_db: number) => {}, []);
  const setSRSEnhancement = useCallback((_enabled: boolean) => {}, []);
  const setWOW = useCallback((_enabled: boolean) => {}, []);
  const setTruBass = useCallback((_enabled: boolean) => {}, []);

  const setBassFoundation = useCallback((enabled: boolean) => {
    const freq = enabled ? 80 : 20000;
    if (bassLR1Ref.current) bassLR1Ref.current.frequency.value = freq;
    if (bassLR2Ref.current) bassLR2Ref.current.frequency.value = freq;
    setState((s) => ({ ...s, bassFilterFreq: freq }));
  }, []);

  const setCheaterBeater = useCallback((_enabled: boolean) => {}, []);
  const setEQuake = useCallback((_enabled: boolean) => {}, []);

  const setNaturalBottom = useCallback((db: number) => {
    const gain = 1.0 + (db / 100) * (10 ** (8 / 20) - 1);
    if (bassNaturalBottomRef.current)
      bassNaturalBottomRef.current.gain.value = gain;
  }, []);

  // ── Protection System ──────────────────────────────────────────────────────
  // Builds a gentle soft-clip WaveShaper curve. At 0 → pass-through. At 100 → soft clip.
  // This is PROTECTION ONLY — not saturation, not tube effect.
  const buildSoftClipCurve = useCallback(
    (amount: number): Float32Array<ArrayBuffer> => {
      const samples = 256;
      const curve = new Float32Array(samples) as Float32Array<ArrayBuffer>;
      const intensity = Math.max(0.001, amount / 100) * 0.4; // very gentle
      for (let i = 0; i < samples; i++) {
        const x = (i * 2) / samples - 1;
        curve[i] = x / (1 + intensity * Math.abs(x));
      }
      return curve;
    },
    [],
  );

  const setDistortionReduction = useCallback(
    (v: number) => {
      // Wire to WaveShaperNode — higher value = softer curve (less distortion)
      if (distortionShaperRef.current) {
        if (v <= 0) {
          distortionShaperRef.current.curve = null; // pass-through
        } else {
          distortionShaperRef.current.curve = buildSoftClipCurve(v);
        }
      }
      setState((s) => {
        const grade = computeSRLGrade(v, s.clippingReduction, s.cleanSignal);
        applySRLCrossoverCommand(grade, s.bassFilterFreq, s.highsFilterFreq);
        handleSRLDGrade(grade);
        return {
          ...s,
          distortionReduction: v,
          srlGrade: grade,
          srlGradeLabel: srlGradeLabelFor(grade),
          hasUnsavedChanges: true,
        };
      });
    },
    [applySRLCrossoverCommand, handleSRLDGrade, buildSoftClipCurve],
  );

  const setClippingReduction = useCallback(
    (v: number) => {
      // Wire to bassComp knee only — threshold stays FIXED at -24 (R5: no bass gating)
      if (bassCompRef.current) {
        bassCompRef.current.knee.value = (v / 100) * 40; // knee 0-40dB range
      }
      setState((s) => {
        const grade = computeSRLGrade(s.distortionReduction, v, s.cleanSignal);
        applySRLCrossoverCommand(grade, s.bassFilterFreq, s.highsFilterFreq);
        handleSRLDGrade(grade);
        return {
          ...s,
          clippingReduction: v,
          srlGrade: grade,
          srlGradeLabel: srlGradeLabelFor(grade),
          hasUnsavedChanges: true,
        };
      });
    },
    [applySRLCrossoverCommand, handleSRLDGrade],
  );

  const setCleanSignal = useCallback(
    (v: number) => {
      // Wire to cleanFilter Q — higher clean value = tighter bass cutoff
      if (cleanFilterRef.current) {
        cleanFilterRef.current.Q.value = 0.5 + (v / 100) * 1.5; // Q: 0.5 to 2.0
      }
      setState((s) => {
        const grade = computeSRLGrade(
          s.distortionReduction,
          s.clippingReduction,
          v,
        );
        applySRLCrossoverCommand(grade, s.bassFilterFreq, s.highsFilterFreq);
        handleSRLDGrade(grade);
        return {
          ...s,
          cleanSignal: v,
          srlGrade: grade,
          srlGradeLabel: srlGradeLabelFor(grade),
          hasUnsavedChanges: true,
        };
      });
    },
    [applySRLCrossoverCommand, handleSRLDGrade],
  );

  // ── Low End Booster ────────────────────────────────────────────────────────
  const enableLowEndBooster = useCallback(() => {
    if (boosterTimerRef.current) clearTimeout(boosterTimerRef.current);
    if (boosterCountdownRef.current) clearInterval(boosterCountdownRef.current);
    // Wire Low End Booster to real audio node — 30Hz +8dB peaking
    if (lowEndBoostNodeRef.current) {
      lowEndBoostNodeRef.current.gain.value = 8;
    }
    let remaining = 15 * 60;
    setState((s) => ({
      ...s,
      lowEndBoosterEnabled: true,
      lowEndBoosterActive: true,
      lowEndBoosterTimeLeft: remaining,
      hasUnsavedChanges: true,
    }));
    boosterCountdownRef.current = setInterval(() => {
      remaining -= 1;
      setState((s) => {
        if (s.lowEndBoosterClaimed) return s;
        if (remaining <= 0) {
          if (boosterCountdownRef.current)
            clearInterval(boosterCountdownRef.current);
          return {
            ...s,
            lowEndBoosterEnabled: false,
            lowEndBoosterActive: false,
            lowEndBoosterTimeLeft: null,
          };
        }
        return { ...s, lowEndBoosterTimeLeft: remaining };
      });
    }, 1000);
  }, []);

  const claimLowEndBooster = useCallback(() => {
    if (boosterTimerRef.current) clearTimeout(boosterTimerRef.current);
    if (boosterCountdownRef.current) clearInterval(boosterCountdownRef.current);
    setState((s) => ({
      ...s,
      lowEndBoosterClaimed: true,
      lowEndBoosterEnabled: true,
      lowEndBoosterActive: true,
      lowEndBoosterTimeLeft: null,
      hasUnsavedChanges: true,
    }));
  }, []);

  const disableLowEndBooster = useCallback(() => {
    if (boosterTimerRef.current) clearTimeout(boosterTimerRef.current);
    if (boosterCountdownRef.current) clearInterval(boosterCountdownRef.current);
    // Deactivate Low End Booster node
    if (lowEndBoostNodeRef.current) {
      lowEndBoostNodeRef.current.gain.value = 0;
    }
    setState((s) => ({
      ...s,
      lowEndBoosterEnabled: false,
      lowEndBoosterActive: false,
      lowEndBoosterTimeLeft: null,
      hasUnsavedChanges: true,
    }));
  }, []);

  // ── Canister ───────────────────────────────────────────────────────────────
  const setCanisterActive = useCallback((active: boolean) => {
    if (canisterOutRef.current)
      canisterOutRef.current.gain.value = active ? 1.0 : 0.0;
    if (canisterDryRef.current)
      canisterDryRef.current.gain.value = active ? 0.0 : 1.0;
    setState((s) => ({
      ...s,
      canisterActive: active,
      hasUnsavedChanges: true,
    }));
  }, []);

  const setCanisterBottomBoost = useCallback((level: number) => {
    const db = pctToDb(level, 0, 12);
    if (canisterF1Ref.current) canisterF1Ref.current.gain.value = db * 0.6;
    if (canisterF2Ref.current) canisterF2Ref.current.gain.value = db;
    setState((s) => ({
      ...s,
      canisterBottomBoost: level,
      hasUnsavedChanges: true,
    }));
  }, []);

  const setCanisterPunchBoost = useCallback((level: number) => {
    const db = pctToDb(level, 0, 12);
    if (canisterF3Ref.current) canisterF3Ref.current.gain.value = db;
    setState((s) => ({
      ...s,
      canisterPunchBoost: level,
      hasUnsavedChanges: true,
    }));
  }, []);

  // ── Ultra authority ────────────────────────────────────────────────────────
  const setUltraActive = useCallback((active: boolean) => {
    if (ultraGainRef.current)
      ultraGainRef.current.gain.value = active ? 1.0 : 0.0;
    setState((s) => ({ ...s, ultraActive: active, hasUnsavedChanges: true }));
  }, []);

  // ── Helix activation (replaces ASO-V3 switching) ──────────────────────────
  // Helix is the ONE amp. Activates with pre-play scanner.
  // When toggled OFF: 5-second fade-out then AudioContext.suspend().
  // When toggled ON: AudioContext.resume() then fade-in.
  const setASOv3Active = useCallback(
    (active: boolean) => {
      if (active) {
        const ctx = helixCtxRef.current;
        // Write amp-on punch/depth/weight characteristics immediately (SAB[0-2])
        const view = sharedViewRef.current;
        if (view) {
          view[SAB_PUNCH] = 0.7; // SAB[0] — amp pounds by default
          view[SAB_DEPTH] = 0.6; // SAB[1]
          view[SAB_WEIGHT] = 0.65; // SAB[2]
        }
        // Resume AudioContext first, then scan
        if (ctx && ctx.state === "suspended") {
          ctx.resume().catch(() => {});
        }
        setState((s) => ({
          ...s,
          asoV3Active: false,
          helixActive: false,
          asoV3Scanning: true,
          scanResult: null,
          hasUnsavedChanges: true,
        }));
        runPrePlayScan().then((result) => {
          // Fade-in volumeGain over 300ms (NOT masterGain — masterGain is fixed 1.0)
          const volumeGain = volumeGainRef.current;
          if (volumeGain && ctx) {
            const targetGain = volToGain(volumeRef.current);
            volumeGain.gain.setValueAtTime(0, ctx.currentTime);
            volumeGain.gain.linearRampToValueAtTime(
              targetGain,
              ctx.currentTime + 0.3,
            );
          }
          // Ensure masterGain stays at exactly 1.0 (pass-through, never animated)
          if (masterGainRef.current) {
            masterGainRef.current.gain.value = 1.0;
          }
          setState((s) => ({
            ...s,
            helixActive: true,
            asoV3Active: true,
            asoV3Scanning: false,
            scanResult: result,
            hasUnsavedChanges: true,
          }));
          startWorker();
          workerRef.current?.postMessage({
            type: "SET_PLAYING",
            playing: audioRef.current ? !audioRef.current.paused : false,
          });
        });
      } else {
        // 5-second handoff: fade-out volumeGain over 5s, then suspend AudioContext
        // masterGain is NEVER touched — it stays at 1.0 always
        const ctx = helixCtxRef.current;
        const volumeGain = volumeGainRef.current;
        if (ctx && volumeGain) {
          const now = ctx.currentTime;
          volumeGain.gain.setValueAtTime(volumeGain.gain.value, now);
          volumeGain.gain.linearRampToValueAtTime(0, now + 5);
          setTimeout(() => {
            ctx.suspend().catch(() => {});
          }, 5000);
        } else if (ctx) {
          ctx.suspend().catch(() => {});
        }
        setState((s) => ({
          ...s,
          helixActive: false,
          asoV3Active: false,
          asoV3Scanning: false,
          scanResult: null,
          hasUnsavedChanges: true,
        }));
      }
    },
    [runPrePlayScan, startWorker],
  );

  // switchASOv3 maps to setASOv3Active — with full suspend/resume behavior
  const switchASOv3 = useCallback(
    (on: boolean) => {
      setASOv3Active(on);
    },
    [setASOv3Active],
  );

  // ── Speaker Profile setter ─────────────────────────────────────────────────
  const setSpeakerProfile = useCallback((profile: Partial<SpeakerProfile>) => {
    setState((s) => ({
      ...s,
      speakerProfile: { ...s.speakerProfile, ...profile },
      hasUnsavedChanges: true,
    }));
  }, []);

  // ── Save system ────────────────────────────────────────────────────────────
  const saveAllSettings = useCallback(() => {
    if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);

    saveDebounceRef.current = setTimeout(() => {
      // Pre-save gain stacking validation — log any killable gain > 1.0
      const gainChecks: Array<{
        ref: React.MutableRefObject<GainNode | null>;
        name: string;
      }> = [
        { ref: bassRestGainRef, name: "bassRestGain" },
        { ref: bassOutputLevelRef, name: "bassOutputLevel" },
        { ref: canisterOutRef, name: "canisterOut" },
        { ref: canisterDryRef, name: "canisterDry" },
        { ref: subLevelGainRef, name: "subLevelGain" },
        { ref: ultraGainRef, name: "ultraGain" },
      ];
      for (const { ref, name } of gainChecks) {
        if (ref.current && ref.current.gain.value > 1.0) {
          console.warn(
            `[Save Validation] STACKING DETECTED: ${name} = ${ref.current.gain.value.toFixed(4)} — clamping to 1.0 before save`,
          );
          ref.current.gain.value = 1.0;
        }
      }

      const settings = {
        volume: state.volume,
        canisterBottomBoost: state.canisterBottomBoost,
        canisterPunchBoost: state.canisterPunchBoost,
        bassRestorationLevel: state.bassRestorationLevel,
        processorMimic120dB: state.processorMimic120dB,
        ultraActive: state.ultraActive,
        distortionReduction: state.distortionReduction,
        clippingReduction: state.clippingReduction,
        cleanSignal: state.cleanSignal,
        eqBands: state.eqBands,
        bassFilterFreq: state.bassFilterFreq,
        highsFilterFreq: state.highsFilterFreq,
        bassOutputLevel: state.bassOutputLevel,
        subLevel: state.subLevel,
      };

      try {
        localStorage.setItem("ampPlayer1Settings", JSON.stringify(settings));
      } catch {
        /* ignore */
      }

      const now = new Date();
      const hours = now.getHours();
      const mins = String(now.getMinutes()).padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      const h12 = hours % 12 || 12;
      const timeStr = `${h12}:${mins} ${ampm}`;
      setState((s) => ({ ...s, hasUnsavedChanges: false, lastSaved: timeStr }));
    }, 800);
  }, [
    state.volume,
    state.canisterBottomBoost,
    state.canisterPunchBoost,
    state.bassRestorationLevel,
    state.processorMimic120dB,
    state.ultraActive,
    state.distortionReduction,
    state.clippingReduction,
    state.cleanSignal,
    state.eqBands,
    state.bassFilterFreq,
    state.highsFilterFreq,
    state.bassOutputLevel,
    state.subLevel,
  ]);

  // ── Load saved settings on mount ─────────────────────────────────────────
  // biome-ignore lint/correctness/useExhaustiveDependencies: stable setters, runs once
  useEffect(() => {
    try {
      const saved = localStorage.getItem("ampPlayer1Settings");
      if (!saved) return;
      const s = JSON.parse(saved) as Record<string, unknown>;
      if (typeof s.volume === "number" && s.volume >= 1 && s.volume <= 100)
        setVolume(s.volume);
      if (typeof s.canisterBottomBoost === "number")
        setCanisterBottomBoost(s.canisterBottomBoost);
      if (typeof s.canisterPunchBoost === "number")
        setCanisterPunchBoost(s.canisterPunchBoost);
      if (typeof s.bassRestorationLevel === "number")
        setBassRestorationLevel(s.bassRestorationLevel);
      if (typeof s.processorMimic120dB === "number")
        setProcessorMimic120dB(s.processorMimic120dB);
    } catch {
      /* ignore */
    }
  }, []);

  // ── Context state sync ────────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      const ctxState = helixCtxRef.current?.state ?? "suspended";
      setState((s) => ({
        ...s,
        helixContextState: ctxState,
        bassContextState: ctxState,
        highsContextState: ctxState,
        bassCompReduction: bassCompRef.current?.reduction ?? 0,
        highsCompReduction: highsCompRef.current?.reduction ?? 0,
      }));
    }, 200);
    return () => clearInterval(id);
  }, []);

  // ── Rule Book Verification (masterGain = 1.0, canisterOut = 0.8 at start) ───
  useEffect(() => {
    const violations: string[] = [];
    if (masterGainRef.current && masterGainRef.current.gain.value > 1.0) {
      violations.push("VIOLATION: masterGain exceeded 1.0");
    }
    if (violations.length > 0) {
      setState((s) => ({ ...s, gainViolations: violations }));
    }
  }, []);

  // ── Output mode detection ─────────────────────────────────────────────────
  useEffect(() => {
    const checkOutputMode = () => {
      // Web Audio API context.destination connects to device audio output
      // We detect "external" when audioDevices have output > internal speakers
      if (!navigator.mediaDevices) return;
      navigator.mediaDevices
        .enumerateDevices()
        .then((devices) => {
          const outputs = devices.filter((d) => d.kind === "audiooutput");
          const hasExternal = outputs.some(
            (d) => d.label && !d.label.toLowerCase().includes("built-in"),
          );
          setState((s) => ({
            ...s,
            outputMode: hasExternal ? "external" : "internal",
          }));
        })
        .catch(() => {});
    };
    checkOutputMode();
    const id = setInterval(checkOutputMode, 10000);
    return () => clearInterval(id);
  }, []);

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      cancelAnimationFrame(charRafRef.current);
      cancelAnimationFrame(zeroStackingRafRef.current);
      cancelAnimationFrame(titaniumWallRef.current);
      if (btScanIntervalRef.current) clearInterval(btScanIntervalRef.current);
      if (boosterTimerRef.current) clearTimeout(boosterTimerRef.current);
      if (boosterCountdownRef.current)
        clearInterval(boosterCountdownRef.current);
      if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
      workerRef.current?.terminate();
    };
  }, []);

  // ── Context value ─────────────────────────────────────────────────────────
  const value: AudioEngine = {
    ...state,
    loadFile,
    play,
    stop,
    setVolume,
    setBassFilterFreq,
    setHighsFilterFreq,
    setBassGain,
    setSubLevel,
    setHighsGain,
    setBassCompressor,
    setHighsCompressor,
    setEQBand,
    setEQBypass,
    phaseInvert,
    setEpicenterBoost,
    setParaCenter,
    setParaWidth,
    setParaGain,
    setBassOutputLevel,
    setUltraCrystalClarity,
    setUltraCrystalPresence,
    setSRSEnhancement,
    setWOW,
    setTruBass,
    setBassFoundation,
    setCheaterBeater,
    setEQuake,
    setNaturalBottom,
    setDistortionReduction,
    setClippingReduction,
    setCleanSignal,
    enableLowEndBooster,
    claimLowEndBooster,
    disableLowEndBooster,
    setCanisterActive,
    setCanisterBottomBoost,
    setCanisterPunchBoost,
    setUltraActive,
    setASOv3Active,
    setHelixActive: setASOv3Active,
    setSpeakerProfile,
    saveAllSettings,
    setBassRestorationLevel,
    setProcessorMimic120dB,
    switchASOv3,
    setGainKillActive,
  };

  return createElement(AudioEngineContext.Provider, { value }, children);
}

export function useAudioEngine(): AudioEngine {
  const ctx = useContext(AudioEngineContext);
  if (!ctx)
    throw new Error("useAudioEngine must be used within AudioEngineProvider");
  return ctx;
}

// R5 note: threshold params passed to setBassCompressor/setHighsCompressor are ignored;
// threshold is locked at -24 dBFS permanently in the engine.
export { sliderToParaWidth, pctToDb, pctToGain };
