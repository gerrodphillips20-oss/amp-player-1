import { useAudioEngine } from "@/hooks/useAudioEngine";

export default function SignalRouting() {
  const engine = useAudioEngine();
  const steps = [
    { label: "FILE INPUT", color: "#ffd700", arrow: true },
    {
      label: `AUDIO CONTEXT — ${engine.bassContextState.toUpperCase()}`,
      color: "#00d4ff",
      arrow: true,
    },
    {
      label: "INTELLIGENCE LAYER — 1,000MB CHIP + 25 SMART CHIPS",
      color: "#00ff88",
      arrow: true,
    },
    {
      label: "DUAL THUNDER BATTERY CHAIN — 3,440,000W CHARACTERISTICS",
      color: "#ffd700",
      arrow: true,
    },
    {
      label: "HELIX DSP AMP — VIRTUAL DIGITAL ANALOG SIMULATION",
      color: "#00d4ff",
      arrow: true,
    },
    {
      label: `BASS PATH: BIQUAD LOWPASS ${engine.bassFilterFreq}Hz`,
      color: "#ff6b35",
      arrow: true,
    },
    {
      label: `HIGHS PATH: BIQUAD HIGHPASS ${engine.highsFilterFreq}Hz`,
      color: "#00d4ff",
      arrow: true,
    },
    {
      label: `SMART RANGE LIMITER (VOL ${engine.volume}/100)`,
      color: "#00ff88",
      arrow: true,
    },
    { label: "SPEAKERS OUTPUT", color: "#00ff88", arrow: false },
  ];

  return (
    <div className="space-y-2">
      <div
        className="text-xs font-bold mb-3 px-2 py-1 rounded"
        style={{
          background: "rgba(0,212,255,0.1)",
          color: "#00d4ff",
          border: "1px solid rgba(0,212,255,0.3)",
        }}
      >
        SIGNAL PATH DIAGRAM • ONE AMP: HELIX DSP
      </div>

      <div className="flex flex-col gap-0">
        {steps.map((step, i) => (
          <div key={step.label}>
            <div
              className="px-3 py-2 rounded text-xs font-bold uppercase tracking-widest"
              style={{
                background: `${step.color}15`,
                border: `1px solid ${step.color}44`,
                color: step.color,
              }}
            >
              {i + 1}. {step.label}
            </div>
            {step.arrow && (
              <div className="flex justify-center py-0.5">
                <span style={{ color: "rgba(0,212,255,0.4)" }}>▼</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div
        className="mt-3 px-2 py-1.5 rounded text-xs font-mono"
        style={{
          background: "rgba(0,0,0,0.3)",
          border: "1px solid rgba(0,212,255,0.1)",
          color: "rgba(0,212,255,0.4)",
        }}
      >
        NO SRS 2022 • NO LEGACY AMPS • NO WAVESHAPER • GAINS LOCKED 0.0
      </div>
    </div>
  );
}
