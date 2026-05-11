import { useAudioEngine } from "@/hooks/useAudioEngine";
import { useState } from "react";

export default function ChannelMixer() {
  const engine = useAudioEngine();
  const [levels, setLevels] = useState({ B1: 100, B2: 100, M: 100, H: 100 });

  const CHANNELS = [
    { id: "B1" as const, label: "B1 — BASS 1", color: "#00d4ff", isBass: true },
    { id: "B2" as const, label: "B2 — BASS 2", color: "#0099cc", isBass: true },
    { id: "M" as const, label: "M — MIDS", color: "#ffd700", isBass: false },
    { id: "H" as const, label: "H — HIGHS", color: "#00ff88", isBass: false },
  ];

  const handleChange = (
    id: keyof typeof levels,
    v: number,
    isBass: boolean,
  ) => {
    setLevels((l) => ({ ...l, [id]: v }));
    const gain = v / 100;
    if (isBass) engine.setBassGain(gain);
    else engine.setHighsGain(gain);
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
        4 CHANNEL MIXER • B1 B2 M H
      </div>

      {CHANNELS.map((ch) => (
        <div
          key={ch.id}
          className="py-2 border-b"
          style={{ borderColor: "rgba(0,212,255,0.1)" }}
        >
          <div className="flex items-center justify-between mb-1">
            <span
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: ch.color }}
            >
              {ch.label}
            </span>
            <span
              className="text-xs font-mono font-bold"
              style={{ color: "#ffd700" }}
            >
              {levels[ch.id]}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              data-ocid={`mixer.${ch.id.toLowerCase()}_slider`}
              type="range"
              min={0}
              max={100}
              value={levels[ch.id]}
              onChange={(e) =>
                handleChange(ch.id, Number(e.target.value), ch.isBass)
              }
              className="flex-1"
              style={{ accentColor: ch.color }}
            />
            <div
              className="w-3 h-3 rounded-full"
              style={{
                background:
                  levels[ch.id] > 0 ? ch.color : "rgba(255,255,255,0.1)",
                boxShadow: levels[ch.id] > 0 ? `0 0 6px ${ch.color}` : "none",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
