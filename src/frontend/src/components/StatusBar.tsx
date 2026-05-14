import { useAudioEngine } from "@/hooks/useAudioEngine";

export default function StatusBar() {
  const engine = useAudioEngine();
  const ctxRunning =
    engine.bassContextState === "running" ||
    engine.highsContextState === "running";

  return (
    <footer
      className="border-t flex items-center gap-3 px-4 py-2 flex-wrap"
      style={{
        background: "rgba(0,5,15,0.95)",
        borderColor: "rgba(0,212,255,0.2)",
        backdropFilter: "blur(10px)",
      }}
      data-ocid="status_bar"
    >
      {/* Amp name */}
      <span
        className="inline-block px-3 py-1 rounded text-xs font-bold uppercase tracking-widest"
        style={{
          background: "rgba(0,212,255,0.15)",
          border: "1px solid rgba(0,212,255,0.4)",
          color: "#00d4ff",
        }}
        data-ocid="status.amp_name_tag"
      >
        HELIX DSP
      </span>
      <span
        className="inline-block px-3 py-1 rounded text-xs font-bold uppercase tracking-widest"
        style={{
          background: "rgba(0,255,136,0.1)",
          border: "1px solid rgba(0,255,136,0.3)",
          color: "#00ff88",
        }}
        data-ocid="status.vda_tag"
      >
        VDA SIMULATION
      </span>

      {/* Commander */}
      <div data-ocid="status.commander_tag">
        {engine.isPlaying ? (
          <span className="badge-live">● COMMANDER ON</span>
        ) : (
          <span className="badge-off">● COMMANDER OFF</span>
        )}
      </div>

      {/* Audio Context */}
      <div data-ocid="status.audio_ctx_tag">
        {ctxRunning ? (
          <span className="badge-live">● AUDIO CTX RUNNING</span>
        ) : (
          <span className="badge-off">● AUDIO CTX SUSPENDED</span>
        )}
      </div>

      {/* Thread B status */}
      <div data-ocid="status.thread_b_tag">
        {engine.intelligenceLayer?.threadBActive ? (
          <span className="badge-live">● THREAD B ACTIVE</span>
        ) : (
          <span className="badge-off">● THREAD B STANDBY</span>
        )}
      </div>

      {/* Always-on tags */}
      <span className="badge-live" data-ocid="status.thunder_tag">
        ● THUNDER 120kW STABLE
      </span>
      <span
        className="inline-block px-3 py-1 rounded text-xs font-bold uppercase tracking-widest"
        style={{
          background: "rgba(0,212,255,0.15)",
          border: "1px solid rgba(0,212,255,0.4)",
          color: "#00d4ff",
        }}
        data-ocid="status.master_gain_tag"
      >
        MASTER GAIN 1.00
      </span>

      {/* Context states */}
      <span
        className="text-xs font-mono"
        style={{ color: "rgba(0,212,255,0.5)" }}
      >
        BASS CTX:{" "}
        <span
          style={{
            color:
              engine.bassContextState === "running" ? "#00ff88" : "#ff4444",
          }}
        >
          {engine.bassContextState.toUpperCase()}
        </span>
      </span>
      <span
        className="text-xs font-mono"
        style={{ color: "rgba(0,212,255,0.5)" }}
      >
        HIGHS CTX:{" "}
        <span
          style={{
            color:
              engine.highsContextState === "running" ? "#00ff88" : "#ff4444",
          }}
        >
          {engine.highsContextState.toUpperCase()}
        </span>
      </span>

      <span
        className="inline-block px-3 py-1 rounded text-xs font-bold uppercase tracking-widest"
        style={{
          background: "rgba(0,255,136,0.1)",
          border: "1px solid rgba(0,255,136,0.3)",
          color: "#00ff88",
        }}
        data-ocid="status.proc_char_tag"
      >
        ● PROC CHAR ACTIVE
      </span>
      <span
        className="ml-auto text-xs font-mono"
        style={{ color: "rgba(0,212,255,0.4)" }}
      >
        5W EXT • 1× HELIX CTX • 4 ENGINES
      </span>
      <a
        href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs font-mono"
        style={{ color: "rgba(0,212,255,0.3)", textDecoration: "none" }}
        data-ocid="status.caffeine_link"
      >
        Built on caffeine.ai
      </a>
    </footer>
  );
}
