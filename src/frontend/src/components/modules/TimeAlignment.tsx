import { useAudioEngine } from "@/hooks/useAudioEngine";
import { useState } from "react";

export default function TimeAlignment() {
  const [delays, setDelays] = useState({
    "FRONT L": 0,
    "FRONT R": 0,
    "REAR L": 0,
    "REAR R": 0,
  });

  const handleDelay = (sp: string, v: number) => {
    setDelays((d) => ({ ...d, [sp]: v }));
    // Time alignment is a display-only simulation — no delay node in signal chain
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
        TIME ALIGNMENT • SPEAKER POSITIONING
      </div>

      {Object.entries(delays).map(([sp, val]) => (
        <div
          key={sp}
          className="py-2 border-b"
          style={{ borderColor: "rgba(0,212,255,0.1)" }}
        >
          <div className="flex items-center justify-between mb-1">
            <span
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: "rgba(0,212,255,0.8)" }}
            >
              {sp}
            </span>
            <span
              className="text-xs font-mono font-bold"
              style={{ color: "#ffd700" }}
            >
              {val.toFixed(1)} ms
            </span>
          </div>
          <input
            data-ocid={`time_align.${sp.toLowerCase().replace(" ", "_")}_slider`}
            type="range"
            min={0}
            max={30}
            step={0.1}
            value={val}
            onChange={(e) => handleDelay(sp, Number(e.target.value))}
            className="w-full"
            style={{ accentColor: "#00d4ff" }}
          />
        </div>
      ))}
    </div>
  );
}
