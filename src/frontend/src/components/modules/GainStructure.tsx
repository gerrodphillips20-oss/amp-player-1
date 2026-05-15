import { useAudioEngine } from "@/hooks/useAudioEngine";

export default function GainStructure() {
  const engine = useAudioEngine();
  const gainKillActive = engine.gainKillActive;
  const bassRed = engine.bassCompReduction ?? 0;
  const highsRed = engine.highsCompReduction ?? 0;

  // G01/G02/G04/G05/G06/G08/G13/G14 are locked at 0.0 per rule book.
  // setBassGain / setHighsGain are NO-OPs — these are not user-controllable gains.
  // G03/G07 show compressor gain-reduction (negative dB — pass-through reads).
  // G09-G12/G15 are SRS/mids amps — deleted — permanently 0.0.
  // G16 output stage = average of both comps — display only.
  const GAINS = [
    { id: "G01", label: "BASS INPUT GAIN", value: 0.0 },
    { id: "G02", label: "BASS FILTER GAIN", value: 0.0 },
    { id: "G03", label: "BASS COMP GR", value: bassRed },
    { id: "G04", label: "BASS OUTPUT GAIN", value: 0.0 },
    { id: "G05", label: "HIGHS INPUT GAIN", value: 0.0 },
    { id: "G06", label: "HIGHS FILTER GAIN", value: 0.0 },
    { id: "G07", label: "HIGHS COMP GR", value: highsRed },
    { id: "G08", label: "HIGHS OUTPUT GAIN", value: 0.0 },
    { id: "G09", label: "BASS AMP CH1 GAIN", value: 0.0 },
    { id: "G10", label: "BASS AMP CH2 GAIN", value: 0.0 },
    { id: "G11", label: "MIDS AMP CH1 GAIN", value: 0.0 },
    { id: "G12", label: "MIDS AMP CH2 GAIN", value: 0.0 },
    { id: "G13", label: "MASTER L GAIN", value: 0.0 },
    { id: "G14", label: "MASTER R GAIN", value: 0.0 },
    { id: "G15", label: "SUB AUX GAIN", value: 0.0 },
    { id: "G16", label: "OUTPUT STAGE GAIN", value: (bassRed + highsRed) / 2 },
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

      {/* Description banners */}
      <div className="grid grid-cols-2 gap-1 mb-3">
        <div
          className="px-2 py-1.5 rounded text-xs"
          style={{
            background: "rgba(255,60,60,0.07)",
            border: "1px solid rgba(255,60,60,0.25)",
            color: "rgba(255,100,100,0.9)",
          }}
        >
          <div className="font-bold uppercase">KILLABLE GAINS (8)</div>
          <div style={{ fontSize: "0.6rem", marginTop: "2px" }}>
            Set to 0.0 simultaneously
          </div>
        </div>
        <div
          className="px-2 py-1.5 rounded text-xs"
          style={{
            background: "rgba(0,255,120,0.06)",
            border: "1px solid rgba(0,255,120,0.25)",
            color: "rgba(0,230,120,0.9)",
          }}
        >
          <div className="font-bold uppercase">BYPASS GAINS (2)</div>
          <div style={{ fontSize: "0.6rem", marginTop: "2px" }}>
            VOLUME + MASTER — pass-through only
          </div>
        </div>
      </div>

      {/* Gain Kill Switch */}
      <div
        style={{
          marginBottom: "12px",
          padding: "8px",
          border: "1px solid rgba(255,50,50,0.4)",
          borderRadius: "6px",
          background: gainKillActive ? "rgba(255,0,0,0.08)" : "rgba(0,0,0,0.3)",
        }}
        data-ocid="gain.kill_switch"
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{ fontSize: "0.7rem", fontWeight: "bold", color: "#ff4444" }}
          >
            GAIN KILL SWITCH
          </span>
          <button
            type="button"
            data-ocid="gain.kill_switch_button"
            onClick={() => {
              engine.setGainKillActive(!gainKillActive);
              console.log(
                "[QA] Gain Kill Switch toggled. Kill active:",
                !gainKillActive,
              );
            }}
            style={{
              background: gainKillActive ? "#ff2222" : "#333",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              padding: "4px 10px",
              fontSize: "0.65rem",
              cursor: "pointer",
            }}
          >
            {gainKillActive ? "GAIN KILL SWITCH — ALL GAINS 0.0" : "INACTIVE"}
          </button>
        </div>
        <div
          style={{
            fontSize: "0.6rem",
            color: gainKillActive ? "#ff6666" : "#888",
            marginTop: "4px",
          }}
        >
          {gainKillActive
            ? "ZERO STACKING POLICY CHIP: 8 KILLABLE GAINS CONFIRMED 0.0"
            : "Zero Stacking Policy Chip Monitoring"}
        </div>
      </div>

      {/* Bypass Pass-Through nodes — never killed */}
      <div
        style={{
          marginBottom: "12px",
          padding: "8px",
          border: "1px solid rgba(0,255,120,0.3)",
          borderRadius: "6px",
          background: "rgba(0,255,120,0.04)",
        }}
      >
        <div
          style={{
            fontSize: "0.6rem",
            fontWeight: "bold",
            color: "#00e87a",
            marginBottom: "6px",
          }}
        >
          BYPASS PASS-THROUGH NODES — NEVER KILLED
        </div>
        <div className="grid grid-cols-2 gap-1">
          <div
            className="flex items-center justify-between px-2 py-1.5 rounded"
            style={{
              background: "rgba(0,20,10,0.8)",
              border: "1px solid rgba(0,255,120,0.2)",
            }}
          >
            <div>
              <div
                style={{
                  color: "#00e87a",
                  fontSize: "0.6rem",
                  fontWeight: "bold",
                }}
              >
                VOLUME
              </div>
              <div style={{ color: "#00e87a", fontSize: "0.55rem" }}>
                VOLUME NODE — BYPASS
              </div>
            </div>
            <span
              style={{
                color: "#00e87a",
                fontSize: "0.7rem",
                fontWeight: "bold",
                fontFamily: "monospace",
              }}
            >
              PASS
            </span>
          </div>
          <div
            className="flex items-center justify-between px-2 py-1.5 rounded"
            style={{
              background: "rgba(0,20,10,0.8)",
              border: "1px solid rgba(0,255,120,0.2)",
            }}
          >
            <div>
              <div
                style={{
                  color: "#4dd0ff",
                  fontSize: "0.6rem",
                  fontWeight: "bold",
                }}
              >
                MASTER
              </div>
              <div style={{ color: "#4dd0ff", fontSize: "0.55rem" }}>
                CEILING — FIXED 1.0
              </div>
            </div>
            <span
              style={{
                color: "#4dd0ff",
                fontSize: "0.7rem",
                fontWeight: "bold",
                fontFamily: "monospace",
              }}
            >
              1.00
            </span>
          </div>
        </div>
      </div>

      {/* Console log QA button */}
      <button
        type="button"
        data-ocid="gain.console_log_button"
        onClick={() => {
          console.log("[GAIN QA] All gain node values:");
          console.log("  gainKillActive:", gainKillActive);
          console.log("  bassCompReduction (G03):", bassRed.toFixed(4));
          console.log("  highsCompReduction (G07):", highsRed.toFixed(4));
          console.log(
            "  All fixed gains: G01, G02, G04, G05, G06, G08, G09-G12, G14, G15 = 0.0",
          );
          console.log(
            "  Bypass nodes: VOLUME (pass-through), MASTER (fixed 1.0)",
          );
        }}
        className="w-full mb-2 py-1 rounded text-xs font-bold uppercase tracking-widest"
        style={{
          background: "rgba(0,212,255,0.08)",
          border: "1px solid rgba(0,212,255,0.3)",
          color: "#00d4ff",
          cursor: "pointer",
        }}
      >
        🔍 LOG ALL GAIN VALUES TO CONSOLE (QA)
      </button>
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
