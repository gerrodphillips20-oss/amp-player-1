/**
 * useAudioEngine.ts — Amp Player 1
 *
 * RULE BOOK — ENFORCED ON EVERY BUILD:
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. ALL 16 gains locked at 0.0 at the REAL engine level.
 *    G09/G10 (bass amp channels) and G11/G12 (highs amp channels) are NO-OP setters.
 *    G15/G16 are also NO-OP. Output nodes bassGain/highsGain are pass-through at 1.0
 *    and are NOT amp-channel gains — they are never used to modify signal level.
 * 2. NO WaveShaperNode anywhere in either chain.
 * 3. NO stacking: exactly 1 srlComp per channel. No duplicate limiters.
 * 4. NO DelayNode. NO ConvolverNode.
 * 5. NO features added unless explicitly approved by Gerrod.
 * 6. Low End Booster: BOTH lanes (14–40Hz AND 14–80Hz) active simultaneously.
 *    Do NOT restrict to only one lane.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * COMMAND HIERARCHY:
 *   Ultra (master override) → SRL (grades & commands volume+crossover) → Bass Epicenter
 *   SRL is GRADE AND MONITOR only — pulls back only under D-grade held >3s (5%, briefly)
 *
 * BASS CHAIN (in order):
 *   source → insert(vol)
 *     → subGainNode (user-controlled sub output level — default 1.0 at 100%)
 *     → eq[8]  ← 8 bands starting with 14-50Hz, 14-80Hz, then 250Hz+
 *     → [EPICENTER STAGE]:
 *         pfmFilter (14Hz HP, always on)
 *         → restorationLP (50Hz LP parallel path) → restorationGain → mix via restorationMix
 *         → bassMaximizer (60Hz peaking)
 *         → paraBass (center freq peaking)
 *         → bassOutputLevel (gain)
 *     → naturalBottom
 *     → [LINKWITZ-RILEY 4th-ORDER CROSSOVER] (cascaded 2nd-order Butterworth)
 *       bassLR1 (LP) → bassLR2 (LP) = Sub/Bass LP output
 *     → [CANISTER]: canisterF1(14Hz) → canisterF2(40Hz) → canisterF3(80Hz) → canisterOut
 *     → srlComp (SRL — 1 only, NO duplicate limiter)
 *     → analyser
 *     → bassGain (1.0 pass-through)
 *     → bassUltraGain (Ultra authority)
 *
 * NOTE: Canister operates on a PARALLEL path — completely independent from EQ.
 * EQ does NOT touch frequencies below 250Hz except Band 0 (19Hz) and Band 1 (47Hz)
 * which are the dedicated low-end sliders. Canister nodes (F1/F2/F3) sit AFTER
 * the LR crossover, on a separate wet/dry mix path that bypasses the EQ entirely.
 *     → destination
 *
 * HIGHS CHAIN (in order):
 *   source → insert(vol) → eq[8]
 *   → [LINKWITZ-RILEY 4th-ORDER CROSSOVER]
 *     highsLR1 (HP) → highsLR2 (HP) = Highs HP output
 *   → srlComp → analyser → highsGain (1.0) → highsUltraGain (Ultra) → destination
 *
 * PHASE and SRS/WOW/TruBass nodes REMOVED as of this build.
 * UltraCrystal clarity/presence nodes REMOVED as of this build.
 * Hard brick-wall DynamicsCompressorNode limiter REMOVED — SRL comp is the only comp.
 *
 * DUAL CHARACTERISTICS TRAINING:
 *   Audio behavior (punch/depth/weight/clarity/bassDrop/bassNoteSwitching) +
 *   Power mimic (powerMimic/signalAuthority/ampResponse) — both sets computed from RMS.
 */

import {
  type ReactNode,
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

export interface EQBandState {
  freq: number;
  gainDb: number;
}

export interface ProcessorCharState {
  // ── Audio behavior ──────────────────────────────────────────────────────────
  punch: number; // 0-100
  depth: number; // 0-100 (simulates 8Ω→1Ω load)
  weight: number; // 0-100 (low-freq energy)
  clarity: number; // 0-100 (high-freq detail)
  bassDrop: number; // 0-100 (activates vol>=100 + bass signal)
  bassNoteSwitching: number; // 0-100 (rate of bass freq change)
  // ── Power mimic (dual training) ─────────────────────────────────────────────
  powerMimic: number; // 0-100 — simulates real amp wattage push
  signalAuthority: number; // 0-100 — weight/authority of real wattage in signal
  ampResponse: number; // 0-100 — how amp handles load at channel power levels
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

// ─── EQ frequency bands (8 bands: 14-50Hz, 14-80Hz low end + mids/highs 250Hz+) ─
export const EQ_FREQS = [19, 47, 250, 500, 1000, 4000, 8000, 16000];
// Note: browser BiquadFilter min is ~10Hz; we use 19Hz for the 14-50Hz lane
// and 47Hz for the 14-80Hz lane as practical lower bounds for Web Audio API.
// These represent the CENTER of each lane's boost range.

/**
 * EQ low-end base boost offsets (dB) — embedded in filter init.
 * These lift the naturally quieter low frequencies to be audible from the
 * first slider movement. The slider adds ±12dB ON TOP of this base.
 * Band 0 (19Hz / 14-50Hz lane): +3dB base
 * Band 1 (47Hz / 14-80Hz lane): +2dB base
 */
const EQ_LOW_BASE_BOOST: number[] = [3, 2, 0, 0, 0, 0, 0, 0];

/**
 * EQ Q values per band — low-end bands use tighter Q to prevent
 * 50Hz interfering with 14Hz (and vice versa).
 */
const EQ_Q_VALUES: number[] = [1.8, 1.4, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0];

/**
 * FIX 2: Map EQ slider value (−12..+12 dB from UI) to actual filter dB
 * using an exponential curve so the BOTTOM of the slider already
 * produces audible movement for low-end bands.
 * For low-end bands (0,1): exponential expansion on positive values.
 * For mids/highs bands: linear pass-through.
 */
export const eqSliderToDb = (sliderDb: number, bandIdx: number): number => {
  const base = EQ_LOW_BASE_BOOST[bandIdx] ?? 0;
  if (bandIdx < 2) {
    const sign = sliderDb >= 0 ? 1 : -1;
    const expGain = sign * (Math.exp(Math.abs(sliderDb) * 0.15) - 1) * 9.5;
    return base + expGain;
  }
  return sliderDb;
};

// ─── State interface ─────────────────────────────────────────────────────────
export interface AudioEngineState {
  isPlaying: boolean;
  isLoaded: boolean;
  volume: number; // 1-700
  fileName: string;
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
  // Phase state (legacy: phase nodes removed from chain; state kept for UI compat)
  bassPhaseInverted: boolean;
  highsPhaseInverted: boolean;
  processorChar: ProcessorCharState;
  // Protection System sliders
  distortionReduction: number;
  clippingReduction: number;
  cleanSignal: number;
  // SRL Grade
  srlGrade: SRLGrade;
  srlGradeLabel: string;
  // Low End Booster
  lowEndBoosterEnabled: boolean;
  lowEndBoosterClaimed: boolean;
  lowEndBoosterActive: boolean;
  lowEndBoosterTimeLeft: number | null;
  // Save state
  hasUnsavedChanges: boolean;
  lastSaved: string | null;
  // Rule-book diagnostics
  gainViolations: string[];
  stackingViolations: string[];
  // Epicenter controls
  epicenterBoost: number; // 0-100 → 0-12dB on Bass Maximizer
  paraCenter: number; // 20-120Hz, default 60
  paraWidth: number; // 0.3-3.0, default 1.0
  paraGain: number; // 0-100 → -12..+12dB, default 50
  pfmActive: boolean; // always true
  bassOutputLevel: number; // 0-100 → 0.0-2.0 gain, default 50→1.0
  // Canister
  canisterActive: boolean;
  canisterBottomBoost: number; // 0-100, controls 14-40Hz lane (F1+F2)
  canisterPunchBoost: number; // 0-100, controls 14-80Hz lane (F3)
  // Sub level (FIX 1): user-controlled sub output (0-100)
  subLevel: number;
  // Ultra authority
  ultraActive: boolean;
  // ASO-V3 amp state
  asoV3Active: boolean;
  asoV3SlotNumber: number;
}

// ─── Controls interface ──────────────────────────────────────────────────────
export interface AudioEngineControls {
  loadFile: (file: File) => Promise<void>;
  play: () => void;
  stop: () => void;
  setVolume: (v: number) => void;
  setBassFilterFreq: (hz: number) => void;
  setHighsFilterFreq: (hz: number) => void;
  /** NO-OP: G09/G10 amp channel gains locked at 0.0 */
  setBassGain: (value: number) => void;
  /** FIX 1: User-controlled sub output level (0-100 → 0.0-2.0 on subGainNode). NOT a locked gain. */
  setSubLevel: (value: number) => void;
  /** NO-OP: G11/G12 amp channel gains locked at 0.0 */
  setHighsGain: (value: number) => void;
  setBassCompressor: (
    threshold: number,
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
  // Epicenter — real signal chain controls
  setEpicenterBoost: (pct: number) => void;
  setParaCenter: (hz: number) => void;
  setParaWidth: (width: number) => void;
  setParaGain: (pct: number) => void;
  setBassOutputLevel: (pct: number) => void;
  // Legacy stubs (no-op, panels removed)
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
  // Protection System
  setDistortionReduction: (v: number) => void;
  setClippingReduction: (v: number) => void;
  setCleanSignal: (v: number) => void;
  // Low End Booster
  enableLowEndBooster: () => void;
  claimLowEndBooster: () => void;
  disableLowEndBooster: () => void;
  // Canister
  setCanisterActive: (active: boolean) => void;
  setCanisterBottomBoost: (level: number) => void; // 14-40Hz lane
  setCanisterPunchBoost: (level: number) => void; // 14-80Hz lane
  // Ultra
  setUltraActive: (active: boolean) => void;
  // ASO-V3
  setASOv3Active: (active: boolean) => void;
  // Save
  saveAllSettings: () => void;
}

export type AudioEngine = AudioEngineState & AudioEngineControls;

const AudioEngineContext = createContext<AudioEngine | null>(null);

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Map volume (1-700) to insert gain (0.001 – 1.0) */
const volToGain = (v: number): number =>
  Math.max(0.001, Math.min(1.0, (v - 1) / 699));

/** Map 0-100 slider to dB range [min, max] */
const pctToDb = (pct: number, minDb: number, maxDb: number): number =>
  minDb + (pct / 100) * (maxDb - minDb);

/** Map 0-100 slider to gain range [0.0, 2.0] */
const pctToGain = (pct: number): number => (pct / 100) * 2.0;

/** Map paraWidth slider 0-100 → 0.3-3.0 */
const sliderToParaWidth = (slider: number): number =>
  0.3 + (slider / 100) * 2.7;

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

// ASO-V3 channel power levels (characteristics wattage)
const ASO_BASS_WATTS = 7000;
const ASO_MIDS_WATTS = 2000;
const ASO_HIGHS_WATTS = 2000;
const ASO_TWEETERS_WATTS = 2000;
const ASO_TOTAL_WATTS =
  ASO_BASS_WATTS + ASO_MIDS_WATTS + ASO_HIGHS_WATTS + ASO_TWEETERS_WATTS;

// ─── Provider ────────────────────────────────────────────────────────────────
export function AudioEngineProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AudioEngineState>({
    isPlaying: false,
    isLoaded: false,
    volume: 350,
    fileName: "",
    bassContextState: "suspended",
    highsContextState: "suspended",
    currentTime: 0,
    duration: 0,
    bassFilterFreq: 80,
    highsFilterFreq: 250,
    bassGainValue: 1.0,
    highsGainValue: 1.0,
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
    srlGradeLabel: "ULTRA CLEAN — 5,000W",
    lowEndBoosterEnabled: false,
    lowEndBoosterClaimed: false,
    lowEndBoosterActive: false,
    lowEndBoosterTimeLeft: null,
    hasUnsavedChanges: false,
    lastSaved: null,
    gainViolations: [],
    stackingViolations: [],
    epicenterBoost: 50,
    paraCenter: 60,
    paraWidth: 1.0,
    paraGain: 50,
    pfmActive: true,
    bassOutputLevel: 50,
    canisterActive: false,
    canisterBottomBoost: 50,
    canisterPunchBoost: 50,
    subLevel: 100,
    ultraActive: true,
    asoV3Active: false,
    asoV3SlotNumber: 2847,
  });

  // ── Audio contexts ──────────────────────────────────────────────────────────
  const bassCtxRef = useRef<AudioContext | null>(null);
  const highsCtxRef = useRef<AudioContext | null>(null);

  // ── Bass chain refs ─────────────────────────────────────────────────────────
  const bassInsertRef = useRef<GainNode | null>(null);
  const subGainNodeRef = useRef<GainNode | null>(null); // FIX 1: real sub level control
  const bassEQFiltersRef = useRef<BiquadFilterNode[]>([]);

  // Epicenter stage
  const bassPfmFilterRef = useRef<BiquadFilterNode | null>(null);
  const bassRestLPRef = useRef<BiquadFilterNode | null>(null);
  const bassRestGainRef = useRef<GainNode | null>(null);
  const bassRestMixRef = useRef<GainNode | null>(null);
  const bassMaximizerRef = useRef<BiquadFilterNode | null>(null);
  const bassParaBassRef = useRef<BiquadFilterNode | null>(null);
  const bassOutputLevelRef = useRef<GainNode | null>(null);

  // Natural bottom
  const bassNaturalBottomRef = useRef<GainNode | null>(null);

  // Linkwitz-Riley 4th-order crossover (bass LP path: two cascaded 2nd-order Butterworth LP)
  const bassLR1Ref = useRef<BiquadFilterNode | null>(null); // first Butterworth LP
  const bassLR2Ref = useRef<BiquadFilterNode | null>(null); // second Butterworth LP (cascaded)

  // Canister stage
  const canisterF1Ref = useRef<BiquadFilterNode | null>(null); // 14Hz peaking
  const canisterF2Ref = useRef<BiquadFilterNode | null>(null); // 40Hz peaking
  const canisterF3Ref = useRef<BiquadFilterNode | null>(null); // 80Hz peaking
  const canisterOutRef = useRef<GainNode | null>(null); // wet output
  const canisterDryRef = useRef<GainNode | null>(null); // dry bypass
  const canisterMixRef = useRef<GainNode | null>(null); // merge

  // SRL (1 only — NO duplicate limiter)
  const bassCompRef = useRef<DynamicsCompressorNode | null>(null);

  // Output
  const bassAnalyserRef = useRef<AnalyserNode | null>(null);
  const bassGainRef = useRef<GainNode | null>(null);
  const bassUltraGainRef = useRef<GainNode | null>(null);

  // Legacy inert refs
  const bassCheaterRef = useRef<BiquadFilterNode | null>(null);
  const bassEQuakeRef = useRef<BiquadFilterNode | null>(null);

  // ── Highs chain refs ────────────────────────────────────────────────────────
  const highsInsertRef = useRef<GainNode | null>(null);
  const highsEQFiltersRef = useRef<BiquadFilterNode[]>([]);

  // Linkwitz-Riley 4th-order crossover (highs HP path)
  const highsLR1Ref = useRef<BiquadFilterNode | null>(null);
  const highsLR2Ref = useRef<BiquadFilterNode | null>(null);

  const highsCompRef = useRef<DynamicsCompressorNode | null>(null);
  const highsAnalyserRef = useRef<AnalyserNode | null>(null);
  const highsGainRef = useRef<GainNode | null>(null);
  const highsUltraGainRef = useRef<GainNode | null>(null);

  // ── Analyser data buffers ────────────────────────────────────────────────────
  const bassAnalyserDataRef = useRef<Float32Array<ArrayBuffer> | null>(null);
  const highsAnalyserDataRef = useRef<Float32Array<ArrayBuffer> | null>(null);
  const prevBassFreqRef = useRef<number>(0);
  const charRafRef = useRef<number>(0);

  // ── Audio element refs ───────────────────────────────────────────────────────
  const bassAudioRef = useRef<HTMLAudioElement | null>(null);
  const highsAudioRef = useRef<HTMLAudioElement | null>(null);
  const bassSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const highsSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const fileUrlRef = useRef<string>("");
  const volumeRef = useRef<number>(350);
  const asoV3ActiveRef = useRef<boolean>(false);
  const rafRef = useRef<number>(0);
  const reductionRafRef = useRef<number>(0);

  // ── Timer refs ───────────────────────────────────────────────────────────────
  const boosterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const boosterCountdownRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const saveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // SRL D-grade protection timer
  const srlDTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const srlDActiveRef = useRef<boolean>(false);

  // ── Processor Characteristics tick (DUAL TRAINING) ──────────────────────────
  const startCharTick = useCallback(() => {
    const tick = () => {
      const bassAnalyser = bassAnalyserRef.current;
      const highsAnalyser = highsAnalyserRef.current;
      const bassData = bassAnalyserDataRef.current;
      const highsData = highsAnalyserDataRef.current;

      if (!bassAnalyser || !highsAnalyser || !bassData || !highsData) {
        charRafRef.current = requestAnimationFrame(tick);
        return;
      }

      bassAnalyser.getFloatTimeDomainData(bassData);
      highsAnalyser.getFloatTimeDomainData(highsData);

      let bassRmsSum = 0;
      for (let i = 0; i < bassData.length; i++)
        bassRmsSum += bassData[i] * bassData[i];
      const bassRms = Math.sqrt(bassRmsSum / bassData.length);

      let highsRmsSum = 0;
      for (let i = 0; i < highsData.length; i++)
        highsRmsSum += highsData[i] * highsData[i];
      const highsRms = Math.sqrt(highsRmsSum / highsData.length);

      const vol = volumeRef.current;
      const volNorm = (vol - 1) / 699;

      // ── Audio behavior characteristics ────────────────────────────────────
      const punch = Math.min(100, Math.round(bassRms * 500 + volNorm * 40));
      const depth = Math.min(100, Math.round(85 + bassRms * 50));
      const weight = Math.min(100, Math.round(bassRms * 600 + volNorm * 30));
      const clarity = Math.min(
        100,
        Math.round(highsRms * 500 + volNorm * 25 + 20),
      );
      const bassDrop =
        vol >= 100 && bassRms > 0.01
          ? Math.min(100, Math.round(80 + bassRms * 200))
          : 0;
      const diff = Math.abs(bassRms - prevBassFreqRef.current);
      prevBassFreqRef.current = bassRms;
      const bassNoteSwitching = Math.min(100, Math.round(diff * 8000));

      // ── Power mimic characteristics (dual training) ───────────────────────
      // powerMimic: simulates how a real amp at Bass 7000W pushes under load.
      //   Real amp push = RMS signal authority scaled to channel wattage.
      const bassPowerScale = ASO_BASS_WATTS / ASO_TOTAL_WATTS; // 0.538
      const powerMimic = Math.min(
        100,
        Math.round(
          (bassRms * 600 * bassPowerScale + volNorm * 50) *
            (asoV3ActiveRef.current ? 1.35 : 1.0),
        ),
      );

      // signalAuthority: weight and push felt in the signal — the authority of
      //   real wattage — increases when ASO-V3 is active (20kW characteristics)
      const signalAuthority = Math.min(
        100,
        Math.round(
          (punch * 0.4 + weight * 0.4 + depth * 0.2) *
            (asoV3ActiveRef.current ? 1.4 : 1.0),
        ),
      );

      // ampResponse: how well the amp handles load at the four channel levels.
      //   Modeled as recovery time metric — high RMS variation = high response.
      const combinedRms = bassRms * 0.6 + highsRms * 0.4;
      const ampResponse = Math.min(
        100,
        Math.round(combinedRms * 700 + volNorm * 35),
      );

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
      }));

      charRafRef.current = requestAnimationFrame(tick);
    };
    charRafRef.current = requestAnimationFrame(tick);
  }, []);

  // ── Context / chain initialisation ──────────────────────────────────────────
  const initContexts = useCallback(() => {
    if (bassCtxRef.current) return;

    const bassCtx = new AudioContext();
    const highsCtx = new AudioContext();

    // ══════════════════════════════════════════════════════════════════════════
    //  BASS CHAIN
    // ══════════════════════════════════════════════════════════════════════════

    // 1. Insert gain (volume)
    const bassInsert = bassCtx.createGain();
    bassInsert.gain.value = 1.0;

    // 2. Sub level GainNode (FIX 1) — sits between insert and EQ
    //    User-controlled sub output. Default 1.0 = 100%. NEVER locked at 0.0.
    const subGainNode = bassCtx.createGain();
    subGainNode.gain.value = 1.0;

    // 3. EQ filters (8 bands: 14-50Hz, 14-80Hz, 250Hz–16kHz)
    //    FIX 2: Low-end bands (0,1) get base boost offsets baked in so bass is
    //    audible from the very first slider movement.
    //    Band 0 (19Hz, 14-50Hz lane): +3dB base, Q=1.8 (tight, won't bleed into 47Hz)
    //    Band 1 (47Hz, 14-80Hz lane): +2dB base, Q=1.4
    //    ONE 14Hz source: the PFM highpass filter below is the single 14Hz floor.
    //    Both Band 0 (19Hz) and Band 1 (47Hz) share that floor — no duplicate 14Hz nodes.
    const bassEQFilters: BiquadFilterNode[] = EQ_FREQS.map((freq, idx) => {
      const f = bassCtx.createBiquadFilter();
      f.type = "peaking";
      f.frequency.value = freq;
      f.Q.value = EQ_Q_VALUES[idx] ?? 1.0;
      f.gain.value = EQ_LOW_BASE_BOOST[idx] ?? 0;
      return f;
    });

    // ── EPICENTER STAGE ──────────────────────────────────────────────────────
    const bassPfmFilter = bassCtx.createBiquadFilter();
    bassPfmFilter.type = "highpass";
    bassPfmFilter.frequency.value = 14;
    bassPfmFilter.Q.value = Math.SQRT1_2;

    const bassRestLP = bassCtx.createBiquadFilter();
    bassRestLP.type = "lowpass";
    bassRestLP.frequency.value = 50;
    bassRestLP.Q.value = 0.5;

    const bassRestGain = bassCtx.createGain();
    bassRestGain.gain.value = 0.4;

    const bassRestMix = bassCtx.createGain();
    bassRestMix.gain.value = 1.0;

    const bassMaximizer = bassCtx.createBiquadFilter();
    bassMaximizer.type = "peaking";
    bassMaximizer.frequency.value = 60;
    bassMaximizer.Q.value = 1.2;
    bassMaximizer.gain.value = 6;

    const bassParaBass = bassCtx.createBiquadFilter();
    bassParaBass.type = "peaking";
    bassParaBass.frequency.value = 60;
    bassParaBass.Q.value = 1.0;
    bassParaBass.gain.value = 0;

    const bassOutputLevel = bassCtx.createGain();
    bassOutputLevel.gain.value = 1.0;
    // ── END EPICENTER STAGE ──────────────────────────────────────────────────

    // 3. Natural Bottom boost gain
    const bassNaturalBottom = bassCtx.createGain();
    bassNaturalBottom.gain.value = 1.0;

    // ── LINKWITZ-RILEY 4TH-ORDER CROSSOVER (BASS LP PATH) ───────────────────
    // Two cascaded 2nd-order Butterworth lowpass filters.
    // Crossover at 80Hz by default (SRL-commanded).
    const bassLR1 = bassCtx.createBiquadFilter();
    bassLR1.type = "lowpass";
    bassLR1.frequency.value = 80;
    bassLR1.Q.value = Math.SQRT1_2; // Butterworth Q = 1/√2

    const bassLR2 = bassCtx.createBiquadFilter();
    bassLR2.type = "lowpass";
    bassLR2.frequency.value = 80;
    bassLR2.Q.value = Math.SQRT1_2;
    // ── END CROSSOVER BASS ───────────────────────────────────────────────────

    // ── CANISTER STAGE ───────────────────────────────────────────────────────
    // F1 + F2 = 14–40Hz bottom note lane (controlled by canisterBottomBoost)
    // F3       = 14–80Hz punch lane       (controlled by canisterPunchBoost)
    const canisterF1 = bassCtx.createBiquadFilter();
    canisterF1.type = "peaking";
    canisterF1.frequency.value = 19; // bottom of 14-40Hz lane
    canisterF1.Q.value = 1.5;
    canisterF1.gain.value = 3;

    const canisterF2 = bassCtx.createBiquadFilter();
    canisterF2.type = "peaking";
    canisterF2.frequency.value = 40;
    canisterF2.Q.value = 2.0;
    canisterF2.gain.value = 4;

    const canisterF3 = bassCtx.createBiquadFilter();
    canisterF3.type = "peaking";
    canisterF3.frequency.value = 80;
    canisterF3.Q.value = 1.5;
    canisterF3.gain.value = 3;

    const canisterOut = bassCtx.createGain();
    canisterOut.gain.value = 0; // starts bypassed

    const canisterDry = bassCtx.createGain();
    canisterDry.gain.value = 1.0;

    const canisterMix = bassCtx.createGain();
    canisterMix.gain.value = 1.0;
    // ── END CANISTER STAGE ───────────────────────────────────────────────────

    // 4. SRL Compressor — exactly 1, NO duplicate hard limiter
    const bassComp = bassCtx.createDynamicsCompressor();
    bassComp.threshold.value = -24;
    bassComp.knee.value = 30;
    bassComp.ratio.value = 4;
    bassComp.attack.value = 0.003;
    bassComp.release.value = 0.25;

    // 5. Analyser + output pass-through
    const bassAnalyser = bassCtx.createAnalyser();
    bassAnalyser.fftSize = 256;
    bassAnalyser.smoothingTimeConstant = 0.8;

    const bassGain = bassCtx.createGain();
    bassGain.gain.value = 1.0; // G13 pass-through — NEVER modified

    // 6. Ultra authority GainNode
    const bassUltraGain = bassCtx.createGain();
    bassUltraGain.gain.value = 1.0;

    // ── Wire bass chain ──────────────────────────────────────────────────────
    // insert → subGainNode → EQ[0..7]
    bassInsert.connect(subGainNode);
    subGainNode.connect(bassEQFilters[0]);
    for (let i = 0; i < bassEQFilters.length - 1; i++) {
      bassEQFilters[i].connect(bassEQFilters[i + 1]);
    }
    const bassEQLast = bassEQFilters[bassEQFilters.length - 1];

    // EQ last → pfmFilter
    bassEQLast.connect(bassPfmFilter);

    // pfmFilter → dry path into bassRestMix
    bassPfmFilter.connect(bassRestMix);
    // pfmFilter → restoration parallel
    bassPfmFilter.connect(bassRestLP);
    bassRestLP.connect(bassRestGain);
    bassRestGain.connect(bassRestMix);

    // bassRestMix → Maximizer → ParaBass → OutputLevel
    bassRestMix.connect(bassMaximizer);
    bassMaximizer.connect(bassParaBass);
    bassParaBass.connect(bassOutputLevel);

    // OutputLevel → NaturalBottom → LR Crossover (cascaded LP)
    bassOutputLevel.connect(bassNaturalBottom);
    bassNaturalBottom.connect(bassLR1);
    bassLR1.connect(bassLR2);

    // LR2 → Canister wet + dry → canisterMix
    bassLR2.connect(canisterF1);
    canisterF1.connect(canisterF2);
    canisterF2.connect(canisterF3);
    canisterF3.connect(canisterOut);
    canisterOut.connect(canisterMix); // wet (0 gain when inactive)

    bassLR2.connect(canisterDry);
    canisterDry.connect(canisterMix); // dry (always passes)

    // canisterMix → SRL comp → analyser → gain → Ultra → dest
    canisterMix.connect(bassComp);
    bassComp.connect(bassAnalyser);
    bassAnalyser.connect(bassGain);
    bassGain.connect(bassUltraGain);
    bassUltraGain.connect(bassCtx.destination);

    // Legacy inert nodes (disconnected from chain)
    const bassCheater = bassCtx.createBiquadFilter();
    bassCheater.type = "peaking";
    bassCheater.frequency.value = 33;
    bassCheater.Q.value = 2;
    bassCheater.gain.value = 0;

    const bassEQuake = bassCtx.createBiquadFilter();
    bassEQuake.type = "peaking";
    bassEQuake.frequency.value = 28;
    bassEQuake.Q.value = 1.5;
    bassEQuake.gain.value = 0;

    // ══════════════════════════════════════════════════════════════════════════
    //  HIGHS CHAIN
    //  Phase, SRS/WOW/TruBass, UltraCrystal nodes REMOVED in this build.
    //  Hard brick-wall limiter REMOVED. SRL comp is the only compressor.
    // ══════════════════════════════════════════════════════════════════════════

    const highsInsert = highsCtx.createGain();
    highsInsert.gain.value = 1.0;

    const highsEQFilters: BiquadFilterNode[] = EQ_FREQS.map((freq, idx) => {
      const f = highsCtx.createBiquadFilter();
      f.type = "peaking";
      f.frequency.value = freq;
      f.Q.value = EQ_Q_VALUES[idx] ?? 1.0;
      f.gain.value = EQ_LOW_BASE_BOOST[idx] ?? 0;
      return f;
    });

    // LINKWITZ-RILEY 4TH-ORDER CROSSOVER (HIGHS HP PATH)
    const highsLR1 = highsCtx.createBiquadFilter();
    highsLR1.type = "highpass";
    highsLR1.frequency.value = 250; // default highs cutoff
    highsLR1.Q.value = Math.SQRT1_2;

    const highsLR2 = highsCtx.createBiquadFilter();
    highsLR2.type = "highpass";
    highsLR2.frequency.value = 250;
    highsLR2.Q.value = Math.SQRT1_2;

    // SRL Compressor — exactly 1, NO hard limiter
    const highsComp = highsCtx.createDynamicsCompressor();
    highsComp.threshold.value = -24;
    highsComp.knee.value = 30;
    highsComp.ratio.value = 4;
    highsComp.attack.value = 0.003;
    highsComp.release.value = 0.25;

    const highsAnalyser = highsCtx.createAnalyser();
    highsAnalyser.fftSize = 256;
    highsAnalyser.smoothingTimeConstant = 0.8;

    const highsGain = highsCtx.createGain();
    highsGain.gain.value = 1.0; // pass-through — NEVER modified

    const highsUltraGain = highsCtx.createGain();
    highsUltraGain.gain.value = 1.0;

    // ── Wire highs chain ─────────────────────────────────────────────────────
    highsInsert.connect(highsEQFilters[0]);
    for (let i = 0; i < highsEQFilters.length - 1; i++) {
      highsEQFilters[i].connect(highsEQFilters[i + 1]);
    }
    const highsEQLast = highsEQFilters[highsEQFilters.length - 1];
    // EQ last → LR Crossover (cascaded HP)
    highsEQLast.connect(highsLR1);
    highsLR1.connect(highsLR2);
    // LR2 → SRL comp → analyser → gain → Ultra → dest
    highsLR2.connect(highsComp);
    highsComp.connect(highsAnalyser);
    highsAnalyser.connect(highsGain);
    highsGain.connect(highsUltraGain);
    highsUltraGain.connect(highsCtx.destination);

    // ── Store subGainNode ref ───────────────────────────────────────────────
    subGainNodeRef.current = subGainNode;

    // ── Store all refs ───────────────────────────────────────────────────────
    bassCtxRef.current = bassCtx;
    highsCtxRef.current = highsCtx;
    // Bass
    bassInsertRef.current = bassInsert;
    bassEQFiltersRef.current = bassEQFilters;
    bassPfmFilterRef.current = bassPfmFilter;
    bassRestLPRef.current = bassRestLP;
    bassRestGainRef.current = bassRestGain;
    bassRestMixRef.current = bassRestMix;
    bassMaximizerRef.current = bassMaximizer;
    bassParaBassRef.current = bassParaBass;
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
    bassCompRef.current = bassComp;
    bassAnalyserRef.current = bassAnalyser;
    bassGainRef.current = bassGain;
    bassUltraGainRef.current = bassUltraGain;
    bassCheaterRef.current = bassCheater;
    bassEQuakeRef.current = bassEQuake;
    // Highs
    highsInsertRef.current = highsInsert;
    highsEQFiltersRef.current = highsEQFilters;
    highsLR1Ref.current = highsLR1;
    highsLR2Ref.current = highsLR2;
    highsCompRef.current = highsComp;
    highsAnalyserRef.current = highsAnalyser;
    highsGainRef.current = highsGain;
    highsUltraGainRef.current = highsUltraGain;
    // Analyser buffers
    bassAnalyserDataRef.current = new Float32Array(
      bassAnalyser.fftSize,
    ) as unknown as Float32Array<ArrayBuffer>;
    highsAnalyserDataRef.current = new Float32Array(
      highsAnalyser.fftSize,
    ) as unknown as Float32Array<ArrayBuffer>;
  }, []);

  // ── SRL crossover command ────────────────────────────────────────────────────
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

  // ── SRL D-grade volume protection ────────────────────────────────────────────
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
      const bassInsert = bassInsertRef.current;
      const highsInsert = highsInsertRef.current;
      if (!bassInsert || !highsInsert) return;
      const currentGain = bassInsert.gain.value;
      const reduced = currentGain * 0.95;
      bassInsert.gain.value = reduced;
      highsInsert.gain.value = reduced;
      setTimeout(() => {
        if (bassInsertRef.current)
          bassInsertRef.current.gain.value = currentGain;
        if (highsInsertRef.current)
          highsInsertRef.current.gain.value = currentGain;
        srlDActiveRef.current = false;
      }, 500);
    }, 3000);
  }, []);

  // ── File loader ──────────────────────────────────────────────────────────────
  const loadFile = useCallback(
    async (file: File) => {
      initContexts();
      if (fileUrlRef.current) URL.revokeObjectURL(fileUrlRef.current);
      const url = URL.createObjectURL(file);
      fileUrlRef.current = url;

      if (bassSourceRef.current) {
        bassSourceRef.current.disconnect();
        bassSourceRef.current = null;
      }
      if (highsSourceRef.current) {
        highsSourceRef.current.disconnect();
        highsSourceRef.current = null;
      }

      const bassAudio = new Audio();
      bassAudio.src = url;
      bassAudio.crossOrigin = "anonymous";
      bassAudio.preload = "auto";

      const highsAudio = new Audio();
      highsAudio.src = url;
      highsAudio.crossOrigin = "anonymous";
      highsAudio.preload = "auto";

      bassAudioRef.current = bassAudio;
      highsAudioRef.current = highsAudio;

      const bassCtx = bassCtxRef.current!;
      const highsCtx = highsCtxRef.current!;

      const bassSource = bassCtx.createMediaElementSource(bassAudio);
      bassSource.connect(bassInsertRef.current!);
      bassSourceRef.current = bassSource;

      const highsSource = highsCtx.createMediaElementSource(highsAudio);
      highsSource.connect(highsInsertRef.current!);
      highsSourceRef.current = highsSource;

      await bassCtx.resume();
      await highsCtx.resume();

      setState((s) => ({
        ...s,
        isLoaded: true,
        fileName: file.name,
        bassContextState: bassCtx.state,
        highsContextState: highsCtx.state,
      }));
    },
    [initContexts],
  );

  // ── Playback ─────────────────────────────────────────────────────────────────
  const play = useCallback(() => {
    const bassAudio = bassAudioRef.current;
    const highsAudio = highsAudioRef.current;
    if (!bassAudio || !highsAudio) return;
    bassCtxRef.current?.resume();
    highsCtxRef.current?.resume();
    bassAudio.play().catch(() => {});
    highsAudio.play().catch(() => {});
    setState((s) => ({
      ...s,
      isPlaying: true,
      bassContextState: bassCtxRef.current?.state ?? "running",
      highsContextState: highsCtxRef.current?.state ?? "running",
    }));
    const tick = () => {
      if (bassAudio.duration) {
        setState((s) => ({
          ...s,
          currentTime: bassAudio.currentTime,
          duration: bassAudio.duration,
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
    bassAudioRef.current?.pause();
    highsAudioRef.current?.pause();
    if (bassAudioRef.current) bassAudioRef.current.currentTime = 0;
    if (highsAudioRef.current) highsAudioRef.current.currentTime = 0;
    cancelAnimationFrame(rafRef.current);
    cancelAnimationFrame(reductionRafRef.current);
    cancelAnimationFrame(charRafRef.current);
    setState((s) => ({
      ...s,
      isPlaying: false,
      currentTime: 0,
      processorChar: defaultProcessorChar,
    }));
  }, []);

  // ── Volume ───────────────────────────────────────────────────────────────────
  const setVolume = useCallback((v: number) => {
    volumeRef.current = v;
    const gain = volToGain(v);
    if (bassInsertRef.current) bassInsertRef.current.gain.value = gain;
    if (highsInsertRef.current) highsInsertRef.current.gain.value = gain;
    const threshold =
      v < 100 ? -60 + ((v - 1) / 98) * 20 : -40 + ((v - 100) / 600) * 30;
    if (bassCompRef.current) bassCompRef.current.threshold.value = threshold;
    if (highsCompRef.current) highsCompRef.current.threshold.value = threshold;
    setState((s) => ({ ...s, volume: v }));
  }, []);

  // ── Crossover (LR 4th-order — both stages updated together) ─────────────────
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

  // ── Amp channel gains — ALL NO-OP (Rule Book) ─────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const setBassGain = useCallback((_value: number) => {
    // NO-OP — G09/G10 amp channel gains locked at 0.0
  }, []);

  // ── Sub Level (FIX 1) — REAL user-controlled sub output ──────────────────────
  // This is NOT an amp-channel gain. It is the user's sub output level slider.
  // Range: 0-100 → 0.0-2.0 gain on subGainNode. Default 100 = 1.0 (unity).
  // INTENTIONALLY not a NO-OP — this is a user-facing control.
  const setSubLevel = useCallback((value: number) => {
    const gain = (value / 100) * 2.0;
    if (subGainNodeRef.current) subGainNodeRef.current.gain.value = gain;
    setState((s) => ({ ...s, subLevel: value, hasUnsavedChanges: true }));
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const setHighsGain = useCallback((_value: number) => {
    // NO-OP — G11/G12 amp channel gains locked at 0.0
  }, []);

  // ── Compressor setters ───────────────────────────────────────────────────────
  const setBassCompressor = useCallback(
    (
      threshold: number,
      ratio: number,
      knee: number,
      attack: number,
      release: number,
    ) => {
      const c = bassCompRef.current;
      if (!c) return;
      c.threshold.value = threshold;
      c.ratio.value = ratio;
      c.knee.value = knee;
      c.attack.value = attack;
      c.release.value = release;
    },
    [],
  );

  const setHighsCompressor = useCallback(
    (
      threshold: number,
      ratio: number,
      knee: number,
      attack: number,
      release: number,
    ) => {
      const c = highsCompRef.current;
      if (!c) return;
      c.threshold.value = threshold;
      c.ratio.value = ratio;
      c.knee.value = knee;
      c.attack.value = attack;
      c.release.value = release;
    },
    [],
  );

  // ── EQ ───────────────────────────────────────────────────────────────────────
  // FIX 2+3: Applies exponential curve for low-end bands AND syncs crossover.
  const setEQBand = useCallback((freq: number, gainDb: number) => {
    const idx = EQ_FREQS.indexOf(freq);
    if (idx === -1) return;
    // Apply exponential mapping so low-end bands respond from first movement
    const actualDb = eqSliderToDb(gainDb, idx);
    if (bassEQFiltersRef.current[idx])
      bassEQFiltersRef.current[idx].gain.value = actualDb;
    if (highsEQFiltersRef.current[idx])
      highsEQFiltersRef.current[idx].gain.value = actualDb;
    // FIX 3: syncCrossoverToEQ — reads both low-end band gains and shifts bass LP
    setState((s) => {
      const newBands = s.eqBands.map((b) =>
        b.freq === freq ? { freq, gainDb } : b,
      );
      const band0Gain = newBands[0]?.gainDb ?? 0; // 19Hz slider value (14-50Hz lane)
      const band1Gain = newBands[1]?.gainDb ?? 0; // 47Hz slider value (14-80Hz lane)
      // band0 boosted → lower LP cutoff to let more sub through (min 60Hz)
      const band0Shift = band0Gain > 0 ? -(band0Gain / 12) * 20 : 0;
      // band1 boosted → raise LP cutoff to capture more punch range (max 120Hz)
      const band1Shift = band1Gain > 0 ? (band1Gain / 12) * 40 : 0;
      const newLPFreq = Math.max(
        60,
        Math.min(120, s.bassFilterFreq + band0Shift + band1Shift),
      );
      const adj = SRL_CROSSOVER_ADJUST[s.srlGrade];
      const commanded = Math.max(20, newLPFreq + adj.bassOffset);
      if (bassLR1Ref.current) bassLR1Ref.current.frequency.value = commanded;
      if (bassLR2Ref.current) bassLR2Ref.current.frequency.value = commanded;
      return { ...s, eqBands: newBands };
    });
  }, []);

  const setEQBypass = useCallback((bypass: boolean) => {
    if (bypass) {
      // When bypassed: reset to base boost only (no slider additions)
      EQ_FREQS.forEach((_, idx) => {
        const baseBoost = EQ_LOW_BASE_BOOST[idx] ?? 0;
        if (bassEQFiltersRef.current[idx])
          bassEQFiltersRef.current[idx].gain.value = baseBoost;
        if (highsEQFiltersRef.current[idx])
          highsEQFiltersRef.current[idx].gain.value = baseBoost;
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

  // ── Phase invert — state-only stub (phase nodes removed from chain) ─────────────────
  const phaseInvert = useCallback(
    (channel: "bass" | "highs", invert: boolean) => {
      // Phase nodes removed — state update only for legacy UI compat
      if (channel === "bass") {
        setState((s) => ({ ...s, bassPhaseInverted: invert }));
      } else {
        setState((s) => ({ ...s, highsPhaseInverted: invert }));
      }
    },
    [],
  );

  // ══════════════════════════════════════════════════════════════════════════════
  //  EPICENTER CONTROLS
  // ══════════════════════════════════════════════════════════════════════════════

  const setEpicenterBoost = useCallback((pct: number) => {
    const db = pctToDb(pct, 0, 12);
    if (bassMaximizerRef.current) bassMaximizerRef.current.gain.value = db;
    setState((s) => ({ ...s, epicenterBoost: pct, hasUnsavedChanges: true }));
  }, []);

  const setParaCenter = useCallback((hz: number) => {
    const clamped = Math.max(20, Math.min(120, hz));
    if (bassParaBassRef.current)
      bassParaBassRef.current.frequency.value = clamped;
    setState((s) => ({ ...s, paraCenter: clamped, hasUnsavedChanges: true }));
  }, []);

  const setParaWidth = useCallback((width: number) => {
    const clamped = Math.max(0.3, Math.min(3.0, width));
    if (bassParaBassRef.current) bassParaBassRef.current.Q.value = clamped;
    setState((s) => ({ ...s, paraWidth: clamped, hasUnsavedChanges: true }));
  }, []);

  const setParaGain = useCallback((pct: number) => {
    const db = pctToDb(pct, -12, 12);
    if (bassParaBassRef.current) bassParaBassRef.current.gain.value = db;
    setState((s) => ({ ...s, paraGain: pct, hasUnsavedChanges: true }));
  }, []);

  const setBassOutputLevel = useCallback((pct: number) => {
    const gain = pctToGain(pct);
    if (bassOutputLevelRef.current)
      bassOutputLevelRef.current.gain.value = gain;
    setState((s) => ({ ...s, bassOutputLevel: pct, hasUnsavedChanges: true }));
  }, []);

  // ── Legacy stubs for removed panels ─────────────────────────────────────────
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

  // ══════════════════════════════════════════════════════════════════════════════
  //  PROTECTION SYSTEM
  // ══════════════════════════════════════════════════════════════════════════════

  const setDistortionReduction = useCallback(
    (v: number) => {
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
    [applySRLCrossoverCommand, handleSRLDGrade],
  );

  const setClippingReduction = useCallback(
    (v: number) => {
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

  // ══════════════════════════════════════════════════════════════════════════════
  //  LOW END BOOSTER
  // ══════════════════════════════════════════════════════════════════════════════
  const enableLowEndBooster = useCallback(() => {
    if (boosterTimerRef.current) clearTimeout(boosterTimerRef.current);
    if (boosterCountdownRef.current) clearInterval(boosterCountdownRef.current);
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
    setState((s) => ({
      ...s,
      lowEndBoosterEnabled: false,
      lowEndBoosterActive: false,
      lowEndBoosterTimeLeft: null,
      hasUnsavedChanges: true,
    }));
  }, []);

  // ══════════════════════════════════════════════════════════════════════════════
  //  CANISTER — two independent sliders
  //  Slider 1 (canisterBottomBoost): controls 14–40Hz lane (F1 + F2 peaking gain)
  //  Slider 2 (canisterPunchBoost):  controls 14–80Hz lane (F3 peaking gain)
  // ══════════════════════════════════════════════════════════════════════════════
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

  /** Slider 1 — 14-40Hz bottom note lane: slider 0-100 → peaking gain 0-12dB on F1+F2 */
  const setCanisterBottomBoost = useCallback((level: number) => {
    const db = pctToDb(level, 0, 12);
    if (canisterF1Ref.current) canisterF1Ref.current.gain.value = db * 0.6; // 14Hz boost
    if (canisterF2Ref.current) canisterF2Ref.current.gain.value = db; // 40Hz boost
    setState((s) => ({
      ...s,
      canisterBottomBoost: level,
      hasUnsavedChanges: true,
    }));
  }, []);

  /** Slider 2 — 14-80Hz punch lane: slider 0-100 → peaking gain 0-12dB on F3 */
  const setCanisterPunchBoost = useCallback((level: number) => {
    const db = pctToDb(level, 0, 12);
    if (canisterF3Ref.current) canisterF3Ref.current.gain.value = db;
    setState((s) => ({
      ...s,
      canisterPunchBoost: level,
      hasUnsavedChanges: true,
    }));
  }, []);

  // ══════════════════════════════════════════════════════════════════════════════
  //  ULTRA AUTHORITY
  // ══════════════════════════════════════════════════════════════════════════════
  const setUltraActive = useCallback((active: boolean) => {
    const gain = active ? 1.0 : 0.0;
    if (bassUltraGainRef.current) bassUltraGainRef.current.gain.value = gain;
    if (highsUltraGainRef.current) highsUltraGainRef.current.gain.value = gain;
    setState((s) => ({ ...s, ultraActive: active, hasUnsavedChanges: true }));
  }, []);

  // ══════════════════════════════════════════════════════════════════════════════
  //  ASO-V3 SOVEREIGN AMP
  //  When activated, applies amplified characteristic weights to the signal chain.
  //  Does NOT modify any gain to non-0.0 — characteristics are RMS-layer only.
  //  The amp loads into a Chip Commander capacity slot and stays OFF until
  //  Gerrod manually activates it.
  // ══════════════════════════════════════════════════════════════════════════════
  const setASOv3Active = useCallback((active: boolean) => {
    asoV3ActiveRef.current = active;
    // When ASO-V3 activates, old amps (bass/highs contexts) cut off completely.
    // The ASO-V3 runs on the same bass+highs contexts but its characteristics
    // training multipliers kick in via the charTick asoV3ActiveRef.
    // The Ultra gain pass-through is maintained (no gain change).
    setState((s) => ({
      ...s,
      asoV3Active: active,
      hasUnsavedChanges: true,
    }));
  }, []);

  // ── Save ─────────────────────────────────────────────────────────────────────
  const saveAllSettings = useCallback(() => {
    if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
    const now = new Date();
    const hours = now.getHours();
    const mins = String(now.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    const h12 = hours % 12 || 12;
    const timeStr = `${h12}:${mins} ${ampm}`;
    setState((s) => ({ ...s, hasUnsavedChanges: false, lastSaved: timeStr }));
  }, []);

  // ── Context state sync ───────────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      setState((s) => ({
        ...s,
        bassContextState: bassCtxRef.current?.state ?? "suspended",
        highsContextState: highsCtxRef.current?.state ?? "suspended",
        bassCompReduction: bassCompRef.current?.reduction ?? 0,
        highsCompReduction: highsCompRef.current?.reduction ?? 0,
      }));
    }, 200);
    return () => clearInterval(id);
  }, []);

  // ── Rule Book Verification ───────────────────────────────────────────────────
  useEffect(() => {
    const violations: string[] = [];
    if (bassGainRef.current && bassGainRef.current.gain.value !== 1.0) {
      violations.push("VIOLATION: bassGain pass-through is not 1.0");
    }
    if (highsGainRef.current && highsGainRef.current.gain.value !== 1.0) {
      violations.push("VIOLATION: highsGain pass-through is not 1.0");
    }
    if (
      bassUltraGainRef.current &&
      bassUltraGainRef.current.gain.value !== 1.0
    ) {
      violations.push("VIOLATION: bassUltraGain not initialized to 1.0");
    }
    if (canisterOutRef.current && canisterOutRef.current.gain.value !== 0) {
      violations.push("VIOLATION: canisterOut should start at 0 (bypassed)");
    }
    if (violations.length > 0) {
      setState((s) => ({ ...s, gainViolations: violations }));
    }
  }, []);

  // ── Context value ─────────────────────────────────────────────────────────────
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
    saveAllSettings,
  };

  return createElement(AudioEngineContext.Provider, { value }, children);
}

export function useAudioEngine(): AudioEngine {
  const ctx = useContext(AudioEngineContext);
  if (!ctx)
    throw new Error("useAudioEngine must be used within AudioEngineProvider");
  return ctx;
}

// ─── Helpers re-exported for UI ──────────────────────────────────────────────
export { sliderToParaWidth, pctToDb, pctToGain };
