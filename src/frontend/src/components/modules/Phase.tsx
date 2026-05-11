import { useAudioEngine } from "@/hooks/useAudioEngine";

const CHANNELS = ["CH1", "CH2", "CH3", "CH4"];

export default function Phase() {
  const engine = useAudioEngine();

  const isInverted = (ch: string) =>
    ch === "CH1" || ch === "CH2"
      ? engine.bassPhaseInverted
      : engine.highsPhaseInverted;

  const handleToggle = (ch: string) => {
    if (ch === "CH1" || ch === "CH2") {
      engine.phaseInvert("bass", !engine.bassPhaseInverted);
    } else {
      engine.phaseInvert("highs", !engine.highsPhaseInverted);
    }
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
        PHASE INVERSION PER CHANNEL
      </div>

      {CHANNELS.map((ch) => (
        <div
          key={ch}
          className="flex items-center justify-between py-2 border-b"
          style={{ borderColor: "rgba(0,212,255,0.1)" }}
        >
          <span
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: "rgba(0,212,255,0.8)" }}
          >
            {ch}
            <span
              className="ml-2 text-xs"
              style={{ color: "rgba(0,212,255,0.4)", fontSize: "0.6rem" }}
            >
              {ch === "CH1" || ch === "CH2" ? "BASS" : "HIGHS"}
            </span>
          </span>
          <div className="flex items-center gap-3">
            <span
              className="text-xs font-bold uppercase"
              style={{
                color: isInverted(ch) ? "#ff4444" : "rgba(0,212,255,0.5)",
              }}
            >
              {isInverted(ch) ? "INVERTED" : "NORMAL"}
            </span>
            <button
              type="button"
              data-ocid={`phase.${ch.toLowerCase()}_toggle`}
              onClick={() => handleToggle(ch)}
              className="w-10 h-5 rounded-full transition-smooth relative"
              style={{
                background: isInverted(ch)
                  ? "rgba(255,68,68,0.4)"
                  : "rgba(0,212,255,0.2)",
                border: `1px solid ${
                  isInverted(ch) ? "rgba(255,68,68,0.6)" : "rgba(0,212,255,0.4)"
                }`,
              }}
              aria-label={`Toggle phase ${ch}`}
            >
              <div
                className="absolute top-0.5 w-4 h-4 rounded-full transition-smooth"
                style={{
                  background: isInverted(ch) ? "#ff4444" : "#00d4ff",
                  left: isInverted(ch) ? "calc(100% - 18px)" : "2px",
                }}
              />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
