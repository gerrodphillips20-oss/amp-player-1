import { useAudioEngine } from "@/hooks/useAudioEngine";
import { useState } from "react";

export default function UltraCrystal() {
  const engine = useAudioEngine();
  const [clarity, setClarity] = useState(0);
  const [presence, setPresence] = useState(0);

  const handleClarity = (v: number) => {
    setClarity(v);
    engine.setUltraCrystalClarity(v);
  };

  const handlePresence = (v: number) => {
    setPresence(v);
    engine.setUltraCrystalPresence(v);
  };

  return (
    <div className="space-y-3">
      <div
        className="text-sm font-bold uppercase tracking-widest mb-1"
        style={{ color: "#ffd700" }}
      >
        ULTRA CRYSTAL PROCESSING
      </div>
      <div
        className="text-xs font-bold mb-3 px-2 py-1 rounded"
        style={{
          background: "rgba(255,215,0,0.1)",
          color: "#ffd700",
          border: "1px solid rgba(255,215,0,0.3)",
        }}
      >
        💎 HIGHS AUDIO CONTEXT • SHELF + PEAKING FILTERS
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
            CRYSTAL CLARITY (8kHz shelf)
          </span>
          <span
            className="text-xs font-mono font-bold"
            style={{ color: "#ffd700" }}
          >
            {clarity >= 0 ? "+" : ""}
            {clarity.toFixed(1)} dB
          </span>
        </div>
        <input
          data-ocid="ultracrystal.clarity_slider"
          type="range"
          min={-12}
          max={12}
          step={0.5}
          value={clarity}
          onChange={(e) => handleClarity(Number(e.target.value))}
          className="w-full"
          style={{ accentColor: "#ffd700" }}
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
            PRESENCE (5kHz peak)
          </span>
          <span
            className="text-xs font-mono font-bold"
            style={{ color: "#ffd700" }}
          >
            {presence >= 0 ? "+" : ""}
            {presence.toFixed(1)} dB
          </span>
        </div>
        <input
          data-ocid="ultracrystal.presence_slider"
          type="range"
          min={-12}
          max={12}
          step={0.5}
          value={presence}
          onChange={(e) => handlePresence(Number(e.target.value))}
          className="w-full"
          style={{ accentColor: "#00d4ff" }}
        />
      </div>

      <div className="flex justify-center mt-4">
        <span
          className={
            clarity !== 0 || presence !== 0 ? "badge-live" : "badge-off"
          }
        >
          {clarity !== 0 || presence !== 0 ? "✨ ACTIVE" : "STANDBY"}
        </span>
      </div>
    </div>
  );
}
