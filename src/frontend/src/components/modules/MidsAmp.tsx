import { useAudioEngine } from "@/hooks/useAudioEngine";

export default function MidsAmp() {
  const engine = useAudioEngine();
  const isLive = engine.isPlaying && engine.highsContextState === "running";
  const reduction = engine.highsCompReduction ?? 0;
  const drive = Math.min(100, Math.abs(reduction) * 10);

  return (
    <div className="space-y-3">
      <div
        className="text-sm font-bold uppercase tracking-widest mb-1"
        style={{ color: "#ffd700" }}
      >
        MIDS AMP — SRS 2022
      </div>
      <div
        className="text-xs font-bold mb-3 px-2 py-1 rounded"
        style={{
          background: "rgba(0,212,255,0.1)",
          color: "#00d4ff",
          border: "1px solid rgba(0,212,255,0.3)",
        }}
      >
        HIGHS &amp; MIDS ONLY • RCA SET 2 FROM HEAD UNIT
      </div>

      {[
        { label: "RCA INPUT", value: "RCA SET 2" },
        {
          label: "HIGHPASS FILTER",
          value: `${engine.highsFilterFreq}Hz CUTOFF`,
        },
        { label: "GAIN", value: "LOCKED 0.0" },
        { label: "SIGNAL PATH", value: "WIRED 4 GAUGE" },
        { label: "CONTEXT", value: engine.highsContextState.toUpperCase() },
        { label: "OUTPUT", value: "HIGHS + MIDS" },
      ].map((row) => (
        <div
          key={row.label}
          className="flex items-center justify-between py-2 border-b"
          style={{ borderColor: "rgba(0,212,255,0.1)" }}
        >
          <span
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: "rgba(0,212,255,0.8)" }}
          >
            {row.label}
          </span>
          <span className={isLive ? "badge-live" : "badge-off"}>
            {row.value}
          </span>
        </div>
      ))}

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
            data-ocid="midsamp.ch1_live"
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
            data-ocid="midsamp.ch2_live"
          >
            {isLive ? "✓ LIVE" : "OFF"}
          </span>
        </div>
      </div>
    </div>
  );
}
