import { useAudioEngine } from "@/hooks/useAudioEngine";

export default function PowerManagement() {
  const engine = useAudioEngine();
  const bothRunning =
    engine.bassContextState === "running" &&
    engine.highsContextState === "running";

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
        POWER MANAGEMENT • THUNDER BATTERY
      </div>

      <div
        className="p-3 rounded mb-3"
        style={{
          background: "rgba(255,215,0,0.05)",
          border: "1px solid rgba(255,215,0,0.2)",
        }}
      >
        <div className="flex justify-between items-center">
          <span
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: "#ffd700" }}
          >
            EXTERNAL OUTPUT
          </span>
          <span
            className="text-2xl font-mono font-bold"
            style={{
              color: "#00ff88",
              textShadow: "0 0 15px rgba(0,255,136,0.5)",
            }}
          >
            5W
          </span>
        </div>
        <div className="text-xs mt-1" style={{ color: "rgba(255,215,0,0.5)" }}>
          TRUE POWER: HIDDEN • CLASSIFIED
        </div>
      </div>

      {[
        ["THUNDER BATTERY", "500×9V = 2,500W", "#00ff88"],
        ["TOTAL CAPACITY", "2,500W", "#ffd700"],
        ["CHANNELS", "4 × 625W", "#00d4ff"],
        ["VISIBLE TO SYSTEM", "5W ONLY", "#ffd700"],
        [
          "BASS CONTEXT",
          engine.bassContextState.toUpperCase(),
          engine.bassContextState === "running" ? "#00ff88" : "#ff4444",
        ],
        [
          "HIGHS CONTEXT",
          engine.highsContextState.toUpperCase(),
          engine.highsContextState === "running" ? "#00ff88" : "#ff4444",
        ],
        [
          "SYSTEM STATUS",
          bothRunning ? "ACTIVE" : "STANDBY",
          bothRunning ? "#00ff88" : "#ffd700",
        ],
        ["WIRING", "4 GAUGE", "#00d4ff"],
      ].map(([k, v, c]) => (
        <div
          key={k}
          className="flex justify-between py-1 border-b"
          style={{ borderColor: "rgba(0,212,255,0.1)" }}
        >
          <span className="text-xs" style={{ color: "rgba(0,212,255,0.5)" }}>
            {k}
          </span>
          <span className="text-xs font-mono font-bold" style={{ color: c }}>
            {v}
          </span>
        </div>
      ))}
    </div>
  );
}
