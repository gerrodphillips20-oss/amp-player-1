import { useState } from "react";

export default function StereoWidth() {
  const [width, setWidth] = useState(100);

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
        STEREO FIELD WIDTH
      </div>

      <div
        className="py-2 border-b"
        style={{ borderColor: "rgba(0,212,255,0.1)" }}
      >
        <div className="flex items-center justify-between mb-2">
          <span
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: "rgba(0,212,255,0.8)" }}
          >
            WIDTH
          </span>
          <span
            className="text-lg font-mono font-bold"
            style={{ color: "#ffd700" }}
          >
            {width}%
          </span>
        </div>
        <input
          data-ocid="stereo.width_slider"
          type="range"
          min={0}
          max={200}
          value={width}
          onChange={(e) => setWidth(Number(e.target.value))}
          className="w-full"
          style={{ accentColor: "#00d4ff" }}
        />
        <div
          className="flex justify-between text-xs mt-1"
          style={{ color: "rgba(0,212,255,0.4)" }}
        >
          <span>MONO</span>
          <span>NORMAL</span>
          <span>WIDE</span>
        </div>
      </div>

      {[
        ["L CHANNEL", `${Math.max(0, 100 - width / 4).toFixed(0)}%`],
        ["R CHANNEL", `${Math.max(0, 100 - width / 4).toFixed(0)}%`],
        ["MONO MIX", width === 0 ? "100%" : "0%"],
        ["STATUS", "ACTIVE"],
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
    </div>
  );
}
