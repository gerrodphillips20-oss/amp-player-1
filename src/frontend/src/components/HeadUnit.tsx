import StoryCredits from "@/components/StoryCredits";
import { useAudioEngine } from "@/hooks/useAudioEngine";
import { Save } from "lucide-react";
import { Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function HeadUnit() {
  const [clock, setClock] = useState("");
  const [systemOn, setSystemOn] = useState(true);
  const [storyOpen, setStoryOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const engine = useAudioEngine();

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, "0");
      const m = String(now.getMinutes()).padStart(2, "0");
      const s = String(now.getSeconds()).padStart(2, "0");
      setClock(`${h}:${m}:${s}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const [saveFlash, setSaveFlash] = useState<"idle" | "saving" | "saved">(
    "idle",
  );

  const handleSave = () => {
    setSaveFlash("saving");
    engine.saveAllSettings();
    setTimeout(() => setSaveFlash("saved"), 400);
    setTimeout(() => setSaveFlash("idle"), 2200);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await engine.loadFile(file);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  return (
    <header
      className="bg-card border-b border-border px-4 py-3"
      style={{
        borderColor: "rgba(0,212,255,0.3)",
        boxShadow: "0 2px 20px rgba(0,212,255,0.15)",
      }}
    >
      {/* Top row */}
      <div className="flex items-center justify-between gap-4">
        {/* Left: lightning + title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            data-ocid="head_unit.power_toggle"
            onClick={() => setSystemOn((p) => !p)}
            className={`p-2 rounded border transition-smooth ${
              systemOn
                ? "border-accent text-accent animate-glow-pulse"
                : "border-muted-foreground text-muted-foreground"
            }`}
            aria-label="System power toggle"
          >
            <Zap size={20} fill={systemOn ? "currentColor" : "none"} />
          </button>
          <div>
            <div
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: "rgba(0,212,255,0.7)" }}
            >
              XVM296BT
            </div>
            <div
              className="font-display font-bold uppercase text-sm tracking-widest"
              style={{ color: "#00d4ff" }}
            >
              AMP PLAYER 1 — ASO-V3
            </div>
          </div>
        </div>

        {/* Center: clock */}
        <div
          className="font-mono text-2xl font-bold tracking-widest"
          style={{
            color: "#ffd700",
            textShadow: "0 0 20px rgba(255,215,0,0.6)",
          }}
          data-ocid="head_unit.clock"
        >
          {clock}
        </div>

        {/* Right: file + track info */}
        <div className="flex items-center gap-3">
          {engine.isLoaded && (
            <div className="text-right">
              <div
                className="text-xs font-bold uppercase"
                style={{ color: "#00d4ff" }}
              >
                {engine.fileName.length > 24
                  ? `${engine.fileName.slice(0, 24)}…`
                  : engine.fileName}
              </div>
              <div className="text-xs" style={{ color: "#ffd700" }}>
                {formatTime(engine.currentTime)} / {formatTime(engine.duration)}
              </div>
            </div>
          )}
          {engine.lastSaved && saveFlash === "idle" && (
            <div
              className="text-right"
              style={{ color: "rgba(0,255,136,0.45)", fontSize: "0.6rem" }}
            >
              Saved {engine.lastSaved}
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={handleFile}
            data-ocid="head_unit.file_input"
          />
          <button
            type="button"
            data-ocid="head_unit.save_button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-widest rounded border transition-smooth"
            style={{
              borderColor:
                saveFlash === "saving"
                  ? "rgba(0,212,255,0.5)"
                  : saveFlash === "saved"
                    ? "rgba(0,255,136,0.5)"
                    : engine.hasUnsavedChanges
                      ? "rgba(255,215,0,0.7)"
                      : "rgba(0,255,136,0.4)",
              color:
                saveFlash === "saving"
                  ? "#00d4ff"
                  : saveFlash === "saved"
                    ? "#00ff88"
                    : engine.hasUnsavedChanges
                      ? "#ffd700"
                      : "#00ff88",
              background:
                engine.hasUnsavedChanges && saveFlash === "idle"
                  ? "rgba(255,215,0,0.1)"
                  : "rgba(0,255,136,0.06)",
            }}
            aria-label="Save all settings"
          >
            <Save size={12} />
            {saveFlash === "saving"
              ? "SAVING..."
              : saveFlash === "saved"
                ? "✓ SAVED"
                : "SAVE"}
          </button>
          <button
            type="button"
            data-ocid="head_unit.story_button"
            onClick={() => setStoryOpen(true)}
            className="px-3 py-1.5 text-xs font-bold uppercase tracking-widest rounded border transition-smooth"
            style={{
              borderColor: "rgba(0,212,255,0.5)",
              color: "#00d4ff",
              background: "rgba(0,212,255,0.08)",
            }}
          >
            ✦ STORY
          </button>
          <button
            type="button"
            data-ocid="head_unit.load_track"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 border border-accent text-accent text-xs font-bold uppercase tracking-widest rounded transition-smooth hover:bg-accent hover:text-accent-foreground"
          >
            ⏏ LOAD TRACK
          </button>
        </div>
      </div>

      {/* Bottom row: volume + transport */}
      <div className="flex items-center gap-6 mt-3">
        <div className="flex items-center gap-2 flex-1">
          <span
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: "rgba(0,212,255,0.7)" }}
          >
            FRONTLINE VOLUME
          </span>
          <input
            data-ocid="head_unit.volume_slider"
            type="range"
            min={1}
            max={100}
            value={engine.volume}
            onChange={(e) => engine.setVolume(Number(e.target.value))}
            className="flex-1 accent-cyan-400 h-2"
            style={{ accentColor: "#00d4ff" }}
          />
          <span
            className="text-sm font-bold w-12 text-right font-mono"
            style={{
              color: "#ffd700",
              textShadow: "0 0 10px rgba(255,215,0,0.5)",
            }}
            data-ocid="head_unit.volume_value"
          >
            {engine.volume}
          </span>
          <span className="text-xs" style={{ color: "rgba(0,212,255,0.5)" }}>
            / 100
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            data-ocid="head_unit.play_button"
            onClick={engine.play}
            disabled={!engine.isLoaded}
            className="px-4 py-1.5 text-xs font-bold uppercase tracking-widest rounded transition-smooth disabled:opacity-40"
            style={{
              background: engine.isPlaying
                ? "rgba(0,212,255,0.2)"
                : "rgba(0,212,255,0.1)",
              border: "1px solid #00d4ff",
              color: "#00d4ff",
              boxShadow: engine.isPlaying
                ? "0 0 15px rgba(0,212,255,0.4)"
                : "none",
            }}
          >
            ▶ PLAY
          </button>
          <button
            type="button"
            data-ocid="head_unit.stop_button"
            onClick={engine.stop}
            disabled={!engine.isPlaying}
            className="px-4 py-1.5 text-xs font-bold uppercase tracking-widest rounded transition-smooth disabled:opacity-40"
            style={{
              background: "rgba(255,60,60,0.1)",
              border: "1px solid rgba(255,60,60,0.6)",
              color: "rgba(255,100,100,1)",
            }}
          >
            ■ STOP
          </button>
          <div className="text-xs font-bold uppercase ml-2">
            <span
              className="px-2 py-0.5 rounded"
              style={{
                background: "rgba(0,212,255,0.1)",
                color: "rgba(0,212,255,0.7)",
                border: "1px solid rgba(0,212,255,0.3)",
              }}
            >
              4 GAUGE WIRING
            </span>
          </div>
        </div>
      </div>
      {storyOpen && <StoryCredits onClose={() => setStoryOpen(false)} />}
    </header>
  );
}
