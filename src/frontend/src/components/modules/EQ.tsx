import { useAudioEngine } from "@/hooks/useAudioEngine";
import { EQ_FREQS } from "@/hooks/useAudioEngine";

// 8-band EQ: 14-50Hz, 14-80Hz low end + 250Hz mids/highs through 16kHz
const BANDS = [
  {
    id: "low1",
    label: "14-50Hz",
    freq: EQ_FREQS[0],
    desc: "Bottom / Rumble / Foundation",
    color: "#ff6b35",
  },
  {
    id: "low2",
    label: "14-80Hz",
    freq: EQ_FREQS[1],
    desc: "Kick / Punch / Hit",
    color: "#ffd700",
  },
  {
    id: "low_mid",
    label: "250Hz",
    freq: EQ_FREQS[2],
    desc: "Low Mids / Warmth",
    color: "#00d4ff",
  },
  {
    id: "mid1",
    label: "500Hz",
    freq: EQ_FREQS[3],
    desc: "Mids / Body",
    color: "#00d4ff",
  },
  {
    id: "vocals",
    label: "1kHz",
    freq: EQ_FREQS[4],
    desc: "Presence / Vocals",
    color: "#00d4ff",
  },
  {
    id: "attack",
    label: "4kHz",
    freq: EQ_FREQS[5],
    desc: "Attack / Definition",
    color: "#00d4ff",
  },
  {
    id: "air",
    label: "8kHz",
    freq: EQ_FREQS[6],
    desc: "Air / Brightness",
    color: "#00ff88",
  },
  {
    id: "top",
    label: "16kHz",
    freq: EQ_FREQS[7],
    desc: "Top End / Sparkle",
    color: "#00ff88",
  },
];

export default function EQ() {
  const engine = useAudioEngine();

  const getGain = (freq: number) =>
    engine.eqBands.find((b) => b.freq === freq)?.gainDb ?? 0;

  const handleChange = (freq: number, v: number) => engine.setEQBand(freq, v);

  return (
    <div className="space-y-2">
      <div
        className="text-xs font-bold mb-3 px-2 py-1.5 rounded"
        style={{
          background: "rgba(0,212,255,0.1)",
          color: "#00d4ff",
          border: "1px solid rgba(0,212,255,0.3)",
        }}
      >
        8 BAND EQ ● ±12dB RANGE ● BIQUAD SERIES CHAIN
      </div>

      {/* Low End section header */}
      <div
        className="px-2 py-1 rounded text-xs font-bold uppercase tracking-widest"
        style={{
          background: "rgba(255,107,53,0.08)",
          border: "1px solid rgba(255,107,53,0.2)",
          color: "rgba(255,107,53,0.8)",
        }}
      >
        ● LOW END LANES (Independent — not combined)
      </div>

      {BANDS.map((band, i) => {
        const gain = getGain(band.freq);
        const isLowEnd = i < 2;
        return (
          <div
            key={band.id}
            className="flex items-center gap-3 py-2 border-b"
            style={{
              borderColor: isLowEnd
                ? "rgba(255,107,53,0.15)"
                : "rgba(0,212,255,0.1)",
            }}
          >
            {/* Band info */}
            <div className="w-28 flex-shrink-0">
              <div
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: band.color }}
              >
                {band.label}
              </div>
              <div
                className="text-xs leading-tight mt-0.5"
                style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.6rem" }}
              >
                {band.desc}
              </div>
            </div>

            {/* Slider */}
            <input
              data-ocid={`eq.${band.id}_slider`}
              type="range"
              min={-12}
              max={12}
              step={0.5}
              value={gain}
              onChange={(e) => handleChange(band.freq, Number(e.target.value))}
              className="flex-1"
              style={{ accentColor: band.color }}
            />

            {/* Value */}
            <span
              className="text-xs font-mono w-14 text-right font-bold"
              style={{
                color: gain > 0 ? "#00ff88" : gain < 0 ? "#ff4444" : "#ffd700",
              }}
            >
              {gain >= 0 ? "+" : ""}
              {gain.toFixed(1)} dB
            </span>

            {/* Reset */}
            <button
              type="button"
              data-ocid={`eq.${band.id}_reset`}
              onClick={() => handleChange(band.freq, 0)}
              className="text-xs px-2 py-0.5 rounded"
              style={{
                background: "rgba(0,212,255,0.1)",
                color: "rgba(0,212,255,0.6)",
                border: "1px solid rgba(0,212,255,0.2)",
              }}
            >
              RST
            </button>
          </div>
        );
      })}

      {/* Mids/Highs section note */}
      <div
        className="px-2 py-1 rounded text-xs mt-1"
        style={{
          background: "rgba(0,212,255,0.05)",
          border: "1px solid rgba(0,212,255,0.1)",
          color: "rgba(0,212,255,0.45)",
        }}
      >
        EQ territory starts at 250Hz. Sub and bass lanes handled by Low End
        Booster &amp; Canister.
      </div>
    </div>
  );
}
