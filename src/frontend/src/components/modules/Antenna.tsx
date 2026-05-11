import { useAudioEngine } from "@/hooks/useAudioEngine";

export default function Antenna() {
  const engine = useAudioEngine();
  const strength = engine.isPlaying
    ? Math.min(
        100,
        Math.round(
          ((engine.bassGainValue + engine.highsGainValue) / 2) * 85 + 15,
        ),
      )
    : 0;

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
        ANTENNA SIGNAL STRENGTH
      </div>

      <div className="flex items-center justify-between py-2">
        <span
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: "rgba(0,212,255,0.8)" }}
        >
          SIGNAL STRENGTH
        </span>
        <span
          className="text-2xl font-mono font-bold"
          style={{ color: "#00ff88" }}
        >
          {strength}%
        </span>
      </div>

      <div className="flex items-end gap-1 h-16">
        {[1, 2, 3, 4, 5, 6, 7].map((bar) => {
          const filled = bar * 14 <= strength;
          return (
            <div
              key={bar}
              className="flex-1 rounded-sm transition-smooth"
              style={{
                height: `${bar * 14}%`,
                background: filled ? "#00ff88" : "rgba(255,255,255,0.1)",
                border: `1px solid ${
                  filled ? "rgba(0,255,136,0.5)" : "rgba(255,255,255,0.1)"
                }`,
                animation:
                  filled && engine.isPlaying
                    ? `signal-bar ${0.3 + bar * 0.1}s ease-in-out infinite alternate`
                    : "none",
              }}
            />
          );
        })}
      </div>

      {[
        ["ANTENNA TYPE", "OMNIDIRECTIONAL"],
        ["GAIN", "3 dBi"],
        ["COVERAGE", "360°"],
        ["STATUS", engine.isLoaded ? "ACTIVE" : "STANDBY"],
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
            style={{ color: "#ffd700" }}
          >
            {v}
          </span>
        </div>
      ))}

      <style>{`
        @keyframes signal-bar {
          from { opacity: 0.7; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
