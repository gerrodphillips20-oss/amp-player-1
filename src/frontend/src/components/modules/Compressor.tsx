import { useAudioEngine } from "@/hooks/useAudioEngine";

export default function Compressor() {
  const engine = useAudioEngine();

  const reduction =
    Math.round(
      Math.min(engine.bassCompReduction, engine.highsCompReduction) * -10,
    ) / 10;

  return (
    <div className="space-y-3">
      <div
        className="text-xs font-bold mb-3 px-2 py-1 rounded"
        style={{
          background: "rgba(0,212,255,0.1)",
          color: "#00d4ff",
          border: "1px solid rgba(0,212,255,0.3)",
        }}
      >
        DYNAMICS COMPRESSOR • SMART RANGE LIMITER
      </div>

      {/* Fixed threshold — not user adjustable (prevents bass gating) */}
      <div
        className="px-3 py-2 rounded"
        style={{
          background: "rgba(0,212,255,0.05)",
          border: "1px solid rgba(0,212,255,0.2)",
        }}
      >
        <div className="flex items-center justify-between">
          <span
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: "rgba(0,212,255,0.7)" }}
          >
            THRESHOLD
          </span>
          <span
            className="text-xs font-mono font-bold"
            style={{ color: "#ffd700" }}
          >
            -24 dBFS — FIXED
          </span>
        </div>
        <div className="text-xs mt-1" style={{ color: "rgba(0,212,255,0.4)" }}>
          Smart Range Limiter monitors only — threshold locked to prevent bass
          gating
        </div>
      </div>

      {[
        ["RATIO", "4:1"],
        ["KNEE", "30 dB"],
        ["ATTACK", "3 ms"],
        ["RELEASE", "250 ms"],
        ["GAIN REDUCTION", `${reduction} dB`],
        ["VOLUME RANGE", "1-100"],
      ].map(([k, v]) => (
        <div
          key={k}
          className="flex justify-between py-1 border-b"
          style={{ borderColor: "rgba(0,212,255,0.1)" }}
        >
          <span className="text-xs" style={{ color: "rgba(0,212,255,0.5)" }}>
            {k}
          </span>
          <span
            className="text-xs font-mono font-bold"
            style={{
              color:
                k === "GAIN REDUCTION" && reduction > 0 ? "#ff4444" : "#ffd700",
            }}
          >
            {v}
          </span>
        </div>
      ))}

      <div className="mt-2 text-xs" style={{ color: "rgba(0,212,255,0.5)" }}>
        VOLUME 1-100: SMART CHIPS + FILTERS ACTIVE ACROSS FULL RANGE
      </div>
    </div>
  );
}
