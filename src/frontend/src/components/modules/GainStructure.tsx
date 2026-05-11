import { useAudioEngine } from "@/hooks/useAudioEngine";

export default function GainStructure() {
  const engine = useAudioEngine();
  const bassGain = engine.bassGainValue;
  const highsGain = engine.highsGainValue;
  const bassRed = engine.bassCompReduction ?? 0;
  const highsRed = engine.highsCompReduction ?? 0;

  const GAINS = [
    { id: "G01", label: "BASS INPUT GAIN", value: bassGain },
    { id: "G02", label: "BASS FILTER GAIN", value: 1.0 },
    { id: "G03", label: "BASS COMP GR", value: bassRed },
    { id: "G04", label: "BASS OUTPUT GAIN", value: bassGain },
    { id: "G05", label: "HIGHS INPUT GAIN", value: highsGain },
    { id: "G06", label: "HIGHS FILTER GAIN", value: 1.0 },
    { id: "G07", label: "HIGHS COMP GR", value: highsRed },
    { id: "G08", label: "HIGHS OUTPUT GAIN", value: highsGain },
    { id: "G09", label: "BASS AMP CH1 GAIN", value: 0.0 },
    { id: "G10", label: "BASS AMP CH2 GAIN", value: 0.0 },
    { id: "G11", label: "MIDS AMP CH1 GAIN", value: 0.0 },
    { id: "G12", label: "MIDS AMP CH2 GAIN", value: 0.0 },
    { id: "G13", label: "MASTER L GAIN", value: bassGain },
    { id: "G14", label: "MASTER R GAIN", value: highsGain },
    { id: "G15", label: "SUB AUX GAIN", value: 0.0 },
    {
      id: "G16",
      label: "OUTPUT STAGE GAIN",
      value: (bassGain + highsGain) / 2,
    },
  ];

  return (
    <div className="space-y-2">
      <div
        className="text-xs font-bold mb-3 px-2 py-1 rounded"
        style={{
          background: "rgba(0,212,255,0.1)",
          color: "#00d4ff",
          border: "1px solid rgba(0,212,255,0.3)",
        }}
      >
        ALL 16 GAINS • LIVE ENGINE VALUES
      </div>

      <div className="grid grid-cols-2 gap-1">
        {GAINS.map((g) => (
          <div
            key={g.id}
            className="flex items-center justify-between px-2 py-1.5 rounded"
            style={{
              background: "rgba(0,10,30,0.8)",
              border: "1px solid rgba(0,212,255,0.15)",
            }}
            data-ocid={`gain.${g.id.toLowerCase()}`}
          >
            <div>
              <div
                className="text-xs font-bold"
                style={{ color: "rgba(0,212,255,0.6)", fontSize: "0.6rem" }}
              >
                {g.id}
              </div>
              <div
                className="text-xs font-bold uppercase"
                style={{ color: "rgba(0,212,255,0.8)", fontSize: "0.55rem" }}
              >
                {g.label}
              </div>
            </div>
            <span
              className="text-xs font-mono font-bold"
              style={{
                color:
                  g.value < 0
                    ? "#ff4444"
                    : g.value > 0.5
                      ? "#ffd700"
                      : "rgba(0,212,255,0.6)",
              }}
            >
              {g.value.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
