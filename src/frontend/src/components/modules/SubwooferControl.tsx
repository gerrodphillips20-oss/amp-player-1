import { useAudioEngine } from "@/hooks/useAudioEngine";
import { useState } from "react";

export default function SubwooferControl() {
  const engine = useAudioEngine();
  // Initialize level from engine state (100 = full = 1.0 subGainNode)
  const [level, setLevel] = useState(engine.subLevel ?? 100);
  const [crossover, setCrossover] = useState(80);

  const handleLevel = (v: number) => {
    setLevel(v);
    engine.setSubLevel(v); // FIX 1: calls real subGainNode, not NO-OP setBassGain
  };

  const handleCrossover = (v: number) => {
    setCrossover(v);
    engine.setBassFilterFreq(v);
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
        SUBWOOFER CONTROL
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
            SUB LEVEL
          </span>
          <span
            className="text-xs font-mono font-bold"
            style={{ color: "#ffd700" }}
          >
            {level}%
          </span>
        </div>
        <input
          data-ocid="sub.level_slider"
          type="range"
          min={0}
          max={100}
          value={level}
          onChange={(e) => handleLevel(Number(e.target.value))}
          className="w-full"
          style={{ accentColor: "#00d4ff" }}
        />
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
            CROSSOVER FREQ
          </span>
          <span
            className="text-xs font-mono font-bold"
            style={{ color: "#ffd700" }}
          >
            {crossover} Hz
          </span>
        </div>
        <input
          data-ocid="sub.crossover_slider"
          type="range"
          min={20}
          max={200}
          value={crossover}
          onChange={(e) => handleCrossover(Number(e.target.value))}
          className="w-full"
          style={{ accentColor: "#ffd700" }}
        />
      </div>

      <div
        className="flex items-center justify-between py-2 border-b"
        style={{ borderColor: "rgba(0,212,255,0.1)" }}
      >
        <span
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: "rgba(0,212,255,0.8)" }}
        >
          PHASE INVERT
        </span>
        <button
          type="button"
          data-ocid="sub.phase_toggle"
          onClick={() => engine.phaseInvert("bass", !engine.bassPhaseInverted)}
          className="w-10 h-5 rounded-full transition-smooth relative"
          style={{
            background: engine.bassPhaseInverted
              ? "rgba(255,68,68,0.4)"
              : "rgba(0,212,255,0.2)",
            border: `1px solid ${
              engine.bassPhaseInverted
                ? "rgba(255,68,68,0.6)"
                : "rgba(0,212,255,0.4)"
            }`,
          }}
          aria-label="Toggle bass phase"
        >
          <div
            className="absolute top-0.5 w-4 h-4 rounded-full transition-smooth"
            style={{
              background: engine.bassPhaseInverted ? "#ff4444" : "#00d4ff",
              left: engine.bassPhaseInverted ? "calc(100% - 18px)" : "2px",
            }}
          />
        </button>
      </div>

      {[
        ["FILTER", "BUTTERWORTH 24dB"],
        ["POLARITY", engine.bassPhaseInverted ? "INVERTED" : "NORMAL"],
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
