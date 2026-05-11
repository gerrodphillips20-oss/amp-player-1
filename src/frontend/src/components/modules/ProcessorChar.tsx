import { useAudioEngine } from "@/hooks/useAudioEngine";

interface CharMeterProps {
  label: string;
  value: number;
  color: string;
  description: string;
}

function CharMeter({ label, value, color, description }: CharMeterProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: "#00d4ff" }}
        >
          {label}
        </span>
        <span className="text-xs font-mono font-bold" style={{ color }}>
          {value.toString().padStart(3, "\u00a0")}%
        </span>
      </div>
      <div
        className="h-3 rounded-sm overflow-hidden"
        style={{
          background: "rgba(0,0,0,0.4)",
          border: "1px solid rgba(0,212,255,0.15)",
        }}
      >
        <div
          className="h-full rounded-sm transition-all duration-75"
          style={{
            width: `${value}%`,
            background: `linear-gradient(90deg, ${color}99, ${color})`,
            boxShadow: value > 10 ? `0 0 6px ${color}88` : "none",
          }}
        />
      </div>
      <p className="text-xs" style={{ color: "rgba(0,212,255,0.4)" }}>
        {description}
      </p>
    </div>
  );
}

export default function ProcessorChar() {
  const engine = useAudioEngine();
  const pc = engine.processorChar;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div
        className="px-3 py-2 rounded space-y-1"
        style={{
          background: "rgba(0,212,255,0.08)",
          border: "1px solid rgba(0,212,255,0.3)",
        }}
      >
        <div
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: "#00d4ff" }}
        >
          PROCESSOR CHARACTERISTICS
        </div>
        <div
          className="text-xs uppercase tracking-widest"
          style={{ color: "rgba(0,212,255,0.6)" }}
        >
          THUNDER BATTERY SIGNAL PROCESSOR
        </div>
        <div
          className="inline-block text-xs font-bold px-2 py-0.5 rounded"
          style={{
            background: "rgba(0,255,136,0.15)",
            border: "1px solid rgba(0,255,136,0.4)",
            color: "#00ff88",
          }}
        >
          ● ACTIVE — 2,500W → CHARACTERISTICS
        </div>
      </div>

      {/* 6 Characteristic Meters */}
      <div className="space-y-4" data-ocid="proc_char.meters">
        <CharMeter
          label="PUNCH"
          value={pc.punch}
          color="#ffd700"
          description="Signal impact force — Thunder Battery RMS energy"
        />
        <CharMeter
          label="DEPTH"
          value={pc.depth}
          color="#00d4ff"
          description="8Ω→1Ω load simulation — signal feels loaded and deep"
        />
        <CharMeter
          label="WEIGHT"
          value={pc.weight}
          color="#ff6b35"
          description="Low-frequency body — signal mass at all volumes"
        />
        <CharMeter
          label="CLARITY"
          value={pc.clarity}
          color="#a78bfa"
          description="High-frequency detail and presence"
        />
        <CharMeter
          label="BASS DROP"
          value={pc.bassDrop}
          color="#00ff88"
          description={`Sub-bass switching — ${engine.volume >= 100 ? "ACTIVE (VOL ≥ 100)" : "STANDBY (VOL < 100)"}`}
        />
        <CharMeter
          label="BASS NOTE SWITCHING"
          value={pc.bassNoteSwitching}
          color="#f472b6"
          description="Rapid bass note transition rate"
        />
      </div>

      {/* System info */}
      <div
        className="space-y-2 pt-3"
        style={{ borderTop: "1px solid rgba(0,212,255,0.15)" }}
      >
        {[
          ["SOURCE", "THUNDER BATTERY 500×9V"],
          ["WIRING", "4 GAUGE SIGNAL PATH"],
          ["TOTAL POWER", "2,500W (5W VISIBLE)"],
          ["LOAD SIM", "8Ω → 1Ω MIMICK ACTIVE"],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between">
            <span className="text-xs" style={{ color: "rgba(0,212,255,0.5)" }}>
              {k}
            </span>
            <span
              className="text-xs font-mono font-bold"
              style={{ color: "#ffd700" }}
            >
              {v}
            </span>
          </div>
        ))}
      </div>

      {/* Flows to label */}
      <div
        className="text-xs text-center px-2 py-2 rounded"
        style={{
          background: "rgba(0,0,0,0.4)",
          border: "1px solid rgba(0,212,255,0.15)",
          color: "rgba(0,212,255,0.6)",
        }}
      >
        ALL CHARACTERISTICS FLOW TO:
        <br />
        <span style={{ color: "#00d4ff" }}>
          BASS AMP | MIDS AMP | SIGNAL BOOSTER | SMART RANGE LIMITER
        </span>
      </div>
    </div>
  );
}
