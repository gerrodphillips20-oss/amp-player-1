import { useState } from "react";

export default function XMProcessor() {
  const [boost, setBoost] = useState(50);

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
        XM SIGNAL PROCESSOR • ACTIVE
      </div>

      <div className="flex items-center gap-3 py-2">
        <span
          className="text-xs font-bold uppercase tracking-widest w-24"
          style={{ color: "rgba(0,212,255,0.8)" }}
        >
          BOOST
        </span>
        <input
          data-ocid="xm.boost_slider"
          type="range"
          min={0}
          max={100}
          value={boost}
          onChange={(e) => setBoost(Number(e.target.value))}
          className="flex-1"
          style={{ accentColor: "#00d4ff" }}
        />
        <span
          className="text-xs font-mono font-bold w-12 text-right"
          style={{ color: "#ffd700" }}
        >
          {boost}%
        </span>
      </div>

      {[
        ["PROCESSOR", "XM-PRO"],
        ["STATUS", "ACTIVE"],
        ["BANDWIDTH", "20Hz-20kHz"],
        ["SIGNAL GAIN", `${boost}%`],
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
