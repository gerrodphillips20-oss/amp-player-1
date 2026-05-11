import { useAudioEngine } from "@/hooks/useAudioEngine";
import { useState } from "react";

export default function Highs() {
  const engine = useAudioEngine();
  const [q, setQ] = useState(Math.SQRT1_2);

  const handleFreq = (v: number) => {
    engine.setHighsFilterFreq(v);
  };

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
        HIGH FREQUENCY MODULE • HIGHPASS ACTIVE
      </div>

      <div
        className="flex items-center justify-between py-2 border-b"
        style={{ borderColor: "rgba(0,212,255,0.1)" }}
      >
        <span
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: "rgba(0,212,255,0.8)" }}
        >
          CROSSOVER POINT
        </span>
        <span className="badge-live">ACTIVE</span>
      </div>

      <div className="flex items-center gap-3 py-2">
        <span
          className="text-xs font-bold uppercase tracking-widest w-32"
          style={{ color: "rgba(0,212,255,0.8)" }}
        >
          HIGHPASS FREQ
        </span>
        <input
          data-ocid="highs.crossover_slider"
          type="range"
          min={1000}
          max={20000}
          step={100}
          value={engine.highsFilterFreq}
          onChange={(e) => handleFreq(Number(e.target.value))}
          className="flex-1"
          style={{ accentColor: "#00d4ff" }}
        />
        <span
          className="text-xs font-mono font-bold w-20 text-right"
          style={{ color: "#ffd700" }}
        >
          {engine.highsFilterFreq >= 1000
            ? `${(engine.highsFilterFreq / 1000).toFixed(1)}kHz`
            : `${engine.highsFilterFreq}Hz`}
        </span>
      </div>

      <div className="flex items-center gap-3 py-2">
        <span
          className="text-xs font-bold uppercase tracking-widest w-32"
          style={{ color: "rgba(0,212,255,0.8)" }}
        >
          Q FACTOR
        </span>
        <input
          data-ocid="highs.q_slider"
          type="range"
          min={0.1}
          max={10}
          step={0.1}
          value={q}
          onChange={(e) => setQ(Number(e.target.value))}
          className="flex-1"
          style={{ accentColor: "#00d4ff" }}
        />
        <span
          className="text-xs font-mono font-bold w-20 text-right"
          style={{ color: "#ffd700" }}
        >
          {q.toFixed(2)}
        </span>
      </div>

      {[
        ["FILTER TYPE", "BIQUAD HIGHPASS"],
        ["ORDER", "2nd ORDER"],
        ["SIGNAL", "HIGHS AUDIO CTX"],
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
