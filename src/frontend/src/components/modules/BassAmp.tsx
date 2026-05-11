import { useAudioEngine } from "@/hooks/useAudioEngine";

export default function BassAmp() {
  const engine = useAudioEngine();
  const isLive = engine.isPlaying && engine.bassContextState === "running";
  const reduction = engine.bassCompReduction ?? 0;
  const drive = Math.min(100, Math.abs(reduction) * 10);

  const rows = [
    { label: "VIRTUAL", desc: "Simulation foundation" },
    { label: "DIGITAL", desc: "Class D efficiency" },
    { label: "ANALOG", desc: "Warmth + linearity" },
    { label: "TUBE", desc: "Harmonic richness" },
  ];

  return (
    <div className="space-y-3">
      <div
        className="text-sm font-bold uppercase tracking-widest mb-1"
        style={{ color: "#ffd700" }}
      >
        BASSAMP — SRS 2022 UNIFIED
      </div>
      <div
        className="text-xs font-bold mb-3 px-2 py-1 rounded"
        style={{
          background: "rgba(0,212,255,0.1)",
          color: "#00d4ff",
          border: "1px solid rgba(0,212,255,0.3)",
        }}
      >
        BASS ONLY • PWM DIGITAL • 92-95% EFF • 10Hz-50kHz • THD 0.01%
      </div>

      {rows.map((r) => (
        <div
          key={r.label}
          className="flex items-center justify-between py-2 border-b"
          style={{ borderColor: "rgba(0,212,255,0.1)" }}
        >
          <div>
            <div
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: "#00d4ff" }}
            >
              {r.label}
            </div>
            <div className="text-xs" style={{ color: "rgba(0,212,255,0.5)" }}>
              {r.desc}
            </div>
          </div>
          <span className={isLive ? "badge-live" : "badge-off"}>
            {isLive ? "✓ WIRED" : "STANDBY"}
          </span>
        </div>
      ))}

      <div className="grid grid-cols-2 gap-3 mt-4">
        {[
          ["RCA INPUT", "VIRTUAL RCA"],
          ["LOAD", "8Ω DUMMY LOAD"],
          ["LOWPASS", `${engine.bassFilterFreq}Hz CUTOFF`],
          ["POWER", "12,000W THUNDER"],
          ["GAIN", "LOCKED 0.0"],
          ["CONTEXT", engine.bassContextState.toUpperCase()],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between py-1">
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

      {drive > 0 && (
        <div
          className="flex items-center justify-between px-3 py-2 rounded mt-2"
          style={{
            background: "rgba(255,68,68,0.1)",
            border: "1px solid rgba(255,68,68,0.3)",
          }}
        >
          <span
            className="text-xs font-bold uppercase"
            style={{ color: "#ff4444" }}
          >
            DRIVE METER
          </span>
          <div className="flex items-end gap-0.5 h-4">
            {[20, 40, 60, 80, 100].map((threshold) => (
              <div
                key={threshold}
                className="w-2 rounded-sm"
                style={{
                  height: `${12 + threshold / 10}px`,
                  background:
                    drive >= threshold ? "#ff4444" : "rgba(255,68,68,0.2)",
                }}
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-4 mt-3">
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-bold uppercase"
            style={{ color: "rgba(0,212,255,0.7)" }}
          >
            CH1
          </span>
          <span
            className={isLive ? "badge-live" : "badge-off"}
            data-ocid="bassamp.ch1_live"
          >
            {isLive ? "✓ LIVE" : "OFF"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-bold uppercase"
            style={{ color: "rgba(0,212,255,0.7)" }}
          >
            CH2
          </span>
          <span
            className={isLive ? "badge-live" : "badge-off"}
            data-ocid="bassamp.ch2_live"
          >
            {isLive ? "✓ LIVE" : "OFF"}
          </span>
        </div>
      </div>
    </div>
  );
}
