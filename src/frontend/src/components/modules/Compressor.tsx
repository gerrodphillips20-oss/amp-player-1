import { useAudioEngine } from "@/hooks/useAudioEngine";
import { useState } from "react";

export default function Compressor() {
  const engine = useAudioEngine();
  const [threshold, setThreshold] = useState(-24);
  const [ratio] = useState(4);

  const handleThreshold = (v: number) => {
    setThreshold(v);
    engine.setBassCompressor(v, ratio, 30, 0.003, 0.25);
    engine.setHighsCompressor(v, ratio, 30, 0.003, 0.25);
  };

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

      <div
        className="py-2 border-b"
        style={{ borderColor: "rgba(0,212,255,0.1)" }}
      >
        <div className="flex items-center justify-between mb-1">
          <span
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: "rgba(0,212,255,0.8)" }}
          >
            THRESHOLD
          </span>
          <span
            className="text-xs font-mono font-bold"
            style={{ color: "#ffd700" }}
          >
            {threshold} dBFS
          </span>
        </div>
        <input
          data-ocid="compressor.threshold_slider"
          type="range"
          min={-60}
          max={0}
          value={threshold}
          onChange={(e) => handleThreshold(Number(e.target.value))}
          className="w-full"
          style={{ accentColor: "#00d4ff" }}
        />
      </div>

      {[
        ["RATIO", `${ratio}:1`],
        ["KNEE", "30 dB"],
        ["ATTACK", "3 ms"],
        ["RELEASE", "250 ms"],
        ["GAIN REDUCTION", `${reduction} dB`],
        ["VOLUME RANGE", "1-700"],
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
        VOLUME 1-700: 20 SMART CHIPS + 30 FILTERS ACTIVE FROM 100-700
      </div>
    </div>
  );
}
